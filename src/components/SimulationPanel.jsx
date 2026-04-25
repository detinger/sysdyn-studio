import React, { useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Timer, Cpu, FastForward, Layout, Info, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, LabelList } from 'recharts';
import useStore from '../store';

const SimulationPanel = () => {
  const { 
    isPlaying, 
    togglePlay, 
    resetSimulation, 
    simulationData, 
    currentTime,
    maxTime,
    setMaxTime,
    timeStep,
    setTimeStep,
    playbackSpeed,
    setPlaybackSpeed,
    hiddenLines,
    setHiddenLine,
    modelColors,
    visibleVariables,
    currentModelName,
    currentModelDescription
  } = useStore();

  const [showInfo, setShowInfo] = useState(false);

  const toggleLine = (dataKey) => {
    if (dataKey) {
      setHiddenLine(dataKey, !hiddenLines[dataKey]);
    }
  };

  const CustomLegend = useMemo(() => ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 text-[10px] mt-1 pb-1">
        {payload.map((entry, index) => {
          const isHidden = hiddenLines[entry.dataKey];
          return (
            <div 
              key={`item-${index}`} 
              className={`flex items-center gap-1 cursor-pointer transition-all hover:opacity-80 ${isHidden ? 'opacity-30 grayscale' : 'opacity-100'}`}
              onClick={() => toggleLine(entry.dataKey)}
            >
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
              <span className="text-foreground font-medium">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }, [hiddenLines]);

  const { allKeys, displayKeys, barData } = useMemo(() => {
    if (simulationData.length === 0) return { allKeys: [], displayKeys: [], barData: [] };
    
    const sample = simulationData[0];
    const keys = Object.keys(sample).filter(key => key !== 'time');
    const dKeys = visibleVariables ? keys.filter(key => visibleVariables.includes(key)) : keys;
    
    const currentData = simulationData[simulationData.length - 1];
    const bData = dKeys.map(key => ({
      name: key,
      value: currentData ? currentData[key] : 0,
      color: modelColors[key] || `hsl(${keys.indexOf(key) * 60}, 70%, 50%)`
    }));

    return { allKeys: keys, displayKeys: dKeys, barData: bData };
  }, [simulationData, visibleVariables, modelColors]);

  return (
    <div className="h-80 bg-card border-t border-border flex flex-col shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden">
      <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-background/50 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          {currentModelDescription && (
            <button 
              onClick={() => setShowInfo(true)}
              className="p-1.5 hover:bg-primary/20 text-primary rounded-md transition-colors mr-1"
              title="Model Information"
            >
              <Info size={18} />
            </button>
          )}

          <h2 className="text-sm font-semibold flex items-center gap-2 mr-2">
            Sim
            <span className="text-xs font-normal text-muted-foreground">T: {Math.round(currentTime)}</span>
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded border border-border">
              <Timer size={12} className="text-muted-foreground" />
              <span className="text-[9px] uppercase font-bold text-muted-foreground whitespace-nowrap">Time</span>
              <input 
                type="range" min="10" max="1000" step="10"
                value={maxTime} 
                onChange={(e) => setMaxTime(parseInt(e.target.value))}
                className="w-16 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-mono text-foreground w-6">{maxTime}</span>
            </div>

            <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded border border-border">
              <Cpu size={12} className="text-muted-foreground" />
              <span className="text-[9px] uppercase font-bold text-muted-foreground whitespace-nowrap">dt</span>
              <input 
                type="range" min="0.01" max="0.5" step="0.01"
                value={timeStep} 
                onChange={(e) => setTimeStep(parseFloat(e.target.value))}
                className="w-16 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-mono text-foreground w-8">{timeStep.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded border border-border">
              <FastForward size={12} className="text-muted-foreground" />
              <span className="text-[9px] uppercase font-bold text-muted-foreground whitespace-nowrap">Speed</span>
              <input 
                type="range" min="1" max="50" step="1"
                value={playbackSpeed} 
                onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                className="w-16 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] font-mono text-foreground w-6">{playbackSpeed}x</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={resetSimulation}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw size={16} />
          </button>
          
          <button 
            onClick={togglePlay}
            className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-sm font-semibold transition-all ${isPlaying ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'}`}
          >
            {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run</>}
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-[2] p-4 flex flex-col border-r border-border min-w-0">
          {simulationData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Play size={48} className="mb-2 opacity-10" />
              <p className="text-sm">Ready to simulate.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(tick) => Math.round(tick)}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '11px' }}
                />
                <Legend content={<CustomLegend />} />
                {displayKeys.map((key, index) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={modelColors[key] || `hsl(${(index * 60) % 360}, 70%, 50%)`} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                    hide={hiddenLines[key] === true}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col bg-muted/10">
          <div className="flex items-center gap-2 mb-4">
            <Layout size={14} className="text-primary" />
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Current States</h3>
          </div>
          
          {simulationData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center opacity-20">
               <div className="w-full h-full bg-gradient-to-t from-border to-transparent rounded-t-xl"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 35 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={10} width={80} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={hiddenLines[entry.name] ? 0.2 : 0.8} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={(val) => Math.round(val)} 
                    style={{ fill: 'hsl(var(--foreground))', fontSize: '10px', fontWeight: 'bold' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[600px] max-w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-bold flex items-center gap-3 text-foreground">
                <Info className="text-primary" /> {currentModelName || 'Model Information'}
              </h2>
              <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-secondary rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 text-muted-foreground leading-relaxed text-sm">
              <p>{currentModelDescription}</p>
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end">
              <button 
                onClick={() => setShowInfo(false)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;
