/**
 * Store behaviour: undo/redo, revisions, rename, playback, baselines.
 * Runs in Node; requestAnimationFrame is stubbed so playback never animates.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as EXAMPLES from '../../src/examples.js';

globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const { default: useStore } = await import('../../src/store.js');
const S = () => useStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  S().loadModel(EXAMPLES.INVENTORY_CONTROL, { silent: true });
  useStore.setState({ history: { past: [], future: [], lastGroup: null, lastAt: 0 }, toasts: [] });
});

const node = (label) => S().nodes.find((n) => n.data.label === label);

describe('loading', () => {
  it('normalises legacy edges into material and information links', () => {
    const kinds = S().edges.map((e) => e.data.kind).sort();
    expect(kinds).toEqual(['inflow', 'info', 'info', 'info', 'info', 'info', 'outflow']);
    expect(S().simConfig).toMatchObject({ stop: 50, timeUnit: 'week' });
  });
});

describe('undo / redo', () => {
  it('restores data edits and bumps the revision', () => {
    const id = node('Customer_Demand').id;
    const rev = S().revision;
    S().updateNodeData(id, { value: '150' });
    expect(node('Customer_Demand').data.value).toBe('150');
    expect(S().revision).toBe(rev + 1);
    S().undo();
    expect(node('Customer_Demand').data.value).toBe('100');
    S().redo();
    expect(node('Customer_Demand').data.value).toBe('150');
  });

  it('groups rapid typing in one field into a single undo step', () => {
    const id = node('Production').id;
    S().updateNodeData(id, { equation: 'a' });
    S().updateNodeData(id, { equation: 'ab' });
    S().updateNodeData(id, { equation: 'abc' });
    expect(S().history.past.length).toBe(1);
    S().undo();
    expect(node('Production').data.equation).toMatch(/^Customer_Demand/);
  });

  it('undoes deleting an element together with its links', () => {
    const before = S().edges.length;
    S().deleteElement(node('Sales').id);
    expect(node('Sales')).toBeUndefined();
    expect(S().edges.length).toBeLessThan(before);
    S().undo();
    expect(node('Sales')).toBeDefined();
    expect(S().edges.length).toBe(before);
  });
});

describe('rename', () => {
  it('updates every equation that uses the name', () => {
    expect(S().renameNode(node('Customer_Demand').id, 'demand').ok).toBe(true);
    expect(node('Production').data.equation).toBe('demand + (Target_Inventory - Inventory) / Adjustment_Time');
    expect(node('Sales').data.equation).toBe('demand');
    expect(S().view.visibleVariables).toContain('demand');
  });

  it('refuses a duplicate name', () => {
    const r = S().renameNode(node('Customer_Demand').id, 'Inventory');
    expect(r.ok).toBe(false);
    expect(node('Customer_Demand')).toBeDefined();
  });
});

describe('connections', () => {
  it('refuses an information link into a stock', () => {
    expect(S().checkConnection({ source: node('Customer_Demand').id, target: node('Inventory').id }).ok).toBe(false);
  });

  it('sets the stock a flow drains, replacing the previous one', () => {
    const sales = node('Sales').id;
    S().setFlowStock(sales, 'source', null);
    expect(S().edges.some((e) => e.target === sales && e.data.kind === 'outflow')).toBe(false);
    S().setFlowStock(sales, 'source', node('Inventory').id);
    expect(S().edges.filter((e) => e.target === sales && e.data.kind === 'outflow')).toHaveLength(1);
  });
});

describe('simulation and playback', () => {
  it('solves once; seek/step/reset move only the cursor', () => {
    const run = S().runSimulation({ autoplay: false });
    expect(run.completed).toBe(true);
    expect(S().playback.index).toBe(run.times.length - 1);
    S().seek(100);
    expect(S().run.times[S().playback.index]).toBeCloseTo(10, 9);
    S().stepPlayback(1);
    expect(S().playback.index).toBe(101);
    S().resetSimulation();
    expect(S().playback.index).toBe(0);
    expect(S().run).toBe(run);
  });

  it('marks the run out of date after a semantic edit, not after selection', () => {
    const run = S().runSimulation({ autoplay: false });
    S().select(node('Sales').id, { focus: false });
    expect(S().revision).toBe(run.modelRevision);
    S().updateNodeData(node('Customer_Demand').id, { value: '120' });
    expect(S().revision).not.toBe(run.modelRevision);
  });

  it('blocks the run when there are errors', () => {
    S().updateNodeData(node('Sales').id, { equation: 'DemandRate * 2' });
    expect(S().runSimulation()).toBeNull();
    expect(S().lastValidationBlocked).not.toBeNull();
  });

  it('keeps the baseline immutable when the model changes', () => {
    S().runSimulation({ autoplay: false });
    S().pinBaseline();
    const base = S().baseline.run;
    S().updateNodeData(node('Customer_Demand').id, { value: '150' });
    S().runSimulation({ autoplay: false });
    expect(S().baseline.run).toBe(base);
    expect(S().run.parameters[node('Customer_Demand').id]).toBe(150);
    expect(base.parameters[node('Customer_Demand').id]).toBe(100);
  });
});

describe('inspector visibility', () => {
  it('toggles, and reopens when a run is blocked so the errors are visible', () => {
    S().setInspectorOpen(true);
    S().toggleInspector();
    expect(S().inspectorOpen).toBe(false);
    S().updateNodeData(node('Sales').id, { equation: 'DemandRate * 2' });
    expect(S().runSimulation()).toBeNull();
    expect(S().inspectorOpen).toBe(true);
    expect(S().selectedId).toBeNull();
  });
});

describe('documents', () => {
  it('round-trips the current model through export/import', () => {
    const doc = S().exportDocument();
    S().newModel();
    expect(S().nodes).toHaveLength(0);
    expect(S().importText(JSON.stringify(doc))).toBe(true);
    expect(S().nodes.map((n) => n.id).sort()).toEqual(doc.elements.map((e) => e.id).sort());
    expect(S().meta.name).toBe('Inventory Control System');
  });

  it('rejects a non-model file without touching the current model', () => {
    const before = S().nodes;
    expect(S().importText('{"hello": 1}')).toBe(false);
    expect(S().nodes).toBe(before);
  });
});
