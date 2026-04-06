import { useState, useRef } from 'react';

export default function InputBar({ onSend, disabled, busy }) {
  const [value, setValue]   = useState('');
  const textareaRef         = useRef(null);

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const canSend = !disabled && value.trim().length > 0 && !busy;

  return (
    <div className="px-4 pb-5 pt-3 bg-bg-primary border-t border-border flex-shrink-0">
      <div className={`
        flex items-end gap-2.5 bg-bg-card border rounded-xl px-3.5 py-2.5
        transition-all duration-150
        ${disabled ? 'border-border opacity-60' : 'border-border-mid focus-within:border-accent/40 focus-within:shadow-[0_0_0_2px_rgba(16,185,129,0.08)]'}
      `}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Upload a PDF first...' : 'Ask a question...'}
          className="
            flex-1 bg-transparent resize-none outline-none border-none
            text-sm text-text-primary placeholder-text-hint
            leading-relaxed min-h-[22px] max-h-[140px] overflow-y-auto
            font-sans
          "
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
            transition-all duration-150
            ${canSend
              ? 'bg-accent text-bg-primary hover:bg-accent-soft active:scale-90 shadow-sm'
              : 'bg-bg-hover text-text-hint cursor-not-allowed'
            }
          `}
        >
          {busy ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      <p className="text-[11px] text-text-hint text-center mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
