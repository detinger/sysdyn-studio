/**
 * Challenges (PLAN.md Module G): 18 tasks from easy to advanced.
 *
 * Each check returns { pass, feedback }. Feedback says what is wrong, why it
 * matters and what to do next. Checks assess model meaning (stocks, rates,
 * units, dependencies, behaviour), never element names or diagram layout,
 * except where a challenge works on a given starting model and asks the
 * student to change only named parameters.
 */
import * as EXAMPLES from '../examples.js';
import {
  near, netAtStart, stocksWithInitial, unitIs, runStats, errorsOf, needsRun,
  onlyChanged, dependsOn, rmse, referenceFinal, answered, startValue,
} from '../domain/assessment/rubric.js';

const ok = (feedback) => ({ pass: true, feedback });
const no = (feedback) => ({ pass: false, feedback });

export const LEVELS = ['Easy', 'Intermediate', 'Advanced'];

// ---------------------------------------------------------------------------
// Reusable checks
// ---------------------------------------------------------------------------

const validCheck = {
  id: 'valid',
  label: 'The model validates without errors',
  check: (ctx) => {
    if (!ctx.domain.stocks.length) return no('Build the model first.');
    const e = errorsOf(ctx);
    return e.length ? no(`${e.length} error${e.length > 1 ? 's' : ''} remain. Open Validate in the toolbar and fix them.`) : ok();
  },
};

const questionChecks = (questions) => questions.map((q) => ({ id: `q-${q.id}`, kind: 'question', label: q.label || q.prompt, check: (ctx) => answered(ctx, q) }));

/** A stock with the given initial value, with feedback when missing. */
const stockCheck = (id, label, initial, noun) => ({
  id,
  label,
  check: (ctx) => {
    if (!ctx.domain.stocks.length) return no(`Add a stock for the ${noun}: it accumulates over time.`);
    return stocksWithInitial(ctx, initial).length ? ok() : no(`No stock starts at ${initial}. Set the initial value of the ${noun} stock.`);
  },
});

/** Total inflow / outflow of the stock that starts at `initial`, evaluated at the start time. */
const rateCheck = (id, label, initial, kind, expected, unitText) => ({
  id,
  label,
  check: (ctx) => {
    const s = stocksWithInitial(ctx, initial)[0];
    if (!s) return no('Create the stock first.');
    const ids = kind === 'in' ? s.inflows : s.outflows;
    if (!ids.length) return no(kind === 'in' ? 'Connect a flow into the stock’s inflow port (left side). Only flows change a stock.' : 'Connect the stock’s outflow port (right side) to a flow.');
    const v = netAtStart(ctx, s, kind);
    if (!Number.isFinite(v)) return no('The rate cannot be calculated yet. Check the Validate tab.');
    return near(v, expected) ? ok() : no(`The ${kind === 'in' ? 'inflow' : 'outflow'} is ${+v.toPrecision(6)} at the start; it should be ${expected} ${unitText}.`);
  },
});

const horizonCheck = (length, unit) => ({
  id: 'horizon',
  label: `The simulation covers ${length} ${unit}s`,
  check: (ctx) => {
    if (!unitIs(ctx.config.timeUnit, unit)) return no(`Set the time unit to ${unit} in the Simulation tab (click empty canvas).`);
    return near(ctx.config.stop - ctx.config.start, length) ? ok() : no(`The run covers ${ctx.config.stop - ctx.config.start} ${unit}s. Set start 0 and stop ${length}.`);
  },
});

const parameterUseCheck = (initial) => ({
  id: 'parameters',
  label: 'Constant rates come from named parameters',
  check: (ctx) => {
    const s = stocksWithInitial(ctx, initial)[0];
    if (!s) return no('Create the stock first.');
    const flows = [...s.inflows, ...s.outflows];
    if (!flows.length) return no('Add the flows first.');
    const bare = flows.filter((f) => !(ctx.compiled.dependencies.get(f) || []).some((d) => ctx.compiled.parameterIds.includes(d)));
    return bare.length
      ? no(`${bare.map((f) => ctx.domain.byId.get(f).name).join(', ')} uses only numbers. Put each constant in a parameter and use its name, so it can be changed in experiments.`)
      : ok();
  },
});

const unitsCheck = (initial, stockUnit, timeUnit) => ({
  id: 'units',
  label: `Units are declared and consistent (${stockUnit}, ${stockUnit}/${timeUnit})`,
  check: (ctx) => {
    const s = stocksWithInitial(ctx, initial)[0];
    if (!s) return no('Create the stock first.');
    if (!unitIs(ctx.config.timeUnit, timeUnit)) return no(`Set the time unit to ${timeUnit} in the Simulation tab.`);
    if (!s.unit) return no(`Give the stock a unit, for example ${stockUnit}.`);
    const flows = [...s.inflows, ...s.outflows].map((f) => ctx.domain.byId.get(f));
    const missing = flows.filter((f) => !f.unit);
    if (missing.length) return no(`Give ${missing.map((f) => f.name).join(', ')} a unit: a rate is measured in stock units per ${timeUnit}.`);
    if (ctx.issues.some((i) => i.code === 'units.flow_mismatch')) return no(`A flow unit does not match the stock unit per ${timeUnit}. The Validate tab shows which.`);
    return ok();
  },
});

/** Final value of the stock that starts at `initial`, compared with `expected` (relative tolerance). */
const finalCheck = (initial, expected, label, success, tol = 1e-6) => ({
  id: 'result',
  kind: 'behavior',
  label,
  check: (ctx) => {
    const r = needsRun(ctx);
    if (r) return r;
    const s = stocksWithInitial(ctx, initial)[0];
    const st = s && runStats(ctx, s.id);
    if (!st) return no('Run the model with the stock in place.');
    const target = typeof expected === 'function' ? expected(ctx) : expected;
    return near(st.final, target, tol) ? ok(success) : no(`The run ends at ${+st.final.toPrecision(6)}; expected about ${+target.toPrecision(6)}.`);
  },
});

const stockByName = (ctx, name) => ctx.domain.stocks.find((s) => s.name === name);
const elByName = (ctx, name) => ctx.domain.elements.find((e) => e.name === name);

// ---------------------------------------------------------------------------
// Starting models used only by challenges
// ---------------------------------------------------------------------------

const WATER_TANK_UNITS = {
  name: 'Water tank (unit errors)',
  description: 'A tank is filled by a pump and drained by a valve. The equations are right, but the units are not.',
  maxTime: 30,
  nodes: [
    { id: 'tank', type: 'stock', position: { x: 400, y: 0 }, data: { label: 'Tank_Water', value: 500, unit: 'liters' } },
    { id: 'pump', type: 'flow', position: { x: 180, y: 280 }, data: { label: 'pumping', equation: 'pump_rate', unit: 'liters' } },
    { id: 'valve', type: 'flow', position: { x: 760, y: 280 }, data: { label: 'draining', equation: 'Tank_Water * drain_fraction', unit: 'liters/hour' } },
    { id: 'pr', type: 'variable', position: { x: 187, y: -200 }, data: { label: 'pump_rate', value: '40', unit: 'liters/minute' } },
    { id: 'df', type: 'variable', position: { x: 767, y: -200 }, data: { label: 'drain_fraction', value: '0.1', unit: '1/minute' } },
  ],
  edges: [
    { id: 'm1', source: 'pump', target: 'tank', targetHandle: 'inflow' },
    { id: 'm2', source: 'tank', sourceHandle: 'outflow', target: 'valve' },
    { id: 'i1', sourceHandle: 'info', source: 'pr', target: 'pump', targetHandle: 'info' },
    { id: 'i2', source: 'tank', target: 'valve', targetHandle: 'info' },
    { id: 'i3', sourceHandle: 'info', source: 'df', target: 'valve', targetHandle: 'info' },
  ],
};

