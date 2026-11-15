import { describe, it, expect } from 'vitest';
import { validateModel } from '../../src/domain/validation/validateModel.js';
import { parseExpression, analyzeExpression, compileExpression } from '../../src/domain/equations/expression.js';
import * as F from '../fixtures/models.js';

const cfg = { start: 0, stop: 10, dt: 0.1, method: 'rk4', timeUnit: 'day' };
const codes = (v) => v.issues.map((i) => i.code);

describe('expression language', () => {
  const check = (src) => {
    const { ast, error } = parseExpression(src);
    if (!ast) return { error };
    return analyzeExpression(ast);
  };

  it('accepts arithmetic, functions, comparisons and conditionals', () => {
    ['a * b + c / d - e ^ 2', 'max(0, x - y) / t0', 'x > 3 ? 1 : 0', '-a', 'step(10, 5) + ramp(1, 2, 4)', 'a < b and not c', '2 x']
      .forEach((src) => expect(check(src).errors).toEqual([]));
  });

  it('rejects assignments, function definitions, strings, matrices and unknown functions', () => {
    ['a = 3', 'f(x) = x^2', '"abc"', '[1, 2]', 'evaluate("1+1")', 'import({})', 'a.b', 'a; b', 'sqrt(1, 2)']
      .forEach((src) => {
        const r = check(src);
        expect(r.error || r.errors.length, src).toBeTruthy();
      });
  });

  it('evaluates with numbers only (no math.js units)', () => {
    const { ast } = parseExpression('m * 2 + (x > 1 ? 10 : 20) + 7 % 3');
    const f = compileExpression(ast, (n) => n);
    expect(f({ m: 3, x: 5 }, 0)).toBe(6 + 10 + 1);
  });

  it('reports a syntax error with a message', () => {
    expect(parseExpression('a * (b + ').error).toMatch(/Syntax error/);
  });
});

describe('model validation', () => {
  it('valid minimal models pass without errors', () => {
    for (const m of [F.constantInflow, F.decay(), F.logistic(), F.transfer, F.inventoryLab()]) {
      const v = validateModel(m.nodes, m.edges, cfg);
      expect(v.canRun, JSON.stringify(v.issues.filter((i) => i.severity === 'error'))).toBe(true);
    }
  });

  it('PLAN §5.2 broken model lab: unknown symbol, unit mismatch and algebraic loop are distinct issues and block the run', () => {
    const v = validateModel(F.brokenLab.nodes, F.brokenLab.edges, cfg);
    expect(v.canRun).toBe(false);
    const undefinedIssue = v.issues.find((i) => i.code === 'equation.undefined');
    expect(undefinedIssue).toMatchObject({ severity: 'error', elementId: 'orders' });
    expect(undefinedIssue.title).toContain('DemandRate');
    const loop = v.issues.filter((i) => i.code === 'equation.algebraic_loop');
    expect(loop.map((i) => i.elementId).sort()).toEqual(['x', 'y']);
    const unit = v.issues.find((i) => i.code === 'units.flow_mismatch');
    expect(unit).toMatchObject({ severity: 'warning', elementId: 'orders' });
    expect(unit.message).toContain('items/day');
    expect(undefinedIssue.fix).toBeTruthy();
  });

  it('feedback through a stock is not an algebraic loop', () => {
    const v = validateModel(F.logistic().nodes, F.logistic().edges, cfg);
    expect(codes(v)).not.toContain('equation.algebraic_loop');
  });

  it('detects self-referencing auxiliaries as algebraic loops', () => {
    const m = { nodes: [F.variable('a', 'a', 'a + 1')], edges: [] };
    expect(codes(validateModel(m.nodes, m.edges, cfg))).toContain('equation.algebraic_loop');
  });

  it('flags duplicate names, empty flow equations and invalid links', () => {
    const m = {
      nodes: [F.stock('s1', 'S', 1), F.stock('s2', 'S', 1), F.flow('f', 'F', ''), F.variable('v', 'v', 2)],
      edges: [{ id: 'bad', source: 'v', target: 's1' }],
    };
    const c = codes(validateModel(m.nodes, m.edges, cfg));
    expect(c).toEqual(expect.arrayContaining(['name.duplicate', 'equation.empty', 'link.invalid', 'flow.orphan']));
  });

  it('recommends drawing links that equations use, and flags drawn links that are unused', () => {
    const m = {
      nodes: [F.stock('s', 'S', 1), F.flow('f', 'F', 'S * k'), F.variable('k', 'k', 0.1), F.variable('z', 'z', 3)],
      edges: [F.outflow('s', 'f'), F.info('k', 'f'), F.info('z', 'f')],
    };
    const v = validateModel(m.nodes, m.edges, cfg);
    expect(v.issues.find((i) => i.code === 'link.missing').message).toContain('S');
    expect(codes(v)).toContain('link.unused');
  });

  it('never claims unit correctness when units are absent', () => {
    const v = validateModel(F.decay().nodes, F.decay().edges, cfg);
    expect(v.issues.find((i) => i.code === 'units.none').message).toMatch(/not checked/);
  });

  it('initial values may not depend on stocks or flows', () => {
    const m = { nodes: [F.stock('a', 'A', 1), F.stock('b', 'B', 'A * 2')], edges: [] };
    expect(codes(validateModel(m.nodes, m.edges, cfg))).toContain('initial.dynamic');
  });
});

describe('information ports on every side', () => {
  it('links into a flow from below, and from any side of a variable, are information links', () => {
    const m = {
      nodes: [F.stock('s', 'S', 1), F.flow('f', 'F', 'S * k'), F.variable('k', 'k', 0.1)],
      edges: [F.outflow('s', 'f'), { id: 'a', source: 'k', sourceHandle: 'out-top', target: 'f', targetHandle: 'info-bottom' }, { id: 'b', source: 's', target: 'f', targetHandle: 'info' }],
    };
    const v = validateModel(m.nodes, m.edges, cfg);
    expect(v.domain.infoLinks.map((l) => l.id).sort()).toEqual(['a', 'b']);
    expect(v.issues.map((i) => i.code)).not.toContain('link.missing');
  });
});
