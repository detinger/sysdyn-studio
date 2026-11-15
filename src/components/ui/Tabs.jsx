import { useRef } from 'react';

/** Tab list with arrow-key navigation (WAI-ARIA tabs pattern). */
export default function Tabs({ tabs, value, onChange, compact = false, label }) {
  const refs = useRef({});
  const onKey = (e, i) => {
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = tabs.length - 1;
    if (j === null) return;
    e.preventDefault();
    onChange(tabs[j].id);
    refs.current[tabs[j].id]?.focus();
  };
  return (
    <div className={`tabs${compact ? ' tabs-compact' : ''}`} role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[t.id] = el; }}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          className="tab"
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.icon}
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  );
}
