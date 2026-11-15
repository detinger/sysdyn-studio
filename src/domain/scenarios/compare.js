/**
 * Baseline vs. intervention comparison (PLAN.md Module F).
 * Fair comparison rule: runs must share solver, dt, horizon and initial
 * conditions; any difference is disclosed before results are interpreted.
 */

/** Summary statistics of one series. */
export function seriesStats(times, values) {
  if (!values || !values.length) return null;
  let max = -Infinity;
  let min = Infinity;
  let maxTime = times[0];
  let minTime = times[0];
  values.forEach((v, i) => {
    if (v > max) { max = v; maxTime = times[i]; }
    if (v < min) { min = v; minTime = times[i]; }
  });
  return { initial: values[0], final: values[values.length - 1], max, maxTime, min, minTime };
}

const CONFIG_FIELDS = [
  ['method', 'Integration method'],
  ['dt', 'Time step'],
  ['start', 'Start time'],
  ['stop', 'Stop time'],
  ['nonNegativeStocks', 'Nonnegative-stock constraint'],
];

/**
 * @param {{ run: object, params: Record<string, {name: string, value: number}> }} baseline
 * @param {object} current run record
 */
export function compareRuns(baseline, current) {
  const b = baseline.run;
  const fairness = [];
  CONFIG_FIELDS.forEach(([k, label]) => {
    if (b.config[k] !== current.config[k]) fairness.push(`${label} differs: ${b.config[k]} (baseline) vs ${current.config[k]} (current).`);
  });
  if (!b.completed || !current.completed) fairness.push('One of the runs did not complete.');

  const bIds = new Set(b.elements.map((e) => e.id));
  const cIds = new Set(current.elements.map((e) => e.id));
  const added = current.elements.filter((e) => !bIds.has(e.id)).map((e) => e.name);
  const removed = b.elements.filter((e) => !cIds.has(e.id)).map((e) => e.name);
  if (added.length) fairness.push(`Elements added since the baseline: ${added.join(', ')}.`);
  if (removed.length) fairness.push(`Elements removed since the baseline: ${removed.join(', ')}.`);

  const stocks = current.elements.filter((e) => e.type === 'stock');
  const initialDiff = stocks.filter((s) => b.series[s.id] && b.series[s.id][0] !== current.series[s.id][0]).map((s) => s.name);
  if (initialDiff.length) fairness.push(`Initial values differ for ${initialDiff.join(', ')}.`);

  const parameters = [];
  Object.entries(current.parameters || {}).forEach(([id, after]) => {
    const before = b.parameters?.[id];
    if (before !== undefined && before !== after) {
      parameters.push({ id, name: current.elements.find((e) => e.id === id)?.name || id, before, after });
    }
  });

  const structureChanged = added.length > 0 || removed.length > 0 || b.modelRevision !== current.modelRevision && parameters.length === 0;

  return {
    fairness,
    parameters,
    structureChanged,
    stocks: stocks.map((s) => ({
      id: s.id,
      name: s.name,
      unit: s.unit,
      baseline: b.series[s.id] ? seriesStats(b.times, b.series[s.id]) : null,
      current: seriesStats(current.times, current.series[s.id]),
    })),
  };
}
