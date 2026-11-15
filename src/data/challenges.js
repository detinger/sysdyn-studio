/**
 * Challenges (PLAN.md Module G). Each check returns { pass, feedback }.
 * Feedback says what is wrong, why it matters and what to do next.
 */
import { near, netAtStart, stocksWithInitial, unitIs, runStats, errorsOf, needsRun } from '../domain/assessment/rubric.js';

const ok = (feedback) => ({ pass: true, feedback });
const no = (feedback) => ({ pass: false, feedback });

// ---------------------------------------------------------------------------
// 1. Build: the PLAN.md §5.2 inventory lab
// ---------------------------------------------------------------------------
const inventoryStock = (ctx) => stocksWithInitial(ctx, 100)[0];

const BUILD_INVENTORY = {
  id: 'build-inventory',
  type: 'Build a model',
  level: 'Foundations',
  title: 'Build an inventory',
  objective:
    'A warehouse holds 100 units. Goods arrive at 20 units/day and customers take 15 units/day. Build a stock-and-flow model and find the inventory after 10 days.',
  constraints: ['Use one stock for the inventory.', 'Put the two rates in parameters, not directly in the flow equations.', 'Declare units and use days as the time unit.'],
  start: null,
  checks: [
    {
      id: 'stock',
      label: 'A stock holds the inventory (initial value 100)',
      check: (ctx) => {
        if (ctx.domain.stocks.length === 0) return no('Add a stock: inventory is an accumulation, so it must be a stock.');
        if (!inventoryStock(ctx)) return no('Your stock does not start at 100. Set its initial value to the amount in the warehouse at the start.');
        return ok();
      },
    },
    {
      id: 'inflow',
      label: 'Arrivals fill the stock at 20 units/day',
      check: (ctx) => {
        const s = inventoryStock(ctx);
        if (!s) return no('Create the inventory stock first.');
        if (!s.inflows.length) return no('Connect a flow into the stock’s inflow port (left side). Only flows change a stock.');
        const v = netAtStart(ctx, s, 'in');
        if (!Number.isFinite(v)) return no('The inflow cannot be calculated yet. Check the Validate tab.');
        return near(v, 20) ? ok() : no(`The inflow is ${v} at the start; it should be 20 units per day.`);
      },
    },
    {
      id: 'outflow',
      label: 'Demand drains the stock at 15 units/day',
      check: (ctx) => {
        const s = inventoryStock(ctx);
        if (!s) return no('Create the inventory stock first.');
        if (!s.outflows.length) return no('Connect the stock’s outflow port (right side) to a flow that represents demand.');
        const v = netAtStart(ctx, s, 'out');
        if (!Number.isFinite(v)) return no('The outflow cannot be calculated yet. Check the Validate tab.');
        return near(v, 15) ? ok() : no(`The outflow is ${v}; it should be 15 units per day. A positive outflow rate drains the stock.`);
      },
    },
    {
      id: 'parameters',
      label: 'Rates come from named parameters',
      check: (ctx) => {
        const s = inventoryStock(ctx);
        if (!s) return no('Create the inventory stock first.');
        const flows = [...s.inflows, ...s.outflows];
        if (!flows.length) return no('Add the flows first.');
        const bare = flows.filter((f) => !(ctx.compiled.dependencies.get(f) || []).some((d) => ctx.compiled.parameterIds.includes(d)));
        return bare.length
          ? no(`${bare.map((f) => ctx.domain.byId.get(f).name).join(', ')} uses a number directly. Put the rate in a parameter (an auxiliary with a constant value) and use its name, so it can be changed in experiments.`)
          : ok();
      },
    },
    {
      id: 'units',
      label: 'Units are declared and consistent (units, units/day)',
      check: (ctx) => {
        const s = inventoryStock(ctx);
        if (!s) return no('Create the inventory stock first.');
        if (!unitIs(ctx.config.timeUnit, 'day')) return no('Set the time unit to day in the Simulation tab (click empty canvas).');
        if (!s.unit) return no('Give the stock a unit, for example units.');
        const flows = [...s.inflows, ...s.outflows].map((f) => ctx.domain.byId.get(f));
        const missing = flows.filter((f) => !f.unit);
        if (missing.length) return no(`Give ${missing.map((f) => f.name).join(', ')} a unit. A rate is measured in stock units per day.`);
        if (ctx.issues.some((i) => i.code === 'units.flow_mismatch')) return no('A flow unit does not match the stock unit per day. The Validate tab shows which.');
        return ok();
      },
    },
    {
      id: 'horizon',
      label: 'The simulation covers 10 days',
      check: (ctx) => (near(ctx.config.stop - ctx.config.start, 10) ? ok() : no(`The run covers ${ctx.config.stop - ctx.config.start} time units. Set start 0 and stop 10 in the Simulation tab.`)),
    },
    {
      id: 'valid',
      label: 'The model validates without errors',
      check: (ctx) => {
        if (!ctx.domain.stocks.length) return no('Build the model first.');
        const e = errorsOf(ctx);
        return e.length ? no(`${e.length} error${e.length > 1 ? 's' : ''} remain. Open Validate in the toolbar and fix them.`) : ok();
      },
    },
    {
      id: 'result',
      kind: 'behavior',
      label: 'Inventory after 10 days is correct',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = inventoryStock(ctx);
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Run the model with the inventory stock.');
        return near(st.final, 150, 1e-6)
          ? ok('150 units: 100 + (20 − 15) × 10. With constant rates the stock changes by the net flow times the elapsed time.')
          : no(`The run ends at ${+st.final.toPrecision(6)}. With constant rates, the change is (inflow − outflow) × time.`);
      },
    },
  ],
  hints: [
    'Use the toolbar: one Stock, two Flows and two Auxiliaries (for the rates).',
    'Drag from the stock’s right port to a flow for the outflow, and from a flow’s right side into the stock’s left port for the inflow. Or use “Drains from” and “Fills” in a flow’s Properties.',
    'Give the auxiliaries constant values 20 and 15; then the flow equations are just their names.',
    'Units: the stock in units, both flows in units/day, time unit day, stop time 10.',
  ],
  explanation: 'A stock integrates its net flow. With constant rates, Inventory(t) = 100 + (20 − 15)·t, so after 10 days it holds 150 units. Euler and RK4 give the same answer here because the rates do not change.',
};

