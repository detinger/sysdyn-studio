import { useMemo, useState } from 'react';
import { FlaskConical, TriangleAlert, Play } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import { useTokens } from '../../app/theme';
import { fmtNum } from '../../utils/format';
import { sweepValues, runSweep, sensitivity, METRIC_OPTIONS, MAX_SWEEP_STEPS } from '../../domain/scenarios/sweep';
import Tabs from '../../components/ui/Tabs';

const TOKENS = ['chart-1', 'chart-grid', 'chart-axis', 'text', 'text-muted', 'border', 'bg-elevated'];

function Num({ id, label, value, onChange }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input input-sm num" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Parameter sweeps and one-at-a-time sensitivity, run with the current solver settings. */
export default function ExperimentPanel() {
  const [mode, setMode] = useState('sweep');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '0 12px' }}>
        <Tabs tabs={[{ id: 'sweep', label: 'Parameter sweep' }, { id: 'sens', label: 'Sensitivity' }]} value={mode} onChange={setMode} compact label="Experiment type" />
      </div>
      {mode === 'sweep' ? <Sweep /> : <Sensitivity />}
    </div>
  );
}

function useExperimentContext() {
  const v = useValidation();
  const config = useStore((s) => s.simConfig);
  const revision = useStore((s) => s.revision);
  const labels = useMemo(() => Object.fromEntries(v.domain.elements.map((e) => [e.id, e.name])), [v.domain]);
  const params = v.compiled.parameterIds.map((id) => v.domain.byId.get(id));
  const outputs = v.domain.elements.filter((e) => v.domain.typeOf(e.id) !== 'parameter');
  return { v, config, revision, labels, params, outputs };
}

function NotRunnable({ v }) {
  if (v.canRun && v.compiled.parameterIds.length) return null;
  return (
    <div className="empty" style={{ flex: 1 }}>
      <FlaskConical size={28} aria-hidden="true" />
      <div className="hint">{!v.canRun ? 'Fix the validation errors before running experiments.' : 'This model has no constant parameters to vary.'}</div>
    </div>
  );
}

