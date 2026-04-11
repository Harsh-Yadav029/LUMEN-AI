import { useState, useCallback, useEffect } from 'react';
import Sidebar    from '../components/Sidebar.jsx';
import ChatHeader from '../components/ChatHeader.jsx';
import Messages   from '../components/Messages.jsx';
import InputBar   from '../components/InputBar.jsx';
import { useAuth } from '../AuthContext.jsx';

export default function App() {
  const { user, logOut, getToken } = useAuth();

  // Multi-PDF: docs is an array of { namespace, fileName }
  const [docs, setDocs]                 = useState([]);
  const [messages, setMessages]         = useState([]);
  const [busy, setBusy]                 = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState('');
  const [chatId, setChatId]             = useState(null);
  const [chatList, setChatList]         = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(true);

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

  // Resume a past chat — restore all PDFs from it
  const handleSelectChat = useCallback(async (id) => {
    if (busy) return;
    try {
      const r = await authFetch(`/chats/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setChatId(d.id);
      // Restore pdfs array — fall back to single namespace for old chats
      setDocs(
        d.pdfs && d.pdfs.length > 0
          ? d.pdfs
          : [{ namespace: d.namespace, fileName: d.fileName }]
      );
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
      if (chatId === id) { setChatId(null); setDocs([]); setMessages([]); }
    } catch (err) {
      console.error('Failed to delete chat:', err.message);
    }
  }, [chatId, authFetch]);

  // Upload a single PDF — adds to the docs array (multi-PDF)
  const handleUpload = useCallback(async (file) => {
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const r = await authFetch('/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || 'Upload failed');

      const newDoc = { namespace: d.namespace, fileName: d.fileName };

      // Add to existing docs — don't replace, append
      setDocs(prev => {
        const already = prev.find(p => p.fileName === d.fileName);
        if (already) return prev; // skip duplicate filename
        return [...prev, newDoc];
      });

      setChatId(null); // new session when adding a PDF
      addMsg('ai', `"${d.fileName}" uploaded! You now have ${docs.length + 1} PDF(s) loaded. Ask anything across all of them.`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }, [authFetch, docs.length]);

  // Remove a single PDF from the active set
  const handleRemoveDoc = useCallback((namespace) => {
    setDocs(prev => prev.filter(d => d.namespace !== namespace));
  }, []);

  // Clear all PDFs
  const handleClearDocs = useCallback(() => {
    setDocs([]);
    setChatId(null);
    setMessages([]);
  }, []);

  // Send message — passes all namespaces to the backend
  const handleSend = useCallback(async (question) => {
    if (!question.trim() || busy || docs.length === 0) return;
    setBusy(true);
    addMsg('user', question);
    const aiMsgId = Date.now();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', streaming: true }]);

    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/ask`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question,
          // Send all active namespaces for multi-PDF search
          namespaces: docs,
          // Keep single namespace for backwards compat
          namespace:  docs[0]?.namespace,
          fileName:   docs[0]?.fileName,
          chatId,
        }),
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
  }, [busy, docs, chatId, getToken, loadChatList, BASE_URL]);

  const handleClear = () => { setMessages([]); setChatId(null); };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        docs={docs}
        uploading={uploading}
        uploadError={uploadError}
        onUpload={handleUpload}
        onRemoveDoc={handleRemoveDoc}
        onClearDocs={handleClearDocs}
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
          docs={docs}
          onClear={handleClear}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />
        <Messages messages={messages} />
        <InputBar onSend={handleSend} disabled={docs.length === 0 || busy} busy={busy} />
      </div>
    </div>
  );
}