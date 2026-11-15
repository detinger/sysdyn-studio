import { BookOpen, ArrowRight } from 'lucide-react';
import useStore from '../../store';
import { findExample } from '../library/catalog';
import { StockGlyph, ValveGlyph, AuxGlyph, LegendLine } from '../../components/ui/Glyphs';

/**
 * Theory reference (formerly the Theory modal). Content of the original modal
 * is preserved and extended; each section links to a worked example.
 */
const SECTIONS = [
  { id: 'intro', title: 'What is System Dynamics?' },
  { id: 'blocks', title: 'Stocks, flows and variables' },
  { id: 'links', title: 'Material vs. information' },
  { id: 'feedback', title: 'Feedback loops' },
  { id: 'units', title: 'Units and time' },
  { id: 'numerics', title: 'Numerical integration' },
  { id: 'validation', title: 'Validation' },
  { id: 'experiments', title: 'Experiments' },
];

function TryIt({ exampleKey, children }) {
  const loadModel = useStore((s) => s.loadModel);
  const setRoute = useStore((s) => s.setRoute);
  const ex = findExample(exampleKey);
  if (!ex) return null;
  return (
    <button className="btn btn-sm" onClick={() => { loadModel(ex.model); setRoute('modeler'); }}>
      {children || `Try it: ${ex.model.name}`} <ArrowRight size={14} />
    </button>
  );
}

