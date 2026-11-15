import { useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Link2, X, Crosshair, CircleCheck, Plus } from 'lucide-react';
import Tex from '../../components/ui/Tex';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import Tabs from '../../components/ui/Tabs';
import IssueRow from '../../components/ui/IssueRow';
import { renderInlineCode } from '../../components/ui/text';
import { StockGlyph, ValveGlyph, AuxGlyph } from '../../components/ui/Glyphs';
import { variableExpression, LINK } from '../../domain/model/semantics';
import { exprTex, stockBalanceTex, texName } from '../../domain/equations/tex';
import { FUNCTIONS } from '../../domain/equations/expression';
import { rateUnit } from '../../domain/validation/validateModel';
import { fmtNum } from '../../utils/format';
import ModelPanel from './ModelPanel';
import { explainElement, explainLink } from './explanations';

const TYPE_LABEL = { stock: 'Stock', flow: 'Flow', auxiliary: 'Auxiliary', parameter: 'Parameter' };

function TypeIcon({ type }) {
  if (type === 'stock') return <StockGlyph size={16} />;
  if (type === 'flow') return <ValveGlyph size={18} className="" />;
  return <AuxGlyph size={16} param={type === 'parameter'} />;
}

/** Text field that commits on blur/Enter (used for names, which trigger reference updates). */
function CommitInput({ value, onCommit, id, inputRef, ...rest }) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setDraft(value);
  }
  const commit = () => {
    if (draft !== value) {
      const r = onCommit(draft);
      if (r && r.ok === false) setDraft(value);
    }
  };
  return (
    <input
      id={id}
      ref={inputRef}
      className="input"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setDraft(value);
      }}
      {...rest}
    />
  );
}

function Chips({ ids, domain, onSelect, empty = 'None' }) {
  if (!ids.length) return <span className="hint">{empty}</span>;
  return (
    <div className="dep-list">
      {ids.map((id) => (
        <button key={id} className="chip" onClick={() => onSelect(id)} title="Show on canvas">
          {domain.byId.get(id)?.name || id}
        </button>
      ))}
    </div>
  );
}

export default function Inspector() {
  const selectedId = useStore((s) => s.selectedId);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const node = nodes.find((n) => n.id === selectedId);
  const edge = !node ? edges.find((e) => e.id === selectedId) : null;
  return (
    <aside className="inspector" aria-label="Inspector">
      {node ? <ElementInspector key={node.id} node={node} /> : edge ? <LinkInspector edge={edge} /> : <ModelPanel />}
    </aside>
  );
}

function ElementInspector({ node }) {
  const v = useValidation();
  const [tab, setTab] = useState('properties');
  const nameRef = useRef(null);
  const select = useStore((s) => s.select);
  const deleteElement = useStore((s) => s.deleteElement);
  const domainType = v.domain.typeOf(node.id);
  const issues = v.issues.filter((i) => i.elementId === node.id);
  const blocking = issues.filter((i) => i.severity === 'error' || i.severity === 'warning').length;

  useEffect(() => {
    const onFocus = () => {
      setTab('properties');
      setTimeout(() => nameRef.current?.focus(), 0);
    };
    window.addEventListener('sds:focus-inspector', onFocus);
    return () => window.removeEventListener('sds:focus-inspector', onFocus);
  }, []);

  const tabs = [
    { id: 'properties', label: 'Properties' },
    { id: 'equation', label: 'Equation' },
    { id: 'explain', label: 'Explain' },
    { id: 'validate', label: 'Validate', badge: blocking ? <span className={`badge ${issues.some((i) => i.severity === 'error') ? 'badge-error' : 'badge-warning'}`}>{blocking}</span> : null },
  ];

  return (
    <>
      <div className="inspector-head">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <TypeIcon type={domainType} />
            <span className="eyebrow">{TYPE_LABEL[domainType] || node.type}</span>
          </div>
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => select(node.id)} aria-label="Show on canvas" title="Show on canvas"><Crosshair size={16} /></button>
            <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => deleteElement(node.id)} aria-label="Delete element" title="Delete element"><Trash2 size={16} /></button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => select(null, { focus: false })} aria-label="Close inspector" title="Back to model"><X size={16} /></button>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 650, marginTop: 4, overflowWrap: 'anywhere' }}>{node.data.label || 'Unnamed'}</div>
      </div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} compact label="Element details" />
      <div className="inspector-body compact" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'properties' && <PropertiesTab node={node} type={domainType} v={v} nameRef={nameRef} />}
        {tab === 'equation' && <EquationTab node={node} type={domainType} v={v} />}
        {tab === 'explain' && <ExplainTab node={node} type={domainType} v={v} />}
        {tab === 'validate' && <ValidateList issues={issues} node={node} />}
      </div>
    </>
  );
}

