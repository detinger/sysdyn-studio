import { CircleAlert, TriangleAlert } from 'lucide-react';
import { useElementIssues } from '../../state/validation';

/** Localised error / warning marker (recommendations stay in the inspector). */
export function IssueMarker({ id }) {
  const issues = useElementIssues(id);
  const err = issues.find((i) => i.severity === 'error');
  const warn = !err && issues.find((i) => i.severity === 'warning');
  const it = err || warn;
  if (!it) return null;
  const Icon = err ? CircleAlert : TriangleAlert;
  return (
    <span className="sd-marker" style={{ color: err ? 'var(--error)' : 'var(--warning)' }} title={it.title} role="img" aria-label={`${err ? 'Error' : 'Warning'}: ${it.title}`}>
      <Icon size={12} />
    </span>
  );
}
