import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Cloud } from 'lucide-react';
import useStore from '../../store';
import { ValveGlyph } from '../ui/Glyphs';
import { fmtNum } from '../../utils/format';
import { IssueMarker } from './nodeCommon';
import { usePlaybackValue, useRunStale } from './hooks';

/** Flow (rate): a valve on a pipe. Open ends are drawn as clouds (model boundary). */
const FlowNode = ({ id, data, selected }) => {
  const ends = useStore((s) => {
    let src = false;
    let tgt = false;
    s.edges.forEach((e) => {
      if (e.target === id && e.data?.kind === 'outflow') src = true;
      if (e.source === id && e.data?.kind === 'inflow') tgt = true;
    });
    return `${src ? 1 : 0}${tgt ? 1 : 0}`;
  });
  const value = usePlaybackValue(id);
  const stale = useRunStale();
  return (
    <div className={`sd-node sd-flow${selected ? ' selected-ring' : ''}`} title={`Flow · ${data.label}${data.unit ? ` · ${data.unit}` : ''}${data.equation ? ` = ${data.equation}` : ''}`}>
      <IssueMarker id={id} />
      {ends[0] === '0' && (<><span className="cloud-pipe left" /><Cloud size={22} className="cloud left" aria-label="Source outside the model boundary" /></>)}
      {ends[1] === '0' && (<><span className="cloud-pipe right" /><Cloud size={22} className="cloud right" aria-label="Sink outside the model boundary" /></>)}
      <ValveGlyph size={36} />
      <div className="below">
        <div className="sd-label">{data.label}</div>
        {value !== undefined && !stale && <div className="sd-value">{fmtNum(value)}{data.unit ? ` ${data.unit}` : ''}</div>}
      </div>
      <Handle type="target" position={Position.Left} className="material-port" title="Material in: from a stock's outflow port" />
      <Handle type="source" position={Position.Right} className="material-port" title="Material out: into a stock's inflow port" />
      <Handle type="target" position={Position.Top} id="info" className="info-port" title="Information in: values this rate depends on" />
      {/* Information can also arrive from below; the source is rendered last so dragging from the bottom starts a link. */}
      <Handle type="target" position={Position.Bottom} id="info-bottom" className="info-port" title="Information in (from below)" />
      <Handle type="source" position={Position.Bottom} id="info" className="info-port" title="Information out" />
    </div>
  );
};

export default memo(FlowNode);