// ---------------------------------------------------------------------------
// 2. Fix: a broken cooling model
// ---------------------------------------------------------------------------
const COOLING_FINAL = 20 + 70 * Math.exp(-6); // 90 °C coffee, 20 °C room, τ = 10 min, 60 min

const brokenCooling = {
  name: 'Coffee cooling (broken)',
  description: 'A cup of coffee at 90 °C cools towards a room at 20 °C. Heat loss is proportional to the temperature difference, with a time constant of 10 minutes. This model has mistakes.',
  maxTime: 60,
  dt: 0.1,
  timeUnit: 'minute',
  nodes: [
    { id: 'coffee', type: 'stock', position: { x: 300, y: 150 }, data: { label: 'Coffee_Temperature', value: 90, unit: 'degC' } },
    { id: 'cooling', type: 'flow', position: { x: 40, y: 168 }, data: { label: 'cooling', equation: '(Coffee_Temperature - Room_temp) / cooling_time', unit: 'degC/minute' } },
    { id: 'room', type: 'variable', position: { x: 120, y: 360 }, data: { label: 'Room_Temperature', value: '20', unit: 'degC' } },
    { id: 'tau', type: 'variable', position: { x: 360, y: 360 }, data: { label: 'cooling_time', value: '10', unit: 'minute' } },
  ],
  edges: [
    { id: 'm1', source: 'cooling', target: 'coffee', targetHandle: 'inflow' },
    { id: 'i1', source: 'room', target: 'coffee' },
    { id: 'i2', source: 'tau', target: 'cooling', targetHandle: 'info' },
    { id: 'i3', source: 'coffee', target: 'cooling', targetHandle: 'info' },
  ],
};

const coffeeStock = (ctx) => stocksWithInitial(ctx, 90)[0];

const FIX_COOLING = {
  id: 'fix-cooling',
  type: 'Fix a broken model',
  level: 'Foundations',
  title: 'Fix the cooling coffee',
  objective:
    'This model should show a 90 °C coffee cooling towards a 20 °C room over 60 minutes, but it has three mistakes. Find and fix them.',
  constraints: ['Keep one stock for the coffee temperature.', 'Do not change the parameter values.'],
  start: brokenCooling,
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
      check: (ctx) => {
        const bad = ctx.domain.invalidLinks;
        return bad.length ? no('An information link points into a stock. Only flows change a stock, so the link has no effect. Delete it, or point it at the flow that uses the value.') : ok();
      },
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
    {
      id: 'valid',
      label: 'The model validates without errors',
      check: (ctx) => (errorsOf(ctx).length ? no('Errors remain; see the Validate tab.') : ok()),
    },
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

// ---------------------------------------------------------------------------
// 3. Predict: S-shaped adoption
// ---------------------------------------------------------------------------
const PREDICT_ADOPTION = {
  id: 'predict-adoption',
  type: 'Predict behavior',
  level: 'Feedback',
  title: 'Predict the adoption curve',
  objective:
    'Before running the Bass adoption model, predict how the number of adopters will change over time. Then run it and compare.',
  constraints: ['Answer the question before you run the model.'],
  start: 'ADOPTION_MODEL',
  question: {
    id: 'shape',
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
  },
  checks: [
    {
      id: 'answered',
      kind: 'question',
      label: 'Prediction made before running',
      check: (ctx) => {
        const a = ctx.answers.shape;
        if (!a) return no('Choose an answer to the question first.');
        return a === 's' ? ok('Correct prediction.') : no('Your prediction differs from what the structure produces. Read the explanation, then run the model.');
      },
    },
    {
      id: 'run',
      kind: 'behavior',
      label: 'Run confirms an S-shaped curve',
      check: (ctx) => {
        const r = needsRun(ctx);
        if (r) return r;
        const s = ctx.domain.stocks.find((x) => /adopter/i.test(x.name) && !/potential/i.test(x.name)) || ctx.domain.stocks[1];
        const st = s && runStats(ctx, s.id);
        if (!st) return no('Run the model.');
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

export const CHALLENGES = [BUILD_INVENTORY, FIX_COOLING, PREDICT_ADOPTION];
export const findChallenge = (id) => CHALLENGES.find((c) => c.id === id);
