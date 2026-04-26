import React from 'react';
import { Handle, Position } from 'reactflow';
import { Variable } from 'lucide-react';
import useStore from '../../store';

const VariableNode = ({ id, data }) => {
  const updateNodeData = useStore((state) => state.updateNodeData);

  return (
    <div className="px-4 py-3 shadow-xl rounded-lg bg-card border-2 border-yellow-500 min-w-[150px]">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-yellow-500/10 rounded-md">
          <Variable className="w-5 h-5 text-yellow-500" />
        </div>
        <input
          className="bg-transparent font-bold text-sm outline-none w-full"
          value={data.label}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded border border-border/50">
        <input
          className="bg-transparent text-xs outline-none w-full text-center"
          value={data.value || data.equation}
          onChange={(e) => updateNodeData(id, { value: e.target.value, equation: e.target.value })}
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
