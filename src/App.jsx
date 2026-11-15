import { lazy, Suspense, useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import useStore from './store';
import Sidebar from './components/Sidebar';
import SimulationPanel from './components/SimulationPanel';
import Toasts from './components/ui/Toasts';
import Canvas from './features/modeler/Canvas';
import ModelerToolbar from './features/modeler/ModelerToolbar';
import Inspector from './features/modeler/Inspector';

// Secondary pages load on demand to keep the initial bundle small.
const EquationsView = lazy(() => import('./features/equations/EquationsView'));
const TheoryView = lazy(() => import('./features/learning/TheoryView'));
const LibraryView = lazy(() => import('./features/library/LibraryView'));
import { restoreDraft, startAutosave } from './state/persistence';

const COLLAPSE_KEY = 'sds.sidebar.collapsed';

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

function useShortcuts() {
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const s = useStore.getState();
      if (e.key === 'Enter') {
        e.preventDefault();
        s.runSimulation();
        return;
      }
      if (isTyping(document.activeElement)) return; // keep native text undo inside fields
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export default function App() {
  const route = useStore((s) => s.view_route);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  useShortcuts();

  useEffect(() => {
    restoreDraft();
    return startAutosave();
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className={`shell${collapsed ? ' collapsed' : ''}`}>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <main id="main" className="main" tabIndex={-1}>
          {/* The modeler stays mounted so the canvas viewport survives page switches. */}
          <ReactFlowProvider>
            <div className={route === 'modeler' ? undefined : 'offstage'} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }} aria-hidden={route !== 'modeler'} inert={route !== 'modeler'}>
              <ModelerToolbar />
              <div className="modeler">
                <Canvas />
                <Inspector />
                <SimulationPanel />
              </div>
            </div>
          </ReactFlowProvider>
          <Suspense fallback={<div className="empty" role="status">Loading…</div>}>
            {route === 'equations' && <EquationsView />}
            {route === 'theory' && <TheoryView />}
            {route === 'library' && <LibraryView />}
          </Suspense>
        </main>
      </div>
      <Toasts />
    </>
  );
}
