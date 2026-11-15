# Equation language and solver semantics

Reference for model authors and maintainers. The implementation is in `src/domain/`; the tests in `tests/unit/` are the executable specification.

## Equation language

Equations are parsed with math.js and then checked against an allowlist. They are evaluated by the app's own number-only evaluator, never by `math.evaluate` or `eval`.

| Allowed | Notes |
|---|---|
| Numbers, `true`/`false` (as 1/0) | Strings, arrays, matrices and units are rejected |
| Model names | Letters, digits and underscores; not starting with a digit; unique; `time` is reserved |
| `time` | Current simulation time (at RK4 sub-steps, the sub-step time) |
| `pi`, `e` | Only when no element has that name |
| `+ - * / ^ %` and unary `-` | `%` is `x − y·floor(x/y)`; implicit multiplication such as `2 x` is allowed |
| `< > <= >= == !=`, `and`, `or`, `not` | Results are 1 or 0 |
| `condition ? a : b` | |
| `abs sqrt exp log log10 sin cos tan min max floor ceil round sign pow` | `log(x)` is natural; `log(x, b)` uses base b; `round` rounds halves up |
| `step(height, start)`, `ramp(slope, start[, end])`, `pulse(height, start, width)` | Time functions; discontinuous, so check results with a smaller dt |

Rejected: assignment, function definitions, multiple statements, property access, indexing, ranges, unknown functions, wrong argument counts, and expressions with more than 500 terms or more than 2,000 characters.

## Model semantics

- A **stock** has an initial value (a number or an expression of constant parameters) and changes only through flows: `dS/dt = Σ inflows − Σ outflows`.
- A **flow** drains at most one stock (from that stock's outflow port) and fills at most one stock (into its inflow port). A missing end is a cloud, meaning the model boundary. Connecting more stocks is allowed but produces a warning, because the full rate is applied to each of them.
- A **variable** whose equation is a numeric literal is a **parameter**: evaluated once per run and open to scenario overrides. Otherwise it is an **auxiliary**, recomputed at every evaluation.
- An **information link** documents a dependency. It never moves material, and it cannot point into a stock.
- Auxiliaries and flows are evaluated in dependency order. A cycle among them with no stock in between is an **algebraic loop** and an error. Feedback through stocks is normal.

## Solver

- Methods: `euler` (order 1) and `rk4` (classical, order 4). Every RK4 stage recomputes every auxiliary and flow from that stage's stock vector and time.
- Time grid: `t_i = start + i·dt`, computed from the integer index. If the horizon is not a multiple of dt, the last step is shortened so the run ends exactly at `stop`; this is reported.
- Recorded values: stocks at each `t_i`, plus auxiliaries and flows evaluated from those stock values (not from a sub-stage). Values are recorded at every step.
- Failure: a NaN or ±∞ in any auxiliary, flow or derivative, at any stage, stops the run. The run is marked incomplete, and the message names the time, stage and element. Data up to the last valid step are kept and shown as a failed run.
- Nonnegativity: off by default; stocks are never clamped silently. When enabled, negative stocks are set to 0 after each step, and the number of events and the first one are reported.
- Limits: 200,000 steps per run.
- Determinism: identical model and settings give identical results; playback speed never affects them.

Accuracy is a property of the model, the method and dt together. RK4 is not automatically correct. Halve dt and compare.

## Units

Units are free text on each element, with a model time unit in the simulation settings. The validator checks that each flow's declared unit equals `stockUnit/timeUnit` for the stocks it connects (whitespace and case are ignored). It does not perform dimensional algebra inside equations. Missing units are reported as "not checked", never as "valid".

## Exports

| Export | Method | Agreement with the app |
|---|---|---|
| Python (SciPy) | `odeint` (adaptive LSODA), `rtol 1e-8` | Within numerical tolerance, not digit for digit |
| R (deSolve) | Fixed-step `rk4` or `euler` on the app's own time grid | Reproduces the app run (tested to rel. 1e-9) |
| CSV | All recorded series, with a provenance header | Exact |
| JSON | Native schema v1 | Round-trip tested |
