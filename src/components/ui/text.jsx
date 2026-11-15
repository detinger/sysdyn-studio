import { CircleAlert, TriangleAlert, Lightbulb, Info } from 'lucide-react';

export const SEVERITY_META = {
  error: { icon: CircleAlert, label: 'Error' },
  warning: { icon: TriangleAlert, label: 'Warning' },
  recommendation: { icon: Lightbulb, label: 'Recommendation' },
  info: { icon: Info, label: 'Information' },
};

/** Render `backtick` spans as <code> without using innerHTML. */
export function renderInlineCode(text) {
  return String(text).split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <span key={i}>{part}</span>,
  );
}
