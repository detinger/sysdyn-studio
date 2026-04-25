# System Dynamics Studio 🚀

**System Dynamics Studio** is a high-fidelity, interactive platform designed for modeling, simulating, and understanding complex biological, social, and economic systems. Built for both educators and students, it provides a "cockpit" environment where users can visualize feedback loops, analyze system behavior through real-time numerical integration, and export models for professional research.


## ✨ Key Features

### 🛠️ Interactive Modeling Canvas
*   **Drag-and-Drop Interface**: Seamlessly build models using standard System Dynamics primitives: **Stocks**, **Flows**, and **Variables**.
*   **Intelligent Connections**: Visual feedback loops (dotted orange lines) help distinguish information flows from physical material flows.
*   **Live Equations**: Define complex mathematical relationships directly within node properties.

### 🧪 Real-time Simulation Engine
*   **RK4 Integration**: Uses the 4th-order Runge-Kutta method for high-precision numerical stability.
*   **Playback Controls**: Pause, play, and reset simulations to observe time-step transitions.
*   **Instant Visualization**: View system state across dual dashboards featuring both line charts for trends and bar charts for current stock levels.

### 📚 Educational Theory Hub
*   **Built-in Textbook**: Access a comprehensive "Theory" guide covering:
    *   Foundational Stocks & Flows.
    *   Reinforcing vs. Balancing Feedback Loops.
    *   Numerical Integration Methods (Euler vs. RK4).
    *   Real-world modeling best practices.
*   **Example Library**: 5 curated classic models ready for simulation:
    *   **Predator-Prey (Lotka-Volterra)**: Biological oscillations.
    *   **SIR Epidemic Model**: Disease spread dynamics.
    *   **Innovation Adoption (Bass Model)**: Market diffusion.
    *   **Carrying Capacity**: Limits to growth.
    *   **Inventory Control**: Supply chain management.

### 💻 Research-Grade Code Export
*   **Python (SciPy)**: One-click export to production-ready Python code using `scipy.integrate.odeint` and `matplotlib`.
*   **R (deSolve)**: Export to R for statistical analysis using the `deSolve` package and `ggplot2` for publication-quality visuals.

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
*   **Styling**: Tailwind CSS (Dark Mode optimized).
*   **Math/Charts**: Chart.js for data visualization.
*   **Integration**: Custom RK4 engine implemented in JavaScript.

---

## 📖 How to Use

1.  **Select a Model**: Use the Sidebar to load one of the built-in examples or start with a blank canvas.
2.  **Define Equations**: Click on any Flow or Variable node to edit its mathematical expression or constant value.
3.  **Run Simulation**: Hit the **Play** button in the Simulation Panel. Observe how variables interact in real-time.
4.  **Analyze**: Use the line charts to spot oscillations, delays, or exponential growth patterns.
5.  **Export**: Click the **Code** icon in the sidebar to generate Python or R scripts to take your model into a notebook environment.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**System Dynamics Studio** — *Simulating the complexity of the world, one loop at a time.*
