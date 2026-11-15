import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { fmtNum } from '../../utils/format';
import { IssueMarker } from './nodeCommon';
import { usePlaybackValue, useRunStale } from './hooks';

/** Stock (level): a plain rectangle. Material enters left (inflow) and leaves right (outflow). */
const StockNode = ({ id, data, selected }) => {
  const value = usePlaybackValue(id);
  const stale = useRunStale();
  const showValue = value !== undefined && !stale;
  return (
    <div className={`sd-node sd-stock${selected ? ' selected-ring' : ''}`} title={`Stock · ${data.label}${data.unit ? ` · ${data.unit}` : ''}`}>
      <IssueMarker id={id} />
      <div className="sd-label">{data.label}</div>
      <div className="sd-meta">
        {showValue ? <span className="sd-value">{fmtNum(value)}</span> : <>initial {data.value === undefined || data.value === '' ? '—' : String(data.value)}</>}
        {data.unit ? ` ${data.unit}` : ''}
      </div>
      {/* Order matters: React Flow resolves edges without a handle id to the first handle of each type. */}
      <Handle type="target" position={Position.Top} className="info-port" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className="info-port" title="Information: use this stock's value in an equation" />
      <Handle type="target" position={Position.Left} id="inflow" className="material-port" title="Inflow port: connect a flow into this stock" />
      <Handle type="source" position={Position.Right} id="outflow" className="material-port" title="Outflow port: connect this stock to a draining flow" />
    </div>
  );
};

export default memo(StockNode);
