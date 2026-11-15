import { BookOpen, ArrowRight } from 'lucide-react';
import useStore from '../../store';
import { findExample } from '../library/catalog';
import * as EX from '../../examples';
import {
  StockFlowAnatomy, MaterialVsInformation, FeedbackLoops, AccumulationFigure, EquilibriumFigure,
  BehaviorModes, DelayFigure, NumericsFigure,
} from './Figures';

/**
 * Theory reference with live figures. Every chart is computed by the same
 * solver the modeler uses; sliders change a copy of a small model, never the
 * model you are editing.
 */
const SECTIONS = [
  { id: 'intro', title: 'What is System Dynamics?' },
  { id: 'blocks', title: 'Stocks, flows and variables' },
  { id: 'accumulation', title: 'Accumulation' },
  { id: 'links', title: 'Material vs. information' },
  { id: 'feedback', title: 'Feedback loops' },
  { id: 'equilibrium', title: 'Equilibrium' },
  { id: 'modes', title: 'Behaviour modes' },
  { id: 'delays', title: 'Delays and oscillation' },
  { id: 'units', title: 'Units and time' },
  { id: 'numerics', title: 'Numerical integration' },
  { id: 'validation', title: 'Validation' },
  { id: 'experiments', title: 'Experiments' },
];

function useOpenExample() {
  const loadModel = useStore((s) => s.loadModel);
  const setRoute = useStore((s) => s.setRoute);
  return (key) => {
    const model = findExample(key)?.model || EX[key];
    if (!model) return;
    loadModel(model);
    setRoute('modeler');
  };
}

function TryIt({ exampleKey, children }) {
  const open = useOpenExample();
  const ex = findExample(exampleKey);
  if (!ex) return null;
  return (
    <button className="btn btn-sm" onClick={() => open(exampleKey)}>
      {children || `Try it: ${ex.model.name}`} <ArrowRight size={14} />
    </button>
  );
}

