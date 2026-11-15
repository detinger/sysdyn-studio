# System Dynamics Studio — STYLE.md

**Purpose:** Transfer the proven **BPMN Studio design language** to System Dynamics Studio while replacing BPMN symbols, terminology, screens and process-specific interactions with system dynamics concepts.  
**Companion:** [`PLAN.md`](PLAN.md)  
**Applies to:** Application shell, React Flow modeler, CLD workspace, equation inspector, simulation controls, charts, educational content, challenges, scenario comparison and exports.

> **Primary instruction to development agents:** This is a visual and interaction specification, not inspiration for a new theme. **Preserve the actual BPMN Studio palette, typography, component geometry, density, borders, light/dark behavior and hierarchy.** Map these onto the current React/Tailwind/React Flow stack. Replace BPMN branding and domain content only.

---

## 1. Visual character and design principles

System Dynamics Studio should feel like a **calm, compact academic analytical workspace**. It is an instrument for thinking, modeling and experimentation — not a marketing landing page or colorful flowchart toy.

- **The model is central.** Diagram, equations, plots and explanations occupy most of the screen. The shell stays quiet.
- **Dense, but organized.** Tight button groups and toolbars; more generous separation between work sections.
- **Borders before shadows.** Flat/elevated neutral panels, consistent 1px borders, restrained shadows.
- **Color has semantic meaning.** Blue = primary action/selection; orange = specialized activity or the existing system dynamics information-link convention; feedback colors = validated states.
- **Contextual learning.** Explain errors, assumptions, loops and solver choices next to the thing being manipulated.
- **Themes are complete.** Every custom React Flow node, port, connection, chart, formula and dialog responds to light/dark theme.
- **Professional plotting.** Clear units, labeled axes, compact legends, readable numerical data and no unnecessary gradients.

Avoid oversized hero banners inside workspaces, neumorphism, glassmorphism, decorative gradients, heavy shadows on every card, arbitrary stock/flow colors, emoji icons as UI controls, and pill-shaped primary buttons. Reserve pill treatment for badges, filters and step indicators.

### Transfer map

| BPMN Studio component | System Dynamics Studio interpretation |
|---|---|
| BPMN modeler canvas | Stock-and-flow modeler; separate CLD editor when implemented |
| Token simulation toolbar | Run / pause / reset / time-step / time cursor toolbar |
| BPMN element properties | Stock, rate, auxiliary, parameter and equation inspector |
| BPMN validator panel | Structure, math, units and numerical diagnostics |
| Performance charts | Behavior-over-time plots, state/rate charts and scenario overlays |
| AS-IS / TO-BE | Baseline / intervention experiment comparison |
| BPMN encyclopedia | Concept encyclopedia with mini stock-flow/feedback demonstrations |
| BPMN challenges | System dynamics modeling, debugging, prediction and policy challenges |

---

# 2. Semantic color tokens — exact BPMN Studio values

Use semantic **CSS custom properties**; never hardcode palette colors independently in JSX, Tailwind arbitrary values, React Flow nodes and Recharts. The values here are carried from the supplied BPMN Studio `STYLE(2).md`.

## 2.1 Surfaces and text

| Token | Light theme | Dark theme | Purpose |
|---|---|---|---|
| `--bg` | `#f4f6f9` | `#0f141b` | App background |
| `--bg-elevated` | `#ffffff` | `#171e27` | Sidebar, cards, controls, dialog |
| `--bg-subtle` | `#eef1f5` | `#1c2430` | Table headers, groups, inset tools |
| `--bg-sunken` | `#e6eaf0` | `#121821` | Recessed tracks and progress |
| `--bg-hover` | `#e9eef5` | `#233042` | Interactive hover |
| `--border` | `#d6dce5` | `#2b3645` | Standard 1px border |
| `--border-strong` | `#b7c1cf` | `#3b4a5e` | Selected/hover outlines |
| `--text` | `#17202c` | `#e6ebf1` | Primary text |
| `--text-muted` | `#4b5867` | `#b2bdcb` | Descriptions, labels |
| `--text-subtle` | `#6b7787` | `#8a97a8` | Metadata, hints |
| `--text-on-primary` | `#ffffff` | `#0b1520` | On solid primary buttons |

## 2.2 Brand and interaction

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--primary` | `#1f5f8b` | `#5aa7d8` | Selected elements, primary action, focus |
| `--primary-hover` | `#184d72` | `#7ab9e3` | Solid button hover |
| `--primary-soft` | `#e3eef7` | `#16314a` | Selected rows, explanatory panels |
| `--primary-strong` | `#123b59` | `#a8d3ef` | Emphasized primary text |
| `--accent` | `#d9822b` | `#f0a457` | Specialized activity, time playback, information links |
| `--accent-soft` | `#fbeedd` | `#3a2a17` | Quiet orange highlights |

Solid accent surfaces use dark text `#1d1205` **in both themes**. Do not automatically use white text on orange.

## 2.3 Feedback colors

