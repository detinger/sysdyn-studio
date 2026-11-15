import { Workflow, Sigma, BookOpen, Library, Target, Upload, PanelLeftClose, PanelLeftOpen, Sun, Moon, Monitor } from 'lucide-react';
import { useRef } from 'react';
import useStore from '../store';
import { useTheme } from '../app/theme';
import { BrandGlyph } from './ui/Glyphs';

const NAV = [
  { group: 'Workspace', items: [
    { id: 'modeler', label: 'Modeler', icon: Workflow },
    { id: 'equations', label: 'Equations', icon: Sigma },
  ] },
  { group: 'Learn', items: [
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'library', label: 'Model library', icon: Library },
    { id: 'challenges', label: 'Challenges', icon: Target },
  ] },
];

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

/** Application navigation (STYLE.md §5.1–5.2). */
export default function Sidebar({ collapsed, onToggle }) {
  const route = useStore((s) => s.view_route);
  const setRoute = useStore((s) => s.setRoute);
  const importText = useStore((s) => s.importText);
  const { preference, setPreference } = useTheme();
  const fileRef = useRef(null);
  const next = THEMES[(THEMES.findIndex((t) => t.id === preference) + 1) % THEMES.length];
  const Current = THEMES.find((t) => t.id === preference)?.icon || Monitor;

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark"><BrandGlyph /></span>
        <span className="brand-text">
          <div className="brand-name">System Dynamics Studio</div>
          <div className="brand-sub">Model · Simulate · Learn</div>
        </span>
      </div>
      <div className="nav">
        {NAV.map((g) => (
          <div key={g.group} style={{ display: 'contents' }}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((it) => (
              <button key={it.id} className="nav-link" aria-current={route === it.id ? 'page' : undefined} onClick={() => setRoute(it.id)} title={it.label}>
                <it.icon size={18} aria-hidden="true" />
                <span className="nav-label">{it.label}</span>
              </button>
            ))}
          </div>
        ))}
        <div className="nav-group">Tools</div>
        <button className="nav-link" onClick={() => fileRef.current?.click()} title="Import model">
          <Upload size={18} aria-hidden="true" />
          <span className="nav-label">Import model</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f && importText(await f.text())) setRoute('modeler');
            e.target.value = '';
          }}
        />
      </div>
      <div className="sidebar-foot">
        <button className="nav-link" onClick={() => setPreference(next.id)} title={`Theme: ${preference}. Switch to ${next.label.toLowerCase()}.`} aria-label={`Theme: ${preference}. Switch to ${next.label.toLowerCase()}`}>
          <Current size={18} aria-hidden="true" />
          <span className="theme-label">Theme: {THEMES.find((t) => t.id === preference)?.label}</span>
        </button>
        <button className="nav-link collapse-btn" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          <span className="nav-label">Collapse</span>
        </button>
      </div>
    </nav>
  );
}
