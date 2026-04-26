import React, { useState, useEffect } from 'react';
import { Database, MoveRight, Variable, FileCode, FolderOpen, X, Copy, Check, Code, Trash2, BookOpen, Sigma } from 'lucide-react';
import useStore from '../store';
import { generatePythonCode } from '../pythonExporter';
import { generateRCode } from '../rExporter';
import { POPULATION_EXTENDED, PREDATOR_PREY, SIR_MODEL, ADOPTION_MODEL, CARRYING_CAPACITY, INVENTORY_CONTROL, WORLD3_MODEL } from '../examples';
import EquationsModal from './EquationsModal';

import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-r';
import 'prismjs/themes/prism-tomorrow.css';

const Sidebar = () => {
  const { clearCanvas } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [showEquationsModal, setShowEquationsModal] = useState(false);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (showModal) {
      Prism.highlightAll();
    }
  }, [showModal, code, lang]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleExport = (type) => {
    const { nodes, edges, maxTime, visibleVariables } = useStore.getState();
    let generated = '';
    if (type === 'python') {
      generated = generatePythonCode(nodes, edges, 0.1, maxTime, visibleVariables);
      setLang('python');
    } else {
      generated = generateRCode(nodes, edges, 0.1, maxTime, visibleVariables);
      setLang('r');
    }
    setCode(generated);
    setShowModal(true);
    setCopied(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = (model) => {
    useStore.getState().loadModel(model);
  };

  return (
    <>
      <div className="w-64 bg-card border-r border-border p-4 flex flex-col h-full shadow-2xl z-10 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">SysDyn Studio</h1>
          <p className="text-xs text-muted-foreground mt-1">Interactive System Dynamics</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowTheoryModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-2 rounded-md text-xs font-semibold transition-all uppercase tracking-wider"
          >
            <BookOpen size={14} />
            Theory
          </button>

          <button
            onClick={() => setShowEquationsModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 py-2 rounded-md text-xs font-semibold transition-all uppercase tracking-wider"
          >
            <Sigma size={14} />
            Eqs
          </button>

          <button
            onClick={clearCanvas}
            className="flex-1 flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 py-2 rounded-md text-xs font-semibold transition-all uppercase tracking-wider"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Components</h2>

        <div className="flex flex-col gap-3">
          <div className="bg-background border border-border p-3 rounded-lg cursor-grab hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-3 shadow-sm"
            onDragStart={(event) => onDragStart(event, 'stock')} draggable>
            <div className="p-2 bg-primary/10 rounded-md"><Database size={18} className="text-primary" /></div>
            <div>
              <div className="text-sm font-medium">Stock</div>
              <div className="text-xs text-muted-foreground">Accumulates</div>
            </div>
          </div>

          <div className="bg-background border border-border p-3 rounded-lg cursor-grab hover:border-red-500/50 hover:bg-red-500/5 transition-colors flex items-center gap-3 shadow-sm"
            onDragStart={(event) => onDragStart(event, 'flow')} draggable>
            <div className="p-2 bg-red-500/10 rounded-md"><MoveRight size={18} className="text-red-500" /></div>
            <div>
              <div className="text-sm font-medium">Flow</div>
              <div className="text-xs text-muted-foreground">Rate of change</div>
            </div>
          </div>

          <div className="bg-background border border-border p-3 rounded-lg cursor-grab hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-colors flex items-center gap-3 shadow-sm"
            onDragStart={(event) => onDragStart(event, 'variable')} draggable>
            <div className="p-2 bg-yellow-500/10 rounded-md"><Variable size={18} className="text-yellow-500" /></div>
            <div>
              <div className="text-sm font-medium">Variable</div>
              <div className="text-xs text-muted-foreground">Equations</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Examples</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => loadExample(POPULATION_EXTENDED)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> Population
            </button>
            <button onClick={() => loadExample(PREDATOR_PREY)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> Predator-Prey
            </button>
            <button onClick={() => loadExample(SIR_MODEL)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> Epidemic (SIR)
            </button>
            <button onClick={() => loadExample(ADOPTION_MODEL)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> Innovation Adoption
            </button>
            <button onClick={() => loadExample(CARRYING_CAPACITY)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> Carrying Capacity
            </button>
            <button onClick={() => loadExample(INVENTORY_CONTROL)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> Inventory Control
            </button>
            <button onClick={() => loadExample(WORLD3_MODEL)} className="w-full flex items-center gap-2 bg-background border border-border hover:border-primary/50 hover:text-primary transition-colors p-2 rounded-md text-sm text-left">
              <FolderOpen size={16} className="text-muted-foreground" /> World3 (Club of Rome)
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8 flex flex-col gap-2">
          <button onClick={() => handleExport('python')} className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-md text-sm font-medium transition-colors border border-border">
            <FileCode size={16} />
            Export Python Code
          </button>
          <button onClick={() => handleExport('r')} className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-md text-sm font-medium transition-colors border border-border">
            <FileCode size={16} />
            Export R Code
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[800px] max-w-[90vw] max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <FileCode size={18} className="text-primary" /> {lang === 'python' ? 'Python Code (Colab)' : 'R Code'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#1d1f21]">
              <pre className={`line-numbers language-${lang} text-[9px] leading-tight`}>
                <code className={`language-${lang}`}>
                  {code}
                </code>
              </pre>
            </div>

            <div className="p-4 border-t border-border bg-card flex justify-end">
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-6 rounded-md text-sm font-medium transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTheoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[800px] max-w-full max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                <BookOpen className="text-primary" /> System Dynamics Theory
              </h2>
              <button onClick={() => setShowTheoryModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-secondary rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8 text-muted-foreground leading-relaxed">

              <section>
                <h3 className="text-lg font-bold text-foreground mb-3 border-b border-border pb-2">1. Introduction to System Dynamics</h3>
                <p>System Dynamics (SD) is a computer-aided approach to policy analysis and design. It applies to dynamic problems arising in complex social, managerial, economic, or ecological systems. It is fundamentally focused on understanding how things change over time, characterized by interdependence, mutual interaction, information feedback, and circular causality.</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">2. Core Building Blocks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/30 p-5 rounded-lg border border-border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-foreground"><Database size={16} className="text-primary" /> Stocks (Accumulations)</h4>
                    <p className="text-sm">Stocks represent accumulations within the system. They describe the current state of the system and generate the information upon which decisions and actions are based. They provide "memory" to a system.<br /><br /><strong className="text-foreground text-xs">Examples:</strong> Population, water in a tub, bank balance, inventory.</p>
                  </div>
                  <div className="bg-secondary/30 p-5 rounded-lg border border-border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-foreground"><MoveRight size={16} className="text-red-500" /> Flows (Rates)</h4>
                    <p className="text-sm">Flows represent the rate of change of the stocks over time. They are the <i>only</i> way stocks can change. If time stops, flows disappear, but stocks remain.<br /><br /><strong className="text-foreground text-xs">Examples:</strong> Birth rate (inflow), water draining (outflow), spending.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-3 border-b border-border pb-2">3. Feedback Loops</h3>
                <p className="mb-3">The interactions between stocks, flows, and variables create feedback loops. These loops are the fundamental structural elements that generate dynamic behavior over time:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-foreground">Reinforcing (Positive) Feedback:</strong> Generates exponential growth or collapse. It acts as an engine of growth. <i>Example: More infected people cause a higher infection rate, which leads to even more infected people.</i></li>
                  <li><strong className="text-foreground">Balancing (Negative) Feedback:</strong> Seeks equilibrium and goal-seeking behavior. It acts as a stabilizing force. <i>Example: A thermostat turning off the heat when the target temperature is reached, or a population dying off due to lack of resources.</i></li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-foreground mb-3 border-b border-border pb-2">4. Numerical Integration</h3>
                <p className="mb-3">Because these systems are defined by interconnected differential equations, analytical solutions are often impossible. Instead, we use numerical methods to step through time and simulate the behavior:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-foreground">Euler Method:</strong> A simple method that calculates the rate of change at the start of a time step and projects it forward. Fast, but can introduce significant error (instability) for highly oscillating systems.</li>
                  <li><strong className="text-foreground">Runge-Kutta 4 (RK4):</strong> The powerful solver used by default in this tool. It evaluates the derivatives four times per step (start, twice at midpoint, and end), providing highly accurate and stable simulations even for complex, continuous dynamics like predator-prey cycles.</li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      )}

      {showEquationsModal && <EquationsModal onClose={() => setShowEquationsModal(false)} />}
    </>
  );
};

export default Sidebar;
