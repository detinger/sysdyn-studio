/**
 * Contextual explanations (PLAN.md Module A "Contextual education").
 * Built from the actual element, its connections and names, so the text
 * describes this model rather than a generic textbook case.
 */
import { LINK } from '../../domain/model/semantics.js';

const list = (names) => (names.length === 0 ? 'nothing' : names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

export function explainElement(node, type, v) {
  const el = v.domain.byId.get(node.id);
  const name = (id) => v.domain.byId.get(id)?.name || id;
  if (type === 'stock') {
    const ins = el.inflows.map(name);
    const outs = el.outflows.map(name);
    return [
      { title: 'What it is', body: [`${el.name} is a stock: an accumulation. It is the memory of the system and only changes through its flows.`] },
      {
        title: 'How it changes',
        body: [
          `Its rate of change is the sum of inflows minus the sum of outflows: d${el.name}/dt = ${ins.length ? ins.join(' + ') : '0'}${outs.length ? ` − ${outs.join(' − ')}` : ''}.`,
          ins.length || outs.length
            ? `It is filled by ${list(ins)} and drained by ${list(outs)}.`
            : 'It has no flows yet, so it will stay at its initial value.',
          'Raising an inflow changes the slope of the stock, not its level: the level responds gradually.',
        ],
      },
      { title: 'Units', body: [`If ${el.name} is measured in, say, \`items\`, every connected flow must be in \`items\` per unit of time.${el.unit ? ` Here the declared unit is \`${el.unit}\`.` : ''}`] },
      {
        title: 'Common mistakes',
        body: [
          'Pointing an information link into a stock. Only flows change stocks; information links only feed equations.',
          'Treating a stock as a rate, for example adding a stock to a flow in one equation without converting units.',
        ],
      },
    ];
  }
  if (type === 'flow') {
    const src = el.sources.map(name);
    const tgt = el.targets.map(name);
    return [
      { title: 'What it is', body: [`${el.name} is a flow: a rate that moves material per unit of time.`] },
      {
        title: 'Effect on stocks',
        body: [
          src.length ? `It drains ${list(src)}.` : 'Its source is a cloud: material comes from outside the model boundary.',
          tgt.length ? `It fills ${list(tgt)}.` : 'Its destination is a cloud: material leaves the model boundary.',
          'A negative value reverses the direction: material then moves from the destination back to the source.',
        ],
      },
      { title: 'Equation', body: [`The equation \`${el.equation || '…'}\` is evaluated at every time point (and at every RK4 sub-step) from the current stock values.`] },
      {
        title: 'Common mistakes',
        body: [
          'Forgetting the time dimension: a rate is "per day" or "per week", not just "items".',
          'Using a stock in the equation without drawing an information link, so the diagram hides the feedback.',
        ],
      },
    ];
  }
  const usedBy = [];
  v.compiled.dependencies.forEach((ds, key) => ds.includes(node.id) && usedBy.push(name(key.split('#')[0])));
  if (type === 'parameter') {
    return [
      { title: 'What it is', body: [`${el.name} is a parameter: a constant assumption (${el.equation}). It stays fixed during a run and is the natural thing to change in an experiment.`] },
      { title: 'Where it is used', body: [usedBy.length ? `Used by ${list([...new Set(usedBy)])}.` : 'No equation uses it yet.'] },
      { title: 'Good practice', body: ['Give it a unit and a description of where the value comes from (data, estimate, policy target).'] },
    ];
  }
  return [
    { title: 'What it is', body: [`${el.name} is an auxiliary: an intermediate calculation, recomputed at every time point from the current state.`] },
    { title: 'Where it is used', body: [usedBy.length ? `Used by ${list([...new Set(usedBy)])}.` : 'No equation uses it yet.'] },
    {
      title: 'Common mistakes',
      body: [
        'Making auxiliaries depend on each other in a circle without a stock in between. That is an algebraic loop and cannot be calculated.',
        'Hiding a real accumulation inside an auxiliary. If something builds up over time, it should be a stock.',
      ],
    },
  ];
}

export function explainLink(kind, from, to) {
  if (kind === LINK.INFO) {
    return [
      { title: 'Information, not material', body: [`This orange dashed arrow says that the equation of ${to?.name} uses the value of ${from?.name}. Nothing is transferred: ${from?.name} does not decrease.`] },
      { title: 'Keep diagram and equations in sync', body: ['Every name used in an equation should have an information link, and every information link should be used. The validator reports mismatches.'] },
    ];
  }
  if (kind === LINK.INVALID) {
    return [{ title: 'This link has no effect', body: ['It connects elements in a way the model does not support. Only flows change stocks, and material enters a stock through its inflow port (left) and leaves through its outflow port (right).'] }];
  }
  return [
    {
      title: 'Material flow',
      body: [
        kind === LINK.INFLOW
          ? `Material moved by ${from?.name} accumulates in ${to?.name}.`
          : `Material leaves ${from?.name} through ${to?.name}.`,
        'Material is conserved: what leaves one stock through a flow enters the next stock, or crosses the model boundary at a cloud.',
      ],
    },
  ];
}
