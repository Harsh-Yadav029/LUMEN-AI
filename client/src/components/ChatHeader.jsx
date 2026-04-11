export default function ChatHeader({ docs, onClear, onToggleSidebar }) {
  const hasDoc = docs && docs.length > 0;

  const title = !hasDoc
    ? 'No documents loaded'
    : docs.length === 1
    ? docs[0].fileName
    : `${docs.length} PDFs loaded`;

  const sub = !hasDoc
    ? null
    : docs.length === 1
    ? 'Ask anything about this document'
    : `Searching across: ${docs.map(d => d.fileName).join(', ')}`;

  return (
    <header className="flex items-center justify-between px-4 h-[52px] bg-bg-primary border-b border-border flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-medium truncate leading-tight ${hasDoc ? 'text-text-primary' : 'text-text-muted'}`}>
            {title}
          </span>
          {sub && <span className="text-[11px] text-text-muted leading-tight truncate">{sub}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {hasDoc && (
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Ready
          </div>
        )}
        {hasDoc && (
          <button
            onClick={onClear}
            className="text-xs text-text-muted border border-border rounded-lg px-3 py-1.5 hover:border-border-light hover:text-text-primary transition-all duration-150"
          >
            Clear chat
          </button>
        )}
      </div>
    </header>
  );
}