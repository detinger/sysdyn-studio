/**
 * Application state (Zustand).
 *
 * Separation (PLAN.md §3.2):
 * - Editable model: nodes, edges, meta, simConfig, view. Semantic edits bump
 *   `revision` and are undoable.
 * - Results: `run` is an immutable record produced by the solver and tagged
 *   with the model revision it was computed from. Editing the model never
 *   rewrites a run; the UI shows "out of date" instead.
 * - Playback: `playback.index` points into `run.times`. Speed changes how
 *   fast the cursor moves, never the solver dt.
 */
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { normalizeEdges, normalizeEdge } from './features/modeler/edgeModel.js';
import { classifyEdge, LINK, HANDLES, NODE_TYPES } from './domain/model/semantics.js';
import { runModel } from './domain/simulation/runModel.js';
import { DEFAULT_CONFIG } from './domain/simulation/solver.js';
import { migrateDocument, fromDocument, toDocument, parseDocumentText } from './domain/model/document.js';
import { renameInEquation } from './domain/equations/rename.js';
import { getValidation } from './state/validation.js';

const HISTORY_LIMIT = 100;
const GROUP_MS = 800;

let animationFrameId = null;
let lastFrameTime = 0;
let toastId = 0;

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const stopAnimation = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
};

const DEFAULT_NAMES = { stock: 'Stock', flow: 'flow', variable: 'variable' };

const emptyModel = () => ({
  nodes: [],
  edges: [],
  meta: { id: uid('model'), name: 'Untitled model', description: '', source: '' },
  simConfig: { ...DEFAULT_CONFIG },
  view: { visibleVariables: null, colors: {} },
});

