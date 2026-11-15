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
  {
    key: 'BATHTUB',
    model: EX.BATHTUB,
    level: 'Foundations',
    concepts: ['Stock', 'Balancing loop', 'Equilibrium'],
    behavior: 'The water level rises and levels off at inflow_rate × drain_time = 60 liters, where drain equals faucet.',
    prompts: [
      'Double drain_time. Where does the level settle now, and how long does it take?',
      'Start the tub at 100 liters. Predict the curve before running.',
    ],
    limitations: 'The drain is proportional to the water level; a real tub can overflow and cannot hold negative water.',
  },
  {
    key: 'COFFEE_COOLING',
    model: EX.COFFEE_COOLING,
    level: 'Foundations',
    concepts: ['Goal seeking', 'Time constant', 'Exponential decay'],
    behavior: 'The temperature approaches room temperature exponentially; the gap halves roughly every 7 minutes.',
    prompts: [
      'After one time constant (10 minutes), what fraction of the gap remains?',
      'Run with Euler at dt = 5. How far off is the result?',
    ],
    limitations: 'The room temperature is constant and the cup is perfectly mixed.',
  },
  {
    key: 'SAVINGS_ACCOUNT',
    model: EX.SAVINGS_ACCOUNT,
    level: 'Feedback',
    concepts: ['Reinforcing loop', 'Exponential growth', 'Doubling time'],
    behavior: 'Interest grows with the balance, so the balance grows faster and faster; withdrawals slow it slightly.',
    prompts: [
      'At which withdrawal does the balance stay constant?',
      'Estimate the doubling time with the rule of 70 and check it in the table.',
    ],
    limitations: 'Continuous compounding, a constant interest rate, no inflation or taxes.',
  },
  {
    key: 'CUSTOMER_BASE',
    model: EX.CUSTOMER_BASE,
    level: 'Feedback',
    concepts: ['Reinforcing loop', 'Balancing loop', 'Loop dominance'],
    behavior: 'Customers approach 100 / (0.05 − 0.02) ≈ 3,333, because churn (balancing) outweighs referrals (reinforcing).',
    prompts: [
      'Raise referral_rate above churn_fraction. What changes qualitatively?',
      'Which parameter moves the equilibrium most? Use the Sensitivity tool.',
    ],
    limitations: 'No market saturation: with referrals stronger than churn, customers would grow without limit.',
  },
  {
    key: 'PROJECT_BACKLOG',
    model: EX.PROJECT_BACKLOG,
    level: 'Quantitative models',
    concepts: ['Capacity', 'Bottleneck', 'Nonlinearity (min)'],
    behavior: 'With capacity 10 tasks/week against 8 arriving, the backlog shrinks by about 2 tasks per week until the work-through time limits completion.',
    prompts: [
      'Set staff to 3. What happens to the backlog, and why?',
      'How many weeks until the backlog reaches its working level?',
    ],
    limitations: 'All tasks are identical; productivity does not change with pressure or fatigue.',
  },
  {
    key: 'HIRING_PIPELINE',
    model: EX.HIRING_PIPELINE,
    level: 'Quantitative models',
    concepts: ['Aging chain', 'Delay', 'Goal seeking'],
    behavior: 'Hiring jumps to close the workforce gap; trainees peak after a few months and experienced staff catch up only after the training delay.',
    prompts: [
      'Lengthen training_time to 12 months. When does the experienced workforce reach 150?',
      'Why does hiring include quits as well as the gap?',
    ],
    limitations: 'Hiring cannot be negative (no layoffs); trainees never quit.',
  },
  {
    key: 'SUPPLY_CHAIN_DELAY',
    model: EX.SUPPLY_CHAIN_DELAY,
    level: 'Complex behavior',
    concepts: ['Delay', 'Oscillation', 'Supply line', 'Bullwhip'],
    behavior: 'Ignoring the supply line (weight 0) makes orders overshoot: inventory overshoots its target and oscillates before settling.',
    prompts: [
      'Set supply_line_weight to 1. What happens to the overshoot?',
      'Make delivery_delay longer. Is the oscillation stronger or weaker?',
    ],
    limitations: 'Single echelon, constant demand, delivery delay modelled as a first-order (exponential) delay.',
  },
  {
    key: 'FISHERY',
    model: EX.FISHERY,
    level: 'Complex behavior',
    concepts: ['Overshoot and collapse', 'Renewable resource', 'Policy design'],
    behavior: 'The fleet grows on early catches, harvest overshoots the maximum sustainable yield (125 tons/year) and the fish stock collapses before the fleet shrinks.',
    prompts: [
      'What is the highest harvest the fish can sustain? Where is it reached?',
      'Which policy keeps the fishery productive: fewer boats, shorter boat life, or lower reinvestment?',
    ],
    limitations: 'Fish price and costs are constant, and the fleet responds only to the catch.',
  },
];

export const findExample = (key) => EXAMPLE_LIBRARY.find((e) => e.key === key);