function ValueAtCursor({ id, unit }) {
  const value = useStore((s) => s.run?.series?.[id]?.[Math.min(s.playback.index, (s.run?.times.length || 1) - 1)]);
  const t = useStore((s) => s.run?.times?.[s.playback.index]);
  const stale = useStore((s) => !!s.run && s.run.modelRevision !== s.revision);
  if (value === undefined) return null;
  return (
    <div className="kpi" style={{ marginBottom: 12 }}>
      <div className="kpi-label">Value at t = {fmtNum(t)}{stale ? ' (from an earlier model version)' : ''}</div>
      <div className="kpi-value">{fmtNum(value, 5)}</div>
      <div className="kpi-ctx">{unit || 'unit not declared'}</div>
    </div>
  );
}

function PropertiesTab({ node, type, v, nameRef }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const renameNode = useStore((s) => s.renameNode);
  const toast = useStore((s) => s.toast);
  const timeUnit = useStore((s) => s.simConfig.timeUnit);
  const d = node.data;
  const el = v.domain.byId.get(node.id);
  const expectedUnit = useMemo(() => {
    if (type !== 'flow' || !timeUnit || !el) return null;
    const stock = [...el.sources, ...el.targets].map((id) => v.domain.byId.get(id)).find((s) => s?.unit);
    return stock ? rateUnit(stock.unit, timeUnit) : null;
  }, [type, timeUnit, el, v.domain]);

  return (
    <>
      <ValueAtCursor id={node.id} unit={d.unit} />
      <div className="field">
        <label htmlFor="insp-name">Name</label>
        <CommitInput
          id="insp-name"
          inputRef={nameRef}
          value={d.label || ''}
          onCommit={(name) => {
            const r = renameNode(node.id, name);
            if (!r.ok) toast(r.reason, 'warning');
            return r;
          }}
          spellCheck={false}
        />
        <span className="hint">Use letters, digits and underscores. Renaming updates every equation that uses this name.</span>
      </div>

      <ExpressionField node={node} type={type} v={v} id="insp-expr" />

      <div className="field">
        <label htmlFor="insp-unit">Unit</label>
        <input id="insp-unit" className="input" value={d.unit || ''} onChange={(e) => updateNodeData(node.id, { unit: e.target.value || undefined })} placeholder={type === 'stock' ? 'e.g. units' : type === 'flow' ? 'e.g. units/day' : 'e.g. day or dimensionless'} spellCheck={false} />
        {expectedUnit && (d.unit || '') !== expectedUnit && (
          <span className="hint">
            Expected {expectedUnit} from the connected stock.{' '}
            <button className="btn btn-sm btn-ghost" style={{ height: 22 }} onClick={() => updateNodeData(node.id, { unit: expectedUnit })}>Use {expectedUnit}</button>
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="insp-desc">Description</label>
        <textarea id="insp-desc" className="textarea" rows={2} value={d.description || ''} onChange={(e) => updateNodeData(node.id, { description: e.target.value || undefined })} placeholder="What does this element represent? Which assumption does it encode?" />
      </div>

      <Connections node={node} type={type} v={v} />
    </>
  );
}

/** Expression editor shared by the Properties and Equation tabs (one underlying model value). */
function ExpressionField({ node, type, v, id, rows }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const d = node.data;
  const exprValue = type === 'stock' ? (d.value ?? '') : type === 'flow' ? (d.equation ?? '') : variableExpression(d);
  const setExpr = (text) => {
    if (type === 'stock') updateNodeData(node.id, { value: text });
    else if (type === 'flow') updateNodeData(node.id, { equation: text });
    else updateNodeData(node.id, { equation: text, value: undefined });
  };
  const exprIssues = v.issues.filter((i) => i.elementId === node.id && i.severity === 'error' && i.category === 'equation');
  const hintId = `${id}-hint`;
  return (
    <div className="field">
      <label htmlFor={id}>{type === 'stock' ? 'Initial value' : type === 'flow' ? 'Rate equation' : 'Value or equation'}</label>
      <textarea
        id={id}
        className="textarea mono"
        rows={rows || (type === 'stock' ? 1 : 3)}
        value={exprValue}
        onChange={(e) => setExpr(e.target.value)}
        spellCheck={false}
        aria-invalid={exprIssues.length > 0}
        aria-describedby={hintId}
        placeholder={type === 'stock' ? '0' : type === 'flow' ? 'e.g. Inventory / adjustment_time' : 'a number (parameter) or an equation'}
      />
      {exprIssues.length > 0 ? (
        <span id={hintId} className="hint sev-error">{renderInlineCode(exprIssues[0].title)}. {exprIssues[0].message}</span>
      ) : (
        <span id={hintId} className="hint">
          {type === 'stock' ? 'Amount at the start time. Numbers or constant parameters only.' : type === 'flow' ? 'Amount moved per unit of time. Use * for multiplication and ^ for powers.' : 'A number makes this a parameter; an expression makes it an auxiliary.'}
        </span>
      )}
    </div>
  );
}

/** Keyboard-accessible alternative to dragging connections on the canvas. */
function Connections({ node, type, v }) {
  const setFlowStock = useStore((s) => s.setFlowStock);
  const addInfoLink = useStore((s) => s.addInfoLink);
  const edges = useStore((s) => s.edges);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const select = useStore((s) => s.select);
  const el = v.domain.byId.get(node.id);
  const stocks = v.domain.stocks;
  const [adding, setAdding] = useState('');
  if (!el) return null;

  const infoIn = edges.filter((e) => e.target === node.id && e.data?.kind === LINK.INFO);
  const candidates = v.domain.elements.filter((x) => x.id !== node.id && !infoIn.some((e) => e.source === x.id));

  return (
    <section>
      <h4>Connections</h4>
      {type === 'flow' && (
        <div className="field-grid" style={{ marginBottom: 12 }}>
          <div className="field">
            <label htmlFor="insp-src">Drains from</label>
            <select id="insp-src" className="select select-sm" value={el.sources[0] || ''} onChange={(e) => setFlowStock(node.id, 'source', e.target.value || null)}>
              <option value="">Cloud (outside the model)</option>
              {stocks.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="insp-tgt">Fills</label>
            <select id="insp-tgt" className="select select-sm" value={el.targets[0] || ''} onChange={(e) => setFlowStock(node.id, 'target', e.target.value || null)}>
              <option value="">Cloud (outside the model)</option>
              {stocks.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      )}
      {type === 'stock' && (
        <dl className="kv" style={{ marginBottom: 12 }}>
          <dt>Inflows</dt>
          <dd><Chips ids={el.inflows} domain={v.domain} onSelect={select} empty="None" /></dd>
          <dt>Outflows</dt>
          <dd><Chips ids={el.outflows} domain={v.domain} onSelect={select} empty="None" /></dd>
        </dl>
      )}
      {type !== 'stock' && (
        <>
          <div className="label" style={{ marginBottom: 4 }}>Information inputs</div>
          {infoIn.length === 0 && <div className="hint" style={{ marginBottom: 6 }}>No information links point here.</div>}
          {infoIn.map((e) => (
            <div key={e.id} className="row" style={{ paddingLeft: 0 }}>
              <Link2 size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <span style={{ flex: 1 }}>{v.domain.byId.get(e.source)?.name}</span>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Remove link from ${v.domain.byId.get(e.source)?.name}`} onClick={() => onEdgesChange([{ type: 'remove', id: e.id }])}><X size={14} /></button>
            </div>
          ))}
          <div className="flex gap-2" style={{ marginTop: 6 }}>
            <select className="select select-sm" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Element to link from">
              <option value="">Add input from…</option>
              {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn btn-sm" disabled={!adding} onClick={() => { addInfoLink(adding, node.id); setAdding(''); }}><Plus size={14} /> Link</button>
          </div>
        </>
      )}
    </section>
  );
}

function EquationTab({ node, type, v }) {
  const select = useStore((s) => s.select);
  const el = v.domain.byId.get(node.id);
  const deps = v.compiled.dependencies.get(type === 'stock' ? `${node.id}#initial` : node.id) || [];
  const usedBy = [];
  v.compiled.dependencies.forEach((ds, key) => {
    if (ds.includes(node.id)) usedBy.push(key.split('#')[0]);
  });
  const name = (id) => v.domain.byId.get(id)?.name || id;
  const tex = type === 'stock'
    ? stockBalanceTex(el.name, el.inflows.map(name), el.outflows.map(name))
    : (() => {
        const t = exprTex(el.equation);
        return t ? `${texName(el.name)} = ${t}` : null;
      })();
  const initTex = type === 'stock' ? exprTex(el.initial) : null;

  const insert = (text) => {
    const ta = document.getElementById('eq-expr');
    if (!ta) return;
    ta.focus();
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const next = ta.value.slice(0, start) + text + ta.value.slice(end);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, next);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const caret = start + text.length - (text.endsWith('()') ? 1 : 0);
    requestAnimationFrame(() => ta.setSelectionRange(caret, caret));
  };

  return (
    <>
      <section>
        <h4>{type === 'stock' ? 'Stock balance' : 'Equation'}</h4>
        <div className="mathjax-preview" aria-label="Rendered equation">
          {tex ? <Tex tex={tex} /> : <span className="hint">The equation does not parse yet.</span>}
        </div>
        {type === 'stock' && (
          <p className="hint" style={{ marginTop: 6 }}>
            Initial value at the start time: {initTex ? <Tex tex={initTex} inline /> : '0 (not set)'}
          </p>
        )}
        <dl className="kv" style={{ marginTop: 10 }}>
          <dt>Unit</dt><dd>{el.unit || <span className="hint">not declared</span>}</dd>
          <dt>Depends on</dt><dd><Chips ids={deps} domain={v.domain} onSelect={select} /></dd>
          <dt>Used by</dt><dd><Chips ids={[...new Set(usedBy)]} domain={v.domain} onSelect={select} empty="No equation uses it" /></dd>
        </dl>
      </section>
      {type !== 'stock' && (
        <section>
          <ExpressionField node={node} type={type} v={v} id="eq-expr" rows={4} />
          <h4>Insert</h4>
          <div className="label" style={{ marginBottom: 4 }}>Model names</div>
          <div className="dep-list" style={{ marginBottom: 10 }}>
            {v.domain.elements.filter((x) => x.id !== node.id).map((x) => (
              <button key={x.id} className="chip mono" onClick={() => insert(x.name)}>{x.name}</button>
            ))}
            <button className="chip mono" onClick={() => insert('time')} title="Current simulation time">time</button>
          </div>
          <div className="label" style={{ marginBottom: 4 }}>Functions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(FUNCTIONS).map(([fn, def]) => (
              <button key={fn} className="row" style={{ border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }} onClick={() => insert(`${fn}()`)}>
                <code style={{ minWidth: 56 }}>{fn}</code>
                <span className="hint">{def.doc}</span>
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Also available: + − * / ^ %, comparisons (&lt; &gt; == !=), and / or / not, and <code>condition ? a : b</code>. <code>step</code>, <code>ramp</code> and <code>pulse</code> are discontinuous: check results with a smaller dt.</p>
        </section>
      )}
    </>
  );
}

function ExplainTab({ node, type, v }) {
  const content = explainElement(node, type, v);
  return (
    <div className="prose" style={{ fontSize: 13 }}>
      {content.map((s) => (
        <section key={s.title}>
          <h4>{s.title}</h4>
          {s.body.map((p, i) => <p key={i}>{renderInlineCode(p)}</p>)}
        </section>
      ))}
    </div>
  );
}

function ValidateList({ issues, node }) {
  const select = useStore((s) => s.select);
  const syncInfoLinks = useStore((s) => s.syncInfoLinks);
  if (!issues.length) {
    return (
      <div className="callout callout-success">
        <CircleCheck size={18} aria-hidden="true" />
        <div>No problems found for this element under the current checks. This does not mean the model is a valid representation of the system.</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {issues.map((i) => (
        <IssueRow
          key={i.id}
          issue={i}
          onSelect={() => i.related?.[0] && i.code === 'units.flow_mismatch' ? select(i.related[0]) : select(node?.id || i.elementId)}
          action={i.code === 'link.missing' ? (
            <button className="btn btn-sm" style={{ marginTop: 4 }} onClick={() => syncInfoLinks(i.elementId)}><Link2 size={14} /> Draw missing links</button>
          ) : null}
        />
      ))}
    </div>
  );
}

function LinkInspector({ edge }) {
  const v = useValidation();
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const select = useStore((s) => s.select);
  const from = v.domain.byId.get(edge.source);
  const to = v.domain.byId.get(edge.target);
  const kind = edge.data?.kind;
  const issues = v.issues.filter((i) => i.edgeId === edge.id);
  const content = explainLink(kind, from, to);
  return (
    <>
      <div className="inspector-head">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{kind === LINK.INFO ? 'Information link' : kind === LINK.INVALID ? 'Invalid link' : 'Material flow'}</span>
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => { onEdgesChange([{ type: 'remove', id: edge.id }]); select(null, { focus: false }); }} aria-label="Delete link" title="Delete link"><Trash2 size={16} /></button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => select(null, { focus: false })} aria-label="Close inspector"><X size={16} /></button>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 650, marginTop: 4 }}>{from?.name} → {to?.name}</div>
      </div>
      <div className="inspector-body compact">
        {issues.length > 0 && <div style={{ marginBottom: 12 }}><ValidateList issues={issues} /></div>}
        <div className="prose">
          {content.map((s) => (
            <section key={s.title}>
              <h4>{s.title}</h4>
              {s.body.map((p, i) => <p key={i}>{renderInlineCode(p)}</p>)}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
