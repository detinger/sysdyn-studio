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
      {/*
        Every side can both receive and send information. Order matters:
        - Edges saved without a handle id attach to the FIRST target (Left) and
          the FIRST source (Right), as in models created before these ports existed.
        - Sources come after targets so they sit on top: dragging from any side
          starts a link; dropping onto any side ends one.
      */}
      <Handle type="target" position={Position.Left} className="info-port" />
      <Handle type="target" position={Position.Right} id="in-right" className="info-port" />
      <Handle type="target" position={Position.Bottom} id="in-bottom" className="info-port" />
      <Handle type="target" position={Position.Top} id="info" className="info-port" />
      <Handle type="source" position={Position.Right} className="info-port" />
      <Handle type="source" position={Position.Bottom} id="info" className="info-port" />
      <Handle type="source" position={Position.Top} id="out-top" className="info-port" />
      <Handle type="source" position={Position.Left} id="out-left" className="info-port" />
    </div>
  );
};

export default memo(VariableNode);
