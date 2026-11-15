# System Dynamics Studio 🚀

**System Dynamics Studio** is an interactive learning environment designed for modeling, simulating, and understanding complex biological, social, and economic systems. Built for both educators and students, it provides a "cockpit" environment where users can visualize feedback loops, analyze system behavior through real-time numerical integration, and export models for professional research.


## ✨ Key Features

### 🛠️ Interactive Modeling Canvas
*   **Drag-and-Drop Interface**: Build models from standard System Dynamics notation: **stocks** (rectangles), **flows** (valves on pipes, with clouds at the model boundary), **auxiliaries** and **parameters** (circles).
*   **Typed Connections**: Thick pipes carry material; orange dashed arrows carry information. Connections that cannot work (for example an information arrow into a stock) are refused with an explanation.
*   **Inspector**: Edit names, equations, units and descriptions, with a rendered equation preview, dependency lists, an *Explain* tab, and keyboard-accessible controls for connecting flows and links. Renaming updates every equation that uses the name.
*   **Validation before running**: Undefined names, unsupported functions, algebraic loops, invalid links and declared-unit mismatches are explained next to the element. Errors block the run, so a broken equation never produces a plausible-looking chart.
*   **Equations page**: Every stock balance and equation, rendered with MathJax from the same parsed expressions the solver uses.
*   **Undo/redo, autosave and files**: Changes autosave in the browser; models import and export as versioned JSON.
*   **Light and dark themes**: Light, dark, or follow the system setting.

### 🧪 Real-time Simulation Engine
*   **Euler and RK4**: Fixed-step integration, tested against analytical solutions (including measured convergence order). The run ends exactly at the stop time, and failures (for example `sqrt` of a negative number) stop the run and name the time and element. Stocks are never clamped silently.
*   **Playback Controls**: Solve once, then play, pause, step, scrub and reset along the stored result. Playback speed never changes the numerical result.
*   **Visualization**: Behavior-over-time charts for stocks, flows and variables with units and a time cursor, current stock levels, a data table, and CSV export.
*   **Baseline vs. intervention**: Pin a run as the baseline, change parameters, run again, and compare overlaid trajectories, parameter differences and summary metrics, with checks that both runs used the same numerical settings.

### 📚 Educational Theory Hub
*   **Built-in Textbook**: Access a comprehensive "Theory" guide covering:
    *   Foundational Stocks & Flows.
    *   Reinforcing vs. Balancing Feedback Loops.
    *   Numerical Integration Methods (Euler vs. RK4).
    *   Real-world modeling best practices.
*   **Example Library**: 7 curated classic models ready for simulation:
    *   **Population Dynamics (Extended)**: Births, deaths, immigration, and exodus in one stock-and-flow model.
    *   **Predator-Prey (Lotka-Volterra)**: Biological oscillations.
    *   **SIR Epidemic Model**: Disease spread dynamics.
    *   **Innovation Adoption (Bass Model)**: Market diffusion.
    *   **Carrying Capacity**: Limits to growth.
    *   **Inventory Control**: Supply chain management.
    *   **World3 (Limits to Growth)**: Overshoot-and-collapse dynamics across population, industry, resources, and pollution.

### 💻 Code Export
*   **Python (SciPy)**: Export to Python using `scipy.integrate.odeint` and `matplotlib`. odeint is adaptive, so results agree with the app within numerical tolerance.
*   **R (deSolve)**: Export to R using `deSolve` (same fixed-step method and time grid as the app) and `ggplot2`.
*   Both exports are generated from the parsed equations and are executed in the test suite against the app's results (see `tests/integration/export-parity.test.js`).

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18.0 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/system-dynamics-studio.git
    cd system-dynamics-studio
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```

4.  **Access the app**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Technology Stack

*   **Frontend**: React.js with Vite.
*   **State Management**: Zustand (for high-performance simulation state).
*   **Canvas Engine**: React Flow (with custom node implementations).
*   **Styling**: Tailwind CSS with semantic design tokens (`src/styles/tokens.css`) for light and dark themes.
*   **Math/Charts**: Recharts for charts, MathJax for rendered equations, and Math.js for parsing (equations are evaluated by a restricted, number-only evaluator).
*   **Integration**: Pure JavaScript Euler/RK4 solver in `src/domain/simulation` (no UI dependencies), tested with Vitest.

---

## 📖 How to Use

1.  **Select a Model**: Open **Model library** in the sidebar and choose an example, or add a stock on the empty canvas.
2.  **Define Equations**: Select an element and edit it in the inspector on the right. Click empty canvas to see model-wide validation and simulation settings (start, stop, dt, method, time unit).
3.  **Review Equations**: Open **Equations** in the sidebar to see the whole model rendered with MathJax.
4.  **Run Simulation**: Choose **Run simulation** (or press Ctrl/⌘ Enter). Values appear on the diagram and in the charts as the time cursor moves.
5.  **Analyze and compare**: Use the Stocks / Flows / Variables / Table tabs. Choose **Set as baseline**, change a parameter, run again, and open **Compare**.
6.  **Export**: Use **Export** in the toolbar for the model file (JSON), results (CSV), or Python and R code.

---

## 🧪 Development

```bash
npm test        # unit and characterization tests (Vitest)
npm run lint
npm run build
```

Export parity tests run real Python and R when `SD_PYTHON` (Python with NumPy and SciPy) and `SD_RSCRIPT` / `SD_R_LIBS` (R with deSolve) are set.

*   `PLAN.md` holds the roadmap and `STYLE.md` the design language.
*   `docs/architecture/current-state.md` records what has been verified, what changed, and the known gaps.
*   `docs/semantics-and-units/equations-and-solver.md` documents the supported equation language and the solver semantics.

---

**System Dynamics Studio** — *Simulating the complexity of the world, one loop at a time.*
