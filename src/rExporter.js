import { buildModel } from './simulationEngine';

export const generateRCode = (nodes, edges, timeStep = 0.1, maxTime = 100, visibleVariables = null) => {
  const model = buildModel(nodes, edges);

  const safeName = (name) => name.replace(/[^a-zA-Z0-9_]/g, '_');

  let code = `# Required packages: install.packages(c("deSolve", "ggplot2", "tidyr"))
library(deSolve)
library(ggplot2)
library(tidyr)

# 1. Model Parameters
params <- c(
`;
  model.variables.forEach((v, i) => {
    const comma = i === model.variables.length - 1 ? '' : ',';
    code += `  ${safeName(v.data.label)} = ${v.data.value || 0}${comma}\n`;
  });
  code += `)

# 2. Initial State (Stocks)
init_state <- c(
`;
  model.stocks.forEach((s, i) => {
    const comma = i === model.stocks.length - 1 ? '' : ',';
    code += `  ${safeName(s.data.label)} = ${s.data.value || 0}${comma}\n`;
  });
  code += `)

# 3. Model Definition
model_fn <- function(t, state, params) {
  with(as.list(c(state, params)), {
    
    # Auxiliaries
`;
  model.variables.forEach(v => {
    if (v.data.equation) {
      code += `    ${safeName(v.data.label)} <- ${v.data.equation}\n`;
    }
  });

  code += `\n    # Flows\n`;
  model.flows.forEach(f => {
    code += `    ${safeName(f.data.label)} <- ${f.data.equation}\n`;
  });

  code += `\n    # Change in Stocks (Derivatives)\n`;
  model.stocks.forEach(stock => {
    const label = safeName(stock.data.label);
    const inflows = model.stockFlows[stock.id].inflows.map(id => safeName(model.nodeMap[id].data.label));
    const outflows = model.stockFlows[stock.id].outflows.map(id => safeName(model.nodeMap[id].data.label));
    let flowStr = inflows.map(f => ` + ${f}`).join('') + outflows.map(f => ` - ${f}`).join('');
    code += `    d_${label} <- ${flowStr.trim() || '0'}\n`;
  });

  code += `\n    return(list(c(${model.stocks.map(s => `d_${safeName(s.data.label)}`).join(', ')}),
                ${model.flows.concat(model.variables).map(v => `${safeName(v.data.label)} = ${safeName(v.data.label)}`).join(',\n                ')}))
  })
}

# 4. Run Simulation
times <- seq(0, ${maxTime}, by = ${timeStep})
out <- ode(y = init_state, times = times, func = model_fn, parms = params)

# 5. Visualization
out_df <- as.data.frame(out)

# Pivot to long format for ggplot
out_long <- pivot_longer(out_df, cols = -time, names_to = "variable", values_to = "value")
`;

  if (visibleVariables && visibleVariables.length > 0) {
    const allModelVars = new Set([
      ...model.stocks.map(s => safeName(s.data.label)),
      ...model.flows.map(f => safeName(f.data.label)),
      ...model.variables.map(v => safeName(v.data.label))
    ]);
    const filteredVars = visibleVariables.map(v => safeName(v)).filter(v => allModelVars.has(v));
    const rVector = filteredVars.map(v => `"${v}"`).join(', ');
    code += `\n# Filter for variables requested in the UI
out_long <- out_long[out_long$variable %in% c(${rVector}), ]\n`;
  }

  code += `
ggplot(out_long, aes(x = time, y = value, color = variable)) +
  geom_line(size = 1) +
  theme_minimal() +
  labs(title = "System Dynamics Simulation (R)",
       subtitle = "Generated via SysDyn Studio",
       x = "Time", y = "Value") +
  theme(legend.position = "bottom")
`;

  return code;
};
