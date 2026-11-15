import { useMemo, useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import useStore from '../../store';
import { EXAMPLE_LIBRARY } from './catalog';
import { runModel } from '../../domain/simulation/runModel';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

/** Preview drawn from the model's actual simulated stock trajectories (each scaled to its own range). */
function Preview({ model }) {
  const paths = useMemo(() => {
    const { run } = runModel(model.nodes, model.edges, { start: 0, stop: model.maxTime, dt: model.maxTime / 400, method: 'rk4' });
    if (!run || !run.completed) return [];
    const stocks = run.elements.filter((e) => e.type === 'stock');
    const W = 300;
    const H = 120;
    return stocks.map((s, k) => {
      const ys = run.series[s.id];
      const lo = Math.min(...ys);
      const hi = Math.max(...ys);
      const span = hi - lo || 1;
      const step = Math.max(1, Math.floor(ys.length / 150));
      const pts = [];
      for (let i = 0; i < ys.length; i += step) pts.push(`${((run.times[i] / model.maxTime) * W).toFixed(1)},${(H - 8 - ((ys[i] - lo) / span) * (H - 16)).toFixed(1)}`);
      return { d: `M${pts.join(' L')}`, color: model.colors?.[s.name] || COLORS[k % COLORS.length], name: s.name };
    });
  }, [model]);
  return (
    <svg className="preview" viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label={`Simulated stock trajectories: ${paths.map((p) => p.name).join(', ')}`} style={{ width: '100%', display: 'block' }}>
      {paths.map((p) => <path key={p.name} d={p.d} fill="none" style={{ stroke: p.color }} strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

export default function LibraryView() {
  const loadModel = useStore((s) => s.loadModel);
  const setRoute = useStore((s) => s.setRoute);
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('All');
  const levels = ['All', ...new Set(EXAMPLE_LIBRARY.map((e) => e.level))];
  const items = EXAMPLE_LIBRARY.filter((e) => (level === 'All' || e.level === level) && `${e.model.name} ${e.model.description} ${e.concepts.join(' ')}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 1200 }}>
        <div className="page-header">
          <div>
            <h1>Model library</h1>
            <p>Worked teaching models. Opening one replaces the current model; you can undo that.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center" style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-subtle)' }} aria-hidden="true" />
            <input className="input" style={{ paddingLeft: 32 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models and concepts" aria-label="Search models" />
          </div>
          {levels.map((l) => <button key={l} className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>{l}</button>)}
        </div>
        <div className="grid-cards">
          {items.map((e) => (
            <article key={e.key} className="card card-link preview-card">
              <Preview model={e.model} />
              <div className="body">
                <h3 style={{ margin: 0 }}>{e.model.name}</h3>
                <div className="flex gap-1 flex-wrap">
                  <span className="badge badge-primary">{e.level}</span>
                  {e.concepts.map((c) => <span key={c} className="badge">{c}</span>)}
                </div>
                <p className="muted" style={{ fontSize: 13, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.model.description}</p>
                <p className="hint" style={{ margin: 0 }}><strong>Limitations:</strong> {e.limitations}</p>
                <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => { loadModel(e.model); setRoute('modeler'); }}><FolderOpen size={14} /> Open model</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {items.length === 0 && <div className="empty">No models match the search.</div>}
      </div>
    </div>
  );
}
