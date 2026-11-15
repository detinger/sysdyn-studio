import { useState } from 'react';

const MIN = 180;
const maxHeight = () => Math.max(MIN, Math.round(window.innerHeight * 0.75));

/** Height state persisted per browser, clamped to [180px, 75vh]. */
// eslint-disable-next-line react-refresh/only-export-components
export function usePanelHeight(key, initial) {
  const [h, setH] = useState(() => {
    try {
      const v = Number(localStorage.getItem(key));
      return v >= MIN ? v : initial;
    } catch {
      return initial;
    }
  });
  const set = (v) => {
    const clamped = Math.round(Math.min(maxHeight(), Math.max(MIN, v)));
    setH(clamped);
    try {
      localStorage.setItem(key, String(clamped));
    } catch {
      /* storage unavailable */
    }
  };
  return [h, set];
}

/** Horizontal splitter above a bottom panel. Drag, or focus it and use ↑ / ↓ (Shift for larger steps). */
export default function ResizeHandle({ height, onChange, label }) {
  const onPointerDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const start = height;
    const move = (ev) => onChange(start + (startY - ev.clientY));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.cursor = '';
    };
    document.body.style.cursor = 'row-resize';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 80 : 20;
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange(height + step); }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange(height - step); }
  };
  return (
    <div
      className="resize-handle"
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      aria-valuenow={height}
      aria-valuemin={MIN}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      title="Drag to resize (or focus and use the arrow keys)"
    />
  );
}
