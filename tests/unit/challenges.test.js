/**
 * Every challenge must (a) not be complete in its starting state and
 * (b) be completable: a reference solution passes every check.
 */
import { describe, it, expect } from 'vitest';
import { CHALLENGES, findChallenge, startModelOf, LEVELS } from '../../src/data/challenges.js';
import { makeContext, evaluateChallenge } from '../../src/domain/assessment/rubric.js';
import { validateModel } from '../../src/domain/validation/validateModel.js';
import { runModel } from '../../src/domain/simulation/runModel.js';
import { migrateDocument, fromDocument } from '../../src/domain/model/document.js';
import * as F from '../fixtures/models.js';

const loadStart = (c) => {
  const m = startModelOf(c);
  if (!m) return { nodes: [], edges: [], simulation: { start: 0, stop: 100, dt: 0.1, method: 'rk4', timeUnit: '' } };
  return fromDocument(migrateDocument(m).document);
};

const assess = (c, { nodes, edges, config, answers = {}, run = true }) => {
  const validation = validateModel(nodes, edges, config);
  const r = run && validation.canRun ? runModel(nodes, edges, config, { modelRevision: 1 }).run : null;
  return evaluateChallenge(c, makeContext({ validation, run: r, config, revision: 1, answers, startModel: startModelOf(c) }));
};
const failing = (res) => res.results.filter((r) => !r.pass).map((r) => `${r.id}: ${r.feedback}`);

const setParam = (nodes, name, value) => nodes.map((n) => (n.data.label === name ? { ...n, data: { ...n.data, value: String(value), equation: undefined } } : n));
const setData = (nodes, name, patch) => nodes.map((n) => (n.data.label === name ? { ...n, data: { ...n.data, ...patch } } : n));
const fromStart = (id, fn = (s) => s, cfg = {}, answers = {}) => {
  const c = findChallenge(id);
  const s = loadStart(c);
  const out = fn({ nodes: s.nodes, edges: s.edges });
  return { c, nodes: out.nodes, edges: out.edges, config: { ...s.simulation, ...cfg }, answers };
};
const built = (id, nodes, edges, config, answers = {}) => ({ c: findChallenge(id), nodes, edges, config: { start: 0, dt: 0.1, method: 'rk4', ...config }, answers });

const SOLUTIONS = {
  'build-bathtub': () => built('build-bathtub',
    [F.stock('w', 'Water', 50, { unit: 'liters' }), F.flow('in', 'faucet', 'fill_rate'), F.flow('out', 'drain', 'drain_rate'), F.variable('a', 'fill_rate', 10), F.variable('b', 'drain_rate', 15)],
    [F.inflow('in', 'w'), F.outflow('w', 'out'), F.info('a', 'in'), F.info('b', 'out')], { stop: 10, timeUnit: 'minute' }, { negative: 'neg' }),
  'build-inventory': () => built('build-inventory', F.inventoryLab(15).nodes, F.inventoryLab(15).edges, { stop: 10, timeUnit: 'day' }),
  'fix-cooling': () => fromStart('fix-cooling', ({ nodes, edges }) => ({
    nodes: setData(nodes, 'cooling', { equation: '(Coffee_Temperature - Room_Temperature) / cooling_time' }),
    edges: [{ id: 'm1', source: 'coffee', sourceHandle: 'outflow', target: 'cooling' }, { id: 'i1', source: 'room', target: 'cooling', targetHandle: 'info' }, ...edges.filter((e) => e.id === 'i2' || e.id === 'i3')],
  })),
  'fix-units': () => fromStart('fix-units', ({ nodes, edges }) => ({ nodes: setData(setData(nodes, 'pumping', { unit: 'liters/minute' }), 'draining', { unit: 'liters/minute' }), edges }), { timeUnit: 'minute' }),
  'predict-bathtub': () => fromStart('predict-bathtub', undefined, {}, { settle: 'sixty' }),
  'identify-elements': () => fromStart('identify-elements', undefined, {}, { customers: 'stock', churn: 'flow', fraction: 'param', link: 'uses' }),
  'build-savings': () => built('build-savings',
    [F.stock('b', 'Balance', 1000, { unit: 'EUR' }), F.flow('i', 'interest', 'Balance * rate', { unit: 'EUR/year' }), F.variable('r', 'rate', 0.05, { unit: '1/year' })],
    [F.inflow('i', 'b'), F.info('b', 'i'), F.info('r', 'i')], { stop: 20, timeUnit: 'year' }, { loop: 'r' }),
  'build-churn': () => built('build-churn',
    [F.stock('c', 'Customers', 0, { unit: 'customers' }), F.flow('a', 'acquisition', 'reach', { unit: 'customers/month' }), F.flow('x', 'churn', 'Customers * cf', { unit: 'customers/month' }), F.variable('r', 'reach', 100), F.variable('k', 'cf', 0.05)],
    [F.inflow('a', 'c'), F.outflow('c', 'x'), F.info('r', 'a'), F.info('c', 'x'), F.info('k', 'x')], { stop: 60, timeUnit: 'month' }, { level: '2000' }),
  'predict-adoption': () => fromStart('predict-adoption', undefined, {}, { shape: 's' }),
  'fix-algebraic-loop': () => fromStart('fix-algebraic-loop', ({ nodes, edges }) => ({ nodes: setData(nodes, 'productivity', { equation: 'base_productivity' }), edges: [...edges.filter((e) => e.id !== 'i5'), { id: 'fix', source: 'base', target: 'prod', targetHandle: 'info' }] })),
  'policy-sir': () => fromStart('policy-sir', ({ nodes, edges }) => ({ nodes: setParam(nodes, 'infection_probability', 0.25), edges }), {}, { timing: 'later' }),
  'numerical-euler': () => fromStart('numerical-euler', undefined, { method: 'euler', dt: 0.02 }, { order: 'half' }),
  'predict-supply': () => fromStart('predict-supply', undefined, {}, { overshoot: 'overshoot' }),
  'policy-supply': () => fromStart('policy-supply', ({ nodes, edges }) => ({ nodes: setParam(nodes, 'supply_line_weight', 1), edges })),
  'calibrate-logistic': () => fromStart('calibrate-logistic', ({ nodes, edges }) => ({ nodes: setParam(setParam(nodes, 'growth_rate', 0.3), 'carrying_capacity', 800), edges }), {}, { meaning: 'consistent' }),
  'build-hiring': () => built('build-hiring',
    [F.stock('t', 'Trainees', 0), F.stock('e', 'Experienced', 100), F.flow('h', 'hiring', 'hire_rate'), F.flow('c', 'training_completion', 'Trainees / training_time'), F.flow('q', 'quits', 'Experienced * quit_fraction'),
      F.variable('hr', 'hire_rate', 8), F.variable('tt', 'training_time', 6), F.variable('qf', 'quit_fraction', 0.04)],
    [F.inflow('h', 't'), F.outflow('t', 'c'), F.inflow('c', 'e'), F.outflow('e', 'q'), F.info('hr', 'h'), F.info('t', 'c'), F.info('tt', 'c'), F.info('e', 'q'), F.info('qf', 'q')],
    { stop: 60, timeUnit: 'month' }),
  'explain-fishery': () => fromStart('explain-fishery', undefined, {}, { fleet: 'r', fish: 'b', msy: '125' }),
  'policy-fishery': () => fromStart('policy-fishery', ({ nodes, edges }) => ({ nodes: setParam(setParam(nodes, 'reinvestment_fraction', 0.1), 'boat_lifetime', 6), edges })),
};

