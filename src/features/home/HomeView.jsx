import { useState } from 'react';
import {
  Workflow, Sigma, BookOpen, Library, Target, FlaskConical, ShieldCheck, LineChart, FilePlus, Upload, ArrowRight,
  CircleCheck, CircleAlert, TriangleAlert, Trash2, HardDrive, Pin,
} from 'lucide-react';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import { useProgress, resetProgress } from '../../state/progress';
import { listStored, clearStored, formatBytes } from '../../state/storage';
import { suspendAutosave } from '../../state/persistence';
import { CHALLENGES, findChallenge } from '../../data/challenges';
import { EXAMPLE_LIBRARY } from '../library/catalog';
import Dialog from '../../components/ui/Dialog';
import { BrandGlyph } from '../../components/ui/Glyphs';

const WORKFLOW = [
  { route: 'theory', icon: BookOpen, title: 'Learn', text: 'Stocks, flows, feedback, delays and numerical integration, one idea at a time.' },
  { route: 'library', icon: Library, title: 'Explore models', text: `${EXAMPLE_LIBRARY.length} worked models, from a bathtub to an overfished ocean.` },
  { route: 'modeler', icon: Workflow, title: 'Build', text: 'Draw stocks, flows and links; write equations with units.' },
  { route: 'modeler', icon: ShieldCheck, title: 'Validate', text: 'Find undefined names, algebraic loops and unit mismatches before running.' },
  { route: 'modeler', icon: LineChart, title: 'Simulate & compare', text: 'Euler or RK4, playback, baseline vs. intervention, sweeps and sensitivity.' },
  { route: 'challenges', icon: Target, title: 'Practise', text: `${CHALLENGES.length} challenges with feedback, from easy to advanced.` },
];

