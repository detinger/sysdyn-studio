import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, ControlButton, MiniMap, useReactFlow } from 'reactflow';
import { Plus, Map as MapIcon } from 'lucide-react';
import useStore from '../../store';
import StockNode from '../../components/nodes/StockNode';
import FlowNode from '../../components/nodes/FlowNode';
import VariableNode from '../../components/nodes/VariableNode';
import { MaterialEdge, InfoEdge, InvalidEdge, EdgeMarkers } from './edges';
import { LegendLine, StockGlyph, ValveGlyph, AuxGlyph } from '../../components/ui/Glyphs';
import { EXAMPLE_LIBRARY } from '../library/catalog';
import ChallengeCard from '../challenges/ChallengeCard';

const nodeTypes = { stock: StockNode, flow: FlowNode, variable: VariableNode };
const edgeTypes = { material: MaterialEdge, info: InfoEdge, invalid: InvalidEdge };

export default function Canvas() {
  const wrapper = useRef(null);
  const rf = useReactFlow();
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const onConnect = useStore((s) => s.onConnect);
  const onSelectionChange = useStore((s) => s.onSelectionChange);
  const onNodeDragStart = useStore((s) => s.onNodeDragStart);
  const addNode = useStore((s) => s.addNode);
  const checkConnection = useStore((s) => s.checkConnection);
  const focusRequest = useStore((s) => s.focusRequest);
  const loadModel = useStore((s) => s.loadModel);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!focusRequest) return;
    const t = setTimeout(() => {
      if (focusRequest.fit) rf.fitView({ padding: 0.15, maxZoom: 1, duration: 250 });
      else if (focusRequest.id) {
        const node = rf.getNode(focusRequest.id);
        if (node) rf.fitView({ nodes: [{ id: node.id }], padding: 1.2, maxZoom: 1.2, duration: 300 });
      }
    }, 30);
    return () => clearTimeout(t);
  }, [focusRequest, rf]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    addNode(type, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }, [rf, addNode]);

  const isValidConnection = useCallback((c) => checkConnection(c).ok, [checkConnection]);

  const onNodeDoubleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('sds:focus-inspector'));
  }, []);

  const inventory = EXAMPLE_LIBRARY.find((x) => x.key === 'INVENTORY_CONTROL');

  return (
    <div className="canvas-wrap" ref={wrapper} aria-label="Stock-and-flow canvas">
      <EdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDoubleClick={onNodeDoubleClick}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Shift']}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls position="top-left" showInteractive={false}>
          <ControlButton onClick={() => setShowMap((m) => !m)} aria-label={showMap ? 'Hide overview map' : 'Show overview map'} title={showMap ? 'Hide overview map' : 'Show overview map'} aria-pressed={showMap}>
            <MapIcon size={14} />
          </ControlButton>
        </Controls>
        {showMap && (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={() => 'var(--border-strong)'}
            nodeStrokeColor={() => 'var(--sd-stroke)'}
            maskColor="color-mix(in srgb, var(--bg-sunken) 60%, transparent)"
            style={{ width: 160, height: 100 }}
            ariaLabel="Model overview map"
          />
        )}
      </ReactFlow>

      <div className="canvas-legend" aria-label="Notation legend">
        <span className="flex items-center gap-1"><StockGlyph size={14} /> Stock</span>
        <span className="flex items-center gap-1"><ValveGlyph size={18} className="" /> Flow</span>
        <span className="flex items-center gap-1"><AuxGlyph size={14} /> Auxiliary</span>
        <span className="flex items-center gap-1"><AuxGlyph size={14} param /> Parameter</span>
        <span className="flex items-center gap-1"><LegendLine kind="material" /> Material</span>
        <span className="flex items-center gap-1"><LegendLine kind="info" /> Information</span>
      </div>

      <ChallengeCard />

      {nodes.length === 0 && (
        <div className="canvas-empty">
          <div className="card">
            <h3>Start a model</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              Add a stock to represent an accumulated quantity, then add flows that fill or drain it. Or open a worked example.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button className="btn btn-primary" onClick={() => addNode('stock', { x: 0, y: 0 })}><Plus size={16} /> Add stock</button>
              {inventory && <button className="btn" onClick={() => loadModel(inventory.model)}>Open inventory example</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