export default function TheoryView() {
  const open = useOpenExample();
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
              <p>The concepts behind the modeler, one idea at a time. The charts are computed live by the simulator; move the sliders to see how structure creates behaviour. Sliders change a copy, never your model.</p>
            </div>
          </div>

          <h2 id="th-intro">What is System Dynamics?</h2>
          <p>System Dynamics (SD) is a computer-aided approach to policy analysis and design. It applies to dynamic problems arising in complex social, managerial, economic, or ecological systems. It is fundamentally focused on understanding how things change over time, characterized by interdependence, mutual interaction, information feedback, and circular causality.</p>
          <p>An SD model is a hypothesis about structure. Simulating it shows which behaviour that structure produces; it does not by itself prove that the real system works that way.</p>

          <h2 id="th-blocks">Stocks, flows and variables</h2>
          <StockFlowAnatomy />
          <ul>
            <li><strong>Stocks</strong> represent accumulations within the system. They describe the current state of the system and generate the information upon which decisions and actions are based. They provide &quot;memory&quot; to a system. <span className="hint">Examples: population, water in a tub, bank balance, inventory.</span></li>
            <li><strong>Flows</strong> represent the rate of change of the stocks over time. They are the <em>only</em> way stocks can change. If time stops, flows disappear, but stocks remain. <span className="hint">Examples: births, water draining, spending.</span></li>
            <li><strong>Auxiliaries</strong> are intermediate calculations, recomputed at each instant from the current state. <strong>Parameters</strong> are constant assumptions you change in experiments.</li>
            <li>A <strong>cloud</strong> marks the model boundary: material comes from, or goes to, somewhere the model does not track.</li>
          </ul>
          <p className="hint">A quick test: imagine pressing pause. Whatever you could still count (people, liters, euros) is a stock; anything measured “per unit of time” is a flow.</p>

          <h2 id="th-accumulation">Accumulation</h2>
          <p>A stock adds up its net flow over time: <code>S(t) = S(0) + ∫ (inflow − outflow) dt</code>. Changing a flow changes the <em>slope</em> of the stock immediately, but its <em>level</em> only gradually. This is why stocks create inertia and delays in real systems.</p>
          <AccumulationFigure />
          <TryIt exampleKey="POPULATION_EXTENDED" />

          <h2 id="th-links">Material vs. information</h2>
          <p>A <strong>material flow</strong> (thick pipe) moves a conserved quantity: what leaves one stock arrives in another, or crosses the boundary at a cloud. An <strong>information link</strong> (orange dashed arrow) says that an equation uses a value. Nothing moves along it.</p>
          <MaterialVsInformation />
          <p>The validator checks that the diagram and the equations agree: every name used in an equation should have an information link, and every information link should be used.</p>

          <h2 id="th-feedback">Feedback loops</h2>
          <p>Feedback loops are the fundamental structures that generate dynamic behaviour. To find a loop’s type, follow it around and count the negative (−) links: an <strong>even</strong> number makes it reinforcing, an <strong>odd</strong> number makes it balancing.</p>
          <FeedbackLoops />
          <ul>
            <li><strong>Reinforcing (positive) feedback</strong> generates exponential growth or collapse. It acts as an engine of growth. <em>Example: more infected people cause a higher infection rate, which leads to even more infected people.</em> &quot;Positive&quot; means amplifying, not desirable.</li>
            <li><strong>Balancing (negative) feedback</strong> seeks equilibrium and goal-seeking behaviour. It acts as a stabilizing force. <em>Example: a thermostat turning off the heat when the target temperature is reached, or a population dying off due to lack of resources.</em> A balancing loop with a delay can still oscillate.</li>
          </ul>
          <p>Feedback through a stock is legitimate and is how SD models produce behaviour. A loop among auxiliaries with no stock in between is an <em>algebraic loop</em>: it has no order of calculation and the validator rejects it.</p>
          <div className="flex gap-2 flex-wrap"><TryIt exampleKey="SAVINGS_ACCOUNT" /><TryIt exampleKey="CUSTOMER_BASE" /></div>

          <h2 id="th-equilibrium">Equilibrium</h2>
          <p>A stock is in equilibrium when its inflows and outflows are equal, so its net flow is zero. You can often find the equilibrium without simulating: set inflow = outflow and solve. Simulation shows <em>how</em> and <em>how fast</em> the stock gets there.</p>
          <EquilibriumFigure />
          <TryIt exampleKey="BATHTUB" />

          <h2 id="th-modes">Behaviour modes</h2>
          <p>A handful of structures produce most of the patterns you will see. Recognising the pattern is the first step to guessing the structure behind it. Each chart below was computed from a model in the library.</p>
          <BehaviorModes onOpen={open} />

          <h2 id="th-delays">Delays and oscillation</h2>
          <p>A delay separates a decision from its effect. Inside a balancing loop it makes the correction continue after the goal is reached, because the earlier corrections are still on their way. The result is overshoot and, often, oscillation, like the bullwhip effect in supply chains.</p>
          <DelayFigure />
          <p>Two remedies: shorten the delay, or make decisions that account for what is already in the pipeline. Simply reacting more slowly reduces the overshoot too, but leaves the system short for longer.</p>
          <TryIt exampleKey="SUPPLY_CHAIN_DELAY" />

          <h2 id="th-units">Units and time</h2>
          <p>Every stock has a unit (for example <code>units</code>), and every flow connected to it must be in that unit per unit of time (<code>units/week</code>), as in the anatomy diagram above. Set the model time unit in the Simulation settings; the validator then compares declared units.</p>
          <p>The unit check is deliberately conservative: if units are missing, it says the check was not done, never that units are correct.</p>
          <TryIt exampleKey="INVENTORY_CONTROL" />

          <h2 id="th-numerics">Numerical integration</h2>
          <p>Because these systems are defined by interconnected differential equations, analytical solutions are often impossible. Instead, we use numerical methods to step through time and simulate the behaviour:</p>
          <ul>
            <li><strong>Euler method:</strong> calculates the rate of change at the start of a time step and projects it forward. Simple and transparent, but the error shrinks only in proportion to dt, and large steps can make oscillating systems unstable.</li>
            <li><strong>Runge–Kutta 4 (RK4):</strong> the default in this tool. It evaluates the derivatives four times per step (start, twice at the midpoint, and at the end). For smooth models its error shrinks roughly with dt⁴, so it is usually far more accurate than Euler at the same step. It is not an unconditional guarantee: discontinuities (<code>step</code>, conditionals) and very fast processes still need a small enough dt.</li>
          </ul>
          <NumericsFigure />
          <p>A good habit: halve dt and run again. If the curves change noticeably, the earlier result was not numerically reliable.</p>
          <TryIt exampleKey="PREDATOR_PREY">Try it: compare Euler and RK4 on predator–prey</TryIt>

          <h2 id="th-validation">Validation</h2>
          <p>Before running, the model is checked for structural problems (orphaned flows, links that cannot work), equation problems (undefined names, unsupported functions, algebraic loops), declared-unit mismatches and suspicious numerical settings. Errors block the run, so a broken equation never silently produces a plausible-looking chart.</p>
          <p>Passing these checks means the model can be simulated as written. It does not mean the model is a good representation of the real system.</p>

          <h2 id="th-experiments">Experiments</h2>
          <p>Run a baseline, choose <em>Set as baseline</em>, change one parameter and run again. The Compare view lists exactly which parameters changed, checks that both runs used the same solver, time step and horizon, and shows the two trajectories together (solid for the current run, dashed for the baseline). The Experiment tab sweeps a parameter over a range and ranks parameters by sensitivity.</p>
          <p>Ask whether a change alters the <em>size</em> of a response, its <em>timing</em>, or both, and which feedback loop explains it.</p>
          <TryIt exampleKey="SIR_MODEL">Try it: lower the infection peak in the SIR model</TryIt>
        </article>
      </div>
    </div>
  );
}
