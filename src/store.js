import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { runSimulation } from './simulationEngine';

const useStore = create((set, get) => {
  let animationFrameId = null;
  let lastFrameTime = 0;

  return {
    nodes: [],
    edges: [],
    simulationData: [],
    isPlaying: false,
    timeStep: 0.1,
    currentTime: 0,
    maxTime: 100,
    playbackSpeed: 5,
    hiddenLines: {},
    modelColors: {},
    visibleVariables: null,
    
    // Metadata for Info popup
    currentModelName: '',
    currentModelDescription: '',

    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (params) => {
      const { nodes, edges } = get();
      let connection = { ...params };
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Smart direction flipping
      // 1. If dragging from a Stock to a Flow's inflow handle, it's correct.
      // 2. If dragging from a Variable to anything, it's correct (source).
      // 3. If dragging from a Stock's target handle (inflow), it might be backwards.
      
      let shouldFlip = false;

      // If source is a Stock and we are connecting to a Flow, 
      // check if we are using the 'outflow' source handle.
      if (sourceNode.type === 'stock' && targetNode.type === 'flow') {
        // If they dragged from an inflow handle, they probably meant the other way
        if (connection.sourceHandle === 'inflow') shouldFlip = true;
      }

      // If source is a Flow and we are connecting to a Stock,
      // check if we are using the target handle of the flow
      if (sourceNode.type === 'flow' && targetNode.type === 'stock') {
        if (connection.targetHandle !== 'inflow') shouldFlip = true;
      }

      if (shouldFlip) {
        connection = {
          source: params.target,
          target: params.source,
          sourceHandle: params.targetHandle,
          targetHandle: params.sourceHandle,
        };
      }

      const isInfo = 
        sourceNode?.type === 'variable' || 
        targetNode?.type === 'variable' || 
        connection.sourceHandle === 'info' || 
        connection.targetHandle === 'info';

      set({
        edges: addEdge({ 
          ...connection, 
          animated: true,
          className: isInfo ? 'info-edge' : ''
        }, edges),
      });
    },
    addNode: (node) => {
      set({
        nodes: [...get().nodes, node],
      });
    },
    loadModel: (model) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      set({ 
        nodes: model.nodes, 
        edges: model.edges, 
        simulationData: [], 
        isPlaying: false, 
        currentTime: 0, 
        maxTime: model.maxTime || 100,
        visibleVariables: model.visibleVariables || null,
        modelColors: model.colors || {},
        currentModelName: model.name || '',
        currentModelDescription: model.description || '',
        hiddenLines: {} 
      });
    },
    clearCanvas: () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      set({
        nodes: [],
        edges: [],
        simulationData: [],
        isPlaying: false,
        currentTime: 0,
        visibleVariables: null,
        modelColors: {},
        currentModelName: '',
        currentModelDescription: '',
        hiddenLines: {}
      });
    },
    setHiddenLine: (dataKey, isHidden) => {
      set({
        hiddenLines: { ...get().hiddenLines, [dataKey]: isHidden }
      });
    },
    setMaxTime: (time) => {
      set({ maxTime: time });
    },
    setTimeStep: (dt) => {
      set({ timeStep: dt });
    },
    setPlaybackSpeed: (speed) => {
      set({ playbackSpeed: speed });
    },
    updateNodeData: (nodeId, data) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        }),
      });
    },
    togglePlay: () => {
      const state = get();
      
      if (!state.isPlaying) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        const fullData = runSimulation(state.nodes, state.edges, state.timeStep, state.maxTime);
        set({ isPlaying: true, simulationData: [], currentTime: 0 });

        let index = 0;
        
        const animate = (timestamp) => {
          const currentState = get();
          
          if (!currentState.isPlaying || index >= fullData.length) {
            set({ isPlaying: false });
            return;
          }

          const elapsed = timestamp - lastFrameTime;
          if (elapsed > 16) {
            lastFrameTime = timestamp;
            
            const stepsToAdvance = Math.max(1, Math.floor(currentState.playbackSpeed));
            index = Math.min(index + stepsToAdvance, fullData.length - 1);
            
            set({ 
              simulationData: fullData.slice(0, index + 1),
              currentTime: fullData[index].time
            });

            if (index >= fullData.length - 1) {
              set({ isPlaying: false });
              return;
            }
          }
          
          animationFrameId = requestAnimationFrame(animate);
        };
        
        animationFrameId = requestAnimationFrame(animate);
      } else {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        set({ isPlaying: false });
      }
    },
    resetSimulation: () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      set({ currentTime: 0, simulationData: [], isPlaying: false });
    },
  };
});

export default useStore;
