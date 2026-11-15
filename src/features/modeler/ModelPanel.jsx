import { useEffect, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, BookOpen } from 'lucide-react';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import IssueRow from '../../components/ui/IssueRow';
import Tabs from '../../components/ui/Tabs';
import { METHODS, MAX_STEPS } from '../../domain/simulation/solver';
import { EXAMPLE_LIBRARY } from '../library/catalog';

const CATEGORY_LABEL = { structure: 'Structure', equation: 'Equations', units: 'Units', numerical: 'Numerical settings', education: 'Modelling advice' };

function NumberField({ id, label, value, onChange, hint, min, step }) {
  const [draft, setDraft] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setDraft(String(value));
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input input-sm num"
        inputMode="decimal"
        value={draft}
        min={min}
        step={step}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(n);
        }}
        aria-invalid={draft.trim() === '' || !Number.isFinite(Number(draft))}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export default function ModelPanel() {
  const meta = useStore((s) => s.meta);
  const setMeta = useStore((s) => s.setMeta);
  const cfg = useStore((s) => s.simConfig);
  const setSimConfig = useStore((s) => s.setSimConfig);
  const select = useStore((s) => s.select);
  const blockedAt = useStore((s) => s.lastValidationBlocked);
  const v = useValidation();
  const [tab, setTab] = useState('validate');
  const listRef = useRef(null);
  const example = EXAMPLE_LIBRARY.find((e) => e.model.name === meta.name || e.model.name === meta.source);

  // When a run is blocked by errors, switch to the Validate tab (adjusting state during render).
  const [seenBlock, setSeenBlock] = useState(blockedAt);
  if (blockedAt !== seenBlock) {
    setSeenBlock(blockedAt);
    setTab('validate');
  }
  useEffect(() => {
    if (blockedAt) listRef.current?.focus();
  }, [blockedAt]);
  useEffect(() => {
    const onOpen = () => setTab('validate');
    window.addEventListener('sds:open-validation', onOpen);
    return () => window.removeEventListener('sds:open-validation', onOpen);
  }, []);

  const counts = v.issues.reduce((acc, i) => ({ ...acc, [i.severity]: (acc[i.severity] || 0) + 1 }), {});
  const groups = Object.keys(CATEGORY_LABEL)
    .map((cat) => ({ cat, items: v.issues.filter((i) => i.category === cat) }))
    .filter((g) => g.items.length);
  const steps = cfg.dt > 0 ? Math.ceil((cfg.stop - cfg.start) / cfg.dt) : 0;

  const tabs = [
    { id: 'validate', label: 'Validate', badge: counts.error ? <span className="badge badge-error">{counts.error}</span> : counts.warning ? <span className="badge badge-warning">{counts.warning}</span> : null },
    { id: 'simulation', label: 'Simulation' },
    { id: 'model', label: 'Model' },
  ];

  return (
    <>
      <div className="inspector-head">
        <span className="eyebrow">Model</span>
        <div style={{ fontSize: 16, fontWeight: 650, marginTop: 4 }}>{meta.name}</div>
        <div className="hint">{v.domain.stocks.length} stocks · {v.domain.flows.length} flows · {v.domain.auxiliaries.length} variables. Select an element to edit it.</div>
      </div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} compact label="Model details" />
      <div className="inspector-body compact" role="tabpanel">
        {tab === 'validate' && (
          <div ref={listRef} tabIndex={-1} style={{ outline: 'none' }}>
            {v.canRun ? (
              <div className="callout callout-success" style={{ marginBottom: 12 }}>
                <CircleCheck size={18} aria-hidden="true" />
                <div><strong>Ready to run.</strong> No errors under the current checks{counts.warning ? `, ${counts.warning} warning${counts.warning > 1 ? 's' : ''} to review` : ''}. Passing validation does not prove the model is a correct representation of the system.</div>
              </div>
            ) : (
              <div className="callout callout-error" style={{ marginBottom: 12 }}>
                <CircleAlert size={18} aria-hidden="true" />
                <div><strong>{counts.error} error{counts.error > 1 ? 's' : ''} block the run.</strong> Click an issue to find the element.</div>
              </div>
            )}
            {groups.map((g) => (
              <section key={g.cat}>
                <h4>{CATEGORY_LABEL[g.cat]}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {g.items.map((i) => (
                    <IssueRow key={i.id} issue={i} onSelect={() => (i.elementId || i.edgeId) && select(i.edgeId && !i.elementId ? i.edgeId : i.elementId)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'simulation' && (
          <>
            <div className="field-grid">
              <NumberField id="cfg-start" label="Start time" value={cfg.start} onChange={(n) => setSimConfig({ start: n })} />
              <NumberField id="cfg-stop" label="Stop time" value={cfg.stop} onChange={(n) => setSimConfig({ stop: n })} />
              <NumberField id="cfg-dt" label="Time step (dt)" value={cfg.dt} onChange={(n) => setSimConfig({ dt: n })} />
            </div>
            <div className="field-grid" style={{ marginTop: 12 }}>
              <div className="field">
                <label htmlFor="cfg-method">Integration method</label>
                <select id="cfg-method" className="select select-sm" value={cfg.method} onChange={(e) => setSimConfig({ method: e.target.value })}>
                  {Object.values(METHODS).map((m) => <option key={m.id} value={m.id}>{m.label} (order {m.order})</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cfg-unit">Time unit</label>
                <input id="cfg-unit" className="input input-sm" value={cfg.timeUnit} onChange={(e) => setSimConfig({ timeUnit: e.target.value })} placeholder="e.g. day" list="time-units" />
                <datalist id="time-units">{['second', 'minute', 'hour', 'day', 'week', 'month', 'year'].map((u) => <option key={u} value={u} />)}</datalist>
              </div>
            </div>
            <p className="hint" style={{ marginTop: 8 }}>{steps.toLocaleString('en-US')} steps of {cfg.dt} {cfg.timeUnit || 'time units'} ({MAX_STEPS.toLocaleString('en-US')} maximum). Values are recorded at every step.</p>
            <label className="check" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={!!cfg.nonNegativeStocks} onChange={(e) => setSimConfig({ nonNegativeStocks: e.target.checked })} />
              Keep stocks nonnegative (reported when applied)
            </label>
            <div className="callout" style={{ marginTop: 14 }}>
              <BookOpen size={18} aria-hidden="true" />
              <div>
                <strong>Euler</strong> uses the rate at the start of each step. <strong>RK4</strong> combines four rate evaluations per step and is more accurate for smooth models, but is not automatically correct. Try a smaller time step to check numerical sensitivity.
              </div>
            </div>
          </>
        )}

        {tab === 'model' && (
          <>
            <div className="field">
              <label htmlFor="meta-name">Model name</label>
              <input id="meta-name" className="input" value={meta.name} onChange={(e) => setMeta({ name: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="meta-desc">Description</label>
              <textarea id="meta-desc" className="textarea" rows={6} value={meta.description} onChange={(e) => setMeta({ description: e.target.value })} placeholder="What question does this model answer? What is inside and outside the boundary?" />
            </div>
            {example && (
              <section>
                <h4>Teaching notes</h4>
                <p><span className="badge badge-primary">{example.level}</span> {example.concepts.map((c) => <span key={c} className="badge" style={{ marginLeft: 4 }}>{c}</span>)}</p>
                <p><strong>Intended behaviour.</strong> {example.behavior}</p>
                <p><strong>Try this.</strong></p>
                <ul style={{ paddingLeft: 18, margin: '0 0 0.75em' }}>{example.prompts.map((p) => <li key={p}>{p}</li>)}</ul>
                <p><strong>Limitations.</strong> {example.limitations}</p>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
