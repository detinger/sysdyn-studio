# System Dynamics Studio

System Dynamics Studio is a browser-based environment for building, simulating and teaching stock-and-flow models of biological, social and economic systems. It is intended for educators and students: models are drawn in standard System Dynamics notation, validated before they run, solved with fixed-step numerical integration, and can be exported as executable Python and R code.

## Features

### Home
*   **Start screen**: Shows the open model (validation status, last run, active challenge or baseline), challenge progress by level, and links to each step of the learning workflow.
*   **Local data**: Lists what the app stores in this browser and lets you reset challenge progress or clear everything. Model data and progress stay in the browser.

### Modeling Canvas
*   **Drag and drop**: Build models from standard System Dynamics notation: **stocks** (rectangles), **flows** (valves on pipes, with clouds at the model boundary), **auxiliaries** and **parameters** (circles).
*   **Typed connections**: Thick pipes carry material; orange dashed arrows carry information. Connections that cannot work (for example an information arrow into a stock) are refused with an explanation. Variables connect on all four sides, flows receive information at the top and the bottom, and stocks send it from the top and the bottom.
*   **Snapping**: While you drag an element, nearly straight connections snap exactly straight (hold Alt/Option to place freely).
*   **Inspector**: Edit names, equations, units and descriptions, with a rendered equation preview, dependency lists, an *Explain* tab, and keyboard-accessible controls for connecting flows and links. Renaming updates every equation that uses the name. Hide it with the toolbar toggle or Ctrl/⌘ \\ to give the canvas more room.
*   **Validation before running**: Undefined names, unsupported functions, algebraic loops, invalid links and declared-unit mismatches are explained next to the element. Errors block the run, so a broken equation never produces a plausible-looking chart.
*   **Equations page**: Every stock balance and equation, rendered with MathJax from the same parsed expressions the solver uses.
*   **Undo/redo, autosave and files**: Changes autosave in the browser; models import and export as versioned JSON.
*   **Light and dark themes**: Light, dark, or follow the system setting.

### Simulation
*   **Euler and RK4**: Fixed-step integration, tested against analytical solutions (including measured convergence order). The run ends exactly at the stop time, and failures (for example `sqrt` of a negative number) stop the run and name the time and element. Stocks are never clamped silently.
*   **Playback controls**: Solve once, then play, pause, step, scrub and reset along the stored result. Playback speed never changes the numerical result.
*   **Visualization**: Behavior-over-time charts for stocks, flows and variables with units and a time cursor, current stock levels, a data table, and CSV export.
*   **Baseline vs. intervention**: Pin a run as the baseline, change parameters, run again, and compare overlaid trajectories, parameter differences and summary metrics, with checks that both runs used the same numerical settings.
*   **Experiments**: Sweep a parameter over a linear or logarithmic range, or rank all parameters by local sensitivity (one-at-a-time ±10 %). Results are labelled as exploratory.
*   **Resizable results panel**: Drag the top edge (or use the arrow keys on it) to give charts more room.

### Learning
*   **Theory**: A reference guide with live figures computed by the simulator: stock-and-flow anatomy, material vs. information, reinforcing and balancing loops, accumulation, equilibrium, delays and oscillation, Euler vs. RK4, and a gallery of six behaviour modes. Sliders change a copy of a small model, never your own.
*   **Model library**: 15 documented models, each with teaching notes (concepts, intended behaviour, prompts to try, limitations) and a preview of its simulated behaviour:
    *   Foundations: **Population Dynamics (Extended)**, **Bathtub**, **Coffee Cooling**, **Inventory Control**
    *   Feedback: **Innovation Adoption (Bass)**, **Savings Account**, **Customer Base**
    *   Quantitative models: **Carrying Capacity**, **Project Backlog**, **Hiring Pipeline**
    *   Complex behaviour: **Predator–Prey**, **SIR Epidemic**, **Supply Chain with Delivery Delay**, **Fishery**, **World3 (Limits to Growth)**. World3 is a simplified teaching model inspired by World3, not the calibrated original.
*   **Challenges**: 18 challenges at three levels (6 easy, 6 intermediate, 6 advanced): build, fix, identify, predict, explain feedback, numerical method lab, calibrate to data, and policy design. Checks look at what the model means (stocks, rates, units, behaviour), not how the diagram looks. Each check explains what to change; hints appear one at a time, and progress is saved in the browser.

### Code Export
*   **Python (SciPy)**: Export to Python using `scipy.integrate.odeint` and `matplotlib`. odeint is adaptive, so results agree with the app within numerical tolerance.
*   **R (deSolve)**: Export to R using `deSolve` (same fixed-step method and time grid as the app) and `ggplot2`.
*   Both exports are generated from the parsed equations. Optional integration tests execute them against the app's results (see `tests/integration/export-parity.test.js`).

