export const POPULATION_EXTENDED = {
  name: 'Population Dynamics (Extended)',
  description: 'A fundamental population model exploring the four drivers of change: Births, Deaths, Immigration, and Exodus. This model illustrates how even simple linear rates can create complex growth or decline patterns when multiple inflows and outflows interact.',
  maxTime: 100,
  visibleVariables: ['Population'],
  colors: {
    'Population': '#3b82f6'
  },
  nodes: [
    { id: 'pop', type: 'stock', position: { x: 400, y: 200 }, data: { label: 'Population', value: 1000 } },

    // Flows
    { id: 'immigration', type: 'flow', position: { x: 100, y: 50 }, data: { label: 'Immigration', value: '10' } },
    { id: 'births', type: 'flow', position: { x: 150, y: 550 }, data: { label: 'Births', equation: 'Population * birth_rate' } },
    { id: 'deaths', type: 'flow', position: { x: 800, y: 400 }, data: { label: 'Deaths', equation: 'Population * death_rate' } },
    { id: 'exodus', type: 'flow', position: { x: 700, y: 750 }, data: { label: 'Exodus', equation: 'Population * exodus_fraction' } },

    // Variables
    { id: 'v_br', type: 'variable', position: { x: 0, y: 250 }, data: { label: 'birth_rate', value: '0.03' } },
    { id: 'v_dr', type: 'variable', position: { x: 650, y: 100 }, data: { label: 'death_rate', value: '0.02' } },
    { id: 'v_ef', type: 'variable', position: { x: 400, y: 580 }, data: { label: 'exodus_fraction', value: '0.005' } }
  ],
  edges: [
    // Physical Flows
    { id: 'e1', source: 'immigration', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'births', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e3', source: 'pop', sourceHandle: 'outflow', target: 'deaths', animated: true },
    { id: 'e4', source: 'pop', sourceHandle: 'outflow', target: 'exodus', animated: true },

    // Info Links
    { id: 'i1', source: 'v_br', target: 'births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i2', source: 'pop', target: 'births', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i3', source: 'pop', target: 'deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i4', source: 'v_dr', target: 'deaths', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i5', source: 'pop', target: 'exodus', targetHandle: 'info', animated: true, className: 'info-edge' },
    { id: 'i6', source: 'v_ef', target: 'exodus', targetHandle: 'info', animated: true, className: 'info-edge' }
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
    { id: 'prey', type: 'stock', position: { x: 200, y: 100 }, data: { label: 'Prey', value: 100 } },
    { id: 'predators', type: 'stock', position: { x: 500, y: 100 }, data: { label: 'Predators', value: 20 } },
    { id: 'prey_births', type: 'flow', position: { x: 20, y: 480 }, data: { label: 'prey_births', equation: 'Prey * prey_birth_rate' } },
    { id: 'prey_deaths', type: 'flow', position: { x: 500, y: 740 }, data: { label: 'prey_deaths', equation: 'Prey * Predators * predation_rate' } },
    { id: 'predator_births', type: 'flow', position: { x: 180, y: 720 }, data: { label: 'predator_births', equation: 'Prey * Predators * predator_birth_rate' } },
    { id: 'predator_deaths', type: 'flow', position: { x: 680, y: 480 }, data: { label: 'predator_deaths', equation: 'Predators * predator_death_rate' } },

    { id: 'v_pbr', type: 'variable', position: { x: 880, y: 100 }, data: { label: 'prey_birth_rate', value: '0.05' } },
    { id: 'v_pred_br', type: 'variable', position: { x: 880, y: 330 }, data: { label: 'predator_birth_rate', value: '0.0002' } },
    { id: 'v_pdr', type: 'variable', position: { x: 880, y: 560 }, data: { label: 'predator_death_rate', value: '0.03' } },
    { id: 'v_pr', type: 'variable', position: { x: 880, y: 790 }, data: { label: 'predation_rate', value: '0.001' } }
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
  description: 'The SIR model is one of the most famous compartmental models in epidemiology. It divides a population into three groups: Susceptible (can catch the disease), Infected (have the disease and can spread it), and Recovered (cannot catch it again). This model helps scientists predict how fast an outbreak will spread, what the peak number of infections will be, and how \"herd immunity\" eventually stops the transmission.',
  maxTime: 120,
  visibleVariables: ['Susceptible', 'Infected', 'Recovered'],
  colors: {
    'Susceptible': '#3b82f6', // Blue
    'Infected': '#ef4444',    // Red
    'Recovered': '#10b981'    // Green
  },
  nodes: [
    { id: 'susceptible', type: 'stock', position: { x: 50, y: 50 }, data: { label: 'Susceptible', value: 990 } },
    { id: 'infected', type: 'stock', position: { x: 400, y: 50 }, data: { label: 'Infected', value: 10 } },
    { id: 'recovered', type: 'stock', position: { x: 750, y: 50 }, data: { label: 'Recovered', value: 0 } },

    { id: 'infection_rate', type: 'flow', position: { x: 225, y: 350 }, data: { label: 'infection_rate', equation: 'Susceptible * Infected * infection_probability / total_pop' } },
    { id: 'recovery_rate', type: 'flow', position: { x: 575, y: 350 }, data: { label: 'recovery_rate', equation: 'Infected / recovery_delay' } },

    { id: 'v_tp', type: 'variable', position: { x: 250, y: 700 }, data: { label: 'total_pop', value: '1000' } },
    { id: 'v_ip', type: 'variable', position: { x: 450, y: 700 }, data: { label: 'infection_probability', value: '0.4' } },
    { id: 'v_rd', type: 'variable', position: { x: 650, y: 700 }, data: { label: 'recovery_delay', value: '10' } }
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
  description: 'This model explains how new products or ideas spread through a population. It identifies two main drivers: Innovation (people adopting because of advertising) and Imitation (people adopting because they see others using it). The famous \"S-Curve\" of adoption is generated by this dynamic, starting slowly and then accelerating rapidly as the \"word of mouth\" feedback loop takes over.',
  maxTime: 10,
  visibleVariables: ['adopters', 'adoption_rate', 'potential_adopters'],
  colors: {
    'adopters': '#3b82f6',         // Blue
    'adoption_rate': '#ef4444',    // Red
    'potential_adopters': '#10b981' // Green
  },
  nodes: [
    { id: 'pot_adopters', type: 'stock', position: { x: 50, y: 800 }, data: { label: 'potential_adopters', value: 10000 } },
    { id: 'adopters', type: 'stock', position: { x: 700, y: 800 }, data: { label: 'adopters', value: 0 } },

    { id: 'adoption_rate', type: 'flow', position: { x: 375, y: 650 }, data: { label: 'adoption_rate', equation: 'sales_from_ads + word_of_mouth' } },

    { id: 'wom', type: 'variable', position: { x: 150, y: 80 }, data: { label: 'word_of_mouth', equation: 'potential_adopters * (adopters / total_population) * contact_rate * adoption_fraction' } },
    { id: 'sales_ads', type: 'variable', position: { x: 150, y: 350 }, data: { label: 'sales_from_ads', equation: 'potential_adopters * ads_effectiveness' } },

    { id: 'v_tp', type: 'variable', position: { x: 600, y: 80 }, data: { label: 'total_population', value: '10000' } },
    { id: 'v_af', type: 'variable', position: { x: 850, y: 80 }, data: { label: 'adoption_fraction', value: '0.015' } },
    { id: 'v_ae', type: 'variable', position: { x: 600, y: 300 }, data: { label: 'ads_effectiveness', value: '0.015' } },
    { id: 'v_cr', type: 'variable', position: { x: 850, y: 300 }, data: { label: 'contact_rate', value: '100' } }
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
  description: 'This model represents the limit to growth for a population in a constrained environment. Unlike exponential growth, which continues forever, logistic growth slows down as resources become scarce. The \"Carrying Capacity\" is the maximum population size that the environment can sustainably support. It illustrates a critical balancing feedback loop that keeps biological systems in check.',
  maxTime: 100,
  visibleVariables: ['Population', 'Carrying_Capacity'],
  colors: {
    'Population': '#3b82f6', // Blue
    'Carrying_Capacity': '#ef4444' // Red
  },
  nodes: [
    { id: 'pop', type: 'stock', position: { x: 700, y: 350 }, data: { label: 'Population', value: 10 } },
    { id: 'net_growth', type: 'flow', position: { x: 350, y: 750 }, data: { label: 'Net_Growth', equation: 'Population * Growth_Rate * (1 - (Population / Carrying_Capacity))' } },
    { id: 'v_gr', type: 'variable', position: { x: 50, y: 150 }, data: { label: 'Growth_Rate', value: '0.1' } },
    { id: 'v_cc', type: 'variable', position: { x: 50, y: 450 }, data: { label: 'Carrying_Capacity', value: '1000' } }
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
  description: 'A fundamental supply chain model that shows how a business manages stock levels. It uses balancing feedback to correct discrepancies between actual inventory and a target level. If inventory is low, production increases; if it is high, production slows. This model helps explain \"oscillations\" and \"overshoot\" in supply chains, especially when there are delays in the system.',
  maxTime: 50,
  visibleVariables: ['Inventory', 'Production', 'Customer_Demand'],
  colors: {
    'Inventory': '#3b82f6', // Blue
    'Production': '#10b981', // Green
    'Customer_Demand': '#ef4444' // Red
  },
  nodes: [
    { id: 'inv', type: 'stock', position: { x: 480, y: 100 }, data: { label: 'Inventory', value: 200 } },
    { id: 'prod', type: 'flow', position: { x: 200, y: 700 }, data: { label: 'Production', equation: 'Customer_Demand + (Target_Inventory - Inventory) / Adjustment_Time' } },
    { id: 'sales', type: 'flow', position: { x: 800, y: 700 }, data: { label: 'Sales', equation: 'Customer_Demand' } },

    { id: 'v_ti', type: 'variable', position: { x: 50, y: 150 }, data: { label: 'Target_Inventory', value: '500' } },
    { id: 'v_at', type: 'variable', position: { x: 50, y: 400 }, data: { label: 'Adjustment_Time', value: '5' } },
    { id: 'v_cd', type: 'variable', position: { x: 490, y: 500 }, data: { label: 'Customer_Demand', value: '100' } }
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
    { id: 'cap', type: 'stock', position: { x: 450, y: 650 }, data: { label: 'Industrial_Capital', value: 100 } },
    { id: 'res', type: 'stock', position: { x: 800, y: 250 }, data: { label: 'Resources', value: 100 } },
    { id: 'pol', type: 'stock', position: { x: 950, y: 850 }, data: { label: 'Pollution', value: 10 } },

    // Population Flows
    { id: 'births', type: 'flow', position: { x: 50, y: 900 }, data: { label: 'Births', equation: 'Population * 0.04' } },
    { id: 'deaths', type: 'flow', position: { x: 650, y: 1200 }, data: { label: 'Deaths', equation: 'Population * (0.01 + Pollution * 0.0001 + 0.05 / (Ind_Cap_Per_Capita + 0.1))' } },

    // Capital Flows
    { id: 'investment', type: 'flow', position: { x: 250, y: 450 }, data: { label: 'Investment', equation: 'Ind_Output * 0.1' } },
    { id: 'depreciation', type: 'flow', position: { x: 700, y: 750 }, data: { label: 'Depreciation', equation: 'Industrial_Capital * 0.05' } },

    // Resource & Pollution Flows
    { id: 'res_usage', type: 'flow', position: { x: 1050, y: 450 }, data: { label: 'Resource_Usage', equation: 'Ind_Output * 0.01' } },
    { id: 'pol_gen', type: 'flow', position: { x: 600, y: 450 }, data: { label: 'Pollution_Gen', equation: 'Ind_Output * 0.05' } },
    { id: 'pol_abs', type: 'flow', position: { x: 1250, y: 950 }, data: { label: 'Pollution_Abs', equation: 'Pollution * 0.1' } },

    // Variables
    { id: 'ind_out', type: 'variable', position: { x: 50, y: 50 }, data: { label: 'Ind_Output', equation: 'Industrial_Capital * (Resources / 100)' } },
    { id: 'ic_pc', type: 'variable', position: { x: 500, y: 900 }, data: { label: 'Ind_Cap_Per_Capita', equation: 'Industrial_Capital / Population' } }
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