| Role / token | Foreground light / dark | Soft background light / dark | Usage |
|---|---|---|---|
| Error `--error`, `--error-soft` | `#c0392b` / `#f2776a` | `#fbe9e7` / `#3b1d1a` | Invalid equation, failed run, destructive action |
| Warning `--warning`, `--warning-soft` | `#b7791f` / `#e8b45a` | `#fdf3dc` / `#3a2d14` | Uncertain units, suspect step size |
| Recommendation `--recommendation`, `--recommendation-soft` | `#2b6cb0` / `#79b2ec` | `#e6f0fa` / `#172a40` | Educational advice |
| Info `--info`, `--info-soft` | `#5a6779` / `#a3afbf` | `#eef1f5` / `#1f2833` | Neutral metadata |
| Success `--success`, `--success-soft` | `#2f855a` / `#6fcf97` | `#e3f4ea` / `#16301f` | Valid model, completed exercise |

All status messages need an icon + text: color alone is insufficient. Do not use success green to mean *the model predicts growth*; green describes interface validation/completion, not an ethically good system outcome.

### Domain-color precedence

The existing README uses **orange dashed information links**. Keep this useful convention, but distinguish it from a warning or active simulation by **dash pattern, arrowhead, legend and context**. Use blue for selected elements. A causal CLD link can use visible `+`/`−` labels to encode influence, not arbitrary red/green judgments. Never change a series color based on whether its value rises or falls.

---

# 3. Typography — exact scale

```css
--font-sans: 'Inter', 'IBM Plex Sans', system-ui, -apple-system,
  'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace,
  SFMono-Regular, Menlo, monospace;
```

The source BPMN Studio declared these fonts without bundling font files. Match with fallbacks or self-host permitted font assets when consistent cross-device rendering matters. Do not include or redistribute third-party font files without checking licenses.

| UI part | Font size | Weight | Details |
|---|---|---|---|
| Body | **14px** | 400 | Line height `1.5` |
| Overview hero | 32px | 650 | Tracking `-0.02em` |
| Page `h1` | 26px | 650 | Tracking `-0.01em` |
| Section `h2` | 20px | 650 | Tracking `-0.01em` |
| Card `h3` | 16px | 650 | Tracking `-0.01em` |
| Subheading `h4` | 14px | 650 | Tracking `-0.01em` |
| Dialog title | 17px | 650 | No bottom margin |
| Hero description | 15px | 400 | Muted |
| Compact content / inspector | 13px | 400 | Dense panel and list text |
| Field label / table heading | 12px | 600 | Muted |
| Hint | 12px | 400 | Subtle |
| Small metadata / badge | 11px | 400 / 650 | Low hierarchy |
| KPI / prominently shown value | 22px | 700 | Tracking `-0.02em`, tabular numerals |
| Eyebrow | 12px | 600 | Uppercase, letter spacing `0.08em`, primary |
| Nav group label | 11px | 400 | Uppercase, letter spacing `0.06em` |

Headings use `line-height: 1.25`, margin-bottom `0.5em`. Paragraphs have bottom margin `0.75em`. Standard prose uses sentence case. Keep explanatory text at `max-width: 76ch`, header description at `72ch`.

### System Dynamics typography rules

- Equations and identifiers use monospace in text; math is rendered with MathJax in dedicated views.
- Node labels should remain readable at normal zoom without overflowing stocks or covering valves.
- Use **tabular numerals** for simulation time, stock levels, rates, comparisons and tooltips.
- Values and units are kept together (`150 items`, `20 items/day`, `t = 10 days`).
- Mathematical symbols `dS/dt`, `β`, `Δt`, `R`, `B`, `+`, `−` must be legible and accessible through accompanying names/tooltips.
- Never present an equation solely in a truncated tooltip; show full editable expression in the inspector.

---

# 4. Spacing, radii, shadows and geometry

## 4.1 Spacing rhythm

| Size | Use |
|---|---|
| 2–4px | Adjacent toolbar buttons, tight labels, badge gaps |
| 6px | Icon-to-label gap, compact list gaps |
| 8px | Standard row and small-control spacing |
| 10–12px | Form grids and field separation |
| 14–16px | Inspector padding, panel stacks and card gaps |
| 18px | Card/dialog content |
| 20–24px | Major panel separation and page headers |
| 28–32px | Desktop page inset |
| 40–48px | Bottom-page breathing room |

These are the source proportions; optionally express them as `--space-*` variables, without changing the resulting density.

## 4.2 Radius tokens

| Shape | Radius | Uses |
|---|---|---|
| `--radius-sm` | `6px` | Buttons, inputs, tabs containers, callouts |
| `--radius` | `10px` | Cards, metric tiles, groups |
| `--radius-lg` | `14px` | Dialogs |
| Local small | `4px` | Keycaps, diagram micro-corners, bar ends |
| Pill | `999px` | Badges, chips, progress bars |

The **stock shape** is a domain symbol and may use sharper or minimally rounded corners than ordinary cards. It must still be visibly a stock rectangle, not another generic UI card.