const useStore = create((set, get) => {
  const snapshot = () => {
    const { nodes, edges, meta, simConfig, view } = get();
    return { nodes, edges, meta, simConfig, view };
  };

  /** Record an undo point before a semantic change. */
  const pushHistory = (group = null) => {
    const { history } = get();
    const now = Date.now();
    if (group && history.lastGroup === group && now - history.lastAt < GROUP_MS) {
      set({ history: { ...history, lastAt: now } });
      return;
    }
    const past = [...history.past, snapshot()].slice(-HISTORY_LIMIT);
    set({ history: { past, future: [], lastGroup: group, lastAt: now } });
  };

  const commit = (patch, { semantic = true } = {}) => {
    set((s) => ({
      ...patch,
      revision: semantic ? s.revision + 1 : s.revision,
      dirty: true,
    }));
  };

  const toast = (message, kind = 'info', ms = 4000) => {
    toastId += 1;
    const id = toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ms);
  };

  const uniqueName = (base) => {
    const names = new Set(get().nodes.map((n) => n.data?.label));
    let i = 1;
    while (names.has(`${base}_${i}`)) i += 1;
    return `${base}_${i}`;
  };

  const applyModelState = (state, { label = 'Model loaded', keepHistory = true } = {}) => {
    stopAnimation();
    if (keepHistory) pushHistory();
    set((s) => ({
      nodes: state.nodes,
      edges: normalizeEdges(state.edges, state.nodes),
      meta: { ...emptyModel().meta, ...state.meta },
      simConfig: { ...DEFAULT_CONFIG, ...state.simulation },
      view: { visibleVariables: null, colors: {}, ...state.view },
      revision: s.revision + 1,
      run: null,
      baseline: null,
      playback: { index: 0, isPlaying: false, speed: s.playback.speed },
      selectedId: null,
      hiddenLines: {},
      dirty: true,
      focusRequest: { fit: true, at: Date.now() },
    }));
    if (label) toast(label, 'success', 2500);
  };

  return {
    ...emptyModel(),
    revision: 0,
    dirty: false,
    savedAt: null,
    history: { past: [], future: [], lastGroup: null, lastAt: 0 },
    selectedId: null,
    focusRequest: null,
    run: null,
    lastValidationBlocked: null,
    baseline: null,
    playback: { index: 0, isPlaying: false, speed: 5 },
    hiddenLines: {},
    toasts: [],
    view_route: 'home',
    challenge: null, // { id, answers, hintsShown, revealed }

    // ---------- navigation ----------
    setRoute: (route) => set({ view_route: route }),

    // ---------- toasts ----------
    toast,
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    // ---------- React Flow change handlers ----------
    onNodesChange: (changes) => {
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length) pushHistory();
      const semantic = removals.length > 0;
      const nodes = applyNodeChanges(changes, get().nodes);
      let edges = get().edges;
      if (removals.length) {
        const gone = new Set(removals.map((r) => r.id));
        edges = edges.filter((e) => !gone.has(e.source) && !gone.has(e.target));
      }
      const moved = changes.some((c) => c.type === 'position');
      const patch = { nodes, edges };
      if (removals.some((r) => r.id === get().selectedId)) patch.selectedId = null;
      if (semantic) commit(patch);
      else set(moved ? { ...patch, dirty: true } : patch);
    },
    onNodeDragStart: () => pushHistory(),
    onEdgesChange: (changes) => {
      const removals = changes.filter((c) => c.type === 'remove');
      if (removals.length) pushHistory();
      const edges = applyEdgeChanges(changes, get().edges);
      if (removals.length) commit({ edges });
      else set({ edges });
    },
    onSelectionChange: ({ nodes, edges }) => {
      const id = nodes[0]?.id || edges[0]?.id || null;
      if (id !== get().selectedId) set({ selectedId: id });
    },

    /** Validate a proposed connection before React Flow draws it. */
    checkConnection: (conn) => {
      const { nodes } = get();
      const s = nodes.find((n) => n.id === conn.source);
      const t = nodes.find((n) => n.id === conn.target);
      if (!s || !t || s.id === t.id) return { ok: false, reason: 'An element cannot connect to itself.' };
      const { kind, reason } = classifyEdge(conn, s, t);
      if (kind === LINK.INVALID) return { ok: false, reason };
      return { ok: true, kind };
    },

    onConnect: (params) => {
      const { nodes, edges } = get();
      let conn = { ...params };
      const s = nodes.find((n) => n.id === conn.source);
      const t = nodes.find((n) => n.id === conn.target);
      if (!s || !t) return;
      // Snap obvious intentions onto the right ports.
      if (s.type === NODE_TYPES.FLOW && t.type === NODE_TYPES.STOCK && conn.targetHandle !== HANDLES.INFLOW && conn.targetHandle !== null) {
        conn.targetHandle = HANDLES.INFLOW;
      }
      if (s.type === NODE_TYPES.FLOW && t.type === NODE_TYPES.STOCK && conn.targetHandle === null) conn.targetHandle = HANDLES.INFLOW;
      const check = get().checkConnection(conn);
      if (!check.ok) {
        toast(check.reason, 'warning');
        return;
      }
      if (edges.some((e) => e.source === conn.source && e.target === conn.target && (e.sourceHandle ?? null) === (conn.sourceHandle ?? null) && (e.targetHandle ?? null) === (conn.targetHandle ?? null))) return;
      pushHistory();
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const edge = normalizeEdge({ id: uid('link'), ...conn }, nodeMap);
      commit({ edges: [...edges, edge] });
    },

    // ---------- editing ----------
    addNode: (type, position) => {
      pushHistory();
      const id = uid(type);
      const data = { label: uniqueName(DEFAULT_NAMES[type] || type) };
      if (type === NODE_TYPES.STOCK) data.value = '0';
      const node = { id, type, position: position || { x: 100 + Math.random() * 200, y: 100 + Math.random() * 120 }, data, selected: true };
      commit({ nodes: [...get().nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), node], selectedId: id });
      return id;
    },

    updateNodeData: (nodeId, patch, { group } = {}) => {
      pushHistory(group || `data:${nodeId}:${Object.keys(patch).join(',')}`);
      const nodes = get().nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const data = { ...n.data, ...patch };
        Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
        return { ...n, data };
      });
      commit({ nodes });
    },

    /** Rename and update every equation that references the old name. */
    renameNode: (nodeId, newName) => {
      const name = String(newName).trim();
      const { nodes } = get();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.data.label === name) return { ok: true };
      if (name === '') return { ok: false, reason: 'Name cannot be empty.' };
      if (nodes.some((n) => n.id !== nodeId && n.data?.label === name)) return { ok: false, reason: `Another element is already called ${name}.` };
      const oldName = node.data.label;
      pushHistory();
      let updated = 0;
      let failed = 0;
      const next = nodes.map((n) => {
        if (n.id === nodeId) return { ...n, data: { ...n.data, label: name } };
        const data = { ...n.data };
        ['equation', 'value'].forEach((field) => {
          if (typeof data[field] !== 'string') return;
          const r = renameInEquation(data[field], oldName, name);
          if (!r.ok) failed += 1;
          if (r.changed) {
            data[field] = r.text;
            updated += 1;
          }
        });
        return { ...n, data };
      });
      const view = { ...get().view };
      if (view.visibleVariables) view.visibleVariables = view.visibleVariables.map((v) => (v === oldName ? name : v));
      if (view.colors && view.colors[oldName]) {
        view.colors = { ...view.colors, [name]: view.colors[oldName] };
        delete view.colors[oldName];
      }
      commit({ nodes: next, view });
      if (updated) toast(`Renamed ${oldName} to ${name} and updated ${updated} equation${updated > 1 ? 's' : ''}.`, 'success', 3000);
      if (failed) toast(`${failed} equation(s) could not be updated automatically. Check them in the Validate tab.`, 'warning');
      return { ok: true };
    },

    deleteElement: (id) => {
      const { nodes, edges } = get();
      pushHistory();
      commit({
        nodes: nodes.filter((n) => n.id !== id),
        edges: edges.filter((e) => e.id !== id && e.source !== id && e.target !== id),
        selectedId: null,
      });
    },

    addInfoLink: (from, to) => {
      const { nodes, edges } = get();
      if (edges.some((e) => e.source === from && e.target === to && e.data?.kind === LINK.INFO)) return;
      const target = nodes.find((n) => n.id === to);
      const conn = { source: from, target: to, sourceHandle: null, targetHandle: target && target.type !== NODE_TYPES.STOCK ? HANDLES.INFO : null };
      const check = get().checkConnection(conn);
      if (!check.ok) return toast(check.reason, 'warning');
      pushHistory();
      commit({ edges: [...edges, normalizeEdge({ id: uid('link'), ...conn }, new Map(nodes.map((n) => [n.id, n])))] });
    },

    /** Set which stock a flow drains (role 'source') or fills (role 'target'); null = cloud. */
    setFlowStock: (flowId, role, stockId) => {
      const { nodes, edges } = get();
      pushHistory();
      const keep = edges.filter((e) => {
        if (role === 'source') return !(e.target === flowId && e.data?.kind === LINK.OUTFLOW);
        return !(e.source === flowId && e.data?.kind === LINK.INFLOW);
      });
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      if (stockId) {
        const conn = role === 'source'
          ? { source: stockId, sourceHandle: HANDLES.OUTFLOW, target: flowId, targetHandle: null }
          : { source: flowId, sourceHandle: null, target: stockId, targetHandle: HANDLES.INFLOW };
        keep.push(normalizeEdge({ id: uid('link'), ...conn }, nodeMap));
      }
      commit({ edges: keep });
    },

    /** Draw information links for every dependency an equation uses but the diagram lacks. */
    syncInfoLinks: (elementId) => {
      const { nodes, edges, simConfig } = get();
      const v = getValidation(nodes, edges, simConfig);
      const deps = v.compiled.dependencies.get(elementId) || [];
      const drawn = new Set(edges.filter((e) => e.target === elementId && e.data?.kind === LINK.INFO).map((e) => e.source));
      const missing = deps.filter((d) => !drawn.has(d));
      if (!missing.length) return;
      pushHistory();
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const target = nodeMap.get(elementId);
      const added = missing.map((from) => normalizeEdge({ id: uid('link'), source: from, target: elementId, sourceHandle: null, targetHandle: target && target.type !== NODE_TYPES.STOCK ? HANDLES.INFO : null }, nodeMap));
      commit({ edges: [...edges, ...added] });
      toast(`Added ${added.length} information link${added.length > 1 ? 's' : ''}.`, 'success', 2500);
    },

    select: (id, { focus = true } = {}) => {
      const nodes = get().nodes.map((n) => (n.selected !== (n.id === id) ? { ...n, selected: n.id === id } : n));
      const edges = get().edges.map((e) => (e.selected !== (e.id === id) ? { ...e, selected: e.id === id } : e));
      set({ nodes, edges, selectedId: id, ...(focus && id ? { focusRequest: { id, at: Date.now() } } : {}) });
    },
    requestFit: () => set({ focusRequest: { fit: true, at: Date.now() } }),

    setMeta: (patch) => {
      pushHistory('meta');
      commit({ meta: { ...get().meta, ...patch } }, { semantic: false });
    },
    setSimConfig: (patch) => {
      pushHistory(`config:${Object.keys(patch).join(',')}`);
      commit({ simConfig: { ...get().simConfig, ...patch } });
    },

    // ---------- history ----------
    canUndo: () => get().history.past.length > 0,
    canRedo: () => get().history.future.length > 0,
    undo: () => {
      const { history } = get();
      if (!history.past.length) return;
      const prev = history.past[history.past.length - 1];
      stopAnimation();
      set((s) => ({
        ...prev,
        edges: normalizeEdges(prev.edges, prev.nodes),
        history: { past: history.past.slice(0, -1), future: [snapshot(), ...history.future], lastGroup: null, lastAt: 0 },
        revision: s.revision + 1,
        dirty: true,
        playback: { ...s.playback, isPlaying: false },
      }));
    },
    redo: () => {
      const { history } = get();
      if (!history.future.length) return;
      const next = history.future[0];
      stopAnimation();
      set((s) => ({
        ...next,
        edges: normalizeEdges(next.edges, next.nodes),
        history: { past: [...history.past, snapshot()], future: history.future.slice(1), lastGroup: null, lastAt: 0 },
        revision: s.revision + 1,
        dirty: true,
        playback: { ...s.playback, isPlaying: false },
      }));
    },

    // ---------- documents ----------
    /** Load a legacy example object or a native document. */
    loadModel: (model, opts = {}) => {
      const { document, errors, warnings } = migrateDocument(model);
      if (!document) {
        toast(errors.join(' '), 'error');
        return false;
      }
      const state = fromDocument(document);
      if (opts.asCopy) state.meta = { ...state.meta, id: uid('model'), source: state.meta.name };
      applyModelState(state, { label: opts.silent ? null : `Opened ${state.meta.name}` });
      warnings.forEach((w) => toast(w, 'warning'));
      return true;
    },
    importText: (text) => {
      const { state, errors, warnings, migratedFrom } = parseDocumentText(text);
      if (!state) {
        toast(errors.join(' '), 'error', 6000);
        return false;
      }
      applyModelState(state, { label: `Imported ${state.meta.name}${migratedFrom === 0 ? ' (upgraded from the older format)' : ''}` });
      warnings.forEach((w) => toast(w, 'warning', 6000));
      return true;
    },
    exportDocument: () => {
      const { nodes, edges, meta, simConfig, view, revision } = get();
      return toDocument({ nodes, edges, meta: { ...meta, revision }, simulation: simConfig, view });
    },
    newModel: () => {
      applyModelState({ ...emptyModel(), simulation: DEFAULT_CONFIG }, { label: 'New model' });
    },
    clearCanvas: () => get().newModel(),
    restoreDraft: (doc) => {
      const { document } = migrateDocument(doc);
      if (!document) return false;
      applyModelState(fromDocument(document), { label: null, keepHistory: false });
      set({ dirty: false, savedAt: Date.now() });
      return true;
    },
    markSaved: () => set({ dirty: false, savedAt: Date.now() }),

    // ---------- simulation ----------
    /** Solve the model and start playback from t = start. */
    runSimulation: ({ autoplay = true } = {}) => {
      const { nodes, edges, simConfig, revision } = get();
      stopAnimation();
      const { run, validation } = runModel(nodes, edges, simConfig, { modelRevision: revision });
      if (!run) {
        const n = validation.issues.filter((i) => i.severity === 'error').length;
        set({ lastValidationBlocked: Date.now() });
        toast(`The model has ${n} error${n === 1 ? '' : 's'}. Fix ${n === 1 ? 'it' : 'them'} before running.`, 'error');
        return null;
      }
      set({ run, playback: { ...get().playback, index: autoplay ? 0 : run.times.length - 1, isPlaying: false } });
      if (!run.completed) toast(run.failure.message, 'error', 8000);
      run.diagnostics.filter((d) => d.code === 'stocks.clamped').forEach((d) => toast(d.message, 'warning', 8000));
      if (autoplay) get().play();
      return run;
    },
    /** Legacy entry point: Run when idle, Pause when playing. */
    togglePlay: () => {
      const { run, playback, revision } = get();
      if (playback.isPlaying) return get().pause();
      if (!run || run.modelRevision !== revision) return get().runSimulation();
      return get().play();
    },
    play: () => {
      const { run } = get();
      if (!run || run.times.length === 0) return;
      stopAnimation();
      let index = get().playback.index;
      if (index >= run.times.length - 1) index = 0;
      set({ playback: { ...get().playback, index, isPlaying: true } });
      const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        set({ playback: { ...get().playback, index: run.times.length - 1, isPlaying: false } });
        return;
      }
      const animate = (ts) => {
        const s = get();
        if (!s.playback.isPlaying || s.run !== run) return;
        if (ts - lastFrameTime > 16) {
          lastFrameTime = ts;
          const nextIndex = Math.min(s.playback.index + Math.max(1, Math.floor(s.playback.speed)), run.times.length - 1);
          const done = nextIndex >= run.times.length - 1;
          set({ playback: { ...s.playback, index: nextIndex, isPlaying: !done } });
          if (done) return;
        }
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
    },
    pause: () => {
      stopAnimation();
      set({ playback: { ...get().playback, isPlaying: false } });
    },
    stepPlayback: (delta = 1) => {
      const { run, playback } = get();
      if (!run) return;
      stopAnimation();
      const index = Math.max(0, Math.min(run.times.length - 1, playback.index + delta));
      set({ playback: { ...playback, index, isPlaying: false } });
    },
    seek: (index) => {
      const { run, playback } = get();
      if (!run) return;
      stopAnimation();
      set({ playback: { ...playback, index: Math.max(0, Math.min(run.times.length - 1, index)), isPlaying: false } });
    },
    resetSimulation: () => {
      stopAnimation();
      set({ playback: { ...get().playback, index: 0, isPlaying: false } });
    },
    clearRun: () => {
      stopAnimation();
      set({ run: null, playback: { ...get().playback, index: 0, isPlaying: false } });
    },
    setPlaybackSpeed: (speed) => set({ playback: { ...get().playback, speed } }),
    setHiddenLine: (key, hidden) => set({ hiddenLines: { ...get().hiddenLines, [key]: hidden } }),

    // ---------- scenarios ----------
    /** Pin the current run as the baseline scenario for comparison. */
    pinBaseline: () => {
      const { run, nodes, edges, simConfig, meta } = get();
      if (!run) return;
      const v = getValidation(nodes, edges, simConfig);
      const params = {};
      v.compiled.parameterIds.forEach((id) => {
        params[id] = { name: v.domain.byId.get(id)?.name, value: run.parameters[id] };
      });
      set({ baseline: { run, params, label: `Baseline · ${meta.name}`, pinnedAt: new Date().toISOString() } });
      toast('Saved as baseline. Change parameters and run again to compare.', 'success', 4000);
    },
    clearBaseline: () => set({ baseline: null }),

    // ---------- challenges ----------
    /** Start a challenge: load its starting model (or an empty one) and show its checklist. */
    startChallenge: (challenge, startModel) => {
      if (startModel) get().loadModel(startModel, { silent: true, asCopy: true });
      else applyModelState({ ...emptyModel(), meta: { ...emptyModel().meta, name: challenge.title }, simulation: DEFAULT_CONFIG }, { label: null });
      set({ challenge: { id: challenge.id, answers: {}, hintsShown: 0, revealed: false }, view_route: 'modeler', selectedId: null });
      toast(`Challenge started: ${challenge.title}`, 'info', 3000);
    },
    answerChallenge: (questionId, optionId) => {
      const c = get().challenge;
      if (!c || c.answers[questionId]) return; // first answer counts: predict before you look
      set({ challenge: { ...c, answers: { ...c.answers, [questionId]: optionId } } });
    },
    revealHint: () => {
      const c = get().challenge;
      if (c) set({ challenge: { ...c, hintsShown: c.hintsShown + 1 } });
    },
    revealExplanation: () => {
      const c = get().challenge;
      if (c) set({ challenge: { ...c, revealed: true } });
    },
    exitChallenge: () => set({ challenge: null }),
  };
});

export default useStore;
