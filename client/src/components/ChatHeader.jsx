export default function ChatHeader({ doc, onClear, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between px-4 h-[52px] bg-bg-primary border-b border-border flex-shrink-0">

      {/* Left — sidebar toggle + doc name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all duration-150"
          title="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex flex-col min-w-0">
          {doc ? (
            <>
              <span className="text-sm font-medium text-text-primary truncate leading-tight">
                {doc.fileName}
              </span>
              <span className="text-[11px] text-text-muted leading-tight">
                Ask anything about this document
              </span>
            </>
          ) : (
            <span className="text-sm text-text-muted">No document loaded</span>
          )}
        </div>
      </div>

      {/* Right — status + clear */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {doc && (
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Ready
          </div>
        )}
        {doc && (
          <button
            onClick={onClear}
            className="
              text-xs text-text-muted border border-border rounded-lg px-3 py-1.5
              hover:border-border-light hover:text-text-primary transition-all duration-150
            "
          >
            Clear chat
          </button>
        )}
      </div>
    </header>
  );
}
