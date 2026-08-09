import { useEffect, useState } from 'react';
import { Canvas } from './Canvas';
import { CoursePage } from './CoursePage';
import { groupChain, map, parseHash, routeHash, type Route } from './model';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const saved = localStorage.getItem('ocm-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [theme, setTheme] = useState<Theme>(initialTheme);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && route.courseId) navigate(route.groupId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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

      {!route.courseId && (
        <div className="island hint">scroll to pan · ctrl+scroll to zoom · click a subject to see its courses</div>
      )}
    </div>
  );
}
