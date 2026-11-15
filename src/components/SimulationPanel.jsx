import { useMemo, useState } from 'react';
import {
  Play, Pause, RotateCcw, StepForward, StepBack, ChevronDown, ChevronUp, Pin, PinOff, FileSpreadsheet, CircleAlert, TriangleAlert, LineChart as LineIcon,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, LabelList } from 'recharts';
import useStore from '../store';
import Tabs from './ui/Tabs';
import { useTokens } from '../app/theme';
import { fmtNum } from '../utils/format';
import { runToCsv } from '../domain/simulation/runModel';
import { downloadText, fileSafe } from '../utils/download';
import { compareRuns } from '../domain/scenarios/compare';

const PALETTE = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'];
const TOKENS = [...PALETTE, 'chart-grid', 'chart-axis', 'chart-muted', 'chart-surface', 'border', 'text', 'text-muted', 'error', 'accent', 'bg-elevated'];
const MAX_POINTS = 1200;
const SPEEDS = [1, 2, 5, 10, 25, 50];

/** Indices to draw: every k-th sample up to the cursor, always including the cursor (display only). */
function sampleIndices(upTo, total) {
  const stride = Math.max(1, Math.ceil(total / MAX_POINTS));
  const out = [];
  for (let i = 0; i <= upTo; i += stride) out.push(i);
  if (out[out.length - 1] !== upTo) out.push(upTo);
  return out;
}

function useSeriesColors(run, colors, tokens) {
  return useMemo(() => {
    const map = {};
    if (!run) return map;
    let k = 0;
    run.elements.forEach((e) => {
      if (!run.series[e.id]) return;
      map[e.id] = colors?.[e.name] || tokens[PALETTE[k % PALETTE.length]];
      k += 1;
    });
    return map;
  }, [run, colors, tokens]);
}

