import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database } from 'lucide-react';
import useStore from '../../store';

const StockNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="min-w-[150px] bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden transition-all hover:border-primary/50">
      <div className="bg-primary/10 px-3 py-2 flex items-center gap-2 border-b border-border">
        <Database size={16} className="text-primary" />
        <span className="font-semibold text-sm text-foreground">Stock</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <input 
          className="bg-transparent border-b border-border focus:border-primary outline-none text-sm text-foreground px-1 py-0.5" 
          value={data.label} 
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
          placeholder="Name"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Initial:</span>
          <input 
            type="number"
            className="bg-background border border-border rounded px-2 py-1 text-xs w-full text-foreground outline-none focus:border-primary"
            value={data.value || 0}
            onChange={(e) => updateNodeData(id, { value: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-2 border-card" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-card" />
      <Handle type="target" position={Position.Left} id="inflow" className="w-3 h-3 bg-green-500 border-2 border-card" />
      <Handle type="source" position={Position.Right} id="outflow" className="w-3 h-3 bg-red-500 border-2 border-card" />
    </div>
  );
};

export default StockNode;
