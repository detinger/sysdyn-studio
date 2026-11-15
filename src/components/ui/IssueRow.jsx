import { SEVERITY_META, renderInlineCode } from './text';

/** Validation row: severity stripe, icon, title, reason and fix (STYLE.md §6.4). */
export default function IssueRow({ issue, onSelect, action }) {
  const meta = SEVERITY_META[issue.severity];
  const Icon = meta.icon;
  return (
    <div style={{ position: 'relative' }}>
      <button className="issue" onClick={() => onSelect && onSelect(issue)} aria-label={`${meta.label}: ${issue.title}`}>
        <span className={`issue-stripe sev-${issue.severity}`} aria-hidden="true" />
        <Icon size={18} className={`sev-${issue.severity}`} aria-hidden="true" />
        <span>
          <span className="issue-title">{renderInlineCode(issue.title)}</span>
          <span className="issue-body" style={{ display: 'block' }}>{issue.message}</span>
          {issue.fix && <span className="issue-fix" style={{ display: 'block' }}>{issue.fix}</span>}
        </span>
      </button>
      {action}
    </div>
  );
}

