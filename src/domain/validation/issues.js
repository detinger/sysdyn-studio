/** Severity levels, ordered from most to least severe. */
export const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  RECOMMENDATION: 'recommendation',
  INFO: 'info',
};

export const SEVERITY_ORDER = [SEVERITY.ERROR, SEVERITY.WARNING, SEVERITY.RECOMMENDATION, SEVERITY.INFO];

/** Issue categories, matching PLAN.md §2.3 "feedback format". */
export const CATEGORY = {
  STRUCTURE: 'structure',
  EQUATION: 'equation',
  UNITS: 'units',
  NUMERICAL: 'numerical',
  EDUCATION: 'education',
};

/**
 * Create a validation issue.
 * @param {object} p
 * @param {string} p.code stable machine-readable code (used by tests and lessons)
 * @param {string} p.severity
 * @param {string} p.category
 * @param {string} p.title short headline
 * @param {string} p.message why it matters / consequence
 * @param {string} [p.fix] suggested change
 * @param {string} [p.elementId]
 * @param {string} [p.edgeId]
 */
export function issue({ code, severity, category, title, message, fix, elementId, edgeId, related }) {
  return {
    id: `${code}:${elementId || edgeId || 'model'}${related ? `:${related.join(',')}` : ''}`,
    code,
    severity,
    category,
    title,
    message,
    fix: fix || '',
    elementId: elementId || null,
    edgeId: edgeId || null,
    related: related || [],
  };
}

export const hasErrors = (issues) => issues.some((i) => i.severity === SEVERITY.ERROR);

export const sortIssues = (issues) =>
  [...issues].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
