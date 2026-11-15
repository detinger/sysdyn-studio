/**
 * Cross-execution parity for code exports (PLAN.md §2.9 "Export correctness").
 *
 * Runs only when interpreters are configured:
 *   SD_PYTHON=/path/to/python-with-numpy-scipy
 *   SD_RSCRIPT=Rscript  SD_R_LIBS=/path/to/library-with-deSolve   (optional)
 * Tolerances: R (deSolve fixed-step rk4 on the same grid) rel 1e-9;
 * Python (adaptive odeint vs app RK4 at dt 0.01) rel 1e-6, 5e-4 with discontinuous inputs.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as EXAMPLES from '../../src/examples.js';
import { generatePythonCode } from '../../src/pythonExporter.js';
import { generateRCode } from '../../src/rExporter.js';
import { runModel } from '../../src/domain/simulation/runModel.js';
import * as F from '../fixtures/models.js';

const PY = process.env.SD_PYTHON;
const RS = process.env.SD_RSCRIPT;
const RLIB = process.env.SD_R_LIBS || '';

const syntaxModel = {
  name: 'syntax', maxTime: 10, discontinuous: true,
  nodes: [
    F.stock('p', 'P', 10), F.stock('q', 'Q', 1),
    F.flow('g', 'growth', 'r * P ^ 1.5 / 10 * (1 - P / K) + (time > 5 ? 1 : 0) * min(1, P, 3) + step(2, 3) + ramp(0.1, 2, 6) + max(0, -P) + exp(-time) + log(K, 10) % 2'),
    F.flow('h', 'decay', 'Q * k'),
    F.variable('r', 'r', 0.3), F.variable('K', 'K', 1000), F.variable('k', 'k', 0.2),
  ],
  edges: [F.inflow('g', 'p'), F.outflow('q', 'h')],
};

const cases = [...Object.entries(EXAMPLES), ['syntax', syntaxModel]];

const appFinal = (m, dt = 0.1) => {
  const { run } = runModel(m.nodes, m.edges, { start: 0, stop: m.maxTime, dt, method: 'rk4' });
  return run.elements.filter((e) => e.type === 'stock').map((e) => run.series[e.id].at(-1));
};

const rel = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b));

describe.skipIf(!PY)('Python export executes and matches the app', () => {
  it.each(cases)('%s', (_name, m) => {
    let code = generatePythonCode(m.nodes, m.edges, 0.1, m.maxTime);
    code = code.split('# 6. Visualization')[0].replace('import matplotlib.pyplot as plt', '');
    code += '\nimport json\nprint(json.dumps([float(x) for x in sol[-1]]))\n';
    const out = JSON.parse(execFileSync(PY, ['-I', '-'], { input: code }).toString());
    // odeint is adaptive, so compare with a refined app run (dt = 0.01) to
    // separate export correctness from the app's own RK4 truncation error.
    const app = appFinal(m, 0.01);
    // Discontinuous inputs (step, conditionals) reduce fixed-step RK4 to first
    // order near the jump: the app's error is ≈1.2e-3 at dt 0.1 and ≈1.2e-4 at
    // dt 0.01, so a looser bound applies. R reproduces this model to 1e-9.
    const tol = m.discontinuous ? 5e-4 : 1e-6;
    app.forEach((v, i) => expect(rel(out[i], v)).toBeLessThan(tol));
  });
});

describe.skipIf(!RS)('R export executes and reproduces the app run', () => {
  it.each(cases)('%s', (_name, m) => {
    let code = generateRCode(m.nodes, m.edges, 0.1, m.maxTime);
    code = code.split('# 5. Visualization')[0]
      .replace('library(deSolve)', `library(deSolve${RLIB ? `, lib.loc = "${RLIB}"` : ''})`)
      .replace('library(ggplot2)', '').replace('library(tidyr)', '');
    const n = m.nodes.filter((x) => x.type === 'stock').length;
    code += `\ncat(sprintf("%.17g", out[nrow(out), 2:${n + 1}]), sep = ",")\n`;
    const out = execFileSync(RS, ['-e', code]).toString().trim().split(',').map(Number);
    const app = appFinal(m);
    app.forEach((v, i) => expect(rel(out[i], v)).toBeLessThan(1e-9));
  });
});