export default function SimulationPanel() {
  const run = useStore((s) => s.run);
  const baseline = useStore((s) => s.baseline);
  const playback = useStore((s) => s.playback);
  const revision = useStore((s) => s.revision);
  const simConfig = useStore((s) => s.simConfig);
  const view = useStore((s) => s.view);
  const meta = useStore((s) => s.meta);
  const hiddenLines = useStore((s) => s.hiddenLines);
  const setHiddenLine = useStore((s) => s.setHiddenLine);
  const runSimulation = useStore((s) => s.runSimulation);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);
  const stepPlayback = useStore((s) => s.stepPlayback);
  const seek = useStore((s) => s.seek);
  const reset = useStore((s) => s.resetSimulation);
  const setSpeed = useStore((s) => s.setPlaybackSpeed);
  const pinBaseline = useStore((s) => s.pinBaseline);
  const clearBaseline = useStore((s) => s.clearBaseline);
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);
  const tokens = useTokens(TOKENS);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState('stocks');

  const colorOf = useSeriesColors(run, view.colors, tokens);
  const stale = !!run && run.modelRevision !== revision;
  const n = run ? run.times.length : 0;
  const index = Math.min(playback.index, Math.max(0, n - 1));
  const t = run ? run.times[index] : simConfig.start;
  const cfg = run ? run.config : simConfig;
  const unit = cfg.timeUnit;

  const groups = useMemo(() => {
    if (!run) return { stocks: [], flows: [], variables: [] };
    const withSeries = run.elements.filter((e) => run.series[e.id]);
    return {
      stocks: withSeries.filter((e) => e.type === 'stock'),
      flows: withSeries.filter((e) => e.type === 'flow'),
      variables: withSeries.filter((e) => e.type === 'auxiliary' || e.type === 'parameter'),
    };
  }, [run]);

  // Curated `visibleVariables` (from examples) apply within a tab; if none of
  // them belong to the current tab, everything in that tab is shown.
  const isVisible = (e) => {
    if (hiddenLines[e.name] !== undefined) return !hiddenLines[e.name];
    const vv = view.visibleVariables;
    if (!vv) return true;
    const group = e.type === 'stock' ? groups.stocks : e.type === 'flow' ? groups.flows : groups.variables;
    return group.some((x) => vv.includes(x.name)) ? vv.includes(e.name) : true;
  };

  const tabs = [
    { id: 'stocks', label: `Stocks${groups.stocks.length ? ` (${groups.stocks.length})` : ''}` },
    { id: 'flows', label: `Flows${groups.flows.length ? ` (${groups.flows.length})` : ''}` },
    { id: 'variables', label: 'Variables' },
    { id: 'table', label: 'Table' },
    { id: 'compare', label: 'Compare', badge: baseline ? <span className="badge badge-primary">Baseline</span> : null },
  ];

  const status = !run
    ? <span className="badge">Not run</span>
    : !run.completed
      ? <span className="badge badge-error"><CircleAlert size={12} aria-hidden="true" /> Failed</span>
      : stale
        ? <span className="badge badge-warning" title="The model changed after this run. Run again to update."><TriangleAlert size={12} aria-hidden="true" /> Out of date</span>
        : <span className="badge badge-success">Completed</span>;

  return (
    <section className={`results${collapsed ? ' collapsed' : ''}`} aria-label="Simulation results">
      <div className="sim-controls">
        <button className="btn btn-sm btn-primary" onClick={() => runSimulation()} title="Solve the model (Ctrl/⌘ Enter)"><LineIcon size={16} /> Run</button>
        <span className="toolbar-sep" />
        <button className="btn btn-sm btn-icon" onClick={() => stepPlayback(-1)} disabled={!run} aria-label="Step back" title="Step back"><StepBack size={16} /></button>
        <button className="btn btn-sm btn-icon" onClick={() => (playback.isPlaying ? pause() : play())} disabled={!run} aria-label={playback.isPlaying ? 'Pause playback' : 'Play back results'} title={playback.isPlaying ? 'Pause' : 'Play'}>
          {playback.isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="btn btn-sm btn-icon" onClick={() => stepPlayback(1)} disabled={!run} aria-label="Step forward" title="Step forward"><StepForward size={16} /></button>
        <button className="btn btn-sm btn-icon" onClick={reset} disabled={!run} aria-label="Reset playback to start" title="Reset"><RotateCcw size={16} /></button>
        <span className="num" style={{ fontSize: 13, minWidth: 130 }} aria-live="off">
          t = <strong>{fmtNum(t)}</strong> / {fmtNum(cfg.stop)} {unit}
        </span>
        <input
          type="range"
          className="scrubber"
          min={0}
          max={Math.max(0, n - 1)}
          value={index}
          disabled={!run}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Time cursor"
          aria-valuetext={`t = ${fmtNum(t)} ${unit || ''}`}
        />
        <label className="flex items-center gap-1" style={{ fontSize: 12 }}>
          <span className="muted">Speed</span>
          <select className="select select-sm" style={{ width: 70 }} value={playback.speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Playback speed (does not change the solver time step)">
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>
        {status}
        {run && (baseline ? (
          <button className="btn btn-sm" onClick={clearBaseline} title="Stop comparing with the baseline"><PinOff size={14} /> Clear baseline</button>
        ) : (
          <button className="btn btn-sm" onClick={pinBaseline} disabled={!run.completed} title="Keep this run as the baseline scenario"><Pin size={14} /> Set as baseline</button>
        ))}
        <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand results' : 'Collapse results'}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="results-body">
        <div className="results-main">
          <Tabs tabs={tabs} value={tab} onChange={setTab} compact label="Result views" />
          {run && !run.completed && (
            <div className="callout callout-error" style={{ margin: '8px 10px 0' }} role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              <div><strong>{run.failure.message}</strong> The data below stop at the last valid step. Inspect the equation of the named element.</div>
            </div>
          )}
          {!run ? (
            <div className="empty" style={{ flex: 1 }}>
              <Play size={28} aria-hidden="true" />
              <div><strong>Nothing to show yet.</strong></div>
              <div className="hint">Validate the model, then choose Run simulation.</div>
            </div>
          ) : tab === 'table' ? (
            <DataTable run={run} index={index} meta={meta} />
          ) : tab === 'compare' ? (
            <ComparePanel run={run} baseline={baseline} pinBaseline={pinBaseline} />
          ) : (
            <TrendChart
              run={run}
              series={groups[tab]}
              index={index}
              baseline={baseline}
              colorOf={colorOf}
              tokens={tokens}
              isVisible={isVisible}
              toggle={(e) => setHiddenLine(e.name, isVisible(e))}
              onSelect={(id) => select(id)}
              selectedId={selectedId}
              unit={unit}
            />
          )}
          {run && (
            <div className="sim-caption" style={{ padding: '2px 12px 6px' }}>
              {run.methodLabel} · Δt {cfg.dt} {unit} · t {cfg.start}–{cfg.stop} {unit} · {n.toLocaleString('en-US')} samples{run.diagnostics.length ? ` · ${run.diagnostics.map((d) => d.message).join(' ')}` : ''}
            </div>
          )}
        </div>
        <div className="results-side">
          <CurrentLevels run={run} index={index} groups={groups} colorOf={colorOf} tokens={tokens} t={t} unit={unit} stale={stale} />
        </div>
      </div>
    </section>
  );
}

function TrendChart({ run, series, index, baseline, colorOf, tokens, isVisible, toggle, onSelect, selectedId, unit }) {
  const idx = useMemo(() => sampleIndices(index, run.times.length), [index, run]);
  const rows = useMemo(() => idx.map((i) => {
    const row = { time: run.times[i] };
    series.forEach((e) => { row[e.id] = run.series[e.id][i]; });
    return row;
  }), [idx, run, series]);
  const baseRows = useMemo(() => {
    if (!baseline) return null;
    const b = baseline.run;
    const bi = sampleIndices(b.times.length - 1, b.times.length);
    return bi.map((i) => {
      const row = { time: b.times[i] };
      series.forEach((e) => { if (b.series[e.id]) row[e.id] = b.series[e.id][i]; });
      return row;
    });
  }, [baseline, series]);

  if (!series.length) return <div className="empty" style={{ flex: 1 }}><div className="hint">This model has no elements of this kind.</div></div>;
  const visible = series.filter(isVisible);
  const units = [...new Set(visible.map((e) => e.unit || ''))];
  const yLabel = units.length === 1 && units[0] ? units[0] : '';
  const mixed = units.length > 1 && units.every(Boolean);
  const cfg = run.config;
  const tooltipStyle = { background: tokens['bg-elevated'], border: `1px solid ${tokens.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, boxShadow: '0 2px 8px rgba(16,24,40,.08)', color: tokens.text };

  return (
    <>
      <div className="flex flex-wrap gap-1" style={{ padding: '8px 12px 0' }} aria-label="Series">
        {series.map((e) => (
          <button
            key={e.id}
            className="chip"
            aria-pressed={isVisible(e)}
            onClick={() => toggle(e)}
            onDoubleClick={() => onSelect(e.id)}
            title={`Show or hide ${e.name}. Double-click to select it on the canvas.`}
            style={selectedId === e.id ? { borderColor: 'var(--primary)' } : undefined}
          >
            <span style={{ width: 10, height: 3, background: colorOf[e.id], display: 'inline-block', borderRadius: 2 }} aria-hidden="true" />
            {e.name}{e.unit ? <span className="subtle"> ({e.unit})</span> : null}
          </button>
        ))}
        {baseline && <span className="hint" style={{ alignSelf: 'center', marginLeft: 6 }}>Solid: current run · Dashed: baseline</span>}
        {mixed && <span className="hint" style={{ alignSelf: 'center', marginLeft: 6 }}>Different units share this axis: compare shapes, not magnitudes.</span>}
      </div>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
          <LineChart margin={{ top: 8, right: 16, left: 4, bottom: 14 }}>
            <CartesianGrid stroke={tokens['chart-grid']} vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={[cfg.start, cfg.stop]}
              allowDuplicatedCategory={false}
              stroke={tokens['chart-axis']}
              tick={{ fill: tokens['text-muted'], fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) => fmtNum(v)}
              label={{ value: `Time${unit ? ` (${unit})` : ''}`, position: 'insideBottom', offset: -8, fill: tokens['text-muted'], fontSize: 11 }}
            />
            <YAxis
              stroke={tokens['chart-axis']}
              tick={{ fill: tokens['text-muted'], fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => fmtNum(v, 3)}
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: tokens['text-muted'], fontSize: 11 } : undefined}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => `t = ${fmtNum(v)} ${unit || ''}`}
              formatter={(value, name) => [fmtNum(value, 5), name]}
            />
            {visible.map((e) => (
              <Line key={e.id} data={rows} dataKey={e.id} name={e.name} type="linear" stroke={colorOf[e.id]} strokeWidth={selectedId === e.id ? 3 : 2} dot={false} isAnimationActive={false} connectNulls={false} />
            ))}
            {baseRows && visible.filter((e) => baseline.run.series[e.id]).map((e) => (
              <Line key={`b-${e.id}`} data={baseRows} dataKey={e.id} name={`${e.name} (baseline)`} type="linear" stroke={colorOf[e.id]} strokeOpacity={0.75} strokeDasharray="6 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            ))}
            <ReferenceLine x={run.times[index]} stroke={tokens.accent} strokeWidth={1} />
            {!run.completed && run.failure.time !== undefined && (
              <ReferenceLine x={run.failure.time} stroke={tokens.error} strokeDasharray="3 3" label={{ value: 'stopped', fill: tokens.error, fontSize: 11, position: 'top' }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function CurrentLevels({ run, index, groups, colorOf, tokens, t, unit, stale }) {
  if (!run) {
    return (
      <>
        <h4 className="label" style={{ marginBottom: 6 }}>Stock levels</h4>
        <p className="hint">Current values appear here and on the diagram during playback.</p>
      </>
    );
  }
  const bars = groups.stocks.map((e) => ({ id: e.id, name: e.name, value: run.series[e.id][index], unit: e.unit }));
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>Stock levels at t = {fmtNum(t)} {unit}{stale ? ' · out of date' : ''}</div>
      <div style={{ height: Math.max(60, bars.length * 26 + 10) }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
          <BarChart data={bars} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[(min) => Math.min(0, min), 'auto']} />
            <YAxis dataKey="name" type="category" width={92} tick={{ fill: tokens.text, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Bar dataKey="value" barSize={14} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {bars.map((b) => <Cell key={b.id} fill={colorOf[b.id]} />)}
              <LabelList dataKey="value" position="right" formatter={(v) => fmtNum(v)} style={{ fill: tokens.text, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {groups.flows.length > 0 && (
        <>
          <div className="label" style={{ margin: '10px 0 4px' }}>Flow rates</div>
          <table className="table" style={{ border: 0 }}>
            <tbody>
              {groups.flows.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td className="n">{fmtNum(run.series[e.id][index])}</td>
                  <td className="subtle">{e.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function DataTable({ run, index, meta }) {
  const cols = run.elements.filter((e) => run.series[e.id]);
  const n = run.times.length;
  const stride = Math.max(1, Math.ceil(n / 400));
  const rows = [];
  for (let i = 0; i < n; i += stride) rows.push(i);
  if (rows[rows.length - 1] !== n - 1) rows.push(n - 1);
  const nearest = rows.reduce((best, i) => (Math.abs(i - index) < Math.abs(best - index) ? i : best), rows[0]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, padding: '8px 12px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span className="hint">{stride > 1 ? `Showing every ${stride}th of ${n.toLocaleString('en-US')} samples. The CSV contains all of them.` : `${n} samples.`}</span>
        <button className="btn btn-sm" onClick={() => downloadText(`${fileSafe(meta.name)}-results.csv`, runToCsv(run, { modelName: meta.name }), 'text/csv')}><FileSpreadsheet size={14} /> Export CSV</button>
      </div>
      <div className="table-wrap" style={{ flex: 1, minHeight: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th className="n">time{run.config.timeUnit ? ` (${run.config.timeUnit})` : ''}</th>
              {cols.map((c) => <th key={c.id} className="n">{c.name}{c.unit ? ` (${c.unit})` : ''}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i} className={i === nearest ? 'current' : undefined}>
                <td className="n">{fmtNum(run.times[i], 6)}</td>
                {cols.map((c) => <td key={c.id} className="n">{fmtNum(run.series[c.id][i], 6)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparePanel({ run, baseline, pinBaseline }) {
  if (!baseline) {
    return (
      <div className="empty" style={{ flex: 1 }}>
        <Pin size={28} aria-hidden="true" />
        <div><strong>Nothing to compare yet.</strong></div>
        <div className="hint" style={{ maxWidth: '52ch' }}>Run a baseline scenario and choose <em>Set as baseline</em>. Then change a parameter, run again, and the two runs appear here side by side.</div>
        <button className="btn btn-sm" onClick={pinBaseline} disabled={!run.completed}><Pin size={14} /> Set current run as baseline</button>
      </div>
    );
  }
  const c = compareRuns(baseline, run);
  return (
    <div style={{ overflow: 'auto', padding: '8px 12px', flex: 1 }}>
      {c.fairness.length > 0 ? (
        <div className="callout callout-warning" style={{ marginBottom: 10 }}>
          <TriangleAlert size={18} aria-hidden="true" />
          <div><strong>These runs are not directly comparable.</strong><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{c.fairness.map((f) => <li key={f}>{f}</li>)}</ul></div>
        </div>
      ) : (
        <p className="hint" style={{ marginTop: 0 }}>Same solver, time step, horizon and initial conditions. Only the differences listed below changed.</p>
      )}
      <div className="label" style={{ marginBottom: 4 }}>Parameter differences</div>
      {c.parameters.length === 0 ? (
        <p className="hint">No parameter values differ{c.structureChanged ? ', but the model structure or equations changed.' : '. Change a parameter and run again.'}</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: 10 }}>
          <table className="table">
            <thead><tr><th>Parameter</th><th className="n">Baseline</th><th className="n">Current</th><th className="n">Change</th></tr></thead>
            <tbody>
              {c.parameters.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td className="n">{fmtNum(p.before, 6)}</td><td className="n">{fmtNum(p.after, 6)}</td><td className="n">{p.before !== 0 ? `${p.after > p.before ? '↑' : '↓'} ${fmtNum(Math.abs((p.after - p.before) / p.before) * 100, 3)}%` : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="label" style={{ marginBottom: 4 }}>Stocks: baseline → current</div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Stock</th><th className="n">Final (baseline)</th><th className="n">Final (current)</th><th className="n">Δ final</th><th className="n">Peak (baseline)</th><th className="n">Peak (current)</th><th className="n">Min (current)</th></tr>
          </thead>
          <tbody>
            {c.stocks.map((s) => {
              const a = s.baseline;
              const b = s.current;
              const d = b && a ? b.final - a.final : null;
              return (
                <tr key={s.id}>
                  <td>{s.name}{s.unit ? <span className="subtle"> ({s.unit})</span> : null}</td>
                  <td className="n">{a ? fmtNum(a.final, 5) : '—'}</td>
                  <td className="n">{b ? fmtNum(b.final, 5) : '—'}</td>
                  <td className="n">{d === null ? '—' : `${d > 0 ? '↑' : d < 0 ? '↓' : ''} ${fmtNum(Math.abs(d), 4)}`}</td>
                  <td className="n">{a ? `${fmtNum(a.max, 5)} @ ${fmtNum(a.maxTime, 4)}` : '—'}</td>
                  <td className="n">{b ? `${fmtNum(b.max, 5)} @ ${fmtNum(b.maxTime, 4)}` : '—'}</td>
                  <td className="n">{b ? fmtNum(b.min, 5) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        Arrows show direction only; larger is not automatically better. Ask: did the change alter the size of the response, its timing, or both? Which feedback loop explains it?
      </p>
      <details style={{ fontSize: 12, marginTop: 6 }}>
        <summary className="muted">Run provenance</summary>
        <dl className="kv" style={{ marginTop: 6 }}>
          <dt>Baseline</dt><dd>{baseline.run.methodLabel} · Δt {baseline.run.config.dt} · t {baseline.run.config.start}–{baseline.run.config.stop} · revision {baseline.run.modelRevision} · {new Date(baseline.run.createdAt).toLocaleString()}</dd>
          <dt>Current</dt><dd>{run.methodLabel} · Δt {run.config.dt} · t {run.config.start}–{run.config.stop} · revision {run.modelRevision} · {new Date(run.createdAt).toLocaleString()}</dd>
        </dl>
      </details>
    </div>
  );
}