## Getting Started

### Prerequisites
*   Node.js 22.13+ (22.x) or 24+; the installed Vite and ESLint versions also support Node.js 20.19+ (20.x)
*   npm (the repository includes `package-lock.json`)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/detinger/sysdyn-studio.git
    cd sysdyn-studio
    ```

2.  **Install dependencies**:
    ```bash
    npm ci
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```

4.  **Access the app**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## Technology Stack

*   **Frontend**: React with Vite.
*   **State Management**: Zustand.
*   **Canvas Engine**: React Flow (with custom node implementations).
*   **Styling**: Tailwind CSS with semantic design tokens (`src/styles/tokens.css`) for light and dark themes.
*   **Math/Charts**: Recharts for charts, MathJax for rendered equations, and Math.js for parsing (equations are evaluated by a restricted, number-only evaluator).
*   **Integration**: Pure JavaScript Euler/RK4 solver in `src/domain/simulation` (no UI dependencies), tested with Vitest.

## Usage

1.  **Start at Home**: See what is open and where to go next. Open **Model library** to choose an example, **Challenges** for guided tasks, or **Theory** to learn the concepts.
2.  **Define Equations**: Select an element and edit it in the inspector on the right. Click empty canvas to see model-wide validation and simulation settings (start, stop, dt, method, time unit).
3.  **Review Equations**: Open **Equations** in the sidebar to see the whole model rendered with MathJax.
4.  **Run Simulation**: Choose **Run simulation** (or press Ctrl/⌘ Enter). Values appear on the diagram and in the charts as the time cursor moves.
5.  **Analyze and compare**: Use the Stocks / Flows / Variables / Table tabs. Choose **Set as baseline**, change a parameter, run again, and open **Compare**. The **Experiment** tab runs parameter sweeps and sensitivity rankings.
6.  **Export**: Use **Export** in the toolbar for the model file (JSON), results (CSV), or Python and R code.

## Development

```bash
npm test        # unit, characterization and challenge tests (Vitest)
npm run lint
npm run build
```

Export parity tests are skipped unless their interpreters are configured. Set `SD_PYTHON` to a Python executable with NumPy and SciPy, and `SD_RSCRIPT` to an Rscript executable with deSolve. `SD_R_LIBS` optionally selects the R package library:

```bash
SD_PYTHON=/path/to/python SD_RSCRIPT=/path/to/Rscript npm test
```

Running the full exported scripts, including their plots, also requires Python's Matplotlib or R's ggplot2 and tidyr.

To build and preview the production app:

```bash
npm run build     # writes the static app to dist/
npm run preview   # serves the production build locally
```

Deploy the contents of `dist/` to a static web host. No application backend is required.

*   [PLAN.md](PLAN.md) holds the roadmap and [STYLE.md](STYLE.md) the design language.
*   [Architecture audit](docs/architecture/current-state.md) records implementation history, verification evidence and gaps; its test counts describe earlier checkpoints.
*   [Equation language and solver semantics](docs/semantics-and-units/equations-and-solver.md) documents supported expressions, units, time functions and numerical behavior.

## Project Structure

| Path | Purpose |
|---|---|
| `src/domain/` | Pure model, equation, validation, simulation, scenario and assessment logic |
| `src/features/` | Modeler, learning, library, challenges, experiments and other app views |
| `src/components/` | Shared controls, canvas nodes and simulation results |
| `src/store.js`, `src/state/` | App state, autosave, preferences and learning progress |
| `src/examples.js`, `src/data/` | Teaching models and challenge definitions |
| `src/pythonExporter.js`, `src/rExporter.js` | Executable code exporters |
| `tests/` | Unit tests, fixtures (including the original engine used as a characterization reference) and optional Python/R execution tests |

## Storage and Current Limits

The app autosaves one draft, learning progress and preferences in this browser's `localStorage` under `sds.*` keys. Export JSON to keep separate models or transfer them between browsers. Runs and baselines are session state, not a saved run archive. Home provides controls to reset progress or clear app data.

MathJax is loaded from an external CDN, so equation rendering currently needs network access; the app is not fully offline.

*   Units validation compares declared stock/flow units; it does not perform dimensional algebra inside equations.
*   Euler and RK4 use fixed steps. Check convergence by reducing `dt`, especially for discontinuous time functions. Runs execute on the main thread, with a 200,000-step cap and no cancellation.
*   Experiments support one baseline, single-parameter sweeps and local sensitivity. CLD editing, lookup functions, Monte Carlo and XMILE interchange are not implemented.
*   The included models are teaching examples, not calibrated forecasts. The World3 example is a simplified teaching sketch.
*   Automated tests currently cover domain and store behavior; a full automated browser/accessibility suite remains roadmap work.
