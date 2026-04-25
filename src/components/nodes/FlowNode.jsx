import React from 'react';
import { Handle, Position } from 'reactflow';
import { MoveRight } from 'lucide-react';
import useStore from '../../store';

const FlowNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="min-w-[160px] bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden transition-all hover:border-blue-500/50">
      <div className="bg-blue-500/10 px-3 py-2 flex items-center gap-2 border-b border-border">
        <MoveRight size={16} className="text-blue-500" />
        <span className="font-semibold text-sm text-foreground">Flow</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <input 
          className="bg-transparent border-b border-border focus:border-blue-500 outline-none text-sm text-foreground px-1 py-0.5" 
          value={data.label} 
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
          placeholder="Name"
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Equation / Rate:</span>
          <input 
            type="text"
            className="bg-background border border-border rounded px-2 py-1 text-xs w-full text-foreground outline-none focus:border-blue-500 font-mono"
            value={data.equation || ''}
            onChange={(e) => updateNodeData(id, { equation: e.target.value })}
            placeholder="e.g. pop * 0.05"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-card" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-card" />
      <Handle type="target" position={Position.Top} id="info" className="w-3 h-3 bg-yellow-500 border-2 border-card border-dashed" />
      <Handle type="source" position={Position.Bottom} id="info" className="w-3 h-3 bg-yellow-500 border-2 border-card border-dashed" />
    </div>
  );
};

export default FlowNode;
