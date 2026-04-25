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
    onConnect: (connection) => {
      set({
        edges: addEdge({ ...connection, animated: true }, get().edges),
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