## 4.3 Shadow tokens

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(16, 24, 40, 0.06)` | same |
| `--shadow` | `0 2px 8px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.06)` | `0 2px 10px rgba(0, 0, 0, 0.45)` |
| `--shadow-lg` | `0 12px 32px rgba(16, 24, 40, 0.16)` | `0 16px 40px rgba(0, 0, 0, 0.6)` |
| `--focus-ring` | `0 0 0 3px rgba(31, 95, 139, 0.35)` | `0 0 0 3px rgba(90, 167, 216, 0.45)` |

Default to 1px borders with minimal shadow. Linked card hover and toasts use medium shadow; menus/dialogs use large shadow.

---

# 5. Application shell and screen composition

## 5.1 Core shell geometry

- Full-height shell, left sidebar, main content area.
- Expanded sidebar **232px**; collapsed sidebar **64px**.
- Brand and top workspace toolbar each **56px** tall, with toolbar wrapping when necessary.
- Sidebar uses `--bg-elevated`, a right border and grouped navigation; utility actions at bottom.
- Nav link: `8px 10px` padding, `10px` icon gap, **6px** radius.
- Active nav: `--primary-soft` fill, `--primary` text/icon.
- Standard page padding: `28px 32px 48px`; narrow content maximum **1080px**.
- Header: title/description left, primary page action right; wrap at smaller widths with **16px** gap.
- Flexible regions require `min-width: 0`, `min-height: 0` and `minmax(0, 1fr)`.

## 5.2 Proposed System Dynamics navigation

Group and label navigation tersely. Suggested menu content (adapt to actual implemented routes):

```text
SYSTEM DYNAMICS STUDIO

WORKSPACE
  Overview
  Modeler
  Causal Loops           [when implemented]
  Equations              [existing Eqs]

SIMULATION
  Run Simulation
  Analyze Results
  Experiments            [when implemented]

LEARN
  Theory
  Model Library
  Challenges             [when implemented]

TOOLS
  Import / Export
  Settings
```

Do not show absent advanced pages as functional. Hide them until ready or visibly label them as planned with no fake actions.

## 5.3 Page recipes

| Page | Structure |
|---|---|
| Overview | Title and compact description → workflow cards → recent models and lessons |
| Model library | Search/filters → model cards (minimum 260px) → preview and learning tags |
| SFD modeler | Workspace toolbar → flexible canvas + **420px** property inspector |
| CLD editor | Same shell → canvas + loop/polarity inspector |
| Equations | Compact model index + equation list with MathJax/units/validation |
| Simulation | Canvas/preview + time controls + linked behavior-over-time views |
| Configuration/results | **380px** configuration column + flexible charts/results, **20px** gap |
| Experiment comparison | Scenario selectors → KPIs/parameters → overlaid charts → analysis table |
| Learning reference | **280px** sticky table of contents + flexible instructional article, **24px** gap |
| Dashboard | KPI row → chart cards → table and explanation |

### Modeler desktop layout

```text
┌──────────────────── 232px sidebar ───────────────────┐
│                                 MAIN                 │
│ ┌────────────── 56px workspace toolbar ────────────┐ │
│ │ Model name · Undo/Redo · Validate · Run · Export  │ │
│ ├────────────────────────┬─────────────────────────┤ │
│ │                        │                         │ │
│ │  Stock-and-flow canvas │  Inspector (420px)      │ │
│ │                        │  Properties             │ │
│ │  [stocks/flows/links]  │  Equation               │ │
│ │                        │  Units                  │ │
│ │                        │  Explain / Validate     │ │
│ ├────────────────────────┴─────────────────────────┤ │
│ │ Optional collapsible results / time cursor        │ │
│ └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

The diagram must not become an unusably small thumbnail because a chart and inspector are open. Prefer switchable or resizable lower panels on desktop; preserve state when switching.

## 5.4 Breakpoints — carry over source defaults

| Viewport max | Behavior |
|---|---|
| **1100px** | Inspector narrows to **340px**; configuration/results goes one column |
| **960px** | Two-column home hero collapses |
| **900px** | Utility grids collapse; reference index above content |
| **820px** | Sidebar becomes horizontally scrollable navigation; text/group labels hidden; page padding `18px 16px 40px`; inspector below canvas |

At smallest editor breakpoint, source used canvas `minmax(320px, 1fr)` and inspector `minmax(280px, 45vh)`. Test small devices, touch and nested scrolling rather than assuming these dimensions fit every phone. Keep keyboard and screen-reader access to equation editing and validation even when graph manipulation is difficult on narrow screens.

---

# 6. Shared component recipes

## 6.1 Buttons and form inputs

| Component | Exact geometry / treatment |
|---|---|
| Default button | **34px** height, `0 12px` padding, **6px** gap and radius, 1px border, elevated fill, weight 550 |
| Small button | **28px** height, `0 8px`, 13px text |
| Icon button | Square 34px; small square 28px |
| Primary | Solid primary fill/border, `--text-on-primary` text |
| Secondary | Elevated bordered; hover `--bg-hover`, border-strong |
| Ghost | Transparent; soft hover |
| Danger | Error-colored text with standard geometry |
| Selected | Primary-soft fill, primary label, primary outline |
| Input/select | **34px** high, `0 10px`, **6px** radius, elevated fill, 1px border |
| Compact input/select | **28px** high, `0 6px`, 13px text |
| Textarea / expression editor | `8px 10px` padding, vertical resizing for textarea; dedicated monospace editor for equations |

Disabled controls: 50% opacity and an unavailable cursor; focused controls: primary border plus focus ring. Fields stack **label → control → hint** with 4px internal gap and 12px vertical separation. Responsive field grids have 10px gaps and minimum 120px columns.

