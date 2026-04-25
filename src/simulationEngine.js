import { create, all } from 'mathjs';

const math = create(all);

export const buildModel = (nodes, edges) => {
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });

  const stocks = nodes.filter(n => n.type === 'stock');
  const flows = nodes.filter(n => n.type === 'flow');
  const variables = nodes.filter(n => n.type === 'variable');

  const stockFlows = {};
  stocks.forEach(stock => {
    stockFlows[stock.id] = { inflows: [], outflows: [] };
  });

  edges.forEach(edge => {
    const source = nodeMap[edge.source];
    const target = nodeMap[edge.target];

    if (!source || !target) return;

    if (source.type === 'flow' && target.type === 'stock' && edge.targetHandle === 'inflow') {
      stockFlows[target.id].inflows.push(source.id);
    } else if (source.type === 'stock' && target.type === 'flow' && edge.sourceHandle === 'outflow') {
      stockFlows[source.id].outflows.push(target.id);
    }
  });

  return { stocks, flows, variables, stockFlows, nodeMap };
};

export const runSimulation = (nodes, edges, dt = 0.1, maxTime = 100) => {
  const model = buildModel(nodes, edges);
  const data = [];
  
  // Current values of stocks
  let currentStocks = {};
  model.stocks.forEach(stock => {
    currentStocks[stock.data.label] = parseFloat(stock.data.value) || 0;
  });

  const evaluateModel = (stocks) => {
    const scope = { ...stocks };
    
    // Add constants to scope
    model.variables.forEach(v => {
      if (!v.data.equation) {
        scope[v.data.label] = parseFloat(v.data.value) || 0;
      }
    });

    // Iteratively solve for variables and flows (to handle dependencies)
    const toSolve = [...model.variables.filter(v => v.data.equation), ...model.flows];
    for (let i = 0; i < 10; i++) {
      let changed = false;
      toSolve.forEach(node => {
        try {
          const val = math.evaluate(node.data.equation, scope);
          if (scope[node.data.label] !== val) {
            scope[node.data.label] = val;
            changed = true;
          }
        } catch (e) {
          // Dependency not yet available
        }
      });
      if (!changed) break;
    }

    // Calculate net flow for each stock
    const derivatives = {};
    model.stocks.forEach(stock => {
      let netFlow = 0;
      model.stockFlows[stock.id].inflows.forEach(flowId => {
        netFlow += scope[model.nodeMap[flowId].data.label] || 0;
      });
      model.stockFlows[stock.id].outflows.forEach(flowId => {
        netFlow -= scope[model.nodeMap[flowId].data.label] || 0;
      });
      derivatives[stock.data.label] = netFlow;
    });

    return { derivatives, scope };
  };

  for (let t = 0; t <= maxTime; t += dt) {
    // 1. Get initial state derivatives (k1)
    const eval1 = evaluateModel(currentStocks);
    const k1 = eval1.derivatives;
    
    // Record current step data (using Euler-aligned state for plotting)
    const stepData = { time: t, ...currentStocks };
    Object.keys(eval1.scope).forEach(key => {
        if (!currentStocks.hasOwnProperty(key)) {
            stepData[key] = eval1.scope[key];
        }
    });
    data.push(stepData);

    // 2. RK4 Steps
    // k2 = f(t + dt/2, y + k1 * dt/2)
    const y2 = {};
    Object.keys(currentStocks).forEach(label => y2[label] = currentStocks[label] + k1[label] * dt / 2);
    const k2 = evaluateModel(y2).derivatives;

    // k3 = f(t + dt/2, y + k2 * dt/2)
    const y3 = {};
    Object.keys(currentStocks).forEach(label => y3[label] = currentStocks[label] + k2[label] * dt / 2);
    const k3 = evaluateModel(y3).derivatives;

    // k4 = f(t + dt, y + k3 * dt)
    const y4 = {};
    Object.keys(currentStocks).forEach(label => y4[label] = currentStocks[label] + k3[label] * dt);
    const k4 = evaluateModel(y4).derivatives;

    // 3. Update stocks using RK4 weighted average
    Object.keys(currentStocks).forEach(label => {
      currentStocks[label] += (dt / 6) * (k1[label] + 2 * k2[label] + 2 * k3[label] + k4[label]);
      // Prevent negative values for biological/physical models
      if (currentStocks[label] < 0) currentStocks[label] = 0;
    });
  }

  return data;
};
