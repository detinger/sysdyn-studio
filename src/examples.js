export const POPULATION_EXTENDED = {
  name: 'Population Dynamics (Extended)',
  description: 'A fundamental population model exploring the four drivers of change: Births, Deaths, Immigration, and Exodus. This model illustrates how even simple linear rates can create complex growth or decline patterns when multiple inflows and outflows interact.',
  maxTime: 100,
  visibleVariables: ['Population', 'Exodus', 'Immigration', 'Births', 'Deaths'],
  colors: {
    'Population': '#3b82f6'
  },
  nodes: [
    { id: 'pop', type: 'stock', position: { x: 350, y: 250 }, data: { label: 'Population', value: 1000 } },

    // Flows
    { id: 'immigration', type: 'flow', position: { x: 0, y: 50 }, data: { label: 'Immigration', equation: 'Population * immigration_rate' } },
    { id: 'births', type: 'flow', position: { x: 0, y: 500 }, data: { label: 'Births', equation: 'Population * birth_rate' } },
    { id: 'deaths', type: 'flow', position: { x: 850, y: 450 }, data: { label: 'Deaths', equation: 'Population * death_rate' } },
    { id: 'exodus', type: 'flow', position: { x: 800, y: 750 }, data: { label: 'Exodus', equation: 'Population * exodus_fraction' } },

    // Variables
    { id: 'v_br', type: 'variable', position: { x: -250, y: 250 }, data: { label: 'birth_rate', value: '0.03' } },
    { id: 'v_ir', type: 'variable', position: { x: -250, y: -150 }, data: { label: 'immigration_rate', value: '0.08' } },
    { id: 'v_dr', type: 'variable', position: { x: 600, y: 100 }, data: { label: 'death_rate', value: '0.04' } },
    { id: 'v_ef', type: 'variable', position: { x: 400, y: 580 }, data: { label: 'exodus_fraction', value: '0.06' } }
  ],
  edges: [
    // Physical Flows
    { id: 'e1', source: 'immigration', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'births', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e3', source: 'pop', sourceHandle: 'outflow', target: 'deaths', animated: true },
    { id: 'e4', source: 'pop', sourceHandle: 'outflow', target: 'exodus', animated: true },

    // Info Links
    { id: 'i1', source: 'v_ir', target: 'immigration', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i2', source: 'v_br', target: 'births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i3', source: 'pop', target: 'births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i4', source: 'pop', target: 'deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i5', source: 'v_dr', target: 'deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i6', source: 'pop', target: 'exodus', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i7', source: 'v_ef', target: 'exodus', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

export const PREDATOR_PREY = {
  name: 'Predator-Prey (Lotka-Volterra)',
  description: 'This is a classic model of population dynamics between two species: a predator (e.g., foxes) and a prey (e.g., rabbits). It illustrates how biological systems create natural oscillations. As the prey population grows, predators have more food and their population increases. However, more predators eventually over-consume the prey, leading to a predator die-off, which then allows the prey population to recover, starting the cycle anew.',
  maxTime: 500,
  visibleVariables: ['Prey', 'Predators'],
  colors: {
    'Prey': '#10b981',      // Green
    'Predators': '#ef4444'   // Red
  },
  nodes: [
    { id: 'prey', type: 'stock', position: { x: -150, y: 100 }, data: { label: 'Prey', value: 100 } },
    { id: 'predators', type: 'stock', position: { x: 300, y: 100 }, data: { label: 'Predators', value: 20 } },
    { id: 'prey_births', type: 'flow', position: { x: -520, y: 480 }, data: { label: 'prey_births', equation: 'Prey * prey_birth_rate' } },
    { id: 'prey_deaths', type: 'flow', position: { x: 400, y: 680 }, data: { label: 'prey_deaths', equation: 'Prey * Predators * predation_rate' } },
    { id: 'predator_births', type: 'flow', position: { x: -200, y: 670 }, data: { label: 'predator_births', equation: 'Prey * Predators * predator_birth_rate' } },
    { id: 'predator_deaths', type: 'flow', position: { x: 680, y: 480 }, data: { label: 'predator_deaths', equation: 'Predators * predator_death_rate' } },

    { id: 'v_pbr', type: 'variable', position: { x: -400, y: -150 }, data: { label: 'prey_birth_rate', value: '0.05' } },
    { id: 'v_pred_br', type: 'variable', position: { x: -80, y: -150 }, data: { label: 'predator_birth_rate', value: '0.0002' } },
    { id: 'v_pdr', type: 'variable', position: { x: 230, y: -150 }, data: { label: 'predator_death_rate', value: '0.03' } },
    { id: 'v_pr', type: 'variable', position: { x: 540, y: -150 }, data: { label: 'predation_rate', value: '0.001' } }
  ],
  edges: [
    { id: 'e1', source: 'prey_births', target: 'prey', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'prey', sourceHandle: 'outflow', target: 'prey_deaths', animated: true },
    { id: 'e3', source: 'predator_births', target: 'predators', targetHandle: 'inflow', animated: true },
    { id: 'e4', source: 'predators', sourceHandle: 'outflow', target: 'predator_deaths', animated: true },

    { id: 'e5', source: 'prey', target: 'prey_births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e6', source: 'prey', target: 'prey_deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e7', source: 'predators', target: 'prey_deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e8', source: 'prey', target: 'predator_births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e9', source: 'predators', target: 'predator_births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e10', source: 'predators', target: 'predator_deaths', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

export const SIR_MODEL = {
  name: 'SIR Epidemic Model',
  description: 'The SIR model is one of the most famous compartmental models in epidemiology. It divides a population into three groups: Susceptible (can catch the disease), Infected (have the disease and can spread it), and Recovered (cannot catch it again). This model helps scientists predict how fast an outbreak will spread, what the peak number of infections will be, and how "herd immunity" eventually stops the transmission.',
  maxTime: 120,
  visibleVariables: ['Susceptible', 'Infected', 'Recovered'],
  colors: {
    'Susceptible': '#3b82f6', // Blue
    'Infected': '#ef4444',    // Red
    'Recovered': '#10b981'    // Green
  },
  nodes: [
    { id: 'susceptible', type: 'stock', position: { x: -350, y: 50 }, data: { label: 'Susceptible', value: 990 } },
    { id: 'infected', type: 'stock', position: { x: 400, y: 50 }, data: { label: 'Infected', value: 10 } },
    { id: 'recovered', type: 'stock', position: { x: 1200, y: 50 }, data: { label: 'Recovered', value: 0 } },

    { id: 'infection_rate', type: 'flow', position: { x: 25, y: 350 }, data: { label: 'infection_rate', equation: 'Susceptible * Infected * infection_probability / total_pop' } },
    { id: 'recovery_rate', type: 'flow', position: { x: 775, y: 350 }, data: { label: 'recovery_rate', equation: 'Infected / recovery_delay' } },

    { id: 'v_tp', type: 'variable', position: { x: 25, y: 700 }, data: { label: 'total_pop', value: '1000' } },
    { id: 'v_ip', type: 'variable', position: { x: 400, y: 700 }, data: { label: 'infection_probability', value: '0.4' } },
    { id: 'v_rd', type: 'variable', position: { x: 775, y: 700 }, data: { label: 'recovery_delay', value: '10' } }
  ],
  edges: [
    { id: 'e1', source: 'susceptible', sourceHandle: 'outflow', target: 'infection_rate', animated: true },
    { id: 'e2', source: 'infection_rate', target: 'infected', targetHandle: 'inflow', animated: true },
    { id: 'e3', source: 'infected', sourceHandle: 'outflow', target: 'recovery_rate', animated: true },
    { id: 'e4', source: 'recovery_rate', target: 'recovered', targetHandle: 'inflow', animated: true },

    { id: 'e5', source: 'susceptible', target: 'infection_rate', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e6', source: 'infected', target: 'infection_rate', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e7', source: 'infected', target: 'recovery_rate', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

export const ADOPTION_MODEL = {
  name: 'Innovation Adoption (Bass Model)',
  description: 'This model explains how new products or ideas spread through a population. It identifies two main drivers: Innovation (people adopting because of advertising) and Imitation (people adopting because they see others using it). The famous "S-Curve" of adoption is generated by this dynamic, starting slowly and then accelerating rapidly as the "word of mouth" feedback loop takes over.',
  maxTime: 10,
  visibleVariables: ['adopters', 'adoption_rate', 'potential_adopters'],
  colors: {
    'adopters': '#3b82f6',         // Blue
    'adoption_rate': '#ef4444',    // Red
    'potential_adopters': '#10b981' // Green
  },
  nodes: [
    { id: 'pot_adopters', type: 'stock', position: { x: -150, y: 800 }, data: { label: 'potential_adopters', value: 10000 } },
    { id: 'adopters', type: 'stock', position: { x: 900, y: 800 }, data: { label: 'adopters', value: 0 } },

    { id: 'adoption_rate', type: 'flow', position: { x: 375, y: 650 }, data: { label: 'adoption_rate', equation: 'sales_from_ads + word_of_mouth' } },

    { id: 'wom', type: 'variable', position: { x: -100, y: 250 }, data: { label: 'word_of_mouth', equation: 'potential_adopters * (adopters / total_population) * contact_rate * adoption_fraction' } },
    { id: 'sales_ads', type: 'variable', position: { x: -100, y: 400 }, data: { label: 'sales_from_ads', equation: 'potential_adopters * ads_effectiveness' } },

    { id: 'v_tp', type: 'variable', position: { x: 600, y: 150 }, data: { label: 'total_population', value: '10000' } },
    { id: 'v_af', type: 'variable', position: { x: 900, y: 150 }, data: { label: 'adoption_fraction', value: '0.015' } },
    { id: 'v_ae', type: 'variable', position: { x: 600, y: 300 }, data: { label: 'ads_effectiveness', value: '0.015' } },
    { id: 'v_cr', type: 'variable', position: { x: 900, y: 300 }, data: { label: 'contact_rate', value: '100' } }
  ],
  edges: [
    { id: 'e1', source: 'pot_adopters', sourceHandle: 'outflow', target: 'adoption_rate', animated: true },
    { id: 'e2', source: 'adoption_rate', target: 'adopters', targetHandle: 'inflow', animated: true },

    { id: 'e3', source: 'sales_ads', target: 'adoption_rate', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e4', source: 'wom', target: 'adoption_rate', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e5', source: 'pot_adopters', target: 'sales_ads', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e6', source: 'pot_adopters', target: 'wom', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e7', source: 'adopters', target: 'wom', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

export const CARRYING_CAPACITY = {
  name: 'Carrying Capacity (Logistic Growth)',
  description: 'This model represents the limit to growth for a population in a constrained environment. Unlike exponential growth, which continues forever, logistic growth slows down as resources become scarce. The "Carrying Capacity" is the maximum population size that the environment can sustainably support. It illustrates a critical balancing feedback loop that keeps biological systems in check.',
  maxTime: 100,
  visibleVariables: ['Population', 'Carrying_Capacity'],
  colors: {
    'Population': '#3b82f6', // Blue
    'Carrying_Capacity': '#ef4444' // Red
  },
  nodes: [
    { id: 'pop', type: 'stock', position: { x: 800, y: 450 }, data: { label: 'Population', value: 10 } },
    { id: 'net_growth', type: 'flow', position: { x: 350, y: 750 }, data: { label: 'Net_Growth', equation: 'Population * Growth_Rate * (1 - (Population / Carrying_Capacity))' } },
    { id: 'v_gr', type: 'variable', position: { x: 0, y: 300 }, data: { label: 'Growth_Rate', value: '0.1' } },
    { id: 'v_cc', type: 'variable', position: { x: 0, y: 500 }, data: { label: 'Carrying_Capacity', value: '1000' } }
  ],
  edges: [
    { id: 'e1', source: 'net_growth', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'pop', target: 'net_growth', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e3', source: 'v_gr', target: 'net_growth', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e4', source: 'v_cc', target: 'net_growth', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

export const INVENTORY_CONTROL = {
  name: 'Inventory Control System',
  description: 'A fundamental supply chain model that shows how a business manages stock levels. It uses balancing feedback to correct discrepancies between actual inventory and a target level. If inventory is low, production increases; if it is high, production slows. This model helps explain "oscillations" and "overshoot" in supply chains, especially when there are delays in the system.',
  maxTime: 50,
  timeUnit: 'week',
  visibleVariables: ['Inventory', 'Production', 'Customer_Demand'],
  colors: {
    'Inventory': '#3b82f6', // Blue
    'Production': '#10b981', // Green
    'Customer_Demand': '#ef4444' // Red
  },
  nodes: [
    { id: 'inv', type: 'stock', position: { x: 700, y: 500 }, data: { label: 'Inventory', value: 200, unit: 'units' } },
    { id: 'prod', type: 'flow', position: { x: 250, y: 750 }, data: { label: 'Production', equation: 'Customer_Demand + (Target_Inventory - Inventory) / Adjustment_Time', unit: 'units/week' } },
    { id: 'sales', type: 'flow', position: { x: 1200, y: 750 }, data: { label: 'Sales', equation: 'Customer_Demand', unit: 'units/week' } },

    { id: 'v_ti', type: 'variable', position: { x: -150, y: 350 }, data: { label: 'Target_Inventory', value: '500', unit: 'units' } },
    { id: 'v_at', type: 'variable', position: { x: -150, y: 500 }, data: { label: 'Adjustment_Time', value: '5', unit: 'week' } },
    { id: 'v_cd', type: 'variable', position: { x: -150, y: 200 }, data: { label: 'Customer_Demand', value: '100', unit: 'units/week' } }
  ],
  edges: [
    { id: 'e1', source: 'prod', target: 'inv', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'inv', sourceHandle: 'outflow', target: 'sales', animated: true },

    { id: 'e3', source: 'v_cd', target: 'prod', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e4', source: 'v_cd', target: 'sales', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e5', source: 'inv', target: 'prod', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e6', source: 'v_ti', target: 'prod', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'e7', source: 'v_at', target: 'prod', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

export const WORLD3_MODEL = {
  name: 'World3 (Limits to Growth)',
  description: 'The World3 model was created for the Club of Rome to study the long-term consequences of growth in a finite world. It demonstrates "overshoot and collapse": as population and industry grow, they consume non-renewable resources and generate pollution. Eventually, resource scarcity and environmental degradation cause a decline in industrial output, leading to a collapse in population. It remains a foundational model for sustainability science.',
  maxTime: 200,
  visibleVariables: ['Population', 'Industrial_Capital', 'Resources', 'Pollution'],
  colors: {
    'Population': '#3b82f6', // Blue
    'Industrial_Capital': '#f59e0b', // Amber
    'Resources': '#10b981',  // Green
    'Pollution': '#ef4444'   // Red
  },
  nodes: [
    // Stocks
    { id: 'pop', type: 'stock', position: { x: 300, y: 1100 }, data: { label: 'Population', value: 100 } },
    { id: 'cap', type: 'stock', position: { x: 300, y: 650 }, data: { label: 'Industrial_Capital', value: 100 } },
    { id: 'res', type: 'stock', position: { x: 900, y: 300 }, data: { label: 'Resources', value: 100 } },
    { id: 'pol', type: 'stock', position: { x: 1050, y: 650 }, data: { label: 'Pollution', value: 10 } },

    // Population Flows
    { id: 'births', type: 'flow', position: { x: -250, y: 900 }, data: { label: 'Births', equation: 'Population * 0.04' } },
    { id: 'deaths', type: 'flow', position: { x: 750, y: 1200 }, data: { label: 'Deaths', equation: 'Population * (0.01 + Pollution * 0.0001 + 0.05 / (Ind_Cap_Per_Capita + 0.1))' } },

    // Capital Flows
    { id: 'investment', type: 'flow', position: { x: -100, y: 450 }, data: { label: 'Investment', equation: 'Ind_Output * 0.1' } },
    { id: 'depreciation', type: 'flow', position: { x: 700, y: 750 }, data: { label: 'Depreciation', equation: 'Industrial_Capital * 0.05' } },

    // Resource & Pollution Flows
    { id: 'res_usage', type: 'flow', position: { x: 1450, y: 450 }, data: { label: 'Resource_Usage', equation: 'Ind_Output * 0.01' } },
    { id: 'pol_gen', type: 'flow', position: { x: 600, y: 450 }, data: { label: 'Pollution_Gen', equation: 'Ind_Output * 0.05' } },
    { id: 'pol_abs', type: 'flow', position: { x: 1450, y: 950 }, data: { label: 'Pollution_Abs', equation: 'Pollution * 0.1' } },

    // Variables
    { id: 'ind_out', type: 'variable', position: { x: -450, y: 0 }, data: { label: 'Ind_Output', equation: 'Industrial_Capital * (Resources / 100)' } },
    { id: 'ic_pc', type: 'variable', position: { x: 300, y: 900 }, data: { label: 'Ind_Cap_Per_Capita', equation: 'Industrial_Capital / Population' } }
  ],
  edges: [
    // Physical Flows
    { id: 'e1', source: 'births', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'pop', sourceHandle: 'outflow', target: 'deaths', animated: true },

    { id: 'e3', source: 'investment', target: 'cap', targetHandle: 'inflow', animated: true },
    { id: 'e4', source: 'cap', sourceHandle: 'outflow', target: 'depreciation', animated: true },

    { id: 'e5', source: 'res', sourceHandle: 'outflow', target: 'res_usage', animated: true },

    { id: 'e6', source: 'pol_gen', target: 'pol', targetHandle: 'inflow', animated: true },
    { id: 'e7', source: 'pol', sourceHandle: 'outflow', target: 'pol_abs', animated: true },

    // Info Links -> Variables
    { id: 'i1', source: 'cap', target: 'ind_out', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i2', source: 'res', target: 'ind_out', targetHandle: 'info', animated: true, className: 'info-edge' },

    { id: 'i3', source: 'cap', target: 'ic_pc', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i4', source: 'pop', target: 'ic_pc', targetHandle: 'info', animated: true, className: 'info-edge' },

    // Info Links -> Flows
    { id: 'i5', source: 'ind_out', target: 'investment', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i6', source: 'ind_out', target: 'res_usage', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i7', source: 'ind_out', target: 'pol_gen', targetHandle: 'info', animated: true, className: 'info-edge' },

    { id: 'i8', source: 'pol', target: 'deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i9', source: 'ic_pc', target: 'deaths', targetHandle: 'info', animated: true, className: 'info-edge' }
  ]
};

// ---------------------------------------------------------------------------
// Additional teaching models (units declared; no time functions, so the
// legacy engine can still serve as a characterization reference).
// ---------------------------------------------------------------------------

export const BATHTUB = {
  name: 'Bathtub (Goal Seeking)',
  description: 'Water flows into a tub at a constant rate and drains faster the fuller the tub is. The level rises and settles where outflow equals inflow. This is the simplest balancing loop: the stock adjusts until its net flow is zero.',
  maxTime: 30,
  timeUnit: 'minute',
  visibleVariables: ['Water', 'faucet', 'drain'],
  nodes: [
    { id: 'water', type: 'stock', position: { x: 260, y: 120 }, data: { label: 'Water', value: 20, unit: 'liters', description: 'Water in the tub.' } },
    { id: 'faucet', type: 'flow', position: { x: 60, y: 138 }, data: { label: 'faucet', equation: 'inflow_rate', unit: 'liters/minute' } },
    { id: 'drain', type: 'flow', position: { x: 540, y: 138 }, data: { label: 'drain', equation: 'Water / drain_time', unit: 'liters/minute' } },
    { id: 'inflow_rate', type: 'variable', position: { x: 70, y: 320 }, data: { label: 'inflow_rate', value: '12', unit: 'liters/minute' } },
    { id: 'drain_time', type: 'variable', position: { x: 550, y: 320 }, data: { label: 'drain_time', value: '5', unit: 'minute', description: 'Average time water stays in the tub.' } },
  ],
  edges: [
    { id: 'm1', source: 'faucet', target: 'water', targetHandle: 'inflow' },
    { id: 'm2', source: 'water', sourceHandle: 'outflow', target: 'drain' },
    { id: 'i1', source: 'inflow_rate', target: 'faucet', targetHandle: 'info' },
    { id: 'i2', source: 'water', target: 'drain', targetHandle: 'info' },
    { id: 'i3', source: 'drain_time', target: 'drain', targetHandle: 'info' },
  ],
};

export const SAVINGS_ACCOUNT = {
  name: 'Savings Account (Compound Interest)',
  description: 'A balance earns interest in proportion to its size, a reinforcing loop, while a fixed amount is withdrawn every year. If interest exceeds withdrawals the balance grows exponentially; if not, it declines. Interest is compounded continuously.',
  maxTime: 40,
  timeUnit: 'year',
  visibleVariables: ['Balance', 'interest', 'withdrawals'],
  nodes: [
    { id: 'balance', type: 'stock', position: { x: 260, y: 120 }, data: { label: 'Balance', value: 1000, unit: 'EUR' } },
    { id: 'interest', type: 'flow', position: { x: 60, y: 138 }, data: { label: 'interest', equation: 'Balance * interest_rate', unit: 'EUR/year' } },
    { id: 'withdrawals', type: 'flow', position: { x: 540, y: 138 }, data: { label: 'withdrawals', equation: 'annual_withdrawal', unit: 'EUR/year' } },
    { id: 'interest_rate', type: 'variable', position: { x: 70, y: 320 }, data: { label: 'interest_rate', value: '0.05', unit: '1/year' } },
    { id: 'annual_withdrawal', type: 'variable', position: { x: 550, y: 320 }, data: { label: 'annual_withdrawal', value: '20', unit: 'EUR/year' } },
  ],
  edges: [
    { id: 'm1', source: 'interest', target: 'balance', targetHandle: 'inflow' },
    { id: 'm2', source: 'balance', sourceHandle: 'outflow', target: 'withdrawals' },
    { id: 'i1', source: 'balance', target: 'interest', targetHandle: 'info' },
    { id: 'i2', source: 'interest_rate', target: 'interest', targetHandle: 'info' },
    { id: 'i3', source: 'annual_withdrawal', target: 'withdrawals', targetHandle: 'info' },
  ],
};

export const COFFEE_COOLING = {
  name: 'Coffee Cooling (Newton)',
  description: 'A cup of coffee loses heat in proportion to the difference between its temperature and the room. The gap closes exponentially: fast at first, then ever more slowly. The time constant is the time needed to close about 63 % of the gap.',
  maxTime: 60,
  timeUnit: 'minute',
  visibleVariables: ['Coffee_Temperature'],
  nodes: [
    { id: 'coffee', type: 'stock', position: { x: 120, y: 120 }, data: { label: 'Coffee_Temperature', value: 90, unit: 'degC' } },
    { id: 'cooling', type: 'flow', position: { x: 460, y: 138 }, data: { label: 'cooling', equation: '(Coffee_Temperature - Room_Temperature) / cooling_time', unit: 'degC/minute' } },
    { id: 'room', type: 'variable', position: { x: 300, y: 330 }, data: { label: 'Room_Temperature', value: '20', unit: 'degC' } },
    { id: 'tau', type: 'variable', position: { x: 560, y: 330 }, data: { label: 'cooling_time', value: '10', unit: 'minute' } },
  ],
  edges: [
    { id: 'm1', source: 'coffee', sourceHandle: 'outflow', target: 'cooling' },
    { id: 'i1', source: 'coffee', target: 'cooling', targetHandle: 'info' },
    { id: 'i2', source: 'room', target: 'cooling', targetHandle: 'info' },
    { id: 'i3', source: 'tau', target: 'cooling', targetHandle: 'info' },
  ],
};

export const CUSTOMER_BASE = {
  name: 'Customer Base (Referrals and Churn)',
  description: 'A company gains customers through marketing and referrals from existing customers, and loses a fixed fraction every month. Referrals form a reinforcing loop, churn a balancing loop. Because churn outweighs referrals here, the customer base settles at an equilibrium.',
  maxTime: 120,
  timeUnit: 'month',
  visibleVariables: ['Customers', 'acquisition', 'churn'],
  nodes: [
    { id: 'customers', type: 'stock', position: { x: 280, y: 120 }, data: { label: 'Customers', value: 0, unit: 'customers' } },
    { id: 'acquisition', type: 'flow', position: { x: 60, y: 138 }, data: { label: 'acquisition', equation: 'marketing_reach + Customers * referral_rate', unit: 'customers/month' } },
    { id: 'churn', type: 'flow', position: { x: 580, y: 138 }, data: { label: 'churn', equation: 'Customers * churn_fraction', unit: 'customers/month' } },
    { id: 'reach', type: 'variable', position: { x: 0, y: 330 }, data: { label: 'marketing_reach', value: '100', unit: 'customers/month' } },
    { id: 'referral', type: 'variable', position: { x: 220, y: 330 }, data: { label: 'referral_rate', value: '0.02', unit: '1/month' } },
    { id: 'churnf', type: 'variable', position: { x: 600, y: 330 }, data: { label: 'churn_fraction', value: '0.05', unit: '1/month' } },
  ],
  edges: [
    { id: 'm1', source: 'acquisition', target: 'customers', targetHandle: 'inflow' },
    { id: 'm2', source: 'customers', sourceHandle: 'outflow', target: 'churn' },
    { id: 'i1', source: 'reach', target: 'acquisition', targetHandle: 'info' },
    { id: 'i2', source: 'referral', target: 'acquisition', targetHandle: 'info' },
    { id: 'i3', source: 'customers', target: 'acquisition', targetHandle: 'info' },
    { id: 'i4', source: 'customers', target: 'churn', targetHandle: 'info' },
    { id: 'i5', source: 'churnf', target: 'churn', targetHandle: 'info' },
  ],
};

export const PROJECT_BACKLOG = {
  name: 'Project Backlog (Capacity)',
  description: 'Tasks arrive at a steady rate and a team completes them. Completion is limited either by the team capacity or by how fast the backlog can be worked through. If capacity exceeds arrivals the backlog shrinks to a small working level; if not, it grows without limit and the bottleneck is the team.',
  maxTime: 52,
  timeUnit: 'week',
  visibleVariables: ['Backlog', 'Completed_Tasks'],
  nodes: [
    { id: 'backlog', type: 'stock', position: { x: 220, y: 120 }, data: { label: 'Backlog', value: 200, unit: 'tasks' } },
    { id: 'done', type: 'stock', position: { x: 680, y: 120 }, data: { label: 'Completed_Tasks', value: 0, unit: 'tasks' } },
    { id: 'arrivals', type: 'flow', position: { x: 20, y: 138 }, data: { label: 'new_tasks', equation: 'arrival_rate', unit: 'tasks/week' } },
    { id: 'completion', type: 'flow', position: { x: 480, y: 138 }, data: { label: 'completion', equation: 'min(team_capacity, Backlog / minimum_completion_time)', unit: 'tasks/week' } },
    { id: 'capacity', type: 'variable', position: { x: 420, y: 330 }, data: { label: 'team_capacity', equation: 'staff * productivity', unit: 'tasks/week' } },
    { id: 'staff', type: 'variable', position: { x: 300, y: 470 }, data: { label: 'staff', value: '4', unit: 'people' } },
    { id: 'prod', type: 'variable', position: { x: 540, y: 470 }, data: { label: 'productivity', value: '2.5', unit: 'tasks/(person*week)' } },
    { id: 'mct', type: 'variable', position: { x: 660, y: 330 }, data: { label: 'minimum_completion_time', value: '2', unit: 'week' } },
    { id: 'arr', type: 'variable', position: { x: 30, y: 330 }, data: { label: 'arrival_rate', value: '8', unit: 'tasks/week' } },
  ],
  edges: [
    { id: 'm1', source: 'arrivals', target: 'backlog', targetHandle: 'inflow' },
    { id: 'm2', source: 'backlog', sourceHandle: 'outflow', target: 'completion' },
    { id: 'm3', source: 'completion', target: 'done', targetHandle: 'inflow' },
    { id: 'i1', source: 'arr', target: 'arrivals', targetHandle: 'info' },
    { id: 'i2', source: 'capacity', target: 'completion', targetHandle: 'info' },
    { id: 'i3', source: 'backlog', target: 'completion', targetHandle: 'info' },
    { id: 'i4', source: 'mct', target: 'completion', targetHandle: 'info' },
    { id: 'i5', source: 'staff', target: 'capacity', targetHandle: 'info' },
    { id: 'i6', source: 'prod', target: 'capacity', targetHandle: 'info' },
  ],
};

export const HIRING_PIPELINE = {
  name: 'Hiring Pipeline (Aging Chain)',
  description: 'New hires spend months as trainees before becoming experienced staff, who eventually quit. Hiring replaces quits and closes the gap to a target workforce. The training delay means the experienced workforce lags behind hiring decisions.',
  maxTime: 60,
  timeUnit: 'month',
  visibleVariables: ['Trainees', 'Experienced', 'hiring'],
  nodes: [
    { id: 'trainees', type: 'stock', position: { x: 220, y: 120 }, data: { label: 'Trainees', value: 20, unit: 'people' } },
    { id: 'experienced', type: 'stock', position: { x: 640, y: 120 }, data: { label: 'Experienced', value: 100, unit: 'people' } },
    { id: 'hiring', type: 'flow', position: { x: 20, y: 138 }, data: { label: 'hiring', equation: 'max(0, quits + (target_workforce - Trainees - Experienced) / hiring_delay)', unit: 'people/month' } },
    { id: 'training', type: 'flow', position: { x: 450, y: 138 }, data: { label: 'training_completion', equation: 'Trainees / training_time', unit: 'people/month' } },
    { id: 'quits', type: 'flow', position: { x: 880, y: 138 }, data: { label: 'quits', equation: 'Experienced * quit_fraction', unit: 'people/month' } },
    { id: 'target', type: 'variable', position: { x: 0, y: 340 }, data: { label: 'target_workforce', value: '200', unit: 'people' } },
    { id: 'hdelay', type: 'variable', position: { x: 160, y: 340 }, data: { label: 'hiring_delay', value: '3', unit: 'month' } },
    { id: 'ttime', type: 'variable', position: { x: 440, y: 340 }, data: { label: 'training_time', value: '6', unit: 'month' } },
    { id: 'qf', type: 'variable', position: { x: 880, y: 340 }, data: { label: 'quit_fraction', value: '0.03', unit: '1/month' } },
  ],
  edges: [
    { id: 'm1', source: 'hiring', target: 'trainees', targetHandle: 'inflow' },
    { id: 'm2', source: 'trainees', sourceHandle: 'outflow', target: 'training' },
    { id: 'm3', source: 'training', target: 'experienced', targetHandle: 'inflow' },
    { id: 'm4', source: 'experienced', sourceHandle: 'outflow', target: 'quits' },
    { id: 'i1', source: 'quits', target: 'hiring', targetHandle: 'info', sourceHandle: 'info' },
    { id: 'i2', source: 'target', target: 'hiring', targetHandle: 'info' },
    { id: 'i3', source: 'hdelay', target: 'hiring', targetHandle: 'info' },
    { id: 'i4', source: 'trainees', target: 'hiring', targetHandle: 'info' },
    { id: 'i5', source: 'experienced', target: 'hiring', targetHandle: 'info' },
    { id: 'i6', source: 'trainees', target: 'training', targetHandle: 'info' },
    { id: 'i7', source: 'ttime', target: 'training', targetHandle: 'info' },
    { id: 'i8', source: 'experienced', target: 'quits', targetHandle: 'info' },
    { id: 'i9', source: 'qf', target: 'quits', targetHandle: 'info' },
  ],
};

export const SUPPLY_CHAIN_DELAY = {
  name: 'Supply Chain with Delivery Delay',
  description: 'A retailer orders to replace sales and to correct its inventory, but orders take weeks to arrive. Ignoring the orders already in the pipeline (the supply line) makes the manager over-order, so inventory overshoots and oscillates. This is the structure behind the bullwhip effect.',
  maxTime: 80,
  timeUnit: 'week',
  visibleVariables: ['Inventory', 'Supply_Line'],
  nodes: [
    { id: 'sl', type: 'stock', position: { x: 220, y: 120 }, data: { label: 'Supply_Line', value: 400, unit: 'units', description: 'Ordered but not yet delivered.' } },
    { id: 'inv', type: 'stock', position: { x: 660, y: 120 }, data: { label: 'Inventory', value: 200, unit: 'units' } },
    { id: 'orders', type: 'flow', position: { x: 20, y: 138 }, data: { label: 'orders', equation: 'max(0, Customer_Demand + (Target_Inventory - Inventory) / inventory_adjustment_time + supply_line_weight * (desired_supply_line - Supply_Line) / inventory_adjustment_time)', unit: 'units/week' } },
    { id: 'deliveries', type: 'flow', position: { x: 460, y: 138 }, data: { label: 'deliveries', equation: 'Supply_Line / delivery_delay', unit: 'units/week' } },
    { id: 'sales', type: 'flow', position: { x: 900, y: 138 }, data: { label: 'sales', equation: 'Customer_Demand', unit: 'units/week' } },
    { id: 'dsl', type: 'variable', position: { x: 230, y: 340 }, data: { label: 'desired_supply_line', equation: 'Customer_Demand * delivery_delay', unit: 'units' } },
    { id: 'demand', type: 'variable', position: { x: 900, y: 340 }, data: { label: 'Customer_Demand', value: '100', unit: 'units/week' } },
    { id: 'target', type: 'variable', position: { x: 660, y: 340 }, data: { label: 'Target_Inventory', value: '400', unit: 'units' } },
    { id: 'iat', type: 'variable', position: { x: 0, y: 340 }, data: { label: 'inventory_adjustment_time', value: '2', unit: 'week' } },
    { id: 'delay', type: 'variable', position: { x: 460, y: 340 }, data: { label: 'delivery_delay', value: '4', unit: 'week' } },
    { id: 'slw', type: 'variable', position: { x: 0, y: 480 }, data: { label: 'supply_line_weight', value: '0', unit: 'dimensionless', description: '0 = the manager ignores orders in transit; 1 = accounts for them fully.' } },
  ],
  edges: [
    { id: 'm1', source: 'orders', target: 'sl', targetHandle: 'inflow' },
    { id: 'm2', source: 'sl', sourceHandle: 'outflow', target: 'deliveries' },
    { id: 'm3', source: 'deliveries', target: 'inv', targetHandle: 'inflow' },
    { id: 'm4', source: 'inv', sourceHandle: 'outflow', target: 'sales' },
    { id: 'i1', source: 'demand', target: 'orders', targetHandle: 'info' },
    { id: 'i2', source: 'target', target: 'orders', targetHandle: 'info' },
    { id: 'i3', source: 'inv', target: 'orders', targetHandle: 'info' },
    { id: 'i4', source: 'iat', target: 'orders', targetHandle: 'info' },
    { id: 'i5', source: 'slw', target: 'orders', targetHandle: 'info' },
    { id: 'i6', source: 'dsl', target: 'orders', targetHandle: 'info' },
    { id: 'i7', source: 'sl', target: 'orders', targetHandle: 'info' },
    { id: 'i8', source: 'sl', target: 'deliveries', targetHandle: 'info' },
    { id: 'i9', source: 'delay', target: 'deliveries', targetHandle: 'info' },
    { id: 'i10', source: 'demand', target: 'sales', targetHandle: 'info' },
    { id: 'i11', source: 'demand', target: 'dsl', targetHandle: 'info' },
    { id: 'i12', source: 'delay', target: 'dsl', targetHandle: 'info' },
  ],
};

export const FISHERY = {
  name: 'Fishery (Overshoot and Collapse)',
  description: 'Fish regenerate logistically. The fishing fleet grows by reinvesting part of its catch and shrinks as boats are retired. Because the fleet responds to past catches, it keeps growing after the fish stock has started to fall: the fishery overshoots its sustainable yield and the catch collapses before the fleet adjusts.',
  maxTime: 60,
  timeUnit: 'year',
  visibleVariables: ['Fish', 'Boats', 'harvest'],
  nodes: [
    { id: 'fish', type: 'stock', position: { x: 260, y: 120 }, data: { label: 'Fish', value: 900, unit: 'tons' } },
    { id: 'boats', type: 'stock', position: { x: 260, y: 480 }, data: { label: 'Boats', value: 5, unit: 'boats' } },
    { id: 'regen', type: 'flow', position: { x: 40, y: 138 }, data: { label: 'regeneration', equation: 'Fish * regeneration_rate * (1 - Fish / carrying_capacity)', unit: 'tons/year' } },
    { id: 'harvest', type: 'flow', position: { x: 560, y: 138 }, data: { label: 'harvest', equation: 'Boats * catch_per_boat * Fish / carrying_capacity', unit: 'tons/year' } },
    { id: 'buy', type: 'flow', position: { x: 40, y: 498 }, data: { label: 'boat_purchases', equation: 'harvest * reinvestment_fraction / boat_price', unit: 'boats/year' } },
    { id: 'retire', type: 'flow', position: { x: 560, y: 498 }, data: { label: 'boat_retirement', equation: 'Boats / boat_lifetime', unit: 'boats/year' } },
    { id: 'rr', type: 'variable', position: { x: 0, y: 320 }, data: { label: 'regeneration_rate', value: '0.5', unit: '1/year' } },
    { id: 'cc', type: 'variable', position: { x: 300, y: 320 }, data: { label: 'carrying_capacity', value: '1000', unit: 'tons' } },
    { id: 'cpb', type: 'variable', position: { x: 760, y: 320 }, data: { label: 'catch_per_boat', value: '20', unit: 'tons/(boat*year)' } },
    { id: 'rf', type: 'variable', position: { x: 0, y: 660 }, data: { label: 'reinvestment_fraction', value: '0.15', unit: 'dimensionless', description: 'Share of the catch value spent on new boats.' } },
    { id: 'price', type: 'variable', position: { x: 260, y: 660 }, data: { label: 'boat_price', value: '5', unit: 'tons/boat', description: 'Value of a boat, measured in tons of catch.' } },
    { id: 'life', type: 'variable', position: { x: 760, y: 660 }, data: { label: 'boat_lifetime', value: '10', unit: 'year' } },
  ],
  edges: [
    { id: 'm1', source: 'regen', target: 'fish', targetHandle: 'inflow' },
    { id: 'm2', source: 'fish', sourceHandle: 'outflow', target: 'harvest' },
    { id: 'm3', source: 'buy', target: 'boats', targetHandle: 'inflow' },
    { id: 'm4', source: 'boats', sourceHandle: 'outflow', target: 'retire' },
    { id: 'i1', source: 'fish', target: 'regen', targetHandle: 'info' },
    { id: 'i2', source: 'rr', target: 'regen', targetHandle: 'info' },
    { id: 'i3', source: 'cc', target: 'regen', targetHandle: 'info' },
    { id: 'i4', source: 'boats', target: 'harvest', targetHandle: 'info' },
    { id: 'i5', source: 'cpb', target: 'harvest', targetHandle: 'info' },
    { id: 'i6', source: 'fish', target: 'harvest', targetHandle: 'info' },
    { id: 'i7', source: 'cc', target: 'harvest', targetHandle: 'info' },
    { id: 'i8', source: 'harvest', sourceHandle: 'info', target: 'buy', targetHandle: 'info' },
    { id: 'i9', source: 'rf', target: 'buy', targetHandle: 'info' },
    { id: 'i10', source: 'price', target: 'buy', targetHandle: 'info' },
    { id: 'i11', source: 'boats', target: 'retire', targetHandle: 'info' },
    { id: 'i12', source: 'life', target: 'retire', targetHandle: 'info' },
  ],
};