const BROKEN_COOLING = {
  name: 'Coffee cooling (broken)',
  description: 'A cup of coffee at 90 °C cools towards a room at 20 °C. Heat loss is proportional to the temperature difference, with a time constant of 10 minutes. This model has mistakes.',
  maxTime: 60,
  dt: 0.1,
  timeUnit: 'minute',
  nodes: [
    { id: 'coffee', type: 'stock', position: { x: 400, y: 0 }, data: { label: 'Coffee_Temperature', value: 90, unit: 'degC' } },
    { id: 'cooling', type: 'flow', position: { x: 180, y: 280 }, data: { label: 'cooling', equation: '(Coffee_Temperature - Room_temp) / cooling_time', unit: 'degC/minute' } },
    { id: 'room', type: 'variable', position: { x: 470, y: -200 }, data: { label: 'Room_Temperature', value: '20', unit: 'degC' } },
    { id: 'tau', type: 'variable', position: { x: 187, y: -200 }, data: { label: 'cooling_time', value: '10', unit: 'minute' } },
  ],
  edges: [
    { id: 'm1', source: 'cooling', target: 'coffee', targetHandle: 'inflow' },
    { id: 'i1', sourceHandle: 'info', source: 'room', target: 'coffee' },
    { id: 'i2', sourceHandle: 'info', source: 'tau', target: 'cooling', targetHandle: 'info' },
    { id: 'i3', source: 'coffee', target: 'cooling', targetHandle: 'info' },
  ],
};

const BACKLOG_LOOP = {
  name: 'Backlog (algebraic loop)',
  description: 'A team works through a backlog. Someone defined productivity from the completion rate, and the completion rate from productivity.',
  maxTime: 52,
  timeUnit: 'week',
  nodes: [
    { id: 'backlog', type: 'stock', position: { x: 300, y: 0 }, data: { label: 'Backlog', value: 100, unit: 'tasks' } },
    { id: 'arrivals', type: 'flow', position: { x: 80, y: 280 }, data: { label: 'arrivals', equation: 'arrival_rate', unit: 'tasks/week' } },
    { id: 'completion', type: 'flow', position: { x: 700, y: 280 }, data: { label: 'completion', equation: 'min(Backlog, staff * productivity)', unit: 'tasks/week' } },
    { id: 'prod', type: 'variable', position: { x: 860, y: 120 }, data: { label: 'productivity', equation: 'completion / staff', unit: 'tasks/(person*week)' } },
    { id: 'staff', type: 'variable', position: { x: 600, y: -220 }, data: { label: 'staff', value: '3', unit: 'people' } },
    { id: 'base', type: 'variable', position: { x: 780, y: -220 }, data: { label: 'base_productivity', value: '2', unit: 'tasks/(person*week)' } },
    { id: 'arr', type: 'variable', position: { x: 87, y: -220 }, data: { label: 'arrival_rate', value: '4', unit: 'tasks/week' } },
  ],
  edges: [
    { id: 'm1', source: 'arrivals', target: 'backlog', targetHandle: 'inflow' },
    { id: 'm2', source: 'backlog', sourceHandle: 'outflow', target: 'completion' },
    { id: 'i1', sourceHandle: 'info', source: 'arr', target: 'arrivals', targetHandle: 'info' },
    { id: 'i2', source: 'backlog', target: 'completion', targetHandle: 'info' },
    { id: 'i3', sourceHandle: 'info', source: 'staff', target: 'completion', targetHandle: 'info' },
    { id: 'i4', source: 'prod', target: 'completion', targetHandle: 'info' },
    { id: 'i5', source: 'completion', sourceHandle: 'info', target: 'prod', targetHandle: 'info' },
    { id: 'i6', source: 'staff', target: 'prod', targetHandle: 'info' },
  ],
};

const DECAY = {
  name: 'Radioactive decay (numerical lab)',
  description: 'A sample of 1000 atoms decays at 0.5 per hour. The exact solution is 1000·e^(−0.5 t), so after 10 hours 6.738 atoms remain on average.',
  maxTime: 10,
  timeUnit: 'hour',
  simulation: { method: 'euler', dt: 1 },
  nodes: [
    { id: 'atoms', type: 'stock', position: { x: 300, y: 0 }, data: { label: 'Atoms', value: 1000, unit: 'atoms' } },
    { id: 'decay', type: 'flow', position: { x: 700, y: 280 }, data: { label: 'decay', equation: 'Atoms * decay_constant', unit: 'atoms/hour' } },
    { id: 'k', type: 'variable', position: { x: 707, y: -200 }, data: { label: 'decay_constant', value: '0.5', unit: '1/hour' } },
  ],
  edges: [
    { id: 'm1', source: 'atoms', sourceHandle: 'outflow', target: 'decay' },
    { id: 'i1', source: 'atoms', target: 'decay', targetHandle: 'info' },
    { id: 'i2', sourceHandle: 'info', source: 'k', target: 'decay', targetHandle: 'info' },
  ],
};
const DECAY_EXACT = 1000 * Math.exp(-5);

// Observations for the calibration challenge: logistic growth with r = 0.3,
// K = 800, P0 = 20, plus fixed measurement noise (so no fit is perfect).
const NOISE = [0, 3, -4, 6, -5, 8, -6, 4, -3, 2, -2];
export const OBSERVED_POPULATION = NOISE.map((n, i) => {
  const t = i * 4;
  const v = 800 / (1 + ((800 - 20) / 20) * Math.exp(-0.3 * t));
  return { t, v: Math.round((v + n) * 10) / 10 };
});

const POPULATION_FIT = {
  name: 'Population (calibration)',
  description: 'A logistic population model with rough guesses for its two parameters. Adjust them so the simulated population matches the observations.',
  maxTime: 40,
  timeUnit: 'year',
  visibleVariables: ['Population'],
  nodes: [
    { id: 'pop', type: 'stock', position: { x: 400, y: 0 }, data: { label: 'Population', value: 20, unit: 'animals' } },
    { id: 'growth', type: 'flow', position: { x: 180, y: 280 }, data: { label: 'net_growth', equation: 'Population * growth_rate * (1 - Population / carrying_capacity)', unit: 'animals/year' } },
    { id: 'r', type: 'variable', position: { x: 40, y: -200 }, data: { label: 'growth_rate', value: '0.1', unit: '1/year' } },
    { id: 'K', type: 'variable', position: { x: 187, y: -200 }, data: { label: 'carrying_capacity', value: '500', unit: 'animals' } },
  ],
  edges: [
    { id: 'm1', source: 'growth', target: 'pop', targetHandle: 'inflow' },
    { id: 'i1', source: 'pop', target: 'growth', targetHandle: 'info' },
    { id: 'i2', sourceHandle: 'info', source: 'r', target: 'growth', targetHandle: 'info' },
    { id: 'i3', sourceHandle: 'info', source: 'K', target: 'growth', targetHandle: 'info' },
  ],
};

/** Reference solution for the hiring build challenge (used to compute expected values). */
const HIRING_REFERENCE = {
  name: 'hiring-reference',
  nodes: [
    { id: 't', type: 'stock', data: { label: 'T', value: 0 } },
    { id: 'e', type: 'stock', data: { label: 'E', value: 100 } },
    { id: 'h', type: 'flow', data: { label: 'h', equation: '8' } },
    { id: 'c', type: 'flow', data: { label: 'c', equation: 'T / 6' } },
    { id: 'q', type: 'flow', data: { label: 'q', equation: 'E * 0.04' } },
  ],
  edges: [
    { id: '1', source: 'h', target: 't', targetHandle: 'inflow' },
    { id: '2', source: 't', sourceHandle: 'outflow', target: 'c' },
    { id: '3', source: 'c', target: 'e', targetHandle: 'inflow' },
    { id: '4', source: 'e', sourceHandle: 'outflow', target: 'q' },
  ],
};

