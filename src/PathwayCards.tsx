import { SketchBox } from './sketch';
import { pathways, pathwaySchools, pathwayStepCount } from './model';

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
  );
}
