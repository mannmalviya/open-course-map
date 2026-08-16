import { useEffect, useState } from 'react';
import { Canvas, type Background } from './Canvas';
import { CoursePage } from './CoursePage';
import { Landing } from './Landing';
import {
  allSchools, groupChain, isPathway, landingHash, LEVELS, map, parseHash, routeHash,
  setCompactCourses, setHiddenLevels, setHiddenSchools, setHidePrereqs, type Route,
} from './model';

type Theme = 'light' | 'dark';

const REPO = 'mannmalviya/open-course-map';

const BACKGROUNDS: { id: Background; label: string }[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'grid', label: 'Grid' },
  { id: 'dots', label: 'Dots' },
];

function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
}

function initialBackground(): Background {
  const saved = localStorage.getItem('ocm-bg');
  return saved === 'plain' || saved === 'dots' ? saved : 'grid';
}

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

/** Stored as the *hidden* set, matching the school filter. */
function initialHiddenLevels(): ReadonlySet<string> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('ocm-hidden-levels') ?? '[]');
    const known = new Set(LEVELS.map((l) => l.id as string));
    return new Set(
      Array.isArray(saved) ? saved.filter((s): s is string => typeof s === 'string' && known.has(s)) : []
    );
  } catch {
    return new Set();
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [background, setBackground] = useState<Background>(initialBackground);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(initialHidden);
  const [hiddenLevels, setHiddenLevelsState] = useState<ReadonlySet<string>>(initialHiddenLevels);
  const [compact, setCompact] = useState(() => localStorage.getItem('ocm-compact') === '1');
  const [noPrereqs, setNoPrereqs] = useState(() => localStorage.getItem('ocm-hide-prereqs') === '1');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [stars, setStars] = useState<number | null>(() => {
    const cached = sessionStorage.getItem('ocm-stars');
    return cached !== null ? Number(cached) : null;
  });

  // Sync the model's filter before children render so the whole map reflects it
  setHiddenSchools(hidden);
  setHiddenLevels(hiddenLevels);
  setCompactCourses(compact);
  setHidePrereqs(noPrereqs);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (stars !== null) return;
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { stargazers_count?: unknown } | null) => {
        if (typeof d?.stargazers_count === 'number') {
          sessionStorage.setItem('ocm-stars', String(d.stargazers_count));
          setStars(d.stargazers_count);
        }
      })
      .catch(() => {});
  }, [stars]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ocm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ocm-bg', background);
  }, [background]);

  useEffect(() => {
    localStorage.setItem('ocm-hidden-schools', JSON.stringify([...hidden]));
  }, [hidden]);

  useEffect(() => {
    localStorage.setItem('ocm-hidden-levels', JSON.stringify([...hiddenLevels]));
  }, [hiddenLevels]);

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
      else if (viewOpen) setViewOpen(false);
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

  useEffect(() => {
    if (!viewOpen) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element;
      if (!el.closest?.('.view-pop, .gear-button')) setViewOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [viewOpen]);

  const toggleSchool = (school: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(school)) next.delete(school);
      else next.add(school);
      return next;
    });
  };

  const toggleLevel = (level: string) => {
    setHiddenLevelsState((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
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

  /**
   * On a pathway every step is a ghost, so the usual "jump to its home subject"
   * would eject you from the sequence you are reading. Open the course in place.
   */
  const onPathway = isPathway(route.groupId);
  const activateNode = (id: string) => {
    if (onPathway && map.courses[id]) navigate(route.groupId, id);
    else jumpToNode(id);
  };

  const chain = groupChain(route.groupId);

  return (
    <div className="app">
      {route.landing ? (
        <Landing background={background} onOpen={(id) => navigate(id)} />
      ) : route.courseId ? (
        <CoursePage courseId={route.courseId} background={background} onJumpToNode={jumpToNode} />
      ) : (
        <Canvas
          groupId={route.groupId}
          background={background}
          onSelectCourse={(id) => navigate(route.groupId, id)}
          onOpenGroup={(id) => navigate(id)}
          onJumpToNode={activateNode}
        />
      )}

      <div className="island breadcrumbs">
        <a className="logo" href={landingHash()}>Open Course Map</a>
        {!route.landing && chain.map((id, i) => (
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
        <a
          className="gh-link"
          href={`https://github.com/${REPO}`}
          target="_blank"
          rel="noreferrer"
          title="Star on GitHub"
          aria-label="Star on GitHub"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <svg className="gh-star" viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
          </svg>
          {stars !== null && <span className="gh-count">{formatStars(stars)}</span>}
        </a>
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
          <div className="settings-title">Filters</div>
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
          <div className="settings-section">Level</div>
          {LEVELS.map((level) => (
            <label key={level.id} className="settings-row">
              <input
                type="checkbox"
                checked={!hiddenLevels.has(level.id)}
                onChange={() => toggleLevel(level.id)}
              />
              {level.label}
            </label>
          ))}
        </div>
      )}

      {!route.landing && (
        <div className="island view-toggle">
          <button
            className="gear-button"
            onClick={() => setViewOpen((o) => !o)}
            title="View options"
            aria-label="View options"
            aria-expanded={viewOpen}
          >
            <svg
              className="gear" viewBox="0 0 24 24" width="20" height="20"
              fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      )}

      {viewOpen && (
        <div className="island settings-pop view-pop">
          <div className="settings-title">View</div>
          <div className="settings-section">Display</div>
          <label className="settings-row switch-row">
            Collapse thumbnails
            <input
              type="checkbox"
              checked={compact}
              onChange={() => setCompact((c) => !c)}
            />
          </label>
          <label className="settings-row switch-row">
            Hide prerequisites
            <input
              type="checkbox"
              checked={noPrereqs}
              onChange={() => setNoPrereqs((v) => !v)}
            />
          </label>
          <div className="settings-section">Background</div>
          <div className="bg-picker">
            {BACKGROUNDS.map(({ id, label }) => (
              <button
                key={id}
                className={'bg-option' + (background === id ? ' active' : '')}
                onClick={() => setBackground(id)}
                aria-pressed={background === id}
              >
                <span className={'bg-swatch bg-' + id} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!route.courseId && !route.landing && (
        <div className="island hint">
          {onPathway
            ? 'scroll to pan · ctrl+scroll to zoom · follow the arrows'
            : 'scroll to pan · ctrl+scroll to zoom · click a subject to see its courses'}
        </div>
      )}
    </div>
  );
}
