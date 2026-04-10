import { useState, useCallback, useEffect } from 'react';
import Sidebar    from '../components/Sidebar.jsx';
import ChatHeader from '../components/ChatHeader.jsx';
import Messages   from '../components/Messages.jsx';
import InputBar   from '../components/InputBar.jsx';
import { useAuth } from '../AuthContext.jsx';

export default function App() {
  const { user, logOut, getToken } = useAuth();

  const [doc, setDoc]                   = useState(null);
  const [messages, setMessages]         = useState([]);
  const [busy, setBusy]                 = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');
  const [chatId, setChatId]             = useState(null);
  const [chatList, setChatList]         = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  // Dev: VITE_API_URL is not set → empty string → Vite proxy handles /upload /ask /chats
  // Prod: VITE_API_URL = https://lumen-ai-etdj.onrender.com → direct to Render
  const BASE_URL = import.meta.env.VITE_API_URL || '';

  const addMsg = (role, text, extra = {}) =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, text, ...extra }]);

  const authFetch = useCallback(async (url, options = {}) => {
    const token = await getToken();
    return fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
  }, [getToken, BASE_URL]);

  const loadChatList = useCallback(async () => {
    setLoadingChats(true);
    try {
      const r = await authFetch('/chats');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setChatList(d);
    } catch (err) {
      console.error('Failed to load chats:', err.message);
    } finally {
      setLoadingChats(false);
    }
  }, [authFetch]);

  useEffect(() => { if (user) loadChatList(); }, [user, loadChatList]);

  const handleSelectChat = useCallback(async (id) => {
    if (busy) return;
    try {
      const r = await authFetch(`/chats/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setChatId(d.id);
      setDoc({ namespace: d.namespace, fileName: d.fileName });
      setMessages(d.messages.map((m, i) => ({
        id: i,
        role: m.role === 'assistant' ? 'ai' : 'user',
        text: m.text,
      })));
      setUploadError('');
    } catch (err) {
      console.error('Failed to load chat:', err.message);
    }
  }, [busy, authFetch]);

  const handleDeleteChat = useCallback(async (id, e) => {
    e.stopPropagation();
    try {
      await authFetch(`/chats/${id}`, { method: 'DELETE' });
      setChatList(prev => prev.filter(c => c.id !== id));
      if (chatId === id) { setChatId(null); setDoc(null); setMessages([]); }
    } catch (err) {
      console.error('Failed to delete chat:', err.message);
    }
  }, [chatId, authFetch]);

  const handleUpload = useCallback(async (file) => {
    if (file.type !== 'application/pdf') { setUploadError('Please upload a PDF file.'); return; }
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const r = await authFetch('/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Upload failed');
      setDoc({ namespace: d.namespace, fileName: d.fileName });
      setMessages([]);
      setChatId(null);
      addMsg('ai', `"${d.fileName}" is ready! Ask me anything about it.`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }, [authFetch]);

  const handleSend = useCallback(async (question) => {
    if (!question.trim() || busy || !doc) return;
    setBusy(true);
    addMsg('user', question);
    const aiMsgId = Date.now();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', streaming: true }]);

    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/ask`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question, namespace: doc.namespace, fileName: doc.fileName, chatId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let event;
          try { event = JSON.parse(json); } catch { continue; }
          if (event.error) throw new Error(event.error);
          if (event.token) {
            setMessages(prev => prev.map(m =>
              m.id === aiMsgId ? { ...m, text: m.text + event.token } : m
            ));
          }
          if (event.done) {
            setMessages(prev => prev.map(m =>
              m.id === aiMsgId ? { ...m, streaming: false } : m
            ));
            if (event.chatId) setChatId(event.chatId);
            loadChatList();
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, text: '⚠️ ' + err.message, streaming: false } : m
      ));
    } finally {
      setBusy(false);
    }
  }, [busy, doc, chatId, getToken, loadChatList, BASE_URL]);

  const handleClear = () => { setMessages([]); setChatId(null); };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        doc={doc}
        uploading={uploading}
        uploadError={uploadError}
        onUpload={handleUpload}
        onChangeDoc={() => { setDoc(null); setChatId(null); setMessages([]); }}
        chatList={chatList}
        loadingChats={loadingChats}
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        user={user}
        onLogOut={logOut}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <ChatHeader
          doc={doc}
          onClear={handleClear}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />
        <Messages messages={messages} />
        <InputBar onSend={handleSend} disabled={!doc || busy} busy={busy} />
      </div>
    </div>
  );
}