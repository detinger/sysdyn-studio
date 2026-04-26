import React from 'react';
import { X, Sigma } from 'lucide-react';
import { MathJax } from 'better-react-mathjax';
import { create, all } from 'mathjs';
import { buildModel } from '../simulationEngine';
import useStore from '../store';

const math = create(all);

const EquationsModal = ({ onClose }) => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const model = buildModel(nodes, edges);
  const equations = [];

  // Generate equations for stocks
  model.stocks.forEach((stock) => {
    const flows = model.stockFlows[stock.id];
    let rhsTerms = [];

    flows.inflows.forEach((flowId) => {
      const flowNode = model.nodeMap[flowId];
      if (flowNode) rhsTerms.push(`+ ${flowNode.data.label}`);
    });

    flows.outflows.forEach((flowId) => {
      const flowNode = model.nodeMap[flowId];
      if (flowNode) rhsTerms.push(`- ${flowNode.data.label}`);
    });

    let rhsString = rhsTerms.join(' ');
    if (rhsString.startsWith('+ ')) rhsString = rhsString.substring(2);
    if (!rhsString) rhsString = '0';

    // To prevent math.parse from evaluating the plus and minus, we can parse each term or just format it
    // Because we just want to display the stock derivative, we construct a latex string directly
    const texLhs = `\\frac{d\\text{${stock.data.label.replace(/_/g, '\\_')}}}{dt}`;
    
    // Attempt to parse rhsString safely, but just raw string to tex might be safer
    let texRhs = '0';
    try {
      texRhs = math.parse(rhsString).toTex();
    } catch (e) {
      texRhs = rhsString;
    }

    equations.push({
      type: 'stock',
      label: stock.data.label,
      latex: `$$${texLhs} = ${texRhs}$$`,
      initialValue: stock.data.value
    });
  });

  // Generate equations for flows
  model.flows.forEach((flow) => {
    let texRhs = flow.data.equation ? flow.data.equation : '0';
    try {
      if (flow.data.equation) {
        texRhs = math.parse(flow.data.equation).toTex();
      }
    } catch (e) {}

    const texLhs = `\\text{${flow.data.label.replace(/_/g, '\\_')}}`;
    equations.push({
      type: 'flow',
      label: flow.data.label,
      latex: `$$${texLhs} = ${texRhs}$$`
    });
  });

  // Generate equations for variables
  model.variables.forEach((variable) => {
    let texRhs = variable.data.equation ? variable.data.equation : variable.data.value || '0';
    try {
      if (variable.data.equation) {
        texRhs = math.parse(variable.data.equation).toTex();
      } else if (variable.data.value) {
        texRhs = math.parse(variable.data.value).toTex();
      }
    } catch (e) {}

    const texLhs = `\\text{${variable.data.label.replace(/_/g, '\\_')}}`;
    equations.push({
      type: 'variable',
      label: variable.data.label,
      latex: `$$${texLhs} = ${texRhs}$$`
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[800px] max-w-[90vw] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Sigma size={18} className="text-primary" /> Model Equations
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-card">
          {equations.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No equations found in the current model. Add some nodes to see their equations here.
            </div>
          ) : (
            <div className="space-y-8">
              {equations.filter(e => e.type === 'stock').length > 0 && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 border-b border-border pb-2">Stocks</h3>
                  <div className="space-y-6">
                    {equations.filter(e => e.type === 'stock').map((eq, i) => (
                      <div key={i} className="bg-muted/30 p-4 rounded-lg border border-border">
                        <MathJax>{eq.latex}</MathJax>
                        {eq.initialValue !== undefined && (
                          <div className="text-xs text-muted-foreground mt-2 text-center">
                            Initial Value: {eq.initialValue}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {equations.filter(e => e.type === 'flow').length > 0 && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-4 border-b border-border pb-2">Flows</h3>
                  <div className="space-y-6">
                    {equations.filter(e => e.type === 'flow').map((eq, i) => (
                      <div key={i} className="bg-muted/30 p-4 rounded-lg border border-border">
                        <MathJax>{eq.latex}</MathJax>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {equations.filter(e => e.type === 'variable').length > 0 && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500 mb-4 border-b border-border pb-2">Variables</h3>
                  <div className="space-y-6">
                    {equations.filter(e => e.type === 'variable').map((eq, i) => (
                      <div key={i} className="bg-muted/30 p-4 rounded-lg border border-border">
                        <MathJax>{eq.latex}</MathJax>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquationsModal;
