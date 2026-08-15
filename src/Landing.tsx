import { SketchBox } from './sketch';
import {
  allSchools, gapsIn, map, pathways, pathwaySchools, pathwayStepCount,
} from './model';

interface LandingProps {
  onOpenPathway: (id: string) => void;
  onOpenMap: () => void;
}

const KIND_LABEL = {
  official: 'official',
  curated: 'curated',
} as const;

export function Landing({ onOpenPathway, onOpenMap }: LandingProps) {
  const courseCount = Object.keys(map.courses).length;
  const schoolCount = allSchools().length;
  const paths = pathways();

  return (
    <main className="landing">
      <div className="landing-inner">
        <h1>Open Course Map</h1>
        <p className="landing-tagline">
          The best free university courses on the internet, drawn as a map — with the
          prerequisites marked, so you know what to take before what.
        </p>
        <p className="landing-stats">
          {courseCount} courses · {schoolCount} universities · all free, all on YouTube
        </p>

        <h2>What do you want to learn?</h2>
        <p className="landing-sub">
          A pathway is a route through the map. Some are transcribed from a department's own
          requirements; some are one person's picks. Each says which it is.
        </p>

        <div className="pathway-cards">
          {paths.map(({ id, group }) => {
            const steps = pathwayStepCount(id);
            const gaps = gapsIn(id).length;
            const schools = pathwaySchools(id);
            return (
              <SketchBox key={id} seedKey={'pathway:' + id} className="pathway-card">
                <button className="pathway-hit" onClick={() => onOpenPathway(id)}>
                  <span className={'pathway-kind kind-' + group.kind}>
                    {KIND_LABEL[group.kind ?? 'curated']}
                  </span>
                  <span className="pathway-field">{group.field}</span>
                  <span className="pathway-title">{group.title}</span>
                  <span className="pathway-blurb">{group.blurb}</span>
                  <span className="pathway-source">{group.source}</span>
                  <span className="pathway-meta">
                    {steps} steps
                    {schools.length > 0 && ' · ' + schools.join(', ')}
                    {gaps > 0 && (
                      <span className="pathway-gaps"> · {gaps} not uploaded anywhere</span>
                    )}
                  </span>
                </button>
              </SketchBox>
            );
          })}
        </div>

        <div className="landing-alt">
          <button className="landing-map-link" onClick={onOpenMap}>
            or explore the full map →
          </button>
        </div>
      </div>
    </main>
  );
}
