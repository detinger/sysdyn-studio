import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../../src/pythonExporter.js';
import { generateRCode } from '../../src/rExporter.js';
import * as F from '../fixtures/models.js';
import * as EXAMPLES from '../../src/examples.js';

describe('code export', () => {
  it('translates ^ to ** in Python and keeps ^ in R', () => {
    const m = { nodes: [F.stock('s', 'S', 1), F.flow('f', 'F', 'S ^ 2 * k'), F.variable('k', 'k', 0.1)], edges: [F.inflow('f', 's')] };
    expect(generatePythonCode(m.nodes, m.edges, 0.1, 10)).toMatch(/S \*\* 2/);
    expect(generateRCode(m.nodes, m.edges, 0.1, 10)).toMatch(/S \^ 2/);
  });

  it('uses the configured dt and method, not a hard-coded value', () => {
    const m = F.constantInflow;
    expect(generatePythonCode(m.nodes, m.edges, 0.25, 10)).toContain('np.linspace(0, 10, 41)');
    expect(generateRCode(m.nodes, m.edges, 0.25, 10, null, { method: 'euler' })).toContain('method = "euler"');
  });

  it('refuses to export an invalid model and says why', () => {
    const m = { nodes: [F.stock('s', 'S', 1), F.flow('f', 'F', 'missing * 2')], edges: [F.inflow('f', 's')] };
    const py = generatePythonCode(m.nodes, m.edges);
    expect(py).toMatch(/cannot be exported/);
    expect(py).toContain('Undefined variable `missing`');
    expect(py).not.toContain('odeint(');
  });

  it('renames identifiers that collide with target-language names', () => {
    const m = { nodes: [F.stock('s', 't', 1), F.flow('f', 'lambda', 't * 0.1')], edges: [F.inflow('f', 's')] };
    const py = generatePythonCode(m.nodes, m.edges);
    expect(py).toContain('t_ = y[0]');
    expect(py).toContain('lambda_ = (t_ * 0.1)');
  });

  it('exports every example', () => {
    Object.values(EXAMPLES).forEach((m) => {
      expect(generatePythonCode(m.nodes, m.edges, 0.1, m.maxTime, m.visibleVariables)).toContain('odeint(model');
      expect(generateRCode(m.nodes, m.edges, 0.1, m.maxTime, m.visibleVariables)).toContain('ode(y = init_state');
    });
  });
});
