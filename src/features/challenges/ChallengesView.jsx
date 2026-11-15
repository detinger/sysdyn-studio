import { Target, CircleCheck, RotateCcw } from 'lucide-react';
import useStore from '../../store';
import { CHALLENGES } from '../../data/challenges';
import * as EXAMPLES from '../../examples';
import { useProgress, resetProgress } from '../../state/progress';

const startModelOf = (c) => (typeof c.start === 'string' ? EXAMPLES[c.start] : c.start);

export default function ChallengesView() {
  const startChallenge = useStore((s) => s.startChallenge);
  const active = useStore((s) => s.challenge?.id);
  const progress = useProgress();
  const done = Object.keys(progress.completed).length;
  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 1200 }}>
        <div className="page-header">
          <div>
            <h1 className="flex items-center gap-2"><Target size={22} aria-hidden="true" /> Challenges</h1>
            <p>Build, fix and predict. Each challenge checks what your model means (its stocks, rates, units and behaviour), not how the diagram looks. Starting a challenge replaces the current model; Undo brings it back.</p>
          </div>
          {done > 0 && (
            <button className="btn btn-sm" onClick={() => window.confirm('Forget which challenges you have completed?') && resetProgress()}><RotateCcw size={14} /> Reset progress</button>
          )}
        </div>
        <p className="hint" style={{ marginTop: -8 }}>{done} of {CHALLENGES.length} completed. Progress is stored only in this browser.</p>
        <div className="grid-cards">
          {CHALLENGES.map((c) => {
            const completed = progress.completed[c.id];
            return (
              <article key={c.id} className="card card-link" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">{c.type}</span>
                  {completed && <span className="badge badge-success"><CircleCheck size={12} aria-hidden="true" /> Completed</span>}
                </div>
                <h3 style={{ margin: 0 }}>{c.title}</h3>
                <div><span className="badge badge-primary">{c.level}</span> <span className="badge">{c.checks.length} checks</span></div>
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
      </div>
    </div>
  );
}
