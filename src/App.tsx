import { useEffect, useState } from 'react';
import { Canvas } from './Canvas';
import { CoursePage } from './CoursePage';
import {
  allSchools, groupChain, map, parseHash, routeHash, setCompactCourses, setHiddenSchools,
  setHidePrereqs, type Route,
} from './model';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const saved = localStorage.getItem('ocm-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Schools that start hidden the first time they appear; users can re-enable them in Settings. */
const DEFAULT_HIDDEN = ['UC Santa Cruz'];

/** Stored as the *hidden* set so schools added to the data later default to visible. */
function initialHidden(): ReadonlySet<string> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('ocm-hidden-schools') ?? '[]');
    const known = new Set(allSchools());
    const hidden = new Set(
      Array.isArray(saved)
        ? saved.filter((s): s is string => typeof s === 'string' && known.has(s))
        : []
    );
    // Seed default-hidden schools exactly once, so re-enabling them later sticks
    const seededRaw: unknown = JSON.parse(localStorage.getItem('ocm-seeded-hidden') ?? '[]');
    const seeded = Array.isArray(seededRaw)
      ? seededRaw.filter((s): s is string => typeof s === 'string')
      : [];
    for (const s of DEFAULT_HIDDEN) {
      if (known.has(s) && !seeded.includes(s)) {
        hidden.add(s);
        seeded.push(s);
      }
    }
    localStorage.setItem('ocm-seeded-hidden', JSON.stringify(seeded));
    return hidden;
  } catch {
    return new Set(DEFAULT_HIDDEN);
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(initialHidden);
  const [compact, setCompact] = useState(() => localStorage.getItem('ocm-compact') === '1');
  const [noPrereqs, setNoPrereqs] = useState(() => localStorage.getItem('ocm-hide-prereqs') === '1');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync the model's filter before children render so the whole map reflects it
  setHiddenSchools(hidden);
  setCompactCourses(compact);
  setHidePrereqs(noPrereqs);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ocm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ocm-hidden-schools', JSON.stringify([...hidden]));
  }, [hidden]);

  useEffect(() => {
    localStorage.setItem('ocm-compact', compact ? '1' : '0');
  }, [compact]);

  useEffect(() => {
    localStorage.setItem('ocm-hide-prereqs', noPrereqs ? '1' : '0');
  }, [noPrereqs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (settingsOpen) setSettingsOpen(false);
      else if (route.courseId) navigate(route.groupId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element;
      if (!el.closest?.('.settings-pop, .settings-button')) setSettingsOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [settingsOpen]);

  const toggleSchool = (school: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(school)) next.delete(school);
      else next.add(school);
      return next;
    });
  };

  const navigate = (groupId: string, courseId?: string) => {
    window.location.hash = routeHash(groupId, courseId);
  };

  // Jump to a node by id: courses open their page, groups open their map
  const jumpToNode = (id: string) => {
    if (map.courses[id]) navigate(map.courses[id].group, id);
    else if (map.groups[id]) navigate(id);
  };

  const chain = groupChain(route.groupId);

  return (
    <div className="app">
      {route.courseId ? (
        <CoursePage courseId={route.courseId} onJumpToNode={jumpToNode} />
      ) : (
        <Canvas
          groupId={route.groupId}
          onSelectCourse={(id) => navigate(route.groupId, id)}
          onOpenGroup={(id) => navigate(id)}
          onJumpToNode={jumpToNode}
        />
      )}

      <div className="island breadcrumbs">
        <span className="logo">Open Course Map</span>
        {chain.map((id, i) => (
          <span key={id} className="crumb-wrap">
            {i > 0 && <span className="crumb-sep">›</span>}
            <button
              className={'crumb' + (!route.courseId && i === chain.length - 1 ? ' current' : '')}
              onClick={() => navigate(id)}
            >
              {map.groups[id].title}
            </button>
          </span>
        ))}
        {route.courseId && (
          <span className="crumb-wrap">
            <span className="crumb-sep">›</span>
            <button className="crumb current">{map.courses[route.courseId].title}</button>
          </span>
        )}
      </div>

      <div className="island theme-toggle">
        <button
          className="settings-button"
          onClick={() => setSettingsOpen((o) => !o)}
          title="Settings"
          aria-label="Settings"
          aria-expanded={settingsOpen}
        >
          <svg
            viewBox="0 0 24 24" width="20" height="20"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M4 5h16l-6.2 7.4v4.9l-3.6 1.9v-6.8L4 5z" />
          </svg>
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          <svg className="sunmoon" viewBox="0 0 24 24" width="20" height="20">
            <mask id="moon-bite">
              <rect width="24" height="24" fill="white" />
              <circle className="bite" cx={theme === 'dark' ? 15 : 26} cy={theme === 'dark' ? 8 : 2} r="8" fill="black" />
            </mask>
            <circle
              className="core"
              cx="12"
              cy="12"
              r={theme === 'dark' ? 8 : 5}
              mask="url(#moon-bite)"
              fill="currentColor"
            />
            <g className={'rays' + (theme === 'dark' ? ' hidden' : '')} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return (
                  <line
                    key={i}
                    x1={12 + 8 * Math.cos(a)} y1={12 + 8 * Math.sin(a)}
                    x2={12 + 10.5 * Math.cos(a)} y2={12 + 10.5 * Math.sin(a)}
                  />
                );
              })}
            </g>
          </svg>
        </button>
      </div>

      {settingsOpen && (
        <div className="island settings-pop">
          <div className="settings-title">Settings</div>
          <div className="settings-section">Schools</div>
          {allSchools().map((school) => (
            <label key={school} className="settings-row">
              <input
                type="checkbox"
                checked={!hidden.has(school)}
                onChange={() => toggleSchool(school)}
              />
              {school}
            </label>
          ))}
          <div className="settings-section">Display</div>
          <label className="settings-row">
            <input
              type="checkbox"
              checked={compact}
              onChange={() => setCompact((c) => !c)}
            />
            Collapse thumbnails
          </label>
          <label className="settings-row">
            <input
              type="checkbox"
              checked={noPrereqs}
              onChange={() => setNoPrereqs((v) => !v)}
            />
            Hide prerequisites
          </label>
        </div>
      )}

      {!route.courseId && (
        <div className="island hint">scroll to pan · ctrl+scroll to zoom · click a subject to see its courses</div>
      )}
    </div>
  );
}
