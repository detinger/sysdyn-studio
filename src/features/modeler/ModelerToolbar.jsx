import { lazy, Suspense, useRef, useState, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import { Undo2, Redo2, Maximize, ShieldCheck, Play, Download, Upload, ChevronDown, FileJson, FileSpreadsheet, FileCode, FilePlus } from 'lucide-react';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import { StockGlyph, ValveGlyph, AuxGlyph } from '../../components/ui/Glyphs';
import { generatePythonCode } from '../../pythonExporter';
import { generateRCode } from '../../rExporter';
import { runToCsv } from '../../domain/simulation/runModel';
import { downloadText, fileSafe } from '../../utils/download';
import { findFreePosition } from './placement';
const ExportDialog = lazy(() => import('./ExportDialog'));

const PALETTE = [
  { type: 'stock', label: 'Stock', icon: <StockGlyph />, hint: 'Accumulation (level)' },
  { type: 'flow', label: 'Flow', icon: <ValveGlyph size={18} className="" />, hint: 'Rate of change' },
  { type: 'variable', label: 'Auxiliary', icon: <AuxGlyph />, hint: 'Parameter or calculated value' },
];

function SaveStatus() {
  const dirty = useStore((s) => s.dirty);
  const savedAt = useStore((s) => s.savedAt);
  if (dirty) return <span className="badge" aria-live="polite">Saving…</span>;
  if (savedAt) return <span className="badge badge-success" title={`Saved in this browser at ${new Date(savedAt).toLocaleTimeString()}`}>Saved locally</span>;
  return <span className="badge">Not saved</span>;
}

export default function ModelerToolbar() {
  const rf = useReactFlow();
  const meta = useStore((s) => s.meta);
  const setMeta = useStore((s) => s.setMeta);
  const addNode = useStore((s) => s.addNode);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.history.past.length > 0);
  const canRedo = useStore((s) => s.history.future.length > 0);
  const runSimulation = useStore((s) => s.runSimulation);
  const select = useStore((s) => s.select);
  const requestFit = useStore((s) => s.requestFit);
  const importText = useStore((s) => s.importText);
  const newModel = useStore((s) => s.newModel);
  const hasRun = useStore((s) => !!s.run);
  const v = useValidation();
  const [menu, setMenu] = useState(false);
  const [code, setCode] = useState(null);
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    const esc = (e) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    menuRef.current?.querySelector('.menu-item')?.focus();
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  const addAtCenter = (type) => {
    const el = document.querySelector('.canvas-wrap');
    const r = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: 600, height: 400 };
    const center = rf.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const p = findFreePosition(useStore.getState().nodes, type, center);
    addNode(type, p);
  };

  const errors = v.issues.filter((i) => i.severity === 'error').length;
  const warnings = v.issues.filter((i) => i.severity === 'warning').length;
  const base = fileSafe(meta.name);

  const doExport = (kind) => {
    setMenu(false);
    const s = useStore.getState();
    if (kind === 'json') downloadText(`${base}.sdmodel.json`, JSON.stringify(s.exportDocument(), null, 2), 'application/json');
    if (kind === 'csv') downloadText(`${base}-results.csv`, runToCsv(s.run, { modelName: meta.name }), 'text/csv');
    if (kind === 'python') setCode({ lang: 'python', filename: `${base}.py`, code: generatePythonCode(s.nodes, s.edges, s.simConfig.dt, s.simConfig.stop, s.view.visibleVariables, s.simConfig) });
    if (kind === 'r') setCode({ lang: 'r', filename: `${base}.R`, code: generateRCode(s.nodes, s.edges, s.simConfig.dt, s.simConfig.stop, s.view.visibleVariables, s.simConfig) });
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Model tools">
      <input className="model-title" value={meta.name} onChange={(e) => setMeta({ name: e.target.value })} aria-label="Model name" />
      <SaveStatus />
      <span className="toolbar-sep" />
      <div className="toolbar-group" aria-label="Add elements">
        {PALETTE.map((p) => (
          <button
            key={p.type}
            className="btn btn-sm"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', p.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => addAtCenter(p.type)}
            title={`${p.hint}. Click to add, or drag onto the canvas.`}
          >
            {p.icon}<span>{p.label}</span>
          </button>
        ))}
      </div>
      <span className="toolbar-sep" />
      <div className="toolbar-group">
        <button className="btn btn-sm btn-icon btn-ghost" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl/⌘ Z)"><Undo2 size={16} /></button>
        <button className="btn btn-sm btn-icon btn-ghost" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)"><Redo2 size={16} /></button>
        <button className="btn btn-sm btn-icon btn-ghost" onClick={requestFit} aria-label="Fit model to view" title="Fit to model"><Maximize size={16} /></button>
      </div>
      <span className="toolbar-spacer" />
      <div className="toolbar-group">
        <button
          className="btn btn-sm"
          onClick={() => {
            select(null, { focus: false });
            setTimeout(() => window.dispatchEvent(new CustomEvent('sds:open-validation')), 0);
          }}
          title="Show validation results"
        >
          <ShieldCheck size={16} /> Validate
          {errors ? <span className="badge badge-error">{errors}</span> : warnings ? <span className="badge badge-warning">{warnings}</span> : <span className="badge badge-success">OK</span>}
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => runSimulation()} title="Solve the model and play back the result (Ctrl/⌘ Enter)"><Play size={16} /> Run simulation</button>
        <div className="menu-wrap" ref={menuRef}>
          <button className="btn btn-sm" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><Download size={16} /> Export <ChevronDown size={14} /></button>
          {menu && (
            <div className="menu" role="menu">
              <button role="menuitem" className="menu-item" onClick={() => doExport('json')}><FileJson size={16} /> Model file (.json)</button>
              <button role="menuitem" className="menu-item" onClick={() => doExport('csv')} disabled={!hasRun} style={!hasRun ? { opacity: 0.5 } : undefined}><FileSpreadsheet size={16} /> Results (.csv){!hasRun ? ' — run first' : ''}</button>
              <div className="menu-sep" />
              <button role="menuitem" className="menu-item" onClick={() => doExport('python')}><FileCode size={16} /> Python code (SciPy)</button>
              <button role="menuitem" className="menu-item" onClick={() => doExport('r')}><FileCode size={16} /> R code (deSolve)</button>
              <div className="menu-sep" />
              <button role="menuitem" className="menu-item" onClick={() => { setMenu(false); fileRef.current?.click(); }}><Upload size={16} /> Import model…</button>
              <button role="menuitem" className="menu-item" onClick={() => { setMenu(false); newModel(); }}><FilePlus size={16} /> New empty model</button>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Import model file"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) importText(await f.text());
            e.target.value = '';
          }}
        />
      </div>
      {code && (
        <Suspense fallback={null}>
          <ExportDialog {...code} onClose={() => setCode(null)} />
        </Suspense>
      )}
    </div>
  );
}
