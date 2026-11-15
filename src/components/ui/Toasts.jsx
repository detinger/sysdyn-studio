import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import useStore from '../../store';

const ICON = { error: CircleAlert, warning: TriangleAlert, success: CircleCheck, info: Info };
const COLOR = { error: 'var(--error)', warning: 'var(--warning)', success: 'var(--success)', info: 'var(--info)' };

export default function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICON[t.kind] || Info;
        return (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <Icon size={18} style={{ color: COLOR[t.kind], flexShrink: 0 }} aria-hidden="true" />
            <div style={{ flex: 1 }}>{t.message}</div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