Use one obvious primary action per task group. Recommended labels: **Run simulation**, **Validate model**, **Save model**, **Compare scenarios**, **Export data**, **Open lesson**. Do not use vague labels such as “Process” or “Go.”

## 6.2 Cards and list rows

- Card: `--bg-elevated`, 1px `--border`, **10px radius**, **18px padding**, small shadow.
- Title row: title plus optional utility action, **8px** gap, **12px** spacing below.
- Linked card hover: primary border + medium shadow (no bouncy zoom motion).
- Compact rows: 16px outline icon, label, optional trailing metadata/action, background hover.
- Selected rows: primary-soft and primary outline where appropriate.
- Preview cards: **140px** model/chart/diagram preview then body padded `12px 14px`.

Model previews should show *actual* topology or curves, not generic clipart. Include model type, level, estimated learning complexity (if defined), and tags without overselling scientific accuracy.

## 6.3 Tabs, chips, badges

- Tabs above thin bottom border; `9px 12px` padding, 6px icon gap, weight 550; selected uses primary + **2px** underline.
- Inspector tabs: 13px text, `10px 8px` padding, horizontally scrollable when necessary.
- Filter chips: `3px 9px`, 12px text, pill radius, 1px border; selected primary-soft + primary border.
- Badges: **20px** high, `0 7px`, 11px text, weight 650 and pill radius.
- Badges may show **Valid**, **Warning**, **Unsaved**, **Running**, **Baseline**, **Intervention**, but should never imply a scientifically validated model simply because syntax passes.

## 6.4 Validation, empty states, progress, toasts

- Callouts: `10px 12px`, 6px radius, **18px** icon, 10px text gap.
- Info callout border uses ~30% semantic color mix; warning/error/success ~35%.
- Validation row: 3px severity stripe, icon, concise title, expandable reasoning/fix.
- Clicking an issue highlights the corresponding node, connector or equation line.
- Empty state: centered, `36px 16px` padding, muted icon, short explanation + next action.
- Progress: 8px high sunken pill track with primary fill.
- Toasts: bottom right, 16px inset, 8px stack gap, `10px 14px`, 6px radius, medium shadow and 4px semantic left border; widths 260–420px.

Examples of good copy:

- **Undefined variable `DemandRate`.** This flow uses a name that does not exist. Add or rename the parameter before running.
- **Check units.** `Orders` is measured in items, but `OrderRate` needs items/day.
- **Simulation stopped at day 12.4.** A logarithm received a nonpositive input. Inspect the equation for `HiringRate`.
- **Nothing to compare yet.** Run a baseline scenario first, then create an intervention.

---

# 7. System Dynamics canvas and notation

## 7.1 Base canvas tokens — adapted from BPMN Studio

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--canvas-bg` | `#ffffff` | `#141a22` | Editor background |
| `--sd-stroke` | `#22242a` | `#d7dee8` | Physical diagram outlines |
| `--sd-fill` | `#ffffff` | `#1b232d` | Stock/auxiliary fills |
| `--sd-label` | `#22242a` | `#e6ebf1` | Node/edge labels |

These are direct semantic replacements for the source `--bpmn-stroke`, `--bpmn-fill`, `--bpmn-label`. Preserve user-assigned custom diagram colors when importing content, but ensure selected/hover states remain clear in both themes.

## 7.2 Visual notation grammar

| Element | Shape | Stroke/appearance | Labeling behavior |
|---|---|---|---|
| **Stock** | Clear rectangular level box | Neutral `--sd-stroke`; selected blue outline/ring | Name, optionally current value and unit |
| **Flow** | Physical pipe with distinct valve | Solid neutral connection; arrows show direction | Flow name and current rate/units |
| **Cloud** | Cloud-like boundary icon or standard source/sink symbol | Neutral muted stroke | Optional source/sink context |
| **Auxiliary** | Circle / small rounded converter | Neutral stroke, simple fill | Name; equation in inspector |
| **Parameter** | Circle with subtle constant indicator or distinct subtype mark | Neutral; optional small badge | Name and current scalar |
| **Information link** | Directed **orange dashed** connector | `--accent`; dashed, arrowhead; not the same as physical pipe | Optional label on inspection |
| **CLD causal influence** | Directed, optionally curved link | Neutral line with explicit `+` / `−` sign; selection primary | Polarity near target edge |
| **Loop marker** | Compact `R1`, `B1` annotated badge | Neutral/primary-soft background | Explain conceptual hypothesis in inspector |
| **Lookup** | Auxiliary with small miniature curve glyph | Neutral with optional functional glyph | Unit-aware input/output labels |
| **Annotation/group** | Text or thin outlined frame | Subtle border, subdued fill | Never compete with stock/flow elements |

### Selection, hover, and diagnostic overlays

- Selection: primary blue outline, handles and clear keyboard focus; don't recolor the domain symbol permanently.
- Hover: subtle stroke/border increase; tooltip with full name, type and unit.
- Validation error: localized error icon/edge marker and matching issue row; avoid painting an entire model red.
- Warning: small amber/yellow marker with linked explanation.
- Active playback: restrained orange/blue focus on the currently inspected level/rate; numerical values updated by solver results.
- Inactive/disabled: muted, but maintain enough contrast to identify model structure.
- Multi-selection: blue bounding indication, not broad colored fills that obscure flow direction.

