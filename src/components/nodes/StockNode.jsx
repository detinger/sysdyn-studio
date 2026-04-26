import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database } from 'lucide-react';
import useStore from '../../store';

const StockNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="px-4 py-3 shadow-xl rounded-lg bg-card border-2 border-primary min-w-[150px]">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-md">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <input
          className="bg-transparent font-bold text-sm outline-none w-full"
          value={data.label}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] uppercase text-muted-foreground font-semibold">Initial Value</label>
        <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded border border-border/50">
          <input
            type="number"
            className="bg-transparent text-xs outline-none w-full"
            value={data.value}
            onChange={(e) => updateNodeData(id, { value: e.target.value })}
            placeholder="0"
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
