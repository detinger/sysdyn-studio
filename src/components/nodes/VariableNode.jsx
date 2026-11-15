import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { variableExpression } from '../../domain/model/semantics';
import { parseExpression, isNumericLiteral } from '../../domain/equations/expression';
import { fmtNum } from '../../utils/format';
import { IssueMarker } from './nodeCommon';
import { usePlaybackValue, useRunStale } from './hooks';

/** Auxiliary (circle) or parameter (circle with constant bar). All ports carry information. */
const VariableNode = ({ id, data, selected }) => {
  const expr = variableExpression(data);
  const isParam = isNumericLiteral(parseExpression(expr).ast);
  const value = usePlaybackValue(id);
  const stale = useRunStale();
  return (
    <div className={`sd-node sd-var${isParam ? ' param' : ''}${selected ? ' selected-ring' : ''}`} title={`${isParam ? 'Parameter' : 'Auxiliary'} · ${data.label}${data.unit ? ` · ${data.unit}` : ''} = ${expr}`}>
      <IssueMarker id={id} />
      <div className="below">
        <div className="sd-label">{data.label}</div>
        <div className={value !== undefined && !stale && !isParam ? 'sd-value' : 'sd-meta'}>
          {isParam ? expr : value !== undefined && !stale ? fmtNum(value) : ''}
          {data.unit && (isParam || (value !== undefined && !stale)) ? ` ${data.unit}` : ''}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="info-port" />
      <Handle type="source" position={Position.Right} className="info-port" />
      <Handle type="target" position={Position.Top} id="info" className="info-port" />
      <Handle type="source" position={Position.Bottom} id="info" className="info-port" />
    </div>
  );
};

export default memo(VariableNode);
