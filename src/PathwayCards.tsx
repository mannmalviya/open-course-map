import { SketchBox } from './sketch';
import { pathways, pathwaySchools, pathwayStepCount, wordmarkFor } from './model';

const KIND_LABEL = {
  official: 'official',
  curated: 'curated',
} as const;

interface PathwayCardsProps {
  onOpen: (groupId: string) => void;
}

/** The pathway list, drawn the same way on the landing page and the Pathways tab. */
export function PathwayCards({ onOpen }: PathwayCardsProps) {
  return (
    <div className="pathway-cards">
      {pathways().map(({ id, group }) => {
        const steps = pathwayStepCount(id);
        // Hand-set marks win outright — listing the same schools again as names
        // would just say it twice
        const marks = group.logos?.filter((school) => wordmarkFor(school)) ?? [];
        const schools = marks.length > 0 ? [] : pathwaySchools(id);
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
                {marks.length > 0 && (
                  <span className="pathway-logos">
                    {marks.map((school) => (
                      <img
                        key={school}
                        className="pathway-logo"
                        src={wordmarkFor(school)}
                        alt={school}
                        title={school}
                      />
                    ))}
                  </span>
                )}
              </span>
            </button>
          </SketchBox>
        );
      })}
    </div>
  );
}