// ---------------------------------------------------------------------------
// EASY
// ---------------------------------------------------------------------------

const qBathtubNegative = {
  id: 'negative',
  prompt: 'In your model, what would the water level do if you ran it for 15 minutes instead of 10?',
  options: [
    { id: 'zero', label: 'Stay at 0: the tub is empty' },
    { id: 'neg', label: 'Become negative' },
    { id: 'rise', label: 'Start rising again' },
  ],
  correct: 'neg',
  why: {
    zero: 'A real tub stops at 0, but your model does not know that: the drain keeps removing 15 liters/minute, so the stock goes below zero. Real limits must be modelled explicitly (for example, a drain that depends on the water level).',
    neg: 'Right. The drain keeps running at a constant rate, so the stock goes negative. Real limits must be modelled explicitly, for example with a drain that depends on the water level.',
    rise: 'Nothing changes the rates, so the net flow stays −5 liters/minute.',
  },
};

const BUILD_BATHTUB = {
  id: 'build-bathtub',
  type: 'Build a model',
  level: 'Easy',
  title: 'Fill and drain a bathtub',
  objective: 'A bathtub holds 50 liters. The faucet adds 10 liters/minute and the drain removes 15 liters/minute. Build the model and find how much water is left after 10 minutes.',
  constraints: ['One stock for the water, one inflow, one outflow.', 'Put the two rates in parameters.', 'Use minutes as the time unit.'],
  start: null,
  questions: [qBathtubNegative],
  checks: [
    stockCheck('stock', 'A stock holds the water (initial value 50)', 50, 'water'),
    rateCheck('inflow', 'The faucet fills the tub at 10 liters/minute', 50, 'in', 10, 'liters/minute'),
    rateCheck('outflow', 'The drain empties it at 15 liters/minute', 50, 'out', 15, 'liters/minute'),
    parameterUseCheck(50),
    horizonCheck(10, 'minute'),
    validCheck,
    finalCheck(50, 0, 'Water after 10 minutes is correct', 'Empty: 50 + (10 − 15) × 10 = 0.'),
    ...questionChecks([qBathtubNegative]),
  ],
  hints: [
    'Add one Stock, two Flows and two Auxiliaries from the toolbar.',
    'In each flow’s Properties, use “Fills” or “Drains from” to connect it to the stock.',
    'Faucet equation: the name of the 10 liters/minute parameter. Drain: the name of the 15 liters/minute parameter.',
    'Set stop time 10 and time unit minute in the Simulation tab, then run.',
  ],
  explanation: 'With constant flows the stock changes by (inflow − outflow) × time: 50 − 5 × 10 = 0. Constant flows know nothing about the stock, so the model would happily go negative afterwards.',
};

const BUILD_INVENTORY = {
  id: 'build-inventory',
  type: 'Build a model',
  level: 'Easy',
  title: 'Build an inventory',
  objective: 'A warehouse holds 100 units. Goods arrive at 20 units/day and customers take 15 units/day. Build a stock-and-flow model and find the inventory after 10 days.',
  constraints: ['Use one stock for the inventory.', 'Put the two rates in parameters, not directly in the flow equations.', 'Declare units and use days as the time unit.'],
  start: null,
  checks: [
    stockCheck('stock', 'A stock holds the inventory (initial value 100)', 100, 'inventory'),
    rateCheck('inflow', 'Arrivals fill the stock at 20 units/day', 100, 'in', 20, 'units per day'),
    rateCheck('outflow', 'Demand drains the stock at 15 units/day', 100, 'out', 15, 'units per day'),
    parameterUseCheck(100),
    unitsCheck(100, 'units', 'day'),
    horizonCheck(10, 'day'),
    validCheck,
    finalCheck(100, 150, 'Inventory after 10 days is correct', '150 units: 100 + (20 − 15) × 10. With constant rates the stock changes by the net flow times the elapsed time.'),
  ],
  hints: [
    'Use the toolbar: one Stock, two Flows and two Auxiliaries (for the rates).',
    'Drag from the stock’s right port to a flow for the outflow, and from a flow’s right side into the stock’s left port for the inflow. Or use “Drains from” and “Fills” in a flow’s Properties.',
    'Give the auxiliaries constant values 20 and 15; then the flow equations are just their names.',
    'Units: the stock in units, both flows in units/day, time unit day, stop time 10.',
  ],
  explanation: 'A stock integrates its net flow. With constant rates, Inventory(t) = 100 + (20 − 15)·t, so after 10 days it holds 150 units. Euler and RK4 give the same answer here because the rates do not change.',
};

const coffeeStock = (ctx) => stocksWithInitial(ctx, 90)[0];
const COOLING_FINAL = 20 + 70 * Math.exp(-6);

