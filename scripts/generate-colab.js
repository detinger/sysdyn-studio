/**
 * Generates the Google Colab notebooks in colab/ from the model library.
 *
 * Each notebook is built from the same model data and Python exporter the app
 * uses, so the code matches what Export → Python produces in the modeler.
 * Run after changing an example model:  npm run colab
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXAMPLE_LIBRARY } from '../src/features/library/catalog.js';
import { migrateDocument, fromDocument } from '../src/domain/model/document.js';
import { prepareExport } from '../src/domain/export/common.js';
import { stockBalanceTex, exprTex, texName } from '../src/domain/equations/tex.js';
import { generatePythonCode } from '../src/pythonExporter.js';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'colab');

/** Notebooks to generate, with one scenario experiment each. */
const NOTEBOOKS = [
  {
    key: 'SIR_MODEL',
    file: 'sir_epidemic.ipynb',
    experiment: {
      label: 'infection_probability = 0.2',
      params: { infection_probability: 0.2 },
      question: 'Halving the infection probability: is the epidemic peak lower, later, or both?',
    },
  },
  {
    key: 'WORLD3_MODEL',
    file: 'world3_limits_to_growth.ipynb',
    experiment: {
      label: 'Resources(0) = 200',
      initial: { Resources: 200 },
      question: 'Doubling the initial resource base: does the collapse disappear, or is it only postponed?',
    },
  },
  {
    key: 'ADOPTION_MODEL',
    file: 'innovation_adoption_bass.ipynb',
    experiment: {
      label: 'ads_effectiveness = 0',
      params: { ads_effectiveness: 0 },
      question: 'Without advertising, why does adoption never start?',
    },
  },
  {
    key: 'PREDATOR_PREY',
    file: 'predator_prey.ipynb',
    experiment: {
      label: 'Prey(0) × 1.5',
      initialScale: { Prey: 1.5 },
      question: 'Starting with 50 % more prey: how do the amplitude and period of the cycle change?',
    },
  },
  {
    key: 'SUPPLY_CHAIN_DELAY',
    file: 'supply_chain_delay.ipynb',
    experiment: {
      label: 'supply_line_weight = 1',
      params: { supply_line_weight: 1 },
      question: 'Accounting fully for orders already in the supply line: what happens to the overshoot?',
    },
  },
  {
    key: 'FISHERY',
    file: 'fishery.ipynb',
    experiment: {
      label: 'reinvestment_fraction = 0.05',
      params: { reinvestment_fraction: 0.05 },
      question: 'Reinvesting less of the revenue in boats: does the fishery stay productive?',
    },
  },
];

const lines = (text) => {
  const parts = text.replace(/\n+$/, '').split('\n');
  return parts.map((l, i) => (i < parts.length - 1 ? `${l}\n` : l));
};
const md = (text) => ({ cell_type: 'markdown', metadata: {}, source: lines(text) });
const code = (text) => ({ cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: lines(text) });

const pyValue = (v) => (typeof v === 'string' ? `'${v}'` : String(v));
const pyDict = (obj) => `{${Object.entries(obj).map(([k, v]) => `'${k}': ${pyValue(v)}`).join(', ')}}`;
const cellText = (v) => String(v ?? '').replace(/\|/g, '\\|');

