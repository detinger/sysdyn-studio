import { Target, CircleCheck, RotateCcw } from 'lucide-react';
import useStore from '../../store';
import { CHALLENGES, LEVELS, startModelOf } from '../../data/challenges';
import { useProgress, resetProgress } from '../../state/progress';

const LEVEL_NOTE = {
  Easy: 'Stocks, flows, units and simple behaviour. Start here.',
  Intermediate: 'Feedback loops, equilibria, policies and numerical accuracy.',
  Advanced: 'Delays, oscillation, overshoot and collapse, calibration and policy design.',
};

export default function ChallengesView() {
  const startChallenge = useStore((s) => s.startChallenge);
  const active = useStore((s) => s.challenge?.id);
  const progress = useProgress();
  const done = CHALLENGES.filter((c) => progress.completed[c.id]).length;
  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 1200 }}>
        <div className="page-header">
          <div>
            <h1 className="flex items-center gap-2"><Target size={22} aria-hidden="true" /> Challenges</h1>
            <p>Build, fix, predict, explain, calibrate and design policies. Each challenge checks what your model means (its stocks, rates, units and behaviour), not how the diagram looks. Starting a challenge replaces the current model; Undo brings it back.</p>
          </div>
          {done > 0 && (
            <button className="btn btn-sm" onClick={() => window.confirm('Forget which challenges you have completed?') && resetProgress()}><RotateCcw size={14} /> Reset progress</button>
          )}
        </div>
        <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
          <div className="progress" style={{ width: 240 }} role="progressbar" aria-valuemin={0} aria-valuemax={CHALLENGES.length} aria-valuenow={done} aria-label="Challenges completed"><span style={{ width: `${(100 * done) / CHALLENGES.length}%` }} /></div>
          <span className="hint">{done} of {CHALLENGES.length} completed · stored only in this browser</span>
        </div>
        {LEVELS.map((level) => {
          const items = CHALLENGES.filter((c) => c.level === level);
          const levelDone = items.filter((c) => progress.completed[c.id]).length;
          return (
            <section key={level} style={{ marginBottom: 28 }} aria-labelledby={`lvl-${level}`}>
              <div className="flex items-baseline gap-2 flex-wrap" style={{ marginBottom: 10 }}>
                <h2 id={`lvl-${level}`} style={{ margin: 0 }}>{level}</h2>
                <span className="hint">{levelDone}/{items.length} · {LEVEL_NOTE[level]}</span>
              </div>
              <div className="grid-cards">
                {items.map((c) => {
                  const completed = progress.completed[c.id];
                  return (
                    <article key={c.id} className="card card-link" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="eyebrow">{c.type}</span>
                        {completed && <span className="badge badge-success"><CircleCheck size={12} aria-hidden="true" /> Completed</span>}
                      </div>
                      <h3 style={{ margin: 0 }}>{c.title}</h3>
                      <div><span className="badge">{c.checks.length} checks</span>{c.questions?.length ? <span className="badge" style={{ marginLeft: 4 }}>{c.questions.length} question{c.questions.length > 1 ? 's' : ''}</span> : null}</div>
                      <p className="muted" style={{ fontSize: 13, margin: 0 }}>{c.objective}</p>
                      <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => startChallenge(c, startModelOf(c))}>
                          {active === c.id ? 'Restart' : completed ? 'Try again' : 'Start challenge'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