describe('challenge catalogue', () => {
  it('has 18 challenges, six per level, with unique ids', () => {
    expect(CHALLENGES).toHaveLength(18);
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(18);
    LEVELS.forEach((l) => expect(CHALLENGES.filter((c) => c.level === l)).toHaveLength(6));
    CHALLENGES.forEach((c) => {
      expect(c.objective.length).toBeGreaterThan(20);
      expect(c.hints.length).toBeGreaterThan(0);
      expect(c.explanation.length).toBeGreaterThan(20);
      expect(SOLUTIONS[c.id], c.id).toBeTypeOf('function');
    });
  });
});

describe.each(CHALLENGES.map((c) => [c.id, c]))('%s', (id, c) => {
  it('is not complete in its starting state', () => {
    const s = loadStart(c);
    const res = assess(c, { nodes: s.nodes, edges: s.edges, config: s.simulation });
    expect(res.complete).toBe(false);
  });

  it('is completed by a reference solution', () => {
    const sol = SOLUTIONS[id]();
    const res = assess(sol.c, sol);
    expect(failing(res)).toEqual([]);
  });
});

describe('feedback quality', () => {
  it('build-inventory: an empty model gets no free passes and actionable feedback', () => {
    const c = findChallenge('build-inventory');
    const res = assess(c, { nodes: [], edges: [], config: { start: 0, stop: 100, dt: 0.1, method: 'rk4', timeUnit: '' } });
    expect(res.passed).toBe(0);
    expect(res.results.find((r) => r.id === 'stock').feedback).toMatch(/Add a stock/);
  });

  it('build-inventory: passes whatever the element names', () => {
    const m = F.inventoryLab(15);
    m.nodes.find((n) => n.id === 'inv').data.label = 'Warehouse';
    expect(assess(findChallenge('build-inventory'), { ...m, config: { start: 0, stop: 10, dt: 0.1, method: 'rk4', timeUnit: 'day' } }).complete).toBe(true);
  });

  it('policy challenges reject changes outside the allowed parameters', () => {
    const sol = SOLUTIONS['policy-sir']();
    sol.nodes = setParam(sol.nodes, 'recovery_delay', 5);
    const res = assess(sol.c, sol);
    expect(res.results.find((r) => r.id === 'only').feedback).toMatch(/recovery_delay/);
  });

  it('a wrong prediction is explained', () => {
    const sol = SOLUTIONS['predict-supply']();
    const res = assess(sol.c, { ...sol, answers: { overshoot: 'smooth' } });
    expect(res.results.find((r) => r.id === 'q-overshoot').feedback).toMatch(/in transit/);
  });

  it('behaviour checks ask for a run when none exists', () => {
    const sol = SOLUTIONS['build-savings']();
    const res = assess(sol.c, { ...sol, run: false });
    expect(res.results.find((r) => r.id === 'result').feedback).toMatch(/Run the simulation/);
  });

  it('numerical lab: dt = 0.05 is not accurate enough, 0.02 is', () => {
    const sol = SOLUTIONS['numerical-euler']();
    expect(assess(sol.c, { ...sol, config: { ...sol.config, dt: 0.05 } }).results.find((r) => r.id === 'accuracy').pass).toBe(false);
  });
});
