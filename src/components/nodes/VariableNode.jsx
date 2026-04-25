import React from 'react';
import { Handle, Position } from 'reactflow';
import { Variable } from 'lucide-react';
import useStore from '../../store';

const VariableNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="min-w-[140px] bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden transition-all hover:border-yellow-500/50">
      <div className="bg-yellow-500/10 px-3 py-2 flex items-center gap-2 border-b border-border">
        <Variable size={16} className="text-yellow-500" />
        <span className="font-semibold text-sm text-foreground">Variable</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <input
          className="bg-transparent border-b border-border focus:border-yellow-500 outline-none text-sm text-foreground px-1 py-0.5"
          value={data.label}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
          placeholder="Name"
        />
        <input
          type="text"
          className="bg-background border border-border rounded px-2 py-1 text-xs w-full text-foreground outline-none focus:border-yellow-500 font-mono"
          value={data.equation || data.value || ''}
          onChange={(e) => updateNodeData(id, { equation: e.target.value, value: e.target.value })}
          placeholder="Value or Eq"
        />
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500 border-2 border-card" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-500 border-2 border-card" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-500 border-2 border-card" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500 border-2 border-card" />
    </div>
  );
};

export default VariableNode;
