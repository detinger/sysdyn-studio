import { describe, it, expect } from 'vitest';
import { CHALLENGES, findChallenge } from '../../src/data/challenges.js';
import { makeContext, evaluateChallenge } from '../../src/domain/assessment/rubric.js';
import { validateModel } from '../../src/domain/validation/validateModel.js';
import { runModel } from '../../src/domain/simulation/runModel.js';
import { migrateDocument, fromDocument } from '../../src/domain/model/document.js';
import * as EXAMPLES from '../../src/examples.js';
import * as F from '../fixtures/models.js';

const assess = (challenge, nodes, edges, config, { run = true, answers = {} } = {}) => {
  const validation = validateModel(nodes, edges, config);
  const r = run && validation.canRun ? runModel(nodes, edges, config, { modelRevision: 1 }).run : null;
  return evaluateChallenge(challenge, makeContext({ validation, run: r, config, revision: 1, answers }));
};
const failing = (res) => res.results.filter((r) => !r.pass).map((r) => r.id);
const dayCfg = { start: 0, stop: 10, dt: 0.1, method: 'rk4', timeUnit: 'day' };

describe('challenge: build an inventory', () => {
  const c = findChallenge('build-inventory');

  it('gives actionable feedback on an empty model', () => {
    const res = assess(c, [], [], { ...dayCfg, stop: 100, timeUnit: '' });
    expect(res.complete).toBe(false);
    expect(res.results.find((r) => r.id === 'stock').feedback).toMatch(/Add a stock/);
    expect(res.passed).toBe(0); // nothing passes trivially on an empty model
  });

  it('passes for the PLAN §5.2 lab solution, whatever the element names', () => {
    const m = F.inventoryLab(15);
    m.nodes.find((n) => n.id === 'inv').data.label = 'Warehouse';
    const res = assess(c, m.nodes, m.edges, dayCfg);
    expect(failing(res)).toEqual([]);
    expect(res.complete).toBe(true);
  });

  it('flags hard-coded rates and missing units', () => {
    const nodes = [F.stock('s', 'S', 100), F.flow('a', 'a', '20'), F.flow('b', 'b', '15')];
    const edges = [F.inflow('a', 's'), F.outflow('s', 'b')];
    const res = assess(c, nodes, edges, dayCfg);
    expect(failing(res)).toEqual(expect.arrayContaining(['parameters', 'units']));
    expect(failing(res)).not.toContain('result');
  });

  it('asks for a run when the behaviour has not been simulated', () => {
    const m = F.inventoryLab(15);
    const res = assess(c, m.nodes, m.edges, dayCfg, { run: false });
    expect(res.results.find((r) => r.id === 'result').feedback).toMatch(/Run the simulation/);
  });
});

describe('challenge: fix the cooling coffee', () => {
  const c = findChallenge('fix-cooling');
  const start = fromDocument(migrateDocument(c.start).document);

  it('the starting model fails the three targeted checks', () => {
    const res = assess(c, start.nodes, start.edges, start.simulation);
    expect(failing(res)).toEqual(expect.arrayContaining(['undefined', 'links', 'direction', 'valid', 'behavior']));
  });

  it('the repaired model passes', () => {
    const nodes = start.nodes.map((n) => (n.id === 'cooling' ? { ...n, data: { ...n.data, equation: '(Coffee_Temperature - Room_Temperature) / cooling_time' } } : n));
    const edges = [
      { id: 'm1', source: 'coffee', sourceHandle: 'outflow', target: 'cooling' },
      { id: 'i1', source: 'room', target: 'cooling', targetHandle: 'info' },
      ...start.edges.filter((e) => e.id === 'i2' || e.id === 'i3'),
    ];
    const res = assess(c, nodes, edges, start.simulation);
    expect(failing(res)).toEqual([]);
  });
});

describe('challenge: predict adoption', () => {
  const c = findChallenge('predict-adoption');
  const m = EXAMPLES.ADOPTION_MODEL;
  const cfg = { start: 0, stop: 10, dt: 0.1, method: 'rk4' };

  it('requires the correct prediction and a confirming run', () => {
    expect(assess(c, m.nodes, m.edges, cfg, { answers: { shape: 'exp' } }).complete).toBe(false);
    const res = assess(c, m.nodes, m.edges, cfg, { answers: { shape: 's' } });
    expect(failing(res)).toEqual([]);
    expect(res.results.find((r) => r.id === 'run').feedback).toMatch(/peaks at t ≈/);
  });
});

describe('catalogue', () => {
  it('every challenge has an objective, hints and an explanation', () => {
    CHALLENGES.forEach((c) => {
      expect(c.objective.length).toBeGreaterThan(20);
      expect(c.hints.length).toBeGreaterThan(0);
      expect(c.explanation.length).toBeGreaterThan(20);
    });
  });
});
