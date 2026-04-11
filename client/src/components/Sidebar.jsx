import { useRef } from 'react';

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// PDF icon
const PdfIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

export default function Sidebar({
  open,
  docs, uploading, uploadError, onUpload, onRemoveDoc, onClearDocs,
  chatList, loadingChats, activeChatId, onSelectChat, onDeleteChat,
  user, onLogOut,
}) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <aside className={`
      flex flex-col h-full bg-bg-secondary border-r border-border
      transition-all duration-300 ease-in-out flex-shrink-0
      ${open ? 'w-64' : 'w-0 overflow-hidden border-r-0'}
    `}>

      {/* ── Brand ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0">
        <span className="text-accent font-semibold text-xs tracking-[0.2em] uppercase">Lumen</span>
        {docs.length > 0 && (
          <span className="text-[10px] text-accent bg-accent-faint border border-accent/20 rounded-full px-2 py-0.5">
            {docs.length} PDF{docs.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Active PDFs ── */}
      <div className="px-3 py-3 border-b border-border flex-shrink-0 flex flex-col gap-2">

        {/* Upload button — always visible so user can keep adding */}
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="
            w-full py-2 px-3 rounded-lg text-xs font-semibold
            bg-accent text-bg-primary hover:bg-accent-soft
            transition-all duration-150 flex items-center justify-center gap-1.5
            disabled:bg-text-hint disabled:text-text-muted disabled:cursor-not-allowed
          "
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Uploading...
            </>
          ) : (
            <>+ Add PDF</>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFile}
        />

        {uploadError && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-2.5 py-1.5">
            {uploadError}
          </p>
        )}

        {/* Active PDF list */}
        {docs.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-muted">
                Active PDFs
              </p>
              {docs.length > 1 && (
                <button
                  onClick={onClearDocs}
                  className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {docs.map((doc) => (
              <div
                key={doc.namespace}
                className="flex items-center gap-2 bg-accent-faint border border-accent/15 rounded-lg px-2.5 py-1.5 group"
              >
                <span className="text-accent flex-shrink-0"><PdfIcon /></span>
                <span className="text-xs font-medium text-text-primary truncate flex-1">
                  {doc.fileName}
                </span>
                <button
                  onClick={() => onRemoveDoc(doc.namespace)}
                  className="text-text-muted hover:text-red-400 transition-colors text-sm leading-none opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Remove this PDF"
                >
                  ×
                </button>
              </div>
            ))}

            {docs.length > 1 && (
              <p className="text-[10px] text-text-muted text-center pt-0.5">
                Searching across all {docs.length} documents
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Chat history ── */}
      <div className="flex-1 overflow-y-auto py-2">
        <p className="px-4 pb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
          History
        </p>

        {loadingChats && <p className="px-4 py-2 text-xs text-text-muted">Loading...</p>}
        {!loadingChats && chatList.length === 0 && (
          <p className="px-4 py-2 text-xs text-text-muted">No past chats</p>
        )}

        <ul className="flex flex-col gap-px">
          {chatList.map(chat => (
            <li
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`
                group flex items-center gap-2 px-3 py-2.5 mx-1 rounded-lg cursor-pointer
                transition-all duration-100
                ${activeChatId === chat.id
                  ? 'bg-accent-glow border-l-2 border-accent pl-2.5'
                  : 'hover:bg-bg-hover border-l-2 border-transparent pl-2.5'
                }
              `}
            >
              <div className="flex flex-col gap-0.5 overflow-hidden flex-1 min-w-0">
                <span className={`text-xs font-medium truncate ${activeChatId === chat.id ? 'text-accent' : 'text-text-primary'}`}>
                  {chat.fileName}
                </span>
                <span className="text-[11px] text-text-muted truncate">{chat.preview}</span>
                <span className="text-[10px] text-text-hint tabular-nums">{timeAgo(chat.createdAt)}</span>
              </div>
              <button
                onClick={(e) => onDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-text-muted hover:text-red-400 text-base leading-none px-1 rounded transition-all"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── User footer ── */}
      {user && (
        <div className="flex items-center gap-2.5 px-3 py-3 border-t border-border flex-shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-border-mid" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-accent-faint border border-accent/20 flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user.displayName || 'User'}</p>
            <p className="text-[10px] text-text-muted truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogOut}
            className="flex-shrink-0 text-[11px] text-text-muted border border-border rounded-md px-2 py-1 hover:border-border-light hover:text-text-primary transition-all duration-150"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}