function Sweep() {
  const { v, config, revision, labels, params, outputs } = useExperimentContext();
  const tokens = useTokens(TOKENS);
  const [paramId, setParamId] = useState('');
  const [outputId, setOutputId] = useState('');
  const [spec, setSpec] = useState({ min: '', max: '', steps: '5', scale: 'linear' });
  const [result, setResult] = useState(null);
  const pid = params.some((p) => p.id === paramId) ? paramId : params[0]?.id;
  const oid = outputs.some((o) => o.id === outputId) ? outputId : v.domain.stocks[0]?.id || outputs[0]?.id;
  const base = pid && v.compiled.evaluator ? v.compiled.evaluator.parameters()[pid] : 0;
  const min = spec.min === '' ? base * 0.5 : Number(spec.min);
  const max = spec.max === '' ? (base === 0 ? 1 : base * 1.5) : Number(spec.max);
  const grid = sweepValues({ min, max, steps: Number(spec.steps), scale: spec.scale });

  if (!v.canRun || !params.length) return <NotRunnable v={v} />;

  const run = () => setResult({ ...runSweep(v.compiled.evaluator, config, { parameterId: pid, values: grid.values, outputId: oid }, labels), revision, paramName: labels[pid], outputName: labels[oid] });
  const stale = result && result.revision !== revision;
  const unit = v.domain.byId.get(oid)?.unit;
  const n = result?.points.length || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)', gap: 12, padding: '8px 12px', flex: 1, minHeight: 0, overflow: 'auto' }}>
      <div>
        <div className="field">
          <label htmlFor="sw-param">Parameter</label>
          <select id="sw-param" className="select select-sm" value={pid} onChange={(e) => { setParamId(e.target.value); setSpec((s) => ({ ...s, min: '', max: '' })); }}>
            {params.map((p) => <option key={p.id} value={p.id}>{p.name} (now {fmtNum(v.compiled.evaluator.parameters()[p.id])})</option>)}
          </select>
        </div>
        <div className="field-grid">
          <Num id="sw-min" label="From" value={spec.min === '' ? String(+min.toPrecision(6)) : spec.min} onChange={(x) => setSpec((s) => ({ ...s, min: x }))} />
          <Num id="sw-max" label="To" value={spec.max === '' ? String(+max.toPrecision(6)) : spec.max} onChange={(x) => setSpec((s) => ({ ...s, max: x }))} />
        </div>
        <div className="field-grid" style={{ marginTop: 10 }}>
          <Num id="sw-steps" label="Runs" value={spec.steps} onChange={(x) => setSpec((s) => ({ ...s, steps: x }))} />
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="sw-scale">Spacing</label>
            <select id="sw-scale" className="select select-sm" value={spec.scale} onChange={(e) => setSpec((s) => ({ ...s, scale: e.target.value }))}>
              <option value="linear">Linear</option>
              <option value="log">Logarithmic</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label htmlFor="sw-out">Show</label>
          <select id="sw-out" className="select select-sm" value={oid} onChange={(e) => setOutputId(e.target.value)}>
            {outputs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        {grid.errors.length > 0 && <p className="hint sev-error">{grid.errors[0]}</p>}
        <button className="btn btn-sm btn-primary" disabled={grid.errors.length > 0} onClick={run}><Play size={14} /> Run sweep ({grid.values.length || 0} runs)</button>
        <p className="hint" style={{ marginTop: 8 }}>Every run uses the current solver settings ({config.method.toUpperCase()}, Δt {config.dt}); only {labels[pid]} changes. Up to {MAX_SWEEP_STEPS} runs.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        {!result ? (
          <div className="empty" style={{ flex: 1 }}><FlaskConical size={28} aria-hidden="true" /><div className="hint">Choose a parameter and a range, then run the sweep.</div></div>
        ) : (
          <>
            {stale && <div className="callout callout-warning" style={{ marginBottom: 6 }}><TriangleAlert size={18} aria-hidden="true" /><div>The model changed after this sweep. Run it again to update.</div></div>}
            <div style={{ height: 180, minHeight: 140 }}>
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                <LineChart margin={{ top: 6, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke={tokens['chart-grid']} vertical={false} />
                  <XAxis dataKey="t" type="number" domain={[result.config.start, result.config.stop]} allowDuplicatedCategory={false} stroke={tokens['chart-axis']} tick={{ fill: tokens['text-muted'], fontSize: 11 }} tickLine={false} tickFormatter={(x) => fmtNum(x)} />
                  <YAxis stroke={tokens['chart-axis']} tick={{ fill: tokens['text-muted'], fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(x) => fmtNum(x, 3)} />
                  <Tooltip contentStyle={{ background: tokens['bg-elevated'], border: `1px solid ${tokens.border}`, borderRadius: 6, fontSize: 12, color: tokens.text }} labelFormatter={(x) => `t = ${fmtNum(x)}`} formatter={(val, name) => [fmtNum(val, 5), name]} />
                  {result.points.map((p, i) => {
                    const stride = Math.max(1, Math.ceil(p.times.length / 400));
                    const data = p.times.filter((_, k) => k % stride === 0 || k === p.times.length - 1).map((t, k) => ({ t, y: p.series[Math.min(k * stride, p.series.length - 1)] }));
                    return <Line key={i} data={data} dataKey="y" name={`${result.paramName} = ${fmtNum(p.value)}`} stroke={tokens['chart-1']} strokeOpacity={0.25 + 0.75 * (n > 1 ? i / (n - 1) : 1)} strokeWidth={1.6} dot={false} isAnimationActive={false} />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="hint" style={{ margin: '2px 0 6px' }}>{result.outputName}{unit ? ` (${unit})` : ''} over time. Lighter lines are lower values of {result.paramName}, darker lines higher.</p>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th className="n">{result.paramName}</th><th className="n">Final</th><th className="n">Maximum</th><th className="n">at t</th><th className="n">Minimum</th><th>Run</th></tr></thead>
                <tbody>
                  {result.points.map((p, i) => (
                    <tr key={i}>
                      <td className="n">{fmtNum(p.value, 5)}</td>
                      <td className="n">{p.stats ? fmtNum(p.stats.final, 5) : '—'}</td>
                      <td className="n">{p.stats ? fmtNum(p.stats.max, 5) : '—'}</td>
                      <td className="n">{p.stats ? fmtNum(p.stats.maxTime, 4) : '—'}</td>
                      <td className="n">{p.stats ? fmtNum(p.stats.min, 5) : '—'}</td>
                      <td>{p.completed ? 'completed' : <span className="sev-error" title={p.failure?.message}>failed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Sensitivity() {
  const { v, config, revision, labels, params, outputs } = useExperimentContext();
  const [outputId, setOutputId] = useState('');
  const [metric, setMetric] = useState('final');
  const [result, setResult] = useState(null);
  const oid = outputs.some((o) => o.id === outputId) ? outputId : v.domain.stocks[0]?.id || outputs[0]?.id;
  if (!v.canRun || !params.length) return <NotRunnable v={v} />;
  const run = () => setResult({ ...sensitivity(v.compiled.evaluator, config, { parameterIds: params.map((p) => p.id), outputId: oid, metric }, labels), revision, outputName: labels[oid] });
  const maxAbs = result ? Math.max(1e-12, ...result.rows.filter((r) => Number.isFinite(r.elasticity)).map((r) => Math.abs(r.elasticity))) : 1;

  return (
    <div style={{ padding: '8px 12px', overflow: 'auto', flex: 1 }}>
      <div className="flex gap-2 items-end flex-wrap" style={{ marginBottom: 8 }}>
        <div className="field" style={{ marginBottom: 0, minWidth: 160 }}>
          <label htmlFor="se-out">Output</label>
          <select id="se-out" className="select select-sm" value={oid} onChange={(e) => setOutputId(e.target.value)}>
            {outputs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0, minWidth: 140 }}>
          <label htmlFor="se-metric">Measure</label>
          <select id="se-metric" className="select select-sm" value={metric} onChange={(e) => setMetric(e.target.value)}>
            {METRIC_OPTIONS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <button className="btn btn-sm btn-primary" onClick={run}><Play size={14} /> Rank parameters ({params.length * 2 + 1} runs)</button>
      </div>
      <p className="hint">Each parameter is changed by ±10 % on its own, with all others at their current values. The elasticity is the % change in the measure per 1 % change in the parameter. This is a local, exploratory result: it describes the model near its current settings, not what matters most in the real system.</p>
      {result && (
        <>
          {result.revision !== revision && <div className="callout callout-warning" style={{ marginBottom: 6 }}><TriangleAlert size={18} aria-hidden="true" /><div>The model changed after this analysis. Run it again to update.</div></div>}
          <p style={{ fontSize: 13 }}>{METRIC_OPTIONS.find((m) => m.id === result.metric).label} of {result.outputName} with current values: <strong className="num">{fmtNum(result.baseValue, 5)}</strong></p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Parameter</th><th className="n">Value</th><th className="n">−10 %</th><th className="n">+10 %</th><th className="n">Elasticity</th><th style={{ width: '30%' }}>Relative effect</th></tr></thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="n">{fmtNum(r.base, 5)}</td>
                    {r.skipped ? (
                      <td colSpan={4} className="subtle">{r.skipped}</td>
                    ) : (
                      <>
                        <td className="n">{fmtNum(r.low, 5)}</td>
                        <td className="n">{fmtNum(r.high, 5)}</td>
                        <td className="n">{Number.isFinite(r.elasticity) ? `${r.elasticity > 0 ? '+' : ''}${fmtNum(r.elasticity, 3)}` : '—'}</td>
                        <td>
                          {Number.isFinite(r.elasticity) && (
                            <span style={{ display: 'block', height: 8, borderRadius: 4, background: 'var(--chart-1)', width: `${(Math.abs(r.elasticity) / maxAbs) * 100}%`, opacity: r.elasticity < 0 ? 0.55 : 1 }} title={r.elasticity < 0 ? 'Output decreases as the parameter increases' : 'Output increases as the parameter increases'} />
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={{ marginTop: 6 }}>A + sign means the measure rises when the parameter rises; − means it falls. Paler bars are negative. Bigger is not better: it only means more sensitive.</p>
        </>
      )}
    </div>
  );
}