/** Split exporter output at its "# 1." … "# 6." section headings. */
function splitSections(source) {
  const all = source.split('\n');
  const starts = all.map((l, i) => (/^# [1-6]\. /.test(l) ? i : -1)).filter((i) => i >= 0);
  if (starts.length !== 6) throw new Error('Unexpected Python exporter layout');
  const bounds = [0, ...starts, all.length];
  return bounds.slice(0, -1).map((b, i) => all.slice(b, bounds[i + 1]).join('\n').trim());
}

function structureMarkdown(prep) {
  const { domain, stocks, parameters, computed, initial } = prep;
  const name = (id) => domain.byId.get(id).name;
  const out = ['## Model structure', '', '**Stock balances**', '', '$$', '\\begin{aligned}'];
  stocks.forEach((s) => {
    const balance = stockBalanceTex(s.name, s.inflows.map(name), s.outflows.map(name)).replace(' = ', ' &= ');
    out.push(`${balance} \\\\`);
  });
  out.push('\\end{aligned}', '$$', '');

  out.push('**Stocks**', '', '| Stock | Initial value | Unit |', '|---|---|---|');
  stocks.forEach((s, i) => out.push(`| \`${s.name}\` | ${initial[i]} | ${cellText(s.unit) || '—'} |`));
  out.push('');

  if (computed.length) {
    out.push('**Flows and auxiliaries** (in evaluation order)', '', '$$', '\\begin{aligned}');
    computed.forEach((c) => out.push(`${texName(c.name)} &= ${exprTex(c.equation) ?? '\\text{(unparsed)}'} \\\\`));
    out.push('\\end{aligned}', '$$', '');
  }

  if (parameters.length) {
    out.push('**Parameters**', '', '| Parameter | Value | Unit |', '|---|---|---|');
    parameters.forEach((p) => out.push(`| \`${p.name}\` | ${prep.params[p.id]} | ${cellText(p.unit) || '—'} |`));
  } else {
    out.push('This model has no separate parameters: its constants are written directly into the equations above.');
  }
  return out.join('\n');
}

function experimentCode(prep, experiment) {
  const stockNames = prep.stocks.map((s) => s.name);
  const timeUnit = prep.cfg.timeUnit ? ` (${prep.cfg.timeUnit})` : '';
  const initial = { ...(experiment.initial || {}) };
  Object.entries(experiment.initialScale || {}).forEach(([n, f]) => {
    initial[n] = prep.initial[stockNames.indexOf(n)] * f;
  });
  return [
    `STOCKS = [${stockNames.map((n) => `'${n}'`).join(', ')}]`,
    '',
    'def simulate(param_changes=None, initial_changes=None):',
    '    """Rerun the model with changed parameters and/or initial stock values."""',
    '    p = {**params, **(param_changes or {})}',
    '    y_init = list(y0)',
    '    for stock, value in (initial_changes or {}).items():',
    '        y_init[STOCKS.index(stock)] = value',
    '    return odeint(model, y_init, t, args=(p,), rtol=1e-8, atol=1e-10)',
    '',
    `scenario = simulate(param_changes=${pyDict(experiment.params || {})}, initial_changes=${pyDict(initial)})`,
    '',
    'fig, axes = plt.subplots(len(STOCKS), 1, sharex=True, figsize=(10, 2.8 * len(STOCKS)))',
    'axes = np.atleast_1d(axes)',
    'for i, (ax, stock) in enumerate(zip(axes, STOCKS)):',
    "    ax.plot(t, sol[:, i], label='Baseline', linewidth=2)",
    `    ax.plot(t, scenario[:, i], '--', label='${experiment.label}', linewidth=2)`,
    '    ax.set_ylabel(stock)',
    '    ax.grid(True, alpha=0.3)',
    "axes[0].legend(loc='best')",
    `axes[-1].set_xlabel('Time${timeUnit}')`,
    "fig.suptitle('Baseline vs. scenario')",
    'plt.tight_layout()',
    'plt.show()',
  ].join('\n');
}

function buildNotebook({ key, experiment }) {
  const entry = EXAMPLE_LIBRARY.find((e) => e.key === key);
  if (!entry) throw new Error(`Unknown library model ${key}`);
  const { document, errors } = migrateDocument(entry.model);
  if (!document) throw new Error(`${key}: ${errors.join(' ')}`);
  const state = fromDocument(document);
  const cfg = state.simulation;
  const prep = prepareExport(state.nodes, state.edges, cfg);
  if (!prep.ok) throw new Error(`${key}: ${prep.reasons.join('; ')}`);

  const python = generatePythonCode(state.nodes, state.edges, cfg.dt, cfg.stop, state.view.visibleVariables, cfg);
  const [setup, parameters, initial, definition, run, post, plot] = splitSections(python);
  const unit = cfg.timeUnit ? ` ${cfg.timeUnit}s` : ' time units';
  const name = state.meta.name;

  const cells = [
    md([
      `# ${name}`,
      '',
      `*System Dynamics Studio, model library: ${entry.level}*`,
      '',
      state.meta.description,
      '',
      `**Concepts:** ${entry.concepts.join(', ')}`,
      '',
      `**Expected behavior:** ${entry.behavior}`,
      '',
      `**Limitations:** ${entry.limitations}`,
    ].join('\n')),
    md(structureMarkdown(prep)),
    md([
      '## Setup',
      '',
      'NumPy, SciPy and Matplotlib are preinstalled on Google Colab. The step, ramp and pulse helpers',
      'are the time functions available in the app; they are defined here for completeness.',
    ].join('\n')),
    code(setup),
    md('## Parameters and initial values\n\nEdit the values below and rerun the notebook from here to try your own scenarios.'),
    code(`${parameters}\n\n${initial}`),
    md('## Model equations\n\n`model` returns the rate of change of every stock. It is the system of ordinary differential equations shown above.'),
    code(definition),
    md([
      '## Simulation',
      '',
      `The model runs from t = ${cfg.start} to t = ${cfg.stop}${unit}. The app integrates with ${cfg.method === 'euler' ? 'Euler' : 'RK4'} at a fixed`,
      `dt = ${cfg.dt}; this notebook uses SciPy's adaptive \`odeint\` (LSODA) with tight tolerances, so results agree`,
      'with the app within numerical tolerance.',
    ].join('\n')),
    code(run),
    code(post),
    md('## Results'),
    code(plot),
    md(`## Experiment\n\n${experiment.question}\n\nThe cell below reruns the model with one change and compares each stock against the baseline.`),
    code(experimentCode(prep, experiment)),
    md(['## Questions to explore', '', ...entry.prompts.map((p) => `- ${p}`)].join('\n')),
  ];

  return {
    nbformat: 4,
    nbformat_minor: 0,
    metadata: {
      colab: { name, provenance: [] },
      kernelspec: { name: 'python3', display_name: 'Python 3' },
      language_info: { name: 'python' },
    },
    cells,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
NOTEBOOKS.forEach((nb) => {
  writeFileSync(join(OUT_DIR, nb.file), `${JSON.stringify(buildNotebook(nb), null, 1)}\n`);
  console.log(`colab/${nb.file}`);
});
