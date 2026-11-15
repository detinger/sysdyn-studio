import { useEffect, useMemo, useState } from 'react';
import { CircleCheck, Circle, Lightbulb, X, ChevronDown, ChevronUp, Trophy, BookOpen } from 'lucide-react';
import useStore from '../../store';
import { useValidation } from '../../state/validation';
import { findChallenge, startModelOf } from '../../data/challenges';
import { makeContext, evaluateChallenge } from '../../domain/assessment/rubric';
import { markCompleted } from '../../state/progress';

function Question({ q, given, onAnswer }) {
  return (
    <fieldset className="challenge-q">
      <legend className="label">{q.prompt}</legend>
      {q.options.map((o) => (
        <label key={o.id} className="check" style={{ margin: '4px 0' }}>
          <input type="radio" name={q.id} value={o.id} checked={given === o.id} disabled={!!given} onChange={() => onAnswer(q.id, o.id)} />
          <span style={given && o.id === q.correct ? { color: 'var(--success)', fontWeight: 600 } : given === o.id ? { color: 'var(--error)' } : undefined}>{o.label}</span>
        </label>
      ))}
      {given && <p className="hint" style={{ margin: '6px 0 0' }}>{q.why[given]}</p>}
    </fieldset>
  );
}

/** Checklist overlay for the active challenge, evaluated live against the model. */
export default function ChallengeCard() {
  const state = useStore((s) => s.challenge);
  const run = useStore((s) => s.run);
  const config = useStore((s) => s.simConfig);
  const revision = useStore((s) => s.revision);
  const answer = useStore((s) => s.answerChallenge);
  const revealHint = useStore((s) => s.revealHint);
  const revealExplanation = useStore((s) => s.revealExplanation);
  const exit = useStore((s) => s.exitChallenge);
  const toast = useStore((s) => s.toast);
  const validation = useValidation();
  const [open, setOpen] = useState(true);
  const challenge = state && findChallenge(state.id);

  const result = useMemo(() => {
    if (!challenge) return null;
    return evaluateChallenge(challenge, makeContext({ validation, run, config, revision, answers: state.answers, startModel: startModelOf(challenge) }));
  }, [challenge, validation, run, config, revision, state]);

  useEffect(() => {
    if (result?.complete && challenge && markCompleted(challenge.id)) {
      toast(`Challenge complete: ${challenge.title}`, 'success', 5000);
    }
  }, [result?.complete, challenge, toast]);

  if (!challenge || !result) return null;
  const questions = challenge.questions || [];
  const showExplanation = state.revealed || result.complete;

  return (
    <aside className="challenge-card card" aria-label={`Challenge: ${challenge.title}`}>
      <div className="flex items-center justify-between gap-2">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{challenge.level} · {challenge.type}</div>
          <div style={{ fontWeight: 650 }}>{challenge.title}</div>
        </div>
        <div className="flex gap-1 items-center">
          <span className={`badge ${result.complete ? 'badge-success' : 'badge-primary'}`} aria-live="polite">{result.complete ? <><Trophy size={12} aria-hidden="true" /> Done</> : `${result.passed}/${result.total}`}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse challenge' : 'Expand challenge'}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={exit} aria-label="Leave challenge" title="Leave challenge (your model stays)"><X size={16} /></button>
        </div>
      </div>
      {open && (
        <div className="challenge-body">
          <p style={{ fontSize: 13, margin: '8px 0' }}>{challenge.objective}</p>
          {challenge.constraints.length > 0 && (
            <ul className="hint" style={{ margin: '0 0 8px', paddingLeft: 18 }}>{challenge.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
          )}
          {challenge.reference && (
            <details style={{ margin: '0 0 8px', fontSize: 12 }}>
              <summary className="label" style={{ cursor: 'pointer' }}>Observed data ({challenge.reference.points.length} points)</summary>
              <div className="table-wrap" style={{ marginTop: 6, maxHeight: 160 }}>
                <table className="table">
                  <thead><tr><th className="n">time</th><th className="n">{challenge.reference.stock} ({challenge.reference.unit})</th></tr></thead>
                  <tbody>{challenge.reference.points.map((p) => <tr key={p.t}><td className="n">{p.t}</td><td className="n">{p.v}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          )}
          {questions.map((q) => <Question key={q.id} q={q} given={state.answers[q.id]} onAnswer={answer} />)}
          <ul className="challenge-checks">
            {result.results.map((r) => (
              <li key={r.id}>
                {r.pass ? <CircleCheck size={16} style={{ color: 'var(--success)' }} aria-label="Done" /> : <Circle size={16} style={{ color: 'var(--text-subtle)' }} aria-label="Not yet" />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 550 }}>{r.label}</div>
                  {r.feedback && <div className="hint">{r.feedback}</div>}
                </div>
              </li>
            ))}
          </ul>
          {state.hintsShown > 0 && (
            <ol className="hint" style={{ margin: '8px 0', paddingLeft: 18 }}>{challenge.hints.slice(0, state.hintsShown).map((h) => <li key={h}>{h}</li>)}</ol>
          )}
          {showExplanation && (
            <div className="callout callout-recommendation" style={{ marginTop: 8 }}>
              <BookOpen size={18} aria-hidden="true" />
              <div>{challenge.explanation}</div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap" style={{ marginTop: 10 }}>
            {state.hintsShown < challenge.hints.length && (
              <button className="btn btn-sm" onClick={revealHint}><Lightbulb size={14} /> {state.hintsShown ? 'Another hint' : 'Hint'} ({state.hintsShown}/{challenge.hints.length})</button>
            )}
            {!showExplanation && state.hintsShown >= challenge.hints.length && (
              <button className="btn btn-sm" onClick={revealExplanation}>Show explanation</button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