export default function TheoryView() {
  return (
    <div className="page">
      <div className="reference">
        <nav className="toc" aria-label="Contents">
          <div className="eyebrow" style={{ padding: '0 10px 8px' }}>Contents</div>
          {SECTIONS.map((s) => <a key={s.id} className="nav-link" href={`#th-${s.id}`}>{s.title}</a>)}
        </nav>
        <article className="prose">
          <div className="page-header">
            <div>
              <h1 className="flex items-center gap-2"><BookOpen size={22} aria-hidden="true" /> System Dynamics theory</h1>
              <p>The concepts behind the modeler, one idea at a time. Each section links to a model you can change.</p>
            </div>
          </div>

          <h2 id="th-intro">What is System Dynamics?</h2>
          <p>System Dynamics (SD) is a computer-aided approach to policy analysis and design. It applies to dynamic problems arising in complex social, managerial, economic, or ecological systems. It is fundamentally focused on understanding how things change over time, characterized by interdependence, mutual interaction, information feedback, and circular causality.</p>
          <p>An SD model is a hypothesis about structure. Simulating it shows which behaviour that structure produces; it does not by itself prove that the real system works that way.</p>

          <h2 id="th-blocks">Stocks, flows and variables</h2>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: 12 }}>
            <div className="card">
              <h3 className="flex items-center gap-2"><StockGlyph /> Stocks (accumulations)</h3>
              <p style={{ fontSize: 13 }}>Stocks represent accumulations within the system. They describe the current state of the system and generate the information upon which decisions and actions are based. They provide &quot;memory&quot; to a system.</p>
              <p className="hint">Examples: population, water in a tub, bank balance, inventory.</p>
            </div>
            <div className="card">
              <h3 className="flex items-center gap-2"><ValveGlyph size={20} className="" /> Flows (rates)</h3>
              <p style={{ fontSize: 13 }}>Flows represent the rate of change of the stocks over time. They are the <em>only</em> way stocks can change. If time stops, flows disappear, but stocks remain.</p>
              <p className="hint">Examples: birth rate (inflow), water draining (outflow), spending.</p>
            </div>
            <div className="card">
              <h3 className="flex items-center gap-2"><AuxGlyph /> Auxiliaries and parameters</h3>
              <p style={{ fontSize: 13 }}>Auxiliaries are intermediate calculations, recomputed at each instant from the current state. Parameters are constant assumptions that you change in experiments.</p>
              <p className="hint">Examples: fraction of capacity used, adjustment time, contact rate.</p>
            </div>
          </div>
          <p>For a stock <code>S</code> with inflows and outflows, the model defines <code>dS/dt = Σ inflows − Σ outflows</code>. Raising an inflow changes the <em>slope</em> of the stock, not its level: the level responds gradually.</p>
          <p>A cloud at the end of a flow marks the model boundary: material comes from, or goes to, somewhere the model does not track.</p>
          <TryIt exampleKey="POPULATION_EXTENDED" />

          <h2 id="th-links">Material vs. information</h2>
          <p><LegendLine kind="material" /> A <strong>material flow</strong> moves conserved quantity between stocks. What leaves one stock arrives in another, or crosses the boundary at a cloud.</p>
          <p><LegendLine kind="info" /> An <strong>information link</strong> says that an equation uses a value. Nothing moves: drawing an information link from Inventory to an order rate does not reduce Inventory.</p>
          <p>The validator checks that the diagram and the equations agree: every name used in an equation should have an information link, and every information link should be used.</p>

          <h2 id="th-feedback">Feedback loops</h2>
          <p>The interactions between stocks, flows, and variables create feedback loops. These loops are the fundamental structural elements that generate dynamic behavior over time:</p>
          <ul>
            <li><strong>Reinforcing (positive) feedback</strong> generates exponential growth or collapse. It acts as an engine of growth. <em>Example: more infected people cause a higher infection rate, which leads to even more infected people.</em> &quot;Positive&quot; means amplifying, not desirable.</li>
            <li><strong>Balancing (negative) feedback</strong> seeks equilibrium and goal-seeking behavior. It acts as a stabilizing force. <em>Example: a thermostat turning off the heat when the target temperature is reached, or a population dying off due to lack of resources.</em> A balancing loop with a delay can still oscillate.</li>
          </ul>
          <p>Feedback through a stock is legitimate and is how SD models produce behaviour. A loop among auxiliaries with no stock in between is an <em>algebraic loop</em>: it has no order of calculation and the validator rejects it.</p>
          <div className="flex gap-2 flex-wrap"><TryIt exampleKey="ADOPTION_MODEL" /><TryIt exampleKey="CARRYING_CAPACITY" /></div>

          <h2 id="th-units">Units and time</h2>
          <p>Every stock has a unit (for example <code>units</code>), and every flow connected to it must be in that unit per unit of time (<code>units/week</code>). Set the model time unit in the Simulation settings; the validator then compares declared units.</p>
          <p>The unit check is deliberately conservative: if units are missing, it says the check was not done, never that units are correct.</p>
          <TryIt exampleKey="INVENTORY_CONTROL" />

          <h2 id="th-numerics">Numerical integration</h2>
          <p>Because these systems are defined by interconnected differential equations, analytical solutions are often impossible. Instead, we use numerical methods to step through time and simulate the behavior:</p>
          <ul>
            <li><strong>Euler method:</strong> calculates the rate of change at the start of a time step and projects it forward. Simple and transparent, but the error shrinks only in proportion to dt, and large steps can make oscillating systems unstable.</li>
            <li><strong>Runge–Kutta 4 (RK4):</strong> the default in this tool. It evaluates the derivatives four times per step (start, twice at the midpoint, and at the end). For smooth models its error shrinks roughly with dt⁴, so it is usually far more accurate than Euler at the same step. It is not an unconditional guarantee: discontinuities (<code>step</code>, conditionals) and very fast processes still need a small enough dt.</li>
          </ul>
          <p>A good habit: halve dt and run again. If the curves change noticeably, the earlier result was not numerically reliable.</p>
          <TryIt exampleKey="PREDATOR_PREY">Try it: compare Euler and RK4 on predator–prey</TryIt>

          <h2 id="th-validation">Validation</h2>
          <p>Before running, the model is checked for structural problems (orphaned flows, links that cannot work), equation problems (undefined names, unsupported functions, algebraic loops), declared-unit mismatches and suspicious numerical settings. Errors block the run, so a broken equation never silently produces a plausible-looking chart.</p>
          <p>Passing these checks means the model can be simulated as written. It does not mean the model is a good representation of the real system.</p>

          <h2 id="th-experiments">Experiments</h2>
          <p>Run a baseline, choose <em>Set as baseline</em>, change one parameter and run again. The Compare view lists exactly which parameters changed, checks that both runs used the same solver, time step and horizon, and shows the two trajectories together (solid for the current run, dashed for the baseline).</p>
          <p>Ask whether a change alters the <em>size</em> of a response, its <em>timing</em>, or both, and which feedback loop explains it.</p>
          <TryIt exampleKey="SIR_MODEL">Try it: lower the infection peak in the SIR model</TryIt>
        </article>
      </div>
    </div>
  );
}
