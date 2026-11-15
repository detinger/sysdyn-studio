import { Sigma, CircleAlert, TriangleAlert, CircleCheck } from 'lucide-react';
import Tex from '../../components/ui/Tex';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import { exprTex, stockBalanceTex, texName } from '../../domain/equations/tex';
import { renderInlineCode } from '../../components/ui/text';

function EqCard({ el, tex, extra, open, status }) {
  return (
    <div className="card" style={{ padding: '12px 14px' }} id={`eq-${el.id}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, fontWeight: 650 }} onClick={() => open(el.id)} title="Open in the modeler">{el.name || 'Unnamed'}</button>
        <div className="flex gap-2 items-center">
          {el.unit && <span className="badge">{el.unit}</span>}
          {status(el.id)}
        </div>
      </div>
      <div className="mathjax-preview">{tex ? <Tex tex={tex} /> : <code>{el.equation || '(empty)'}</code>}</div>
      {extra}
    </div>
  );
}

/**
 * Equations page (formerly the "Eqs" modal). Every formula is rendered from
 * the same parsed AST the solver compiles, so what you read is what runs.
 */
export default function EquationsView() {
  const v = useValidation();
  const select = useStore((s) => s.select);
  const setRoute = useStore((s) => s.setRoute);
  const meta = useStore((s) => s.meta);
  const timeUnit = useStore((s) => s.simConfig.timeUnit);
  const { domain } = v;
  const name = (id) => domain.byId.get(id)?.name || id;

  const open = (id) => {
    setRoute('modeler');
    setTimeout(() => select(id), 0);
  };

  const status = (id) => {
    const iss = v.issues.filter((i) => i.elementId === id && (i.severity === 'error' || i.severity === 'warning'));
    const err = iss.find((i) => i.severity === 'error');
    if (err) return <span className="badge badge-error" title={err.message}><CircleAlert size={12} aria-hidden="true" /> {renderInlineCode(err.title)}</span>;
    if (iss.length) return <span className="badge badge-warning" title={iss[0].message}><TriangleAlert size={12} aria-hidden="true" /> {iss[0].title}</span>;
    return <span className="badge badge-success"><CircleCheck size={12} aria-hidden="true" /> Parsed</span>;
  };

  const sections = [
    {
      id: 'stocks', title: 'Stocks', note: 'Each stock changes only through its flows: inflows minus outflows.',
      items: domain.stocks.map((s) => ({
        el: s,
        tex: stockBalanceTex(s.name, s.inflows.map(name), s.outflows.map(name)),
        extra: <p className="hint" style={{ margin: '6px 0 0' }}>Initial value: <code>{s.initial || '0 (not set)'}</code>{s.unit ? ` ${s.unit}` : ''}</p>,
      })),
    },
    { id: 'flows', title: 'Flows', note: `Rates, in stock units per ${timeUnit || 'time unit'}.`, items: domain.flows.map((f) => ({ el: f, tex: exprTex(f.equation) && `${texName(f.name)} = ${exprTex(f.equation)}` })) },
    { id: 'aux', title: 'Auxiliaries', note: 'Recomputed at every time point from the current state.', items: domain.auxiliaries.filter((a) => a.kind === 'auxiliary').map((a) => ({ el: a, tex: exprTex(a.equation) && `${texName(a.name)} = ${exprTex(a.equation)}` })) },
    { id: 'params', title: 'Parameters', note: 'Constant during a run; change them in experiments.', items: domain.auxiliaries.filter((a) => a.kind === 'parameter').map((a) => ({ el: a, tex: `${texName(a.name)} = ${exprTex(a.equation) ?? a.equation}` })) },
  ].filter((s) => s.items.length);

  return (
    <div className="page">
      <div className="reference">
        <nav className="toc" aria-label="Equation index">
          <div className="eyebrow" style={{ padding: '0 10px 8px' }}>{meta.name}</div>
          {sections.map((s) => (
            <div key={s.id}>
              <a className="nav-link" href={`#sec-${s.id}`}>{s.title} <span className="subtle" style={{ marginLeft: 'auto' }}>{s.items.length}</span></a>
            </div>
          ))}
          <p className="hint" style={{ padding: '10px' }}>Evaluation order: {v.compiled.order.map(name).join(' → ') || '—'}</p>
        </nav>
        <div className="prose" style={{ maxWidth: 'none' }}>
          <div className="page-header">
            <div>
              <h1 className="flex items-center gap-2"><Sigma size={22} aria-hidden="true" /> Model equations</h1>
              <p>Rendered from the parsed equations the simulator uses. Click a name to edit it in the modeler.</p>
            </div>
          </div>
          {sections.length === 0 && (
            <div className="empty"><Sigma size={28} aria-hidden="true" /><div>No equations yet. Add stocks, flows and variables in the modeler.</div></div>
          )}
          {sections.map((s) => (
            <section key={s.id} id={`sec-${s.id}`} style={{ marginBottom: 24 }}>
              <h2>{s.title}</h2>
              <p className="muted">{s.note}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {s.items.map((it) => <EqCard key={it.el.id} {...it} open={open} status={status} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
