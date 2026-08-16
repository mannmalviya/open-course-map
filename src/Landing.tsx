import { BackgroundLayer, type Background } from './Canvas';
import { GroupNode } from './nodes';
import { SketchBox } from './sketch';
import {
  childGroups, map, PATHWAYS_GROUP, pathways, pathwaySchools, pathwayStepCount,
  schoolsByCourseCount, wordmarkFor,
} from './model';

interface LandingProps {
  background: Background;
  onOpen: (groupId: string) => void;
}

const KIND_LABEL = {
  official: 'official',
  curated: 'curated',
} as const;

/** GroupNode draws its title above the box, so each tile needs headroom for it. */
const TITLE_ROOM = 38;
/** Rough strokes wander past the rect; the viewBox is padded so they don't clip. */
const SLOP = 6;

/** The root map's subjects — the same boxes the map draws, one per tile. */
function subjects() {
  return childGroups('root').filter((id) => id !== PATHWAYS_GROUP);
}

export function Landing({ background, onOpen }: LandingProps) {
  const courseCount = Object.keys(map.courses).length;
  const schools = schoolsByCourseCount();
  const paths = pathways();

  return (
    <main className="landing">
      <BackgroundLayer background={background} />
      <div className="landing-inner">
        <h1>Open Course Map</h1>
        <p className="landing-tagline">
          The best free university courses on the internet, drawn as a map — with the
          prerequisites marked, so you know what to take before what.
        </p>

        <div className="landing-cta">
          <SketchBox
            seedKey="cta:map"
            className="cta-box"
            stroke="var(--accent)"
            fill="var(--sketch-fill, var(--node-fill))"
            strokeWidth={1.8}
          >
            <button className="cta" onClick={() => onOpen('root')}>
              Open the map →
            </button>
          </SketchBox>
        </div>

        {/* The whole point of the project, stated once and set apart */}
        <p className="landing-free">Always free</p>
        <p className="landing-stats">
          {courseCount} courses · {schools.length} universities · every lecture on YouTube
        </p>

        {/* The map's own boxes, drawn straight into the page — click one to go there */}
        <div className="landing-band">
          {subjects().map((id) => {
            const group = map.groups[id];
            const w = group.size?.w ?? 0;
            const h = group.size?.h ?? 0;
            return (
              <svg
                key={id}
                className="subject-tile"
                viewBox={`${-SLOP} ${-TITLE_ROOM} ${w + SLOP * 2} ${h + TITLE_ROOM + SLOP}`}
                aria-label={group.title}
              >
                {/* Each tile draws its group at the origin, wherever the map keeps it */}
                <g transform={`translate(${-(group.pos?.x ?? 0)} ${-(group.pos?.y ?? 0)})`}>
                  <GroupNode id={id} group={group} onOpen={onOpen} />
                </g>
              </svg>
            );
          })}
        </div>

        <h2>Or follow a pathway</h2>
        <p className="landing-sub">
          A pathway is a route through the map, in order. Official ones are transcribed from
          a department's own requirements; curated ones are one person's picks.
        </p>

        <div className="pathway-cards">
          {paths.map(({ id, group }) => {
            const steps = pathwayStepCount(id);
            const schools = pathwaySchools(id);
            return (
              <SketchBox
                key={id}
                seedKey={'pathway:' + id}
                className="pathway-card"
                stroke="var(--sketch-ink, var(--ink))"
                fill="var(--sketch-fill, var(--node-fill))"
              >
                <button className="pathway-hit" onClick={() => onOpen(id)}>
                  <span className="pathway-tags">
                    <span className={'pathway-kind kind-' + group.kind}>
                      {KIND_LABEL[group.kind ?? 'curated']}
                    </span>
                    <span className="pathway-field">{group.field}</span>
                  </span>
                  <span className="pathway-title">{group.title}</span>
                  <span className="pathway-blurb">{group.blurb}</span>
                  <span className="pathway-meta">
                    {steps} steps
                    {schools.length > 0 && ' · ' + schools.join(', ')}
                  </span>
                </button>
              </SketchBox>
            );
          })}
        </div>

        {/* Schools without a logo file keep their name as a wordmark rather than vanish */}
        <div className="logo-wall">
          <span className="logo-wall-label">Lectures from</span>
          <ul className="logo-row">
            {schools.map((school) => {
              const logo = wordmarkFor(school);
              return (
                <li key={school} className="logo-item" title={school}>
                  {logo ? (
                    <img className="school-logo" src={logo} alt={school} />
                  ) : (
                    <span className="school-wordmark">{school}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
