import { useId, useMemo, useState } from 'react';
import * as EX from '../../examples';
import MiniChart from './MiniChart';
import { runMini, solveWith, ACCUMULATION, DECAY, decayExact } from './miniModels';

const C1 = 'var(--chart-1)';
const C2 = 'var(--chart-2)';
const C3 = 'var(--chart-3)';
const STROKE = { stroke: 'var(--sd-stroke)' };
const LABEL = { fill: 'var(--sd-label)', fontSize: 13, fontWeight: 600 };
const NOTE = { fill: 'var(--text-muted)', fontSize: 12 };

/** Figure frame with caption. */
function Figure({ title, children, caption }) {
  return (
    <figure className="theory-figure">
      {title && <div className="theory-figure-title">{title}</div>}
      {children}
      {caption && <figcaption className="hint" style={{ marginTop: 6 }}>{caption}</figcaption>}
    </figure>
  );
}

function Slider({ id, label, value, min, max, step, onChange, format = (v) => v }) {
  return (
    <div className="theory-control">
      <label htmlFor={id}>{label}: <strong className="num">{format(value)}</strong></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notation drawings (SVG, themed)
// ---------------------------------------------------------------------------

const Cloud = ({ x, y }) => (
  <path transform={`translate(${x} ${y})`} d="M-14 6 a7 7 0 0 1 2-13 a9 9 0 0 1 16-3 a7 7 0 0 1 11 5 a6 6 0 0 1-1 11 z" style={{ fill: 'var(--sd-fill)', stroke: 'var(--text-subtle)', strokeWidth: 1.5 }} />
);
const Valve = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-10 -10 L0 0 L-10 10 Z M10 -10 L0 0 L10 10 Z" style={{ fill: 'var(--sd-fill)', ...STROKE, strokeWidth: 1.8 }} />
    <path d="M0 0 V-14" style={{ ...STROKE, strokeWidth: 1.8 }} />
    <circle cx="0" cy="-15" r="2.2" style={{ fill: 'var(--sd-stroke)' }} />
  </g>
);

function Markers({ id }) {
  return (
    <defs>
      <marker id={`${id}-pipe`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--sd-stroke)' }} />
      </marker>
      <marker id={`${id}-info`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--accent)' }} />
      </marker>
      <marker id={`${id}-cld`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--text)' }} />
      </marker>
    </defs>
  );
}

/** Anatomy of a stock-and-flow structure with units. */
export function StockFlowAnatomy() {
  const id = useId();
  return (
    <Figure
      title="Anatomy of a stock-and-flow diagram"
      caption="Material enters from a cloud (outside the model), accumulates in the stock and leaves through the outflow. The orange arrow shows that the outflow rate is calculated from the stock; nothing moves along it."
    >
      <svg viewBox="0 0 640 220" role="img" aria-label="Cloud, inflow valve, stock Inventory, outflow valve, cloud, with an information arrow from the stock to the outflow" style={{ width: '100%', height: 'auto' }}>
        <Markers id={id} />
        <Cloud x={40} y={92} />
        <path d="M58 90 H232" style={{ ...STROKE, strokeWidth: 4 }} markerEnd={`url(#${id}-pipe)`} />
        <Valve x={140} y={90} />
        <rect x="236" y="58" width="168" height="64" rx="2" style={{ fill: 'var(--sd-fill)', ...STROKE, strokeWidth: 2.5 }} />
        <text x="320" y="88" textAnchor="middle" style={LABEL}>Inventory</text>
        <text x="320" y="107" textAnchor="middle" style={NOTE}>units</text>
        <path d="M404 90 H580" style={{ ...STROKE, strokeWidth: 4 }} markerEnd={`url(#${id}-pipe)`} />
        <Valve x={500} y={90} />
        <Cloud x={602} y={92} />
        <text x="140" y="128" textAnchor="middle" style={LABEL}>production</text>
        <text x="140" y="145" textAnchor="middle" style={NOTE}>units/week</text>
        <text x="500" y="128" textAnchor="middle" style={LABEL}>shipments</text>
        <text x="500" y="145" textAnchor="middle" style={NOTE}>units/week</text>
        <path d="M360 122 C380 190, 470 190, 498 108" fill="none" style={{ stroke: 'var(--accent)', strokeWidth: 1.6, strokeDasharray: '6 4' }} markerEnd={`url(#${id}-info)`} />
        <text x="430" y="200" textAnchor="middle" style={{ ...NOTE, fill: 'var(--accent)' }}>information</text>
        <text x="320" y="36" textAnchor="middle" style={NOTE}>stock (accumulation)</text>
        <text x="40" y="128" textAnchor="middle" style={NOTE}>source</text>
        <text x="602" y="128" textAnchor="middle" style={NOTE}>sink</text>
      </svg>
      <div className="theory-equation">d Inventory / dt = production − shipments <span className="hint">· units/week = units/week − units/week</span></div>
    </Figure>
  );
}

/** Material vs information, side by side. */
export function MaterialVsInformation() {
  const id = useId();
  return (
    <Figure caption="Top: a flow drains the stock, so Inventory goes down. Bottom: an equation only reads Inventory, so Inventory is unchanged.">
      <svg viewBox="0 0 640 200" role="img" aria-label="Material flow drains Inventory; an information link only reads Inventory" style={{ width: '100%', height: 'auto' }}>
        <Markers id={id} />
        <rect x="40" y="22" width="140" height="50" rx="2" style={{ fill: 'var(--sd-fill)', ...STROKE, strokeWidth: 2.5 }} />
        <text x="110" y="52" textAnchor="middle" style={LABEL}>Inventory</text>
        <path d="M180 47 H360" style={{ ...STROKE, strokeWidth: 4 }} markerEnd={`url(#${id}-pipe)`} />
        <Valve x={280} y={47} />
        <Cloud x={384} y={49} />
        <text x="420" y="44" style={LABEL}>Material flow</text>
        <text x="420" y="62" style={NOTE}>moves units out of the stock</text>

        <rect x="40" y="122" width="140" height="50" rx="2" style={{ fill: 'var(--sd-fill)', ...STROKE, strokeWidth: 2.5 }} />
        <text x="110" y="152" textAnchor="middle" style={LABEL}>Inventory</text>
        <path d="M180 147 H318" style={{ stroke: 'var(--accent)', strokeWidth: 1.8, strokeDasharray: '6 4' }} markerEnd={`url(#${id}-info)`} />
        <circle cx="336" cy="147" r="15" style={{ fill: 'var(--sd-fill)', ...STROKE, strokeWidth: 2 }} />
        <text x="336" y="182" textAnchor="middle" style={NOTE}>order_rate</text>
        <text x="420" y="144" style={LABEL}>Information link</text>
        <text x="420" y="162" style={NOTE}>the equation reads the stock’s value</text>
      </svg>
    </Figure>
  );
}

/** Causal loop with polarity signs and an R/B marker. */
function LoopDiagram({ a, b, signAB, signBA, letter, aria }) {
  const id = useId();
  const sign = (s) => (s === '+' ? '+' : '−');
  return (
    <svg viewBox="0 0 300 170" role="img" aria-label={aria} style={{ width: '100%', height: 'auto' }}>
      <Markers id={id} />
      <text x="50" y="90" textAnchor="middle" style={LABEL}>{a}</text>
      <text x="250" y="90" textAnchor="middle" style={LABEL}>{b}</text>
      <path d="M70 66 C110 18, 190 18, 230 66" fill="none" style={{ stroke: 'var(--text)', strokeWidth: 1.6 }} markerEnd={`url(#${id}-cld)`} />
      <path d="M230 104 C190 152, 110 152, 70 104" fill="none" style={{ stroke: 'var(--text)', strokeWidth: 1.6 }} markerEnd={`url(#${id}-cld)`} />
      <text x="222" y="48" style={{ ...LABEL, fontSize: 18 }}>{sign(signAB)}</text>
      <text x="66" y="136" style={{ ...LABEL, fontSize: 18 }}>{sign(signBA)}</text>
      <path d="M137 78 a14 14 0 1 1 3 18" fill="none" style={{ stroke: 'var(--primary)', strokeWidth: 1.6 }} markerEnd={`url(#${id}-cld)`} />
      <text x="150" y="93" textAnchor="middle" style={{ fill: 'var(--primary)', fontSize: 16, fontWeight: 700 }}>{letter}</text>
    </svg>
  );
}

/** Reinforcing vs balancing loop, each with its characteristic behaviour. */
export function FeedbackLoops() {
  const savings = useMemo(() => runMini(EX.SAVINGS_ACCOUNT, { stop: 40 }, { annual_withdrawal: 0 }).get('Balance'), []);
  const coffee = useMemo(() => runMini(EX.COFFEE_COOLING, { stop: 60 }).get('Coffee_Temperature'), []);
  return (
    <div className="theory-pair">
      <Figure caption="Reinforcing (R): an even number of − links (here none). Change feeds on itself: exponential growth or collapse.">
        <LoopDiagram a="Balance" b="Interest" signAB="+" signBA="+" letter="R" aria="Reinforcing loop: more balance, more interest; more interest, more balance" />
        <MiniChart series={[{ name: 'Balance', color: C1, points: savings }]} xLabel="Time (years)" yLabel="EUR" height={170} width={360} />
      </Figure>
      <Figure caption="Balancing (B): an odd number of − links. The stock is pushed towards a goal, here room temperature (20 °C).">
        <LoopDiagram a="Temperature" b="Cooling" signAB="+" signBA="−" letter="B" aria="Balancing loop: higher temperature, more cooling; more cooling, lower temperature" />
        <MiniChart series={[{ name: 'Coffee temperature', color: C2, points: coffee }]} xLabel="Time (minutes)" yLabel="°C" height={170} width={360} refLines={[{ y: 20, label: 'room 20 °C' }]} />
      </Figure>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live figures
// ---------------------------------------------------------------------------

/** Accumulation: the inflow steps up; the stock changes slope, not level. */
export function AccumulationFigure() {
  const [inflowAfter, setInflowAfter] = useState(20);
  // Euler is exact for piecewise-constant flows; RK4 would sample the jump mid-step.
  const r = useMemo(() => runMini(ACCUMULATION, { stop: 15, method: 'euler' }, { inflow_increase: inflowAfter - 10 }), [inflowAfter]);
  const net = inflowAfter - 15;
  const water = r.get('Water');
  const negative = water.some((p) => p.v < 0);
  return (
    <Figure
      title="A stock is an accumulation"
      caption={`At t = 5 the inflow changes from 10 to ${inflowAfter} liters/minute. The water level does not jump: its slope changes from −5 to ${net > 0 ? '+' : ''}${net} liters/minute.${negative ? ' This simple model even lets the level go below zero: real limits (an empty tub) must be modelled explicitly.' : ''}`}
    >
      <Slider id="acc-in" label="Inflow after t = 5" value={inflowAfter} min={5} max={30} step={1} onChange={setInflowAfter} format={(v) => `${v} liters/minute`} />
      <div className="theory-pair">
        <MiniChart series={[{ name: 'inflow', color: C1, points: r.get('inflow') }, { name: 'outflow', color: C2, points: r.get('outflow'), dash: '6 4' }]} xLabel="Time (minutes)" yLabel="liters/minute" height={200} width={360} yDomain={[0, 32]} />
        <MiniChart series={[{ name: 'Water (stock)', color: C3, points: water }]} xLabel="Time (minutes)" yLabel="liters" height={200} width={360} refLines={negative ? [{ y: 0, label: 'empty' }] : []} />
      </div>
    </Figure>
  );
}

/** Equilibrium in the bathtub: the level settles where outflow equals inflow. */
export function EquilibriumFigure() {
  const [drainTime, setDrainTime] = useState(5);
  const water = useMemo(() => runMini(EX.BATHTUB, { stop: 40 }, { drain_time: drainTime }).get('Water'), [drainTime]);
  const eq = 12 * drainTime;
  return (
    <Figure
      title="Equilibrium: where inflow equals outflow"
      caption={`The drain removes Water / ${drainTime} liters per minute. It matches the 12 liters/minute faucet when Water = 12 × ${drainTime} = ${eq} liters. A longer drain time raises the equilibrium and slows the approach.`}
    >
      <Slider id="eq-dt" label="drain_time" value={drainTime} min={1} max={10} step={1} onChange={setDrainTime} format={(v) => `${v} minutes`} />
      <MiniChart series={[{ name: 'Water', color: C1, points: water }]} xLabel="Time (minutes)" yLabel="liters" height={200} yDomain={[0, 130]} refLines={[{ y: eq, label: `equilibrium ${eq} L` }]} />
    </Figure>
  );
}

const MODES = [
  { key: 'SAVINGS_ACCOUNT', series: 'Balance', title: 'Exponential growth', structure: 'A dominant reinforcing loop.', params: { annual_withdrawal: 0 } },
  { key: 'COFFEE_COOLING', series: 'Coffee_Temperature', title: 'Goal seeking', structure: 'A dominant balancing loop, no significant delay.' },
  { key: 'ADOPTION_MODEL', series: 'adopters', title: 'S-shaped growth', structure: 'A reinforcing loop, then a balancing loop as a limit is reached.' },
  { key: 'SUPPLY_CHAIN_DELAY', series: 'Inventory', title: 'Overshoot and oscillation', structure: 'A balancing loop with a delay.' },
  { key: 'PREDATOR_PREY', series: 'Prey', title: 'Sustained oscillation', structure: 'Two coupled stocks feeding back on each other.' },
  { key: 'FISHERY', series: 'Fish', title: 'Overshoot and collapse', structure: 'Growth that erodes its own resource, with a delayed response.' },
];

/** Gallery of reference behaviour modes, each computed from a library model. */
export function BehaviorModes({ onOpen }) {
  const data = useMemo(() => MODES.map((m) => ({ ...m, points: runMini(EX[m.key], { stop: EX[m.key].maxTime, dt: 0.1 }, m.params).get(m.series) })), []);
  return (
    <div className="theory-modes">
      {data.map((m, i) => (
        <div key={m.key} className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>{m.title}</div>
          <MiniChart series={[{ name: m.series, color: [C1, C2, C3][i % 3], points: m.points }]} xLabel="time" yLabel={m.series.replace(/_/g, ' ')} height={190} width={340} />
          <p className="hint" style={{ margin: '4px 0 8px' }}>{m.structure}</p>
          {onOpen && <button className="btn btn-sm" onClick={() => onOpen(m.key)}>Open {EX[m.key].name.split(' (')[0]}</button>}
        </div>
      ))}
    </div>
  );
}

/** Delays: the same goal-seeking rule with and without accounting for the supply line. */
export function DelayFigure() {
  const [delay, setDelay] = useState(4);
  const ignore = useMemo(() => runMini(EX.SUPPLY_CHAIN_DELAY, { stop: 60, dt: 0.1 }, { delivery_delay: delay, supply_line_weight: 0 }).get('Inventory'), [delay]);
  const account = useMemo(() => runMini(EX.SUPPLY_CHAIN_DELAY, { stop: 60, dt: 0.1 }, { delivery_delay: delay, supply_line_weight: 1 }).get('Inventory'), [delay]);
  const peak = Math.max(...ignore.map((p) => p.v));
  return (
    <Figure
      title="A delay in a balancing loop causes overshoot"
      caption={`Orders take ${delay} weeks to arrive. A manager who ignores orders already in transit keeps ordering and overshoots to ${Math.round(peak)} units (target 400). Counting the supply line removes the overshoot. Longer delays make it worse.`}
    >
      <Slider id="delay" label="Delivery delay" value={delay} min={1} max={10} step={1} onChange={setDelay} format={(v) => `${v} weeks`} />
      <MiniChart
        series={[{ name: 'ignores the supply line', color: C2, points: ignore }, { name: 'counts the supply line', color: C1, points: account, dash: '6 4' }]}
        xLabel="Time (weeks)" yLabel="units" height={210} refLines={[{ y: 400, label: 'target 400' }]}
      />
    </Figure>
  );
}

const DTS = [2, 1, 0.5, 0.25, 0.1];

/** Euler vs RK4 vs the exact solution, with the time step as a control. */
export function NumericsFigure() {
  const [i, setI] = useState(1);
  const dt = DTS[i];
  const { euler, rk4, exact } = useMemo(() => {
    const toPts = (r) => r.times.map((t, k) => ({ t, v: r.series.a[k] }));
    const e = solveWith(DECAY, { start: 0, stop: 10, dt, method: 'euler' });
    const r = solveWith(DECAY, { start: 0, stop: 10, dt, method: 'rk4' });
    const ex = Array.from({ length: 201 }, (_, k) => ({ t: k / 20, v: decayExact(k / 20) }));
    return { euler: toPts(e), rk4: toPts(r), exact: ex };
  }, [dt]);
  const at = (pts, t) => pts.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best), pts[0]).v;
  const err = (pts) => Math.abs(at(pts, 2) - decayExact(2)) / decayExact(2);
  return (
    <Figure
      title="Euler vs RK4 on exponential decay"
      caption={`dA/dt = −0.5·A. Dots are the computed steps. Relative error at t = 2: Euler ${(100 * err(euler)).toFixed(1)} %, RK4 ${(100 * err(rk4)).toFixed(dt >= 1 ? 1 : 3)} %. Halving dt roughly halves Euler’s error and divides RK4’s by about 16.`}
    >
      <Slider id="num-dt" label="Time step dt" value={i} min={0} max={DTS.length - 1} step={1} onChange={setI} format={() => dt} />
      <MiniChart
        series={[
          { name: 'exact', color: 'var(--text-subtle)', points: exact, width: 1.5 },
          { name: `Euler (dt = ${dt})`, color: C2, points: euler, dots: dt >= 0.25 },
          { name: `RK4 (dt = ${dt})`, color: C1, points: rk4, dots: dt >= 0.25, dash: '6 4' },
        ]}
        xLabel="Time (hours)" yLabel="atoms" height={220} xDomain={[0, 6]} yDomain={[0, 1000]}
      />
    </Figure>
  );
}