const FIX_COOLING = {
  id: 'fix-cooling',
  type: 'Fix a broken model',
  level: 'Easy',
  title: 'Fix the cooling coffee',
  objective: 'This model should show a 90 °C coffee cooling towards a 20 °C room over 60 minutes, but it has three mistakes. Find and fix them.',
  constraints: ['Keep one stock for the coffee temperature.', 'Do not change the parameter values.'],
  start: BROKEN_COOLING,
  checks: [
    {
      id: 'undefined',
      label: 'Every name in the equations exists',
      check: (ctx) => {
        const e = errorsOf(ctx, 'equation.undefined');
        return e.length ? no(`${e[0].title.replace(/`/g, '')}. Check the spelling against the variable names on the canvas.`) : ok();
      },
    },
    {
      id: 'links',
      label: 'No information link points into a stock',
      check: (ctx) => (ctx.domain.invalidLinks.length ? no('An information link points into a stock. Only flows change a stock, so the link has no effect. Delete it, or point it at the flow that uses the value.') : ok()),
    },
    {
      id: 'direction',
      label: 'Cooling drains heat from the coffee',
      check: (ctx) => {
        const s = coffeeStock(ctx);
        if (!s) return no('Keep the coffee stock with its initial value of 90.');
        if (s.inflows.length && !s.outflows.length) return no('Cooling is connected as an inflow, so a positive cooling rate would heat the coffee. Make it an outflow: connect the stock’s right port to the flow (or use “Drains from” in the flow’s Properties).');
        return s.outflows.length ? ok() : no('Connect a cooling flow out of the stock.');
      },
    },
    { id: 'valid', label: 'The model validates without errors', check: (ctx) => (errorsOf(ctx).length ? no('Errors remain; see the Validate tab.') : ok()) },
    {
      id: 'behavior',
      kind: 'behavior',
      label: 'The coffee approaches room temperature',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = coffeeStock(ctx);
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Run the model.');
        if (st.final > st.initial) return no('The coffee heats up. Check the direction of the flow and the sign of its equation.');
        return near(st.final, COOLING_FINAL, 1e-4)
          ? ok(`About ${COOLING_FINAL.toFixed(2)} °C after 60 minutes: the gap to the room shrinks by a factor e every 10 minutes.`)
          : no(`The run ends at ${+st.final.toPrecision(5)} °C; expected about ${COOLING_FINAL.toFixed(2)} °C. Check the time step, the horizon (60 minutes) and the equation.`);
      },
    },
  ],
  hints: [
    'Open Validate in the toolbar: two of the mistakes are reported there.',
    'The cooling equation refers to Room_temp, but the parameter is called Room_Temperature.',
    'Look at the arrow from Room_Temperature: where does it point? And is cooling filling or draining the coffee?',
  ],
  explanation: 'Newton cooling is a balancing loop: the hotter the coffee relative to the room, the faster it cools, so the gap closes exponentially, T(t) = 20 + 70·e^(−t/10).',
};

const FIX_UNITS = {
  id: 'fix-units',
  type: 'Fix a broken model',
  level: 'Easy',
  title: 'Repair the units',
  objective: 'This water tank model calculates correctly, but its units are inconsistent and the time unit is missing. Make every unit consistent.',
  constraints: ['Do not change equations or values; only units and the time unit.'],
  start: WATER_TANK_UNITS,
  checks: [
    { id: 'time', label: 'The model time unit is set to minute', check: (ctx) => (unitIs(ctx.config.timeUnit, 'minute') ? ok() : no('The parameters are per minute, so set the time unit to minute in the Simulation tab (click empty canvas).')) },
    {
      id: 'flows',
      label: 'Both flows are in liters/minute',
      check: (ctx) => {
        const bad = ctx.domain.flows.filter((f) => !unitIs(f.unit, 'liters/minute'));
        return bad.length ? no(`${bad.map((f) => `${f.name} (${f.unit || 'no unit'})`).join(', ')}: a flow into or out of a stock in liters must be in liters per minute.`) : ok();
      },
    },
    { id: 'nounits', label: 'The validator reports no unit mismatches', check: (ctx) => (ctx.issues.some((i) => i.category === 'units' && i.severity !== 'info') ? no('The Validate tab still lists unit problems.') : ok()) },
    {
      id: 'same',
      label: 'Equations and values are unchanged',
      check: (ctx) => {
        const r = onlyChanged(ctx, [], { requireChange: false });
        return r.pass ? ok() : no('Only units should change. Use Undo, or restart the challenge.');
      },
    },
  ],
  hints: ['A stock in liters needs flows in liters per time unit.', 'pumping is declared as liters and draining as liters/hour, but the parameters are per minute.'],
  explanation: 'Unit consistency is a cheap, powerful check: a flow must be measured in its stock’s unit per unit of time. Here the numbers were right but the labels were wrong. In a real model, a wrong label often hides a wrong number (for example, a rate per hour used in a model that runs in minutes).',
};

const qBathtubSettle = {
  id: 'settle',
  prompt: 'Starting at 20 liters, where will the water level end up?',
  options: [
    { id: 'rise', label: 'It keeps rising until the tub overflows' },
    { id: 'sixty', label: 'It levels off at 60 liters' },
    { id: 'twelve', label: 'It levels off at 12 liters' },
    { id: 'osc', label: 'It overshoots 60 liters and oscillates' },
  ],
  correct: 'sixty',
  why: {
    rise: 'The drain grows with the water level, so eventually it matches the faucet and the level stops rising.',
    sixty: 'Right: the level stops changing where drain = faucet, i.e. Water / 5 = 12, so Water = 60 liters.',
    twelve: '12 is the inflow per minute, not a level. Equilibrium is where outflow equals inflow: Water / drain_time = 12.',
    osc: 'A single stock with a balancing loop and no delay approaches its goal smoothly; it cannot overshoot.',
  },
};

const PREDICT_BATHTUB = {
  id: 'predict-bathtub',
  type: 'Predict behavior',
  level: 'Easy',
  title: 'Where does the bathtub settle?',
  objective: 'Open the bathtub model, read its equations and predict where the water level ends up. Then run it to check.',
  constraints: ['Answer before you run.'],
  start: 'BATHTUB',
  questions: [qBathtubSettle],
  checks: [
    ...questionChecks([qBathtubSettle]),
    {
      id: 'run',
      kind: 'behavior',
      label: 'The run confirms the equilibrium',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Water');
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Keep the Water stock.');
        return Math.abs(st.final - 60) < 0.5 && st.max <= 60.0001 ? ok('The level approaches 60 liters from below and never overshoots.') : no('This run does not settle near 60 liters. Did you change the parameters? Restart the challenge to reset them.');
      },
    },
  ],
  hints: ['Equilibrium: the level stops changing when inflow equals outflow.'],
  explanation: 'The drain is proportional to the water level: a balancing loop. The gap to 60 liters shrinks by the same fraction every minute, so the level approaches 60 smoothly (exponentially) and never overshoots.',
};

const IDENTIFY_QUESTIONS = [
  {
    id: 'customers', prompt: 'Customers is a…', label: 'Customers is identified correctly',
    options: [{ id: 'stock', label: 'Stock' }, { id: 'flow', label: 'Flow' }, { id: 'param', label: 'Parameter' }],
    correct: 'stock',
    why: { flow: 'Customers is a quantity you could count at an instant, even if time stopped: an accumulation, so a stock.', param: 'It changes during the run, so it is not a constant.', stock: 'Right: it accumulates acquisitions minus churn.' },
  },
  {
    id: 'churn', prompt: 'churn is a…', label: 'churn is identified correctly',
    options: [{ id: 'stock', label: 'Stock' }, { id: 'flow', label: 'Flow' }, { id: 'param', label: 'Parameter' }],
    correct: 'flow',
    why: { stock: 'Churn is measured per month: a rate. If time stopped, there would be no churn, so it is a flow.', param: 'Churn changes with the number of customers, so it is not constant.', flow: 'Right: customers per month leaving the stock.' },
  },
  {
    id: 'fraction', prompt: 'churn_fraction is a…', label: 'churn_fraction is identified correctly',
    options: [{ id: 'stock', label: 'Stock' }, { id: 'flow', label: 'Flow' }, { id: 'param', label: 'Parameter' }],
    correct: 'param',
    why: { stock: 'It does not accumulate anything.', flow: 'It is a fraction per month used to calculate a flow, but it is constant during the run.', param: 'Right: a constant assumption you can change in experiments.' },
  },
  {
    id: 'link', prompt: 'The orange arrow from Customers to churn means…', label: 'The information link is interpreted correctly',
    options: [{ id: 'moves', label: 'Customers move into churn' }, { id: 'uses', label: 'The churn equation uses the number of customers' }, { id: 'reduces', label: 'Churn reduces Customers' }],
    correct: 'uses',
    why: { moves: 'Material moves along the thick pipes. Orange dashed arrows only carry information.', reduces: 'Churn does reduce Customers, but through the pipe (the outflow), not the orange arrow.', uses: 'Right: the arrow says “churn depends on Customers”. Nothing is transferred.' },
  },
];

const IDENTIFY_ELEMENTS = {
  id: 'identify-elements',
  type: 'Identify stocks and flows',
  level: 'Easy',
  title: 'Stocks, flows and parameters',
  objective: 'Open the customer base model and classify its elements. Look at units: a stock is measured in “things”, a flow in “things per unit of time”.',
  constraints: ['The first answer to each question counts.'],
  start: 'CUSTOMER_BASE',
  questions: IDENTIFY_QUESTIONS,
  checks: questionChecks(IDENTIFY_QUESTIONS),
  hints: ['Imagine pressing pause: whatever you can still count is a stock. Rates per month disappear when time stops.'],
  explanation: 'Stocks are accumulations (customers), flows are rates that change them (customers/month), parameters are constants used in equations, and orange arrows show which values an equation uses.',
};

// ---------------------------------------------------------------------------
// INTERMEDIATE
// ---------------------------------------------------------------------------

const qSavingsLoop = {
  id: 'loop', prompt: 'What kind of feedback loop does interest create?',
  options: [{ id: 'r', label: 'Reinforcing: more balance, more interest, more balance' }, { id: 'b', label: 'Balancing: interest pushes the balance towards a goal' }, { id: 'none', label: 'No loop: interest is just an inflow' }],
  correct: 'r',
  why: { b: 'There is no goal here: the larger the balance, the faster it grows.', none: 'Interest depends on the balance and changes the balance: that is a closed loop.', r: 'Right: the loop amplifies change, which produces exponential growth.' },
};

const BUILD_SAVINGS = {
  id: 'build-savings',
  type: 'Build a model',
  level: 'Intermediate',
  title: 'Compound interest',
  objective: 'You deposit 1000 EUR at 5 % interest per year, compounded continuously, and withdraw nothing. Build the model and find the balance after 20 years.',
  constraints: ['Interest must be calculated from the balance (not a constant).', 'Put the interest rate in a parameter; units EUR, EUR/year, time unit year.'],
  start: null,
  questions: [qSavingsLoop],
  checks: [
    stockCheck('stock', 'A stock holds the balance (initial value 1000)', 1000, 'balance'),
    rateCheck('inflow', 'Interest starts at 50 EUR/year', 1000, 'in', 50, 'EUR per year (5 % of 1000)'),
    {
      id: 'feedback',
      label: 'Interest depends on the balance (feedback)',
      check: (ctx) => {
        const s = stocksWithInitial(ctx, 1000)[0];
        if (!s || !s.inflows.length) return no('Add the interest inflow first.');
        return s.inflows.some((f) => dependsOn(ctx, f, s.id)) ? ok() : no('The interest equation does not use the balance, so it would stay at 50 EUR/year forever. Multiply the balance by the rate.');
      },
    },
    parameterUseCheck(1000),
    unitsCheck(1000, 'EUR', 'year'),
    horizonCheck(20, 'year'),
    validCheck,
    finalCheck(1000, (ctx) => (ctx.config.method === 'euler' ? 1000 * (1 + 0.05 * ctx.config.dt) ** (20 / ctx.config.dt) : 1000 * Math.E), 'Balance after 20 years is correct',
      'About 2718 EUR: 1000·e^(0.05·20) = 1000·e. Continuous compounding at 5 % for 20 years multiplies the balance by e.', 1e-4),
    ...questionChecks([qSavingsLoop]),
  ],
  hints: ['Interest equation: Balance * interest_rate (with your own names).', 'Set the time unit to year and the stop time to 20.'],
  explanation: 'Because the inflow is proportional to the stock, the balance grows exponentially: B(t) = 1000·e^(0.05 t). The doubling time is ln 2 / 0.05 ≈ 14 years (the rule of 70: 70 / 5).',
};

const qChurnLevel = {
  id: 'level', prompt: 'Where will the customer base level off?',
  options: [{ id: '100', label: '100 customers' }, { id: '2000', label: '2,000 customers' }, { id: 'never', label: 'It keeps growing' }, { id: '5000', label: '5,000 customers' }],
  correct: '2000',
  why: { 100: '100 is the monthly inflow. Equilibrium is where churn equals acquisition.', never: 'Churn grows with the customer base, so eventually it cancels acquisition.', 5000: 'Equilibrium: Customers × 0.05 = 100, so Customers = 2,000.', 2000: 'Right: 0.05 × 2000 = 100 per month, so inflow and outflow balance.' },
};

const BUILD_CHURN = {
  id: 'build-churn',
  type: 'Build a model',
  level: 'Intermediate',
  title: 'Acquisition and churn',
  objective: 'A start-up has no customers. Marketing brings 100 new customers per month, and 5 % of customers leave every month. Build the model and find the number of customers after 60 months.',
  constraints: ['Churn must be calculated from the number of customers.', 'Time unit month; units customers and customers/month.'],
  start: null,
  questions: [qChurnLevel],
  checks: [
    stockCheck('stock', 'A stock holds the customers (initial value 0)', 0, 'customer'),
    rateCheck('inflow', 'Acquisition is 100 customers/month', 0, 'in', 100, 'customers per month'),
    {
      id: 'churn',
      label: 'Churn is 5 % of the customer base',
      check: (ctx) => {
        const s = stocksWithInitial(ctx, 0)[0];
        if (!s || !s.outflows.length) return no('Add a churn outflow from the stock.');
        if (!s.outflows.some((f) => dependsOn(ctx, f, s.id))) return no('Churn does not use the number of customers. A fraction of customers leave, so churn = Customers × churn fraction.');
        if (ctx.run && runStats(ctx, s.id)) {
          const i = Math.floor(ctx.run.times.length / 2);
          const c = ctx.run.series[s.id][i];
          const out = s.outflows.reduce((a, f) => a + ctx.run.series[f][i], 0);
          if (c > 0 && !near(out / c, 0.05, 1e-6)) return no(`Churn is ${(100 * out / c).toFixed(2)} % of customers per month; it should be 5 %.`);
        }
        return ok();
      },
    },
    unitsCheck(0, 'customers', 'month'),
    horizonCheck(60, 'month'),
    validCheck,
    finalCheck(0, (ctx) => (ctx.config.method === 'euler' ? 2000 * (1 - (1 - 0.05 * ctx.config.dt) ** (60 / ctx.config.dt)) : 2000 * (1 - Math.exp(-3))), 'Customers after 60 months are correct',
      'About 1,900: the base approaches 2,000 = 100 / 0.05, closing the gap by 5 % per month.', 1e-4),
    ...questionChecks([qChurnLevel]),
  ],
  hints: ['Churn equation: Customers * churn_fraction.', 'An initial value of 0 is fine: the stock fills from the inflow.'],
  explanation: 'Acquisition is constant while churn grows with the customer base, so the base approaches the level where they balance: 100 / 0.05 = 2,000. After three time constants (60 months at 1/0.05 = 20 months each), about 95 % of the gap is closed.',
};

const qAdoption = {
  id: 'shape',
  label: 'Prediction made before running',
  prompt: 'How will adopters grow over the 10 years?',
  options: [
    { id: 'linear', label: 'In a straight line, at a constant rate' },
    { id: 'exp', label: 'Faster and faster, without limit' },
    { id: 's', label: 'Slowly, then quickly, then levelling off (an S-curve)' },
    { id: 'osc', label: 'Up and down in cycles' },
  ],
  correct: 's',
  why: {
    linear: 'A constant rate would need adoption that does not depend on how many people have already adopted. Here word of mouth grows with the number of adopters.',
    exp: 'Word of mouth does create a reinforcing loop, but the market is finite: as potential adopters run out, a balancing loop slows adoption.',
    osc: 'Nothing in this model sends adopters back to potential adopters, so the stock can only grow.',
    s: 'Early on, advertising and a few adopters drive slow growth; word of mouth (reinforcing) then accelerates it, and market saturation (balancing) finally slows it down.',
  },
};

const PREDICT_ADOPTION = {
  id: 'predict-adoption',
  type: 'Predict behavior',
  level: 'Intermediate',
  title: 'Predict the adoption curve',
  objective: 'Before running the Bass adoption model, predict how the number of adopters will change over time. Then run it and compare.',
  constraints: ['Answer the question before you run the model.'],
  start: 'ADOPTION_MODEL',
  questions: [qAdoption],
  checks: [
    ...questionChecks([qAdoption]),
    {
      id: 'run',
      kind: 'behavior',
      label: 'Run confirms an S-shaped curve',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const flow = ctx.domain.flows[0];
        const rate = flow && runStats(ctx, flow.id);
        const peakInside = rate && rate.maxTime > ctx.run.config.start && rate.maxTime < ctx.run.config.stop;
        return peakInside
          ? ok(`The adoption rate peaks at t ≈ ${rate.maxTime.toFixed(1)}: that is the inflection point of the S-curve.`)
          : no('The adoption rate does not peak inside the horizon, so the S-shape is not visible. Did you change the parameters?');
      },
    },
  ],
  hints: ['Look for the loops: what makes adoption faster as more people adopt, and what slows it down eventually?'],
  explanation: 'Two loops compete. Word of mouth is reinforcing (more adopters, more adoption); depletion of potential adopters is balancing. Their shift in dominance creates the S-curve, and the adoption rate peaks at the inflection point.',
};

const FIX_LOOP = {
  id: 'fix-algebraic-loop',
  type: 'Fix a broken model',
  level: 'Intermediate',
  title: 'Break the algebraic loop',
  objective: 'In this backlog model, productivity is calculated from the completion rate and the completion rate from productivity. The model cannot be simulated. Fix the structure so the team works at its base productivity.',
  constraints: ['Keep the Backlog stock and the completion flow.', 'Completion must still depend on staff and productivity.'],
  start: BACKLOG_LOOP,
  checks: [
    { id: 'loop', label: 'No algebraic loop remains', check: (ctx) => (ctx.issues.some((i) => i.code === 'equation.algebraic_loop') ? no('completion and productivity still depend on each other at the same instant. One of them must be calculated from something else.') : ok()) },
    validCheck,
    {
      id: 'uses',
      label: 'Completion depends on staff and on base productivity',
      check: (ctx) => {
        const c = elByName(ctx, 'completion');
        const staff = elByName(ctx, 'staff');
        const base = elByName(ctx, 'base_productivity');
        if (!c || !staff || !base) return no('Keep completion, staff and base_productivity.');
        if (!dependsOn(ctx, c.id, staff.id)) return no('completion no longer uses staff.');
        return dependsOn(ctx, c.id, base.id) ? ok() : no('completion does not use base_productivity. Define productivity from base_productivity instead of from completion.');
      },
    },
    {
      id: 'behavior',
      kind: 'behavior',
      label: 'The team works the backlog down',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Backlog');
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Keep the Backlog stock.');
        return st.final < st.initial ? ok(`Capacity 3 × 2 = 6 tasks/week exceeds 4 arriving, so the backlog falls from ${st.initial} to ${+st.final.toPrecision(3)}.`) : no('The backlog does not fall. With 3 people at 2 tasks each, capacity (6) should exceed arrivals (4).');
      },
    },
  ],
  hints: ['Open Validate: the algebraic loop lists the two elements involved.', 'Give productivity the equation base_productivity (and draw the link from base_productivity).'],
  explanation: 'An algebraic loop has no order of calculation: to know completion you need productivity, and to know productivity you need completion, at the same instant. Feedback is only allowed through a stock, which carries the value from the previous moment. Here productivity was simply defined backwards; it is an input, not a result.',
};

const qTiming = {
  id: 'timing', prompt: 'Besides lowering the peak, what does the policy do to its timing?', label: 'Effect on timing explained',
  options: [{ id: 'later', label: 'The peak comes later' }, { id: 'earlier', label: 'The peak comes earlier' }, { id: 'same', label: 'The timing does not change' }],
  correct: 'later',
  why: { earlier: 'Compare the peak times in the Compare view: slower transmission spreads infections over a longer period.', same: 'Look at the time of maximum in the Compare view: it moves.', later: 'Right: slower transmission delays and spreads out the epidemic. That is what “flattening the curve” means.' },
};

const POLICY_SIR = {
  id: 'policy-sir',
  type: 'Policy design',
  level: 'Intermediate',
  title: 'Flatten the epidemic curve',
  objective: 'In the SIR model the number of infected people peaks at about 406. Reduce the peak below 250 by changing only infection_probability (for example through distancing). Use Set as baseline and Compare to see the effect.',
  constraints: ['Change only infection_probability.'],
  start: 'SIR_MODEL',
  questions: [qTiming],
  checks: [
    { id: 'only', label: 'Only infection_probability was changed', check: (ctx) => onlyChanged(ctx, ['infection_probability']) },
    {
      id: 'peak', kind: 'behavior', label: 'Infection peak below 250',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Infected');
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Keep the Infected stock.');
        return st.max < 250 ? ok(`Peak ${st.max.toFixed(0)} at t = ${st.maxTime.toFixed(1)}.`) : no(`The peak is ${st.max.toFixed(0)}. Lower infection_probability further (a parameter sweep helps).`);
      },
    },
    ...questionChecks([qTiming]),
  ],
  hints: ['Run the model first and choose Set as baseline.', 'The Experiment tab can sweep infection_probability from 0.2 to 0.4 and show the peak for each value.'],
  explanation: 'Lowering transmission reduces how many people are infected at the same time and delays the peak. Fewer people are infected in total as well, because the epidemic stops when the number of susceptible people falls below the threshold for the new transmission rate.',
};

const qEulerOrder = {
  id: 'order', prompt: 'With Euler, what happens to the error when you halve dt?',
  options: [{ id: 'half', label: 'It roughly halves' }, { id: 'quarter', label: 'It drops to about a quarter' }, { id: 'none', label: 'It stays the same' }, { id: 'sixteenth', label: 'It drops to about a sixteenth' }],
  correct: 'half',
  why: { quarter: 'That would be a second-order method. Compare the errors at dt = 0.1 and 0.05 in your own runs.', none: 'The error clearly depends on dt; try two runs.', sixteenth: 'That is RK4 (fourth order) on smooth problems, not Euler.', half: 'Right: Euler is a first-order method, so the error is proportional to dt.' },
};

const NUMERICAL_EULER = {
  id: 'numerical-euler',
  type: 'Numerical method lab',
  level: 'Intermediate',
  title: 'How small must the time step be?',
  objective: 'This decay model runs with Euler at dt = 1 and is badly wrong: the exact answer after 10 hours is 6.738 atoms. Keep Euler and choose a time step that brings the result within 3 % of the exact value.',
  constraints: ['Keep the Euler method.', 'Do not change the model itself.'],
  start: DECAY,
  questions: [qEulerOrder],
  checks: [
    { id: 'euler', label: 'The method is still Euler', check: (ctx) => (ctx.config.method === 'euler' ? ok() : no('Switch the method back to Euler: the point is to see how Euler’s error depends on dt.')) },
    { id: 'same', label: 'The model is unchanged', check: (ctx) => onlyChanged(ctx, [], { requireChange: false }) },
    {
      id: 'accuracy', kind: 'behavior', label: 'Result within 3 % of 6.738',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Atoms');
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Keep the Atoms stock.');
        const err = Math.abs(st.final - DECAY_EXACT) / DECAY_EXACT;
        return err <= 0.03 ? ok(`Error ${(100 * err).toFixed(2)} % at dt = ${ctx.run.config.dt}.`) : no(`Error ${(100 * err).toFixed(1)} % at dt = ${ctx.run.config.dt}. Try a smaller time step.`);
      },
    },
    ...questionChecks([qEulerOrder]),
  ],
  hints: ['Change dt in the Simulation tab (click empty canvas): try 0.5, 0.1, 0.05, …', 'Write down the error for each dt: how does it change when dt halves?'],
  explanation: 'Euler’s error is roughly proportional to dt: about 12 % at dt = 0.1, 6 % at 0.05 and 2.5 % at 0.02. RK4 reaches 0.01 % already at dt = 0.5. Always check numerical sensitivity by halving dt.',
};

// ---------------------------------------------------------------------------
// ADVANCED
// ---------------------------------------------------------------------------

const qSupply = {
  id: 'overshoot',
  prompt: 'Inventory starts at 200 with a target of 400. Orders arrive after a 4-week delay. What will inventory do?',
  options: [
    { id: 'smooth', label: 'Rise smoothly to 400 and stay there' },
    { id: 'overshoot', label: 'Rise above 400, then come back' },
    { id: 'never', label: 'Never reach 400' },
    { id: 'fall', label: 'Fall to zero' },
  ],
  correct: 'overshoot',
  why: {
    smooth: 'That would happen without the delay. Here, by the time inventory reaches 400, many orders are still in transit and arrive anyway.',
    never: 'The ordering rule keeps correcting the gap, so inventory does reach the target.',
    fall: 'Orders exceed sales while inventory is below target, so inventory rises.',
    overshoot: 'Right: the manager keeps ordering until inventory reaches the target, ignoring what is already on its way, so too much arrives.',
  },
};

const PREDICT_SUPPLY = {
  id: 'predict-supply',
  type: 'Predict behavior',
  level: 'Advanced',
  title: 'Predict the supply chain',
  objective: 'Read the ordering rule in the supply chain model (supply_line_weight = 0 means the manager ignores orders already in transit). Predict what inventory does, then run it.',
  constraints: ['Answer before you run.', 'Do not change the model.'],
  start: 'SUPPLY_CHAIN_DELAY',
  questions: [qSupply],
  checks: [
    ...questionChecks([qSupply]),
    { id: 'same', label: 'The model is unchanged', check: (ctx) => onlyChanged(ctx, [], { requireChange: false }) },
    {
      id: 'run', kind: 'behavior', label: 'The run shows the overshoot',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Inventory');
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Keep the Inventory stock.');
        return st.max > 410 ? ok(`Inventory peaks at ${st.max.toFixed(0)} in week ${st.maxTime.toFixed(1)}, ${((st.max / 400 - 1) * 100).toFixed(0)} % above target.`) : no('No overshoot in this run. Restart the challenge to restore the original parameters.');
      },
    },
  ],
  hints: ['Look at the Supply_Line stock: it holds orders that will arrive no matter what the manager decides now.'],
  explanation: 'Delays inside a balancing loop cause overshoot. The correction keeps going after enough has been ordered, because the effect of the orders is not yet visible in inventory. Ignoring the supply line is a common, well-documented decision bias behind the bullwhip effect.',
};

const POLICY_SUPPLY = {
  id: 'policy-supply',
  type: 'Policy design',
  level: 'Advanced',
  title: 'Tame the bullwhip',
  objective: 'Change the ordering policy so inventory never exceeds 410 units (target 400) but still reaches at least 390 by week 20. You may change supply_line_weight and inventory_adjustment_time.',
  constraints: ['Change only supply_line_weight and/or inventory_adjustment_time.'],
  start: 'SUPPLY_CHAIN_DELAY',
  checks: [
    { id: 'only', label: 'Only the ordering policy was changed', check: (ctx) => onlyChanged(ctx, ['supply_line_weight', 'inventory_adjustment_time']) },
    {
      id: 'overshoot', kind: 'behavior', label: 'Inventory stays at or below 410',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Inventory');
        if (!s) return no('Keep the Inventory stock.');
        const st = runStats(ctx, s.id);
        return st.max <= 410 ? ok(`Peak ${st.max.toFixed(1)}.`) : no(`Inventory still peaks at ${st.max.toFixed(0)} in week ${st.maxTime.toFixed(1)}.`);
      },
    },
    {
      id: 'speed', kind: 'behavior', label: 'At least 390 units by week 20',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Inventory');
        if (!s) return no('Keep the Inventory stock.');
        const i = ctx.run.times.findIndex((t) => t >= 20 - 1e-9);
        if (i < 0) return no('Run for at least 20 weeks.');
        const v = ctx.run.series[s.id][i];
        return v >= 390 ? ok(`${v.toFixed(1)} units in week 20.`) : no(`Only ${v.toFixed(0)} units in week 20. A very slow correction avoids overshoot but leaves the shelves short.`);
      },
    },
  ],
  hints: ['What happens when the manager also counts the orders already in transit (supply_line_weight = 1)?', 'Use Set as baseline and Compare to see the trade-off between speed and overshoot.'],
  explanation: 'Accounting for the supply line removes the double counting that causes over-ordering. Slowing the inventory correction also reduces overshoot, but at the cost of a slower recovery. Good policies use the information about the pipeline rather than just reacting more slowly.',
};

const qFit = {
  id: 'meaning', prompt: 'Your model now matches the data closely. What does that show?',
  options: [
    { id: 'true', label: 'That the model structure is correct' },
    { id: 'consistent', label: 'That these parameter values are consistent with the data, assuming this structure' },
    { id: 'predict', label: 'That the model will predict the future accurately' },
  ],
  correct: 'consistent',
  why: {
    true: 'Different structures can fit the same data. A good fit is necessary, not sufficient, for a valid model.',
    predict: 'A fit to past data does not guarantee predictions, especially outside the observed range or if conditions change.',
    consistent: 'Right: calibration estimates parameters for a given structure. The structure must be justified separately.',
  },
};

const CALIBRATE_LOGISTIC = {
  id: 'calibrate-logistic',
  type: 'Calibrate a parameter',
  level: 'Advanced',
  title: 'Fit a population to data',
  objective: 'The observations (dots on the Stocks chart, and the table below) come from an animal population counted every 4 years. Adjust growth_rate and carrying_capacity until the model fits: root-mean-square error below 16 animals (2 % of the final population).',
  constraints: ['Change only growth_rate and carrying_capacity.'],
  start: POPULATION_FIT,
  reference: { stock: 'Population', unit: 'animals', points: OBSERVED_POPULATION },
  questions: [qFit],
  checks: [
    { id: 'only', label: 'Only the two parameters were changed', check: (ctx) => onlyChanged(ctx, ['growth_rate', 'carrying_capacity']) },
    {
      id: 'fit', kind: 'behavior', label: 'RMSE below 16 animals',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Population');
        if (!s) return no('Keep the Population stock.');
        const e = rmse(ctx, s.id, OBSERVED_POPULATION);
        return e < 16 ? ok(`RMSE ${e.toFixed(1)} animals.`) : no(`RMSE ${e.toFixed(1)} animals. Where the curve flattens tells you the carrying capacity; how steeply it rises tells you the growth rate.`);
      },
    },
    ...questionChecks([qFit]),
  ],
  hints: ['Start with carrying_capacity: the observations level off near 800.', 'Then sweep growth_rate between 0.1 and 0.5 (Experiment tab) and watch when the S-curve rises.'],
  explanation: 'The data were generated with growth_rate 0.3 and carrying_capacity 800, plus measurement noise, so no fit is perfect. A good fit means the parameters are consistent with the data under the logistic assumption; it does not prove the population really follows a logistic law.',
};

const BUILD_HIRING = {
  id: 'build-hiring',
  type: 'Build a model',
  level: 'Advanced',
  title: 'Build an aging chain',
  objective: 'A company hires 8 people per month as trainees. Training takes 6 months on average, after which trainees become experienced staff. Experienced staff quit at 4 % per month. Start with 0 trainees and 100 experienced staff; simulate 60 months.',
  constraints: ['Two stocks: trainees and experienced staff.', 'Training completion is Trainees / training_time (a first-order delay).', 'Time unit month.'],
  start: null,
  checks: [
    stockCheck('trainees', 'A stock for trainees (initial value 0)', 0, 'trainee'),
    stockCheck('experienced', 'A stock for experienced staff (initial value 100)', 100, 'experienced staff'),
    rateCheck('hiring', 'Hiring adds 8 trainees per month', 0, 'in', 8, 'people per month'),
    {
      id: 'transfer', label: 'One flow moves trainees into experienced staff',
      check: (ctx) => {
        const t = stocksWithInitial(ctx, 0)[0];
        const e = stocksWithInitial(ctx, 100)[0];
        if (!t || !e) return no('Create both stocks first.');
        const f = ctx.domain.flows.find((x) => x.sources.includes(t.id) && x.targets.includes(e.id));
        if (!f) return no('Add a single flow that drains Trainees and fills Experienced. People are conserved: they move from one stock to the other.');
        if (!dependsOn(ctx, f.id, t.id)) return no(`${f.name} must depend on the number of trainees (Trainees / training_time).`);
        return Number.isFinite(startValue(ctx, f.id)) ? ok() : no('The transfer flow cannot be calculated yet.');
      },
    },
    {
      id: 'quits', label: 'Experienced staff quit at 4 % per month',
      check: (ctx) => {
        const e = stocksWithInitial(ctx, 100)[0];
        if (!e || !e.outflows.length) return no('Add a quit flow out of the experienced stock.');
        if (!e.outflows.some((f) => dependsOn(ctx, f, e.id))) return no('Quits must depend on the number of experienced staff.');
        const v = netAtStart(ctx, e, 'out');
        return near(v, 4) ? ok() : no(`Quits start at ${+v.toPrecision(4)} per month; with 100 people at 4 % it should be 4.`);
      },
    },
    horizonCheck(60, 'month'),
    validCheck,
    {
      id: 'result', kind: 'behavior', label: 'Both stocks follow the expected path',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const t = stocksWithInitial(ctx, 0)[0];
        const e = stocksWithInitial(ctx, 100)[0];
        if (!t || !e) return no('Create both stocks first.');
        const ft = runStats(ctx, t.id).final;
        const fe = runStats(ctx, e.id).final;
        const rt = referenceFinal(HIRING_REFERENCE, ctx.run.config, 'T');
        const re = referenceFinal(HIRING_REFERENCE, ctx.run.config, 'E');
        if (!near(ft, rt, 1e-4)) return no(`Trainees end at ${ft.toFixed(2)}; expected ${rt.toFixed(2)}. Check the training time (6 months).`);
        return near(fe, re, 1e-4) ? ok(`Trainees ${ft.toFixed(1)}, experienced ${fe.toFixed(1)}: heading for 48 and 200.`) : no(`Experienced staff end at ${fe.toFixed(1)}; expected ${re.toFixed(1)}.`);
      },
    },
  ],
  hints: ['Trainees → training_completion → Experienced → quits → cloud. Hiring comes from a cloud.', 'training_completion = Trainees / training_time; quits = Experienced * quit_fraction.'],
  explanation: 'An aging chain represents a pipeline. In equilibrium every flow equals the inflow (8/month): Trainees = 8 × 6 = 48 and Experienced = 8 / 0.04 = 200. Because of the training delay, the experienced workforce responds to hiring only months later.',
};

const FISHERY_QUESTIONS = [
  {
    id: 'fleet', prompt: 'Catch → purchases → boats → catch. What kind of loop is this?', label: 'Fleet loop identified',
    options: [{ id: 'r', label: 'Reinforcing' }, { id: 'b', label: 'Balancing' }],
    correct: 'r',
    why: { b: 'Follow it: more catch, more money for boats, more boats, more catch. Every link has the same direction, so the loop amplifies.', r: 'Right: success breeds investment, which breeds more catch, as long as fish are plentiful.' },
  },
  {
    id: 'fish', prompt: 'Boats → harvest → fish → harvest. What does this loop do?', label: 'Resource loop identified',
    options: [{ id: 'r', label: 'Reinforcing: more harvest, more harvest' }, { id: 'b', label: 'Balancing: more harvest, fewer fish, less harvest per boat' }],
    correct: 'b',
    why: { r: 'More harvest lowers the fish stock, which lowers the catch per boat: the loop counteracts itself.', b: 'Right. But it acts through the fish stock, so it is slow compared with the growth of the fleet.' },
  },
  {
    id: 'msy', prompt: 'What is the highest harvest the fish can sustain indefinitely?', label: 'Sustainable yield found',
    options: [{ id: '500', label: '500 tons/year' }, { id: '125', label: '125 tons/year' }, { id: '237', label: '237 tons/year (the peak harvest)' }, { id: '1000', label: '1000 tons/year' }],
    correct: '125',
    why: { 500: '500 tons is the fish stock at which regeneration is highest, not the yield.', 237: 'That harvest is possible only by mining the stock, which is why it collapses.', 1000: 'That is the carrying capacity, a stock, not a flow.', 125: 'Right: regeneration r·F·(1 − F/K) peaks at F = K/2 = 500, giving 0.5 × 500 × 0.5 = 125 tons/year.' },
  },
];

const EXPLAIN_FISHERY = {
  id: 'explain-fishery',
  type: 'Explain feedback',
  level: 'Advanced',
  title: 'Why the fishery collapses',
  objective: 'Run the fishery model and explain its overshoot and collapse in terms of feedback loops and the sustainable yield.',
  constraints: ['Do not change the model.'],
  start: 'FISHERY',
  questions: FISHERY_QUESTIONS,
  checks: [
    { id: 'same', label: 'The model is unchanged', check: (ctx) => onlyChanged(ctx, [], { requireChange: false }) },
    {
      id: 'run', kind: 'behavior', label: 'You have seen the overshoot',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const h = elByName(ctx, 'harvest');
        if (!h) return no('Keep the harvest flow.');
        const st = runStats(ctx, h.id);
        return ok(`Harvest peaks at ${st.max.toFixed(0)} tons/year in year ${st.maxTime.toFixed(1)}, far above what the fish can sustain.`);
      },
    },
    ...questionChecks(FISHERY_QUESTIONS),
  ],
  hints: ['Trace each loop and count the negative links: an even number means reinforcing, odd means balancing.', 'Regeneration is largest at half the carrying capacity.'],
  explanation: 'The reinforcing fleet loop dominates while fish are plentiful. The balancing resource loop acts through the slow fish stock, and the fleet responds to past catches, so it overshoots the sustainable yield (125 tons/year). By the time the catch falls, the fish stock is depleted and the large fleet keeps it down.',
};

const POLICY_FISHERY = {
  id: 'policy-fishery',
  type: 'Policy design',
  level: 'Advanced',
  title: 'Manage the fishery sustainably',
  objective: 'Design a fleet policy so the fish stock never falls below 300 tons and the harvest in the final year is at least 110 tons/year. You may change reinvestment_fraction and boat_lifetime.',
  constraints: ['Change only reinvestment_fraction and/or boat_lifetime.'],
  start: 'FISHERY',
  checks: [
    { id: 'only', label: 'Only fleet policy parameters were changed', check: (ctx) => onlyChanged(ctx, ['reinvestment_fraction', 'boat_lifetime']) },
    {
      id: 'fish', kind: 'behavior', label: 'Fish never below 300 tons',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = stockByName(ctx, 'Fish');
        if (!s) return no('Keep the Fish stock.');
        const st = runStats(ctx, s.id);
        return st.min >= 300 ? ok(`Lowest fish stock ${st.min.toFixed(0)} tons.`) : no(`The fish stock falls to ${st.min.toFixed(0)} tons in year ${st.minTime.toFixed(1)}.`);
      },
    },
    {
      id: 'yield', kind: 'behavior', label: 'Final harvest at least 110 tons/year',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const h = elByName(ctx, 'harvest');
        if (!h) return no('Keep the harvest flow.');
        const st = runStats(ctx, h.id);
        return st.final >= 110 ? ok(`Final harvest ${st.final.toFixed(0)} tons/year (sustainable maximum 125).`) : no(`Final harvest ${st.final.toFixed(0)} tons/year. Protecting the fish is easy if you stop fishing; the task is to keep it productive too.`);
      },
    },
  ],
  hints: ['A slower-growing fleet (lower reinvestment) gives the fish stock time to signal scarcity.', 'Use a parameter sweep on reinvestment_fraction to see the trade-off.'],
  explanation: 'Weakening the reinforcing fleet loop (lower reinvestment or faster retirement) lets the balancing resource loop keep up, so the fleet settles near the size that harvests the sustainable yield. Policies that act on the growth loop work better than reacting after the collapse.',
};

export const CHALLENGES = [
  BUILD_BATHTUB, BUILD_INVENTORY, FIX_COOLING, FIX_UNITS, PREDICT_BATHTUB, IDENTIFY_ELEMENTS,
  BUILD_SAVINGS, BUILD_CHURN, PREDICT_ADOPTION, FIX_LOOP, POLICY_SIR, NUMERICAL_EULER,
  PREDICT_SUPPLY, POLICY_SUPPLY, CALIBRATE_LOGISTIC, BUILD_HIRING, EXPLAIN_FISHERY, POLICY_FISHERY,
];

export const findChallenge = (id) => CHALLENGES.find((c) => c.id === id);

/** Starting model for a challenge: an example key, a model object, or null (empty canvas). */
export const startModelOf = (c) => (typeof c.start === 'string' ? EXAMPLES[c.start] : c.start);
