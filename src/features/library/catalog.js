/**
 * Teaching metadata for the seven README examples (PLAN.md Module H).
 * The model content itself lives unchanged in src/examples.js.
 */
import * as EX from '../../examples.js';

export const EXAMPLE_LIBRARY = [
  {
    key: 'POPULATION_EXTENDED',
    model: EX.POPULATION_EXTENDED,
    level: 'Foundations',
    concepts: ['Inflow', 'Outflow', 'Exponential growth'],
    behavior: 'Exponential growth or decline: the net rate is a fixed fraction of the stock.',
    prompts: [
      'Which combination of rates makes the population constant?',
      'Double the birth rate. Does the stock double, or does its growth rate change?',
    ],
    limitations: 'All four rates are constant fractions; there is no age structure or carrying capacity.',
  },
  {
    key: 'PREDATOR_PREY',
    model: EX.PREDATOR_PREY,
    level: 'Complex behavior',
    concepts: ['Coupled stocks', 'Nonlinearity', 'Oscillation'],
    behavior: 'Endogenous oscillation: predator peaks lag prey peaks.',
    prompts: [
      'Which population peaks first, and why?',
      'Run with Euler at dt = 0.5 and compare with RK4. What happens to the cycle amplitude?',
    ],
    limitations: 'Classic Lotka–Volterra: no prey self-limitation, so cycle amplitude depends on initial conditions.',
  },
  {
    key: 'SIR_MODEL',
    model: EX.SIR_MODEL,
    level: 'Complex behavior',
    concepts: ['Conservation', 'Nonlinear contact', 'Infection peak'],
    behavior: 'Infected rises to a single peak, then falls as susceptibles are depleted. S + I + R stays constant.',
    prompts: [
      'Lower infection_probability. Does the peak get lower, later, or both?',
      'Check that S + I + R stays at 1000 in the data table.',
    ],
    limitations: 'Closed population (no births, deaths or waning immunity); homogeneous mixing.',
  },
  {
    key: 'ADOPTION_MODEL',
    model: EX.ADOPTION_MODEL,
    level: 'Feedback',
    concepts: ['Reinforcing loop', 'Balancing loop', 'S-curve'],
    behavior: 'S-shaped growth of adopters; the adoption rate rises then falls as the market saturates.',
    prompts: [
      'Set ads_effectiveness to 0. Why does nothing happen?',
      'Which parameter moves the timing of the adoption peak most?',
    ],
    limitations: 'Single product, fixed market size, no discarding or repeat purchase.',
  },
  {
    key: 'CARRYING_CAPACITY',
    model: EX.CARRYING_CAPACITY,
    level: 'Quantitative models',
    concepts: ['Balancing feedback', 'Limits to growth', 'Equilibrium'],
    behavior: 'Logistic growth: near-exponential at first, then levelling off at the carrying capacity.',
    prompts: [
      'Start the population above Carrying_Capacity. What happens?',
      'Compare the curve with the closed-form logistic solution.',
    ],
    limitations: 'Capacity is a constant parameter (not a stock); no delays, so no overshoot.',
  },
  {
    key: 'INVENTORY_CONTROL',
    model: EX.INVENTORY_CONTROL,
    level: 'Foundations',
    concepts: ['Goal seeking', 'Adjustment time', 'Units'],
    behavior: 'Inventory approaches the target exponentially; the gap closes by a fixed fraction per unit of time.',
    prompts: [
      'Halve Adjustment_Time. Is the approach faster? Is there any overshoot?',
      'Save a baseline, raise Customer_Demand to 150 and compare. Does inventory still reach its target?',
    ],
    limitations: 'No delivery delay, so this structure cannot oscillate. Production may become negative if inventory far exceeds the target.',
  },
  {
    key: 'WORLD3_MODEL',
    model: EX.WORLD3_MODEL,
    level: 'Complex behavior',
    concepts: ['Overshoot and collapse', 'Interconnected sectors', 'Policy experiments'],
    behavior: 'Growth in capital and population, followed by decline as resources deplete and pollution rises.',
    prompts: [
      'Which stock peaks first? Which feedback explains the turn?',
      'Change the pollution absorption fraction. Does the collapse disappear, or only shift?',
    ],
    limitations:
      'A four-stock teaching sketch inspired by the structure of World3 (Meadows et al., 1972). It is not the calibrated World3 model and does not reproduce its published scenarios.',
  },
];

export const findExample = (key) => EXAMPLE_LIBRARY.find((e) => e.key === key);