### Flow semantics are not interchangeable

**Physical flow:** conveys stock accumulation or transfer. **Information link:** conveys a model dependency. **CLD causal link:** expresses qualitative influence. Their different geometry/dash/sign conventions must remain clear in grayscale, reduced contrast and screen readers. Do not allow visual decoration to imply a mathematical relation that the domain model does not contain.

## 7.3 Canvas controls

Place a compact, grouped toolbar over or immediately above the canvas:

```text
[Select] [Stock] [Flow] [Auxiliary] [Link] | [Undo] [Redo]
[Fit] [Zoom −] [100%] [Zoom +] | [Validate] [Run simulation]
```

- Use Lucide 16px outline icons with visible labels/tooltip/accessible names.
- Keep the highest-value controls near the model; move advanced layout/align into an overflow menu.
- Model title, save state and solver run state need distinct, persistent indicators.
- No auto-running entire simulations on every mouse drag or equation keystroke.
- Add keyboard alternatives to create elements and links. React Flow's pointer controls alone are not a complete accessible workflow.

## 7.4 Canvas grid, handles and viewport

- Very subtle neutral dot or line grid, optionally hidden; don't compete with information links.
- Handles sufficiently large to interact with yet visually compact; enlarge pointer target invisibly where possible.
- Typed ports should differentiate material and informational connections.
- Bezier paths are appropriate for CLD links; pipes and valve placement should keep transfer directions unambiguous.
- Zoom labels remain readable; avoid scaling labels into giant headline sizes.
- Fit-to-model should include all meaningful nodes without huge empty margins.
- Minimap mirrors the active theme and must not use unthemed white surfaces in dark mode.

## 7.5 Inspector: essential tabs and order

**Default tabs:**

1. **Properties** — element type, name, description, unit, initial value (stock) or equation (rate/auxiliary).
2. **Equation** — full expression editor, symbol browser, mathematical preview and dependency references.
3. **Explain** — what this element does, typical mistakes, mini example and conceptual relationships.
4. **Validate** — specific diagnostics; jump to related elements.

During results playback optionally add a **Values** tab showing current level/rate and a compact local time series. Avoid separate, inconsistent equation copies in `Eqs` and Properties; both must read from the same underlying model.

---

# 8. Data visualization and simulation displays

## 8.1 Chart tokens — exact BPMN Studio palette

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `#2a78d6` | `#3987e5` |
| `--chart-2` | `#eb6834` | `#d95926` |
| `--chart-3` | `#1baf7a` | `#199e70` |
| `--chart-grid` | `#e1e0d9` | `#2c2c2a` |
| `--chart-axis` | `#c3c2b7` | `#383835` |
| `--chart-muted` | `#898781` | `#898781` |
| `--chart-surface` | `#ffffff` | `#171e27` |

Source additional status-scale tokens (unchanged in both themes):

```css
--status-good: #0ca30c;
--status-warning: #fab219;
--status-serious: #ec835a;
--status-critical: #d03b3b;
```

Use these for **true severity scales** only; they are not a generic palette for simulation variables.

## 8.2 Chart composition

- Charts in bordered cards with title, short subtitle, units and legend.
- One value axis per chart by default; **do not overlay incompatible dimensions on the same axis**.
- Light grid, no distracting ticks, **11px** axis labels, 12px categorical labels.
- Lines **2px** wide; area fills ~10% opacity.
- Use step curves only for stepwise quantities or policy inputs, not smooth stock trajectories by default.
- Bars maximum **24px** thick; paired bars **18px**, 4px rounded exposed ends.
- Tooltip: matching elevated surface, 6px radius, `8px 10px`, 12px text, medium shadow.
- Keep series colors stable across charts, scenario overlays and table keys.
- Change color tokens when the theme changes; do not freeze light colors at initialization.
- Every chart has a table/data export alternative.

## 8.3 Behavior-over-time view

- X-axis label is explicit: **Time (days)** or the configured unit, not simply `t` without context.
- Y-axis states a variable name and unit, or groups variables of **compatible dimensions**.
- Scrubbing a chart synchronizes the numerical time cursor and displayed stock/flow values.
- Show current time with a subtle vertical reference line and a small tabular time label.
- Selected model element highlights its series; selecting a chart series highlights the matching model element.
- Show gaps/failure markers for nonfinite numerical results rather than connecting across invalid data.
- Optional solver settings caption: `RK4 · Δt 0.1 day · t 0–100 days`.

## 8.4 Current-level tiles and metrics

BPMN Studio KPI styling transfers unchanged:

- Grid minimum **170px** per tile, **12px** gaps.
- Tile padding `12px 14px`, radius 10px, 1px border.
- Label 12px muted → value 22px bold → context/units 11px subtle.
- Numeric tables right-aligned, `font-variant-numeric: tabular-nums`.
- Include reference/baseline values and delta only when meaningful; do not label *larger* as universally *better*.

## 8.5 Scenario comparison

Baseline and intervention should be distinguishable in print and grayscale:

