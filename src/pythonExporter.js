import { buildModel } from './simulationEngine';

export const generatePythonCode = (nodes, edges, timeStep = 0.1, maxTime = 100, visibleVariables = null) => {
  const model = buildModel(nodes, edges);

  const safeName = (name) => name.replace(/[^a-zA-Z0-9_]/g, '_');

  const constants = model.variables.filter(v => !v.data.equation);
  const auxiliaries = model.variables.filter(v => v.data.equation);

  let code = `import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt

# 1. Model Parameters (Constants)
params = {
`;
  constants.forEach((v, i) => {
    const comma = i === constants.length - 1 ? '' : ',';
    code += `    '${safeName(v.data.label)}': ${v.data.value || 0}${comma}\n`;
  });
  code += `}

# 2. Initial State (Stocks)
y0 = [
`;
  model.stocks.forEach((s, i) => {
    const comma = i === model.stocks.length - 1 ? '' : ',';
    code += `    ${s.data.value || 0}${comma}  # ${safeName(s.data.label)}\n`;
  });
  code += `]

# 3. Model Definition
def model(y, t, p):
    # Unpack stocks
`;
  if (model.stocks.length > 0) {
    if (model.stocks.length === 1) {
      code += `    ${safeName(model.stocks[0].data.label)} = y[0]\n`;
    } else {
      code += `    ${model.stocks.map(s => safeName(s.data.label)).join(', ')} = y\n`;
    }
  }

  code += `
    # Auxiliaries & Flows
`;

  const transformEq = (eq, paramName = 'p') => {
    let newEq = eq.toString();
    const allNodes = [...model.stocks, ...model.variables, ...model.flows].sort((a, b) => b.data.label.length - a.data.label.length);
    
    allNodes.forEach(n => {
      const original = n.data.label;
      const safe = safeName(original);
      const isConstant = constants.some(c => c.id === n.id);
      
      const replacement = isConstant ? `${paramName}['${safe}']` : safe;
      const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      newEq = newEq.replace(new RegExp(`\\b${escaped}\\b`, 'g'), replacement);
    });
    return newEq;
  };

  // Topological Sort
  const allToSolve = [...auxiliaries, ...model.flows];
  const solvedNames = new Set([...model.stocks.map(s => s.data.label), ...constants.map(c => c.data.label)]);
  const sorted = [];
  const remaining = [...allToSolve];
  
  let progress = true;
  while (progress && remaining.length > 0) {
    progress = false;
    for (let i = 0; i < remaining.length; i++) {
      const v = remaining[i];
      const deps = allToSolve.concat(model.stocks).concat(constants).filter(n => {
        const escaped = n.data.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`).test(v.data.equation.toString());
      });
      if (deps.every(d => solvedNames.has(d.data.label) || d.data.label === v.data.label)) {
        sorted.push(v);
        solvedNames.add(v.data.label);
        remaining.splice(i, 1);
        progress = true;
        break;
      }
    }
  }
  const finalEvalOrder = [...sorted, ...remaining];

  finalEvalOrder.forEach(v => {
    code += `    ${safeName(v.data.label)} = ${transformEq(v.data.equation, 'p')}\n`;
  });

  code += `\n    # Derivatives (Change in Stocks)\n`;
  model.stocks.forEach(stock => {
    const label = safeName(stock.data.label);
    const inflows = model.stockFlows[stock.id].inflows.map(id => safeName(model.nodeMap[id].data.label));
    const outflows = model.stockFlows[stock.id].outflows.map(id => safeName(model.nodeMap[id].data.label));
    let flowStr = inflows.map(f => ` + ${f}`).join('') + outflows.map(f => ` - ${f}`).join('');
    code += `    d${label}_dt = ${flowStr.trim() || '0'}\n`;
  });

  code += `\n    return [${model.stocks.map(s => `d${safeName(s.data.label)}_dt`).join(', ') || '0'}]

# 4. Run Simulation
t = np.linspace(0, ${maxTime}, int(${maxTime}/${timeStep}) + 1)
sol = odeint(model, y0, t, args=(params,))

# 5. Post-Processing (Calculate variables for plotting)
`;

  model.stocks.forEach((s, i) => {
    code += `${safeName(s.data.label)} = sol[:, ${i}]\n`;
  });

  constants.forEach(v => {
    code += `${safeName(v.data.label)} = np.full_like(t, params['${safeName(v.data.label)}'])\n`;
  });

  finalEvalOrder.forEach(v => {
    code += `${safeName(v.data.label)} = ${transformEq(v.data.equation, 'params')}\n`;
  });

  code += `\n# 6. Visualization
plt.figure(figsize=(10, 6))
`;

  const varsToPlot = (visibleVariables || model.stocks.map(s => s.data.label))
    .filter(vName => {
      const safe = safeName(vName);
      return model.stocks.some(s => safeName(s.data.label) === safe) || 
             finalEvalOrder.some(v => safeName(v.data.label) === safe) ||
             constants.some(c => safeName(c.data.label) === safe);
    });

  varsToPlot.forEach(vName => {
    const safe = safeName(vName);
    code += `plt.plot(t, ${safe}, label='${vName}', linewidth=2)\n`;
  });

  code += `
plt.title('System Dynamics Simulation (Python)')
plt.xlabel('Time')
plt.ylabel('Value')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()
`;

  return code;
};
