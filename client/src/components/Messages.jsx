import { useEffect, useRef } from 'react';

function renderMarkdown(text) {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

export default function Messages({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted px-8">
        <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center opacity-50">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">No conversation yet</p>
        <p className="text-xs text-center text-text-muted max-w-xs">
          Upload a PDF on the left, then ask anything about it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-6 space-y-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-3 px-4 py-1 animate-fade-up
            ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
          `}
        >
          {/* Avatar */}
          <div className={`
            flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
            text-[10px] font-semibold mt-0.5
            ${msg.role === 'ai'
              ? 'bg-accent-faint border border-accent/20 text-accent'
              : 'bg-bg-hover border border-border text-text-secondary'
            }
          `}>
            {msg.role === 'ai' ? 'AI' : 'You'}
          </div>

          {/* Bubble */}
          <div className={`
            max-w-[72%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed
            ${msg.role === 'user'
              ? 'bg-bg-hover border border-border-mid text-text-primary rounded-br-sm'
              : 'bg-bg-card border border-border text-text-primary rounded-bl-sm'
            }
          `}>
            {msg.role === 'user' ? (
              <span>{msg.text}</span>
            ) : msg.streaming && msg.text === '' ? (
              /* Typing dots */
              <div className="flex gap-1 items-center py-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    style={{ animation: `typing 1.2s ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            ) : (
              <div>
                <div
                  className="md-body"
                  dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(msg.text)}</p>` }}
                />
                {msg.streaming && <span className="stream-cursor" />}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