- Use **color + line style** (for example, solid baseline vs. dashed intervention).
- Explicit legend labels, not "Series A" and "Series B".
- Shared axis and time domain by default; if not, warn the user clearly.
- Delta table uses neutral, up/down arrows and explanatory labels; color is conditional on whether a desired outcome is defined.
- Make parameter differences easy to inspect next to the comparison, not hidden in a modal.
- Show run provenance (model revision, method, `dt`, horizon) in a compact expandable section.

## 8.6 Simulation status and controls

A compact control strip beneath/above model and plots:

```text
[Run] [Play/Pause] [Step] [Reset] | Time 20.0 / 100 days
[────────────── time scrubber ──────────────] | Speed 1×
```

The run button triggers numeric solving. Play/pause changes inspection time. Speed changes **playback cadence only**, never integration `dt`. Provide an accessible static state when reduced motion is requested. Distinguish busy solver progress from animated playback state.

---

# 9. Equation display, numerical diagnostics and learning UI

## 9.1 Equation inspector

- Monospace expression field; compact symbol insertion and lookup.
- MathJax rendering in a dedicated preview pane on `--bg-subtle` or elevated surface.
- Under the preview show **Units**, **Dependencies**, **Initial value or formula**, and **Validation**.
- Link equation identifiers to the corresponding model elements when possible.
- Keep parser syntax and rendered math semantically equivalent; avoid cosmetic simplifications that change meaning.
- Surface function-domain errors near the exact expression.
- Numerical error diagnostics should include time, offending variable and a next troubleshooting step.

### Example inspector block

```text
FLOW · OrderRate
Equation  max(0, DesiredInventory - Inventory) / AdjustmentTime
Unit      items/day
Depends   DesiredInventory, Inventory, AdjustmentTime
Status    Valid (under declared units)

[Explain this rate]    [Show on canvas]
```

This is a layout illustration, not an assertion that the current solver supports `max` or every expression shown. Validate allowed functions against the implementation.

## 9.2 Theory and tutorials

- Reference page: sticky 280px index + readable prose; model screenshots or live mini models inside compact 1px bordered viewers.
- Mini embedded viewer height typically **260px**, tall variant **360px**, 6px radius.
- Explain one idea at a time; situate interactive controls beside example output.
- Lesson footer: **Try it**, **Check understanding**, **Continue learning** — single obvious primary action.
- Challenges display the objective, relevant constraints and current validation status without revealing the solution immediately.
- Short progressive hints and explanation of why model behavior occurs; avoid points-heavy gamification.

## 9.3 Microcopy

Prefer direct, instructional language:

- “Add a stock to represent accumulated inventory.”
- “Connect an outflow from Inventory to the cloud.”
- “Define `DemandRate` in items/day.”
- “Validate equations before running.”
- “Try a smaller time step to check numerical sensitivity.”
- “Compare the intervention with the original baseline.”

Avoid hand-waving labels such as “AI-powered precision,” “perfect simulation,” or “realistic prediction” unless a specific, justified accuracy claim exists.

---

# 10. Theme architecture and CSS starter

The source BPMN Studio uses `light`, `dark` and `system` preferences resolved to `data-theme="light"` / `data-theme="dark"` on the root. Preserve that behavior, including persistence and observation of system changes. Existing Tailwind dark-mode classes can coexist with the CSS custom properties, but **tokens must remain the visual source of truth**.

### Core CSS implementation starter