function StatusLine({ icon: Icon, color, children }) {
  return (
    <div className="flex items-start gap-2" style={{ fontSize: 13, marginBottom: 6 }}>
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

function CurrentModel() {
  const meta = useStore((s) => s.meta);
  const run = useStore((s) => s.run);
  const revision = useStore((s) => s.revision);
  const baseline = useStore((s) => s.baseline);
  const savedAt = useStore((s) => s.savedAt);
  const dirty = useStore((s) => s.dirty);
  const challengeState = useStore((s) => s.challenge);
  const setRoute = useStore((s) => s.setRoute);
  const newModel = useStore((s) => s.newModel);
  const importText = useStore((s) => s.importText);
  const v = useValidation();
  const { domain } = v;
  const errors = v.issues.filter((i) => i.severity === 'error').length;
  const warnings = v.issues.filter((i) => i.severity === 'warning').length;
  const challenge = challengeState && findChallenge(challengeState.id);
  const empty = domain.elements.length === 0;

  return (
    <section className="card" aria-labelledby="home-current">
      <div className="card-title">
        <h3 id="home-current">Currently open</h3>
        <span className="hint">{dirty ? 'Saving…' : savedAt ? `Saved in this browser at ${new Date(savedAt).toLocaleTimeString()}` : 'Not saved yet'}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 650 }}>{meta.name}</div>
      {meta.description && <p className="muted" style={{ fontSize: 13, margin: '4px 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{meta.description}</p>}
      {empty ? (
        <p className="muted" style={{ fontSize: 13 }}>The model is empty. Open an example or start building.</p>
      ) : (
        <div style={{ margin: '10px 0' }}>
          <StatusLine icon={Workflow} color="var(--text-subtle)">
            {domain.stocks.length} stock{domain.stocks.length === 1 ? '' : 's'}, {domain.flows.length} flow{domain.flows.length === 1 ? '' : 's'}, {domain.auxiliaries.length} variable{domain.auxiliaries.length === 1 ? '' : 's'}
          </StatusLine>
          {errors ? (
            <StatusLine icon={CircleAlert} color="var(--error)">{errors} validation error{errors > 1 ? 's' : ''}: the model cannot run yet</StatusLine>
          ) : warnings ? (
            <StatusLine icon={TriangleAlert} color="var(--warning)">Ready to run, {warnings} warning{warnings > 1 ? 's' : ''} to review</StatusLine>
          ) : (
            <StatusLine icon={CircleCheck} color="var(--success)">Ready to run: no errors or warnings</StatusLine>
          )}
          {!run ? (
            <StatusLine icon={LineChart} color="var(--text-subtle)">Not simulated yet</StatusLine>
          ) : !run.completed ? (
            <StatusLine icon={CircleAlert} color="var(--error)">Last run failed: {run.failure.message}</StatusLine>
          ) : (
            <StatusLine icon={LineChart} color={run.modelRevision === revision ? 'var(--success)' : 'var(--warning)'}>
              Last run: {run.methodLabel}, t {run.config.start}–{run.config.stop} {run.config.timeUnit}{run.modelRevision === revision ? '' : ' (out of date: the model changed since)'}
            </StatusLine>
          )}
          {baseline && <StatusLine icon={Pin} color="var(--primary)">A baseline run is pinned for comparison</StatusLine>}
        </div>
      )}
      {challenge && (
        <div className="callout" style={{ marginBottom: 10 }}>
          <Target size={18} aria-hidden="true" />
          <div>Challenge in progress: <strong>{challenge.title}</strong> ({challenge.level}). Its checklist is shown on the canvas.</div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-primary" onClick={() => setRoute('modeler')}><ArrowRight size={16} /> {empty ? 'Open the modeler' : 'Continue modelling'}</button>
        {!empty && <button className="btn" onClick={() => setRoute('equations')}><Sigma size={16} /> Equations</button>}
        <button className="btn" onClick={() => { newModel(); setRoute('modeler'); }}><FilePlus size={16} /> New model</button>
        <label className="btn" style={{ cursor: 'pointer' }}>
          <Upload size={16} /> Import…
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f && importText(await f.text())) setRoute('modeler');
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {!empty && <p className="hint" style={{ marginTop: 8 }}>New model and Import replace the current model. Undo in the modeler brings it back; to keep a copy, use Export → Model file first.</p>}
    </section>
  );
}

function ChallengeProgress() {
  const progress = useProgress();
  const setRoute = useStore((s) => s.setRoute);
  const done = CHALLENGES.filter((c) => progress.completed[c.id]).length;
  const byLevel = ['Easy', 'Intermediate', 'Advanced'].map((l) => {
    const items = CHALLENGES.filter((c) => c.level === l);
    return { l, done: items.filter((c) => progress.completed[c.id]).length, total: items.length };
  });
  const next = CHALLENGES.find((c) => !progress.completed[c.id]);
  return (
    <section className="card" aria-labelledby="home-progress">
      <div className="card-title"><h3 id="home-progress">Challenge progress</h3><span className="hint">{done} / {CHALLENGES.length}</span></div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={CHALLENGES.length} aria-valuenow={done} aria-label="Challenges completed" style={{ marginBottom: 12 }}>
        <span style={{ width: `${(100 * done) / CHALLENGES.length}%` }} />
      </div>
      <table className="table" style={{ marginBottom: 12 }}>
        <tbody>
          {byLevel.map((r) => (
            <tr key={r.l}><td>{r.l}</td><td className="n">{r.done} / {r.total}</td></tr>
          ))}
        </tbody>
      </table>
      {next ? (
        <p style={{ fontSize: 13, margin: '0 0 10px' }}>Next up: <strong>{next.title}</strong> <span className="badge">{next.level}</span></p>
      ) : (
        <p style={{ fontSize: 13, margin: '0 0 10px' }}>All challenges completed.</p>
      )}
      <button className="btn btn-sm" onClick={() => setRoute('challenges')}><Target size={14} /> Go to challenges</button>
    </section>
  );
}

function StoredData() {
  const toast = useStore((s) => s.toast);
  const [, setVersion] = useState(0); // re-read storage after clearing
  const [confirm, setConfirm] = useState(null); // 'progress' | 'all'
  const items = listStored();
  const total = items.reduce((a, b) => a + b.bytes, 0);

  const doClear = () => {
    if (confirm === 'progress') {
      resetProgress();
      toast('Challenge progress was reset.', 'success');
      setConfirm(null);
      setVersion((x) => x + 1);
      return;
    }
    suspendAutosave();
    clearStored();
    window.location.reload();
  };

  return (
    <section className="card" aria-labelledby="home-storage">
      <div className="card-title">
        <h3 id="home-storage" className="flex items-center gap-2"><HardDrive size={18} aria-hidden="true" /> Saved in this browser</h3>
        <span className="hint">{formatBytes(total)}</span>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Everything stays on this device; nothing is sent to a server. Other browsers and devices do not see it, and clearing site data in the browser removes it.</p>
      {items.length === 0 ? (
        <p className="hint">Nothing stored yet.</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: 12 }}>
          <table className="table">
            <thead><tr><th>What</th><th className="n">Size</th></tr></thead>
            <tbody>{items.map((i) => <tr key={i.key}><td title={i.key}>{i.label}</td><td className="n">{formatBytes(i.bytes)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-sm" onClick={() => setConfirm('progress')} disabled={!items.some((i) => i.group === 'progress')}><Target size={14} /> Reset challenge progress</button>
        <button className="btn btn-sm btn-danger" onClick={() => setConfirm('all')} disabled={!items.length}><Trash2 size={14} /> Clear all saved data</button>
      </div>
      {confirm && (
        <Dialog
          title={confirm === 'all' ? 'Clear all saved data?' : 'Reset challenge progress?'}
          icon={<Trash2 size={18} style={{ color: 'var(--error)' }} aria-hidden="true" />}
          onClose={() => setConfirm(null)}
          width={480}
          footer={(
            <>
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doClear}>{confirm === 'all' ? 'Clear everything' : 'Reset progress'}</button>
            </>
          )}
        >
          {confirm === 'all' ? (
            <>
              <p>This removes the current model, challenge progress and your display preferences from this browser, then reloads the app with an empty model.</p>
              <p className="hint">It cannot be undone. To keep the model, use Export → Model file in the modeler first.</p>
            </>
          ) : (
            <p>All {CHALLENGES.length} challenges will be marked as not completed. Your current model is not affected.</p>
          )}
        </Dialog>
      )}
    </section>
  );
}

/** Home: what is open, where to go next, and what is stored locally. */
export default function HomeView() {
  const setRoute = useStore((s) => s.setRoute);
  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 1200 }}>
        <div className="home-hero">
          <span className="brand-mark" style={{ width: 44, height: 44, borderRadius: 10 }}><BrandGlyph size={28} /></span>
          <div>
            <div className="eyebrow">Learn · Model · Validate · Simulate · Experiment</div>
            <h1 className="home-title">System Dynamics Studio</h1>
            <p className="muted" style={{ maxWidth: '72ch', fontSize: 15, margin: 0 }}>
              Build stock-and-flow models, check them before you run them, simulate them with transparent numerical methods, and test policies. A learning environment for modelling and simulation courses.
            </p>
          </div>
        </div>

        <div className="home-grid">
          <CurrentModel />
          <ChallengeProgress />
        </div>

        <h2 style={{ marginTop: 28 }}>Where to go</h2>
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {WORKFLOW.map((w, i) => (
            <button key={w.title} className="card card-link home-step" onClick={() => setRoute(w.route)}>
              <span className="flex items-center gap-2"><span className="badge badge-primary">{i + 1}</span><w.icon size={18} aria-hidden="true" style={{ color: 'var(--primary)' }} /><strong>{w.title}</strong></span>
              <span className="muted" style={{ fontSize: 13 }}>{w.text}</span>
            </button>
          ))}
        </div>

        <div className="home-grid" style={{ marginTop: 28 }}>
          <StoredData />
          <section className="card" aria-labelledby="home-about">
            <div className="card-title"><h3 id="home-about" className="flex items-center gap-2"><FlaskConical size={18} aria-hidden="true" /> How results are computed</h3></div>
            <ul className="muted" style={{ fontSize: 13, paddingLeft: 18, margin: 0 }}>
              <li>Equations are parsed and checked before every run; errors block the run instead of producing a misleading chart.</li>
              <li>Euler and RK4 with a fixed time step. Results depend on dt: halve it to check.</li>
              <li>Stocks are never silently kept at zero; failures name the time and the variable.</li>
              <li>Python and R exports reproduce the in-app equations; R reproduces the run exactly.</li>
            </ul>
            <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => setRoute('theory')}><BookOpen size={14} /> Read the theory</button>
          </section>
        </div>
      </div>
    </div>
  );
}
