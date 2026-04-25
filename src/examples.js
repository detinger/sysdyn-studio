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
    
    { id: 'e5', source: 'prey', target: 'prey_births', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e6', source: 'prey', target: 'prey_deaths', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e7', source: 'predators', target: 'prey_deaths', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e8', source: 'prey', target: 'predator_births', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e9', source: 'predators', target: 'predator_births', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e10', source: 'predators', target: 'predator_deaths', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } }
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
    
    { id: 'e5', source: 'susceptible', target: 'infection_rate', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e6', source: 'infected', target: 'infection_rate', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e7', source: 'infected', target: 'recovery_rate', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } }
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
    
    { id: 'e3', source: 'sales_ads', target: 'adoption_rate', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e4', source: 'wom', target: 'adoption_rate', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e5', source: 'pot_adopters', target: 'sales_ads', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e6', source: 'pot_adopters', target: 'wom', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e7', source: 'adopters', target: 'wom', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } }
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
    { id: 'pop', type: 'stock', position: { x: 700, y: 350 }, data: { label: 'Population', value: 10 } },
    { id: 'net_growth', type: 'flow', position: { x: 350, y: 750 }, data: { label: 'Net_Growth', equation: 'Population * Growth_Rate * (1 - (Population / Carrying_Capacity))' } },
    { id: 'v_gr', type: 'variable', position: { x: 50, y: 150 }, data: { label: 'Growth_Rate', value: '0.1' } },
    { id: 'v_cc', type: 'variable', position: { x: 50, y: 450 }, data: { label: 'Carrying_Capacity', value: '1000' } }
  ],
  edges: [
    { id: 'e1', source: 'net_growth', target: 'pop', targetHandle: 'inflow', animated: true },
    { id: 'e2', source: 'pop', target: 'net_growth', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e3', source: 'v_gr', target: 'net_growth', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e4', source: 'v_cc', target: 'net_growth', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } }
  ]
};

export const INVENTORY_CONTROL = {
  name: 'Inventory Control System',
  description: 'A fundamental supply chain model that shows how a business manages stock levels. It uses balancing feedback to correct discrepancies between actual inventory and a target level. If inventory is low, production increases; if it is high, production slows. This model helps explain "oscillations" and "overshoot" in supply chains, especially when there are delays in the system.',
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
    
    { id: 'e3', source: 'v_cd', target: 'prod', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e4', source: 'v_cd', target: 'sales', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e5', source: 'inv', target: 'prod', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e6', source: 'v_ti', target: 'prod', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } },
    { id: 'e7', source: 'v_at', target: 'prod', targetHandle: 'info', animated: true, style: { strokeDasharray: '5,5', stroke: 'orange' } }
  ]
};