```css
:root,
:root[data-theme='light'] {
  --bg: #f4f6f9;
  --bg-elevated: #ffffff;
  --bg-subtle: #eef1f5;
  --bg-sunken: #e6eaf0;
  --bg-hover: #e9eef5;
  --border: #d6dce5;
  --border-strong: #b7c1cf;
  --text: #17202c;
  --text-muted: #4b5867;
  --text-subtle: #6b7787;
  --text-on-primary: #ffffff;
  --primary: #1f5f8b;
  --primary-hover: #184d72;
  --primary-soft: #e3eef7;
  --primary-strong: #123b59;
  --accent: #d9822b;
  --accent-soft: #fbeedd;
  --error: #c0392b;
  --error-soft: #fbe9e7;
  --warning: #b7791f;
  --warning-soft: #fdf3dc;
  --recommendation: #2b6cb0;
  --recommendation-soft: #e6f0fa;
  --info: #5a6779;
  --info-soft: #eef1f5;
  --success: #2f855a;
  --success-soft: #e3f4ea;
  --chart-1: #2a78d6;
  --chart-2: #eb6834;
  --chart-3: #1baf7a;
  --chart-grid: #e1e0d9;
  --chart-axis: #c3c2b7;
  --chart-muted: #898781;
  --chart-surface: #ffffff;
  --canvas-bg: #ffffff;
  --sd-stroke: #22242a;
  --sd-fill: #ffffff;
  --sd-label: #22242a;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow: 0 2px 8px rgba(16, 24, 40, 0.08),
            0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-lg: 0 12px 32px rgba(16, 24, 40, 0.16);
  --focus-ring: 0 0 0 3px rgba(31, 95, 139, 0.35);
  --font-sans: 'Inter', 'IBM Plex Sans', system-ui, -apple-system,
    'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace,
    SFMono-Regular, Menlo, monospace;
}

:root[data-theme='dark'] {
  --bg: #0f141b;
  --bg-elevated: #171e27;
  --bg-subtle: #1c2430;
  --bg-sunken: #121821;
  --bg-hover: #233042;
  --border: #2b3645;
  --border-strong: #3b4a5e;
  --text: #e6ebf1;
  --text-muted: #b2bdcb;
  --text-subtle: #8a97a8;
  --text-on-primary: #0b1520;
  --primary: #5aa7d8;
  --primary-hover: #7ab9e3;
  --primary-soft: #16314a;
  --primary-strong: #a8d3ef;
  --accent: #f0a457;
  --accent-soft: #3a2a17;
  --error: #f2776a;
  --error-soft: #3b1d1a;
  --warning: #e8b45a;
  --warning-soft: #3a2d14;
  --recommendation: #79b2ec;
  --recommendation-soft: #172a40;
  --info: #a3afbf;
  --info-soft: #1f2833;
  --success: #6fcf97;
  --success-soft: #16301f;
  --chart-1: #3987e5;
  --chart-2: #d95926;
  --chart-3: #199e70;
  --chart-grid: #2c2c2a;
  --chart-axis: #383835;
  --chart-muted: #898781;
  --chart-surface: #171e27;
  --canvas-bg: #141a22;
  --sd-stroke: #d7dee8;
  --sd-fill: #1b232d;
  --sd-label: #e6ebf1;
  --shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.6);
  --focus-ring: 0 0 0 3px rgba(90, 167, 216, 0.45);
}

:root {
  --status-good: #0ca30c;
  --status-warning: #fab219;
  --status-serious: #ec835a;
  --status-critical: #d03b3b;
}

body {
  background: var(--bg);
  color: var(--text);
  font: 400 14px / 1.5 var(--font-sans);
}

/* All interactive elements use visible focus. */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: var(--focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Integration guidance:** Insert semantic CSS token definitions into the **existing** stylesheet/theme entry point. If Tailwind generates a conflicting reset or theme mode, reconcile it rather than creating parallel, inconsistent light/dark systems. For Tailwind v4, follow its recommended stylesheet order for React Flow CSS; see https://reactflow.dev/learn . Do not blindly overwrite existing global CSS.

### React Flow adapter responsibilities

- Theme custom nodes, connections, handles, minimap, controls, backgrounds and floating menus using semantic tokens.
- Use `var(--sd-stroke)`/`var(--sd-fill)` for diagram defaults, `var(--accent)` for informational edges and `var(--primary)` for selection.
- Handle inline SVG marker colors and custom edge strokes when theme changes.
- Preserve custom node colors where explicitly authored; use selection rings and icon markers for error/success instead of altering user-specified fills.
- Ensure connection preview lines are visually distinct by type, and invalid links show a message rather than appearing to snap successfully.

---

# 11. Icons, product mark and illustration

- Use **Lucide** outline icons: **16px** in buttons, **18px** navigation/callouts, **13–14px** for metadata.
- Product mark: **30px** primary-colored square, **8px** radius, containing **20px** single-color domain symbol.
- Wordmark: **15px**; supporting line **11px**.
- Recommended mark: a small **stock rectangle with one inflow and one outflow / simple feedback arc** — easily legible at 20px and not borrowed from BPMN glyphs.
- Avoid embedding full diagram notation inside tiny nav icons. Use general Lucide icons in navigation; reserve stocks/valves/CLD symbols for the modeler palette.
- Example thumbnails should be generated from real sample models and trace plots, not irrelevant stock photography.

---

# 12. Motion, interaction and accessibility

## 12.1 Motion tokens — inherited timings

| Interaction | Duration |
|---|---|
| Button hover background/border | **120ms** |
| Linked card border/shadow | **120ms** |
| Toast entrance | **180ms** ease-out, subtle 8px upward movement |
| Progress fill | **250ms** |
| Loading spinner | **1s** linear repeat |

Simulation playback is different: its speed is user-controlled and must reflect the actual trace/time cursor. Avoid purely decorative movement that could suggest a flow is executing faster than the numerical model indicates. Support paused and reduced-motion display of exact values.

## 12.2 Accessibility behaviors

The transferred BPMN theme includes visible focus, skip-to-content, semantic nav, labeled dialogs/progress, focus restoration, Escape-to-close and tab state attributes. Improve the remaining gaps in System Dynamics Studio:

- **Trap focus in modal dialogs** and restore prior focus when closed.
- Support **arrow-key navigation** in tabs, where the tab pattern applies.
- Every icon-only control has accessible name and tooltip, especially when responsive mode hides labels.
- Provide alternate keyboard interactions for adding/editing a model element and connection.
- Use text, symbols and patterns as well as color for stock/flow/link and error states.
- Ensure chart trends can be inspected via accessible data tables.
- Use `aria-live` sparingly for solver status; avoid overwhelming narration during playback.
- Support reduced motion and zoom/reflow; validate text contrast on both themes.
- Manage tooltip and inspector scrolling with keyboard and screen readers.

## 12.3 Layering

Preserve source z-index convention as a guideline:

| Layer | z-index |
|---|---|
| Watermark | 10 |
| Canvas controls | 15 |
| Canvas overlay | 20 |
| Menus/popovers | 30 |
| Dialogs | 50 |
| Toasts | 60 |
| Skip link | 100 |

Use a coherent portal/root strategy to avoid React Flow SVG and inspector popovers escaping the layer order.

---

# 13. Applying the style to existing code

## 13.1 Migration order

1. **Audit current React/Tailwind styling**, screenshots and actual theme implementation.
2. Create a **central token stylesheet** and light/dark resolver with BPMN Studio values (Section 2 and 10).
3. Apply the shared **sidebar + toolbar + base card/button/input/tab** geometry.
4. Style the **stock-flow canvas**, all custom React Flow nodes/edges and properties inspector.
5. Align **MathJax equation views, simulation toolbar and validation** with compact recipes.
6. Theme **Recharts** axes/grid/tooltip/series and synchronize diagram/chart selections.
7. Apply the same system to **model library, theory, lessons, challenges and experiments**.
8. Test hover/selected/focused/disabled/loading/empty/error/success states in both themes and responsive modes.
9. Remove redundant Tailwind arbitrary colors and unthemed inline SVG styles; retain necessary domain shapes.
10. Perform side-by-side visual comparisons against BPMN Studio references while respecting SD notation.

## 13.2 File ownership suggestion

```text
src/styles/tokens.css         # palette, typography, shape, shadows
src/styles/global.css         # reset, shell and shared components
src/styles/modeler.css        # SFD/CLD nodes, edges, handles, overlays
src/styles/features.css       # theory, lessons, dashboards, scenarios
src/app/theme.tsx             # theme preference and resolution
src/components/ui/*          # buttons, fields, tabs, dialog, callout, toast
src/features/modeler/*       # React Flow adapter and custom notation
src/features/analytics/*     # Recharts chart theme and tooltips
```

These paths are *suggested targets*. Reuse equivalent existing files and avoid unnecessary refactors.

## 13.3 Design acceptance checklist

### Palette and shell

- [ ] Values match the supplied BPMN Studio colors in light and dark mode.
- [ ] Sidebar width 232/64px and toolbar height 56px on desktop.
- [ ] Text/body scale and surface hierarchy match source density.
- [ ] Primary buttons use blue, not orange or gradient.

### Modeler

- [ ] Stocks, flows, clouds and auxiliaries are instantly distinguishable without color.
- [ ] Orange dashed information links are visibly different from physical transfers.
- [ ] Handles, connector previews, selection, errors and overlays match both themes.
- [ ] The inspector uses consistent fields, equation typography, units and explanations.
- [ ] Canvas remains the dominant work surface; no clipped panels or ghost scrolling.

### Simulation and analytics

- [ ] Run controls, time cursor and charts share one underlying simulation state.
- [ ] Every chart shows variables, units, time axis, legend and sensible tooltips.
- [ ] Comparison lines retain consistent series meaning and use pattern + color.
- [ ] Numeric columns align right and use tabular numerals.

### Learning and quality

- [ ] Theory and exercises use the same compact components, not a second design system.
- [ ] Errors explain cause and correction next to relevant editor items.
- [ ] Dialog focus trap, keyboard navigation, screen-reader labels and reduced motion work.
- [ ] UI tested at desktop widths, 1100/960/900/820px breakpoints and smallest target screen.
- [ ] No fake active controls or premature success/validity claims.

---

# 14. Agent implementation brief

> **Implement the System Dynamics Studio interface using the *exact* BPMN Studio visual language supplied here.** Keep the restrained blue-gray palette, sparse orange accent, neutral elevated cards, thin borders, 14px body text, 6px controls, 10px cards, 232px sidebar, 56px toolbar, compact inspectors and readable Recharts styling in light/dark themes.
>
> Preserve the existing React Flow, Zustand, Tailwind, math.js, MathJax and Recharts product stack where functional. The central work surface is a stock-and-flow diagram, not BPMN. Use standard SD notation: stock rectangles, pipes/valves, sources/sinks, auxiliary circles, orange dashed information links, and explicitly signed qualitative CLD links.
>
> Implement consistent shared buttons, inputs, cards, tabs, badges, validation rows, dialogs, tooltips, tables and charts, plus responsive breakpoints and accessible keyboard interactions. The diagram editor must take visual priority; the equation/units inspector must remain usable. Design time controls must represent actual numerical simulation playback, not decorative animation.
>
> Read `PLAN.md` for functionality, mathematical semantics, state contracts, and phase acceptance tests. Make visual changes incrementally, verify light/dark on every embedded surface, and **do not redesign away** the original BPMN Studio density, color roles or UX principles.

---

## Source alignment

**Source-provided:** `STYLE(2).md` is the authority for design tokens, font scale, spacing, shell geometry, shared component recipes, charts and existing theme behavior. `PLAN(3).md` is the authority for BPMN Studio's teaching/validation/workspace patterns. The supplied `README.md` is the authority for existing System Dynamics Studio canvas primitives, orange information arrows, React Flow/Zustand/Tailwind/MathJax/Recharts and current user-facing modules.

**System Dynamics-specific adaptations introduced here:** notation grammar, stock/flow/cloud/CLD colors and ports, equation/unit inspector, solver playback, behavioral graphs, scenario comparison and learning language. These are **recommended implementation targets**, not claims of existing completeness.

**Final design statement:** Build a compact, analytical, professional **System Dynamics Studio** that visually belongs to the same family as BPMN Studio, while retaining the precise notation and learning interactions appropriate to **stock-and-flow simulation**.
