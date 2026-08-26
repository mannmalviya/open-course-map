import { SketchBox, SketchTag } from './sketch';
import { pathways, pathwayCourseCount, pathwaySchools, wordmarkFor } from './model';

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
        const courses = pathwayCourseCount(id);
        // A hand-set list still wins, but the default is simply whoever taught
        // the steps — the card credits the schools the route actually uses
        const schools = group.logos ?? pathwaySchools(id);
        return (
          <SketchBox
            key={id}
            seedKey={'pathway:' + id}
            className="pathway-card"
            stroke="var(--sketch-ink, var(--ink))"
            fill="var(--sketch-fill, var(--node-fill))"
          >
            <button className="pathway-hit" onClick={() => onOpen(id)}>
              <SketchTag seedKey={'kind:' + id} className={'pathway-kind kind-' + group.kind}>
                {KIND_LABEL[group.kind ?? 'curated']}
              </SketchTag>
              <span className="pathway-title">{group.title}</span>
              <span className="pathway-blurb">{group.blurb}</span>
              <span className="pathway-meta">
                <span className="pathway-logos">
                  {schools.map((school) => {
                    const mark = wordmarkFor(school);
                    // A school with no mark on file is still owed the credit
                    return mark ? (
                      <img
                        key={school}
                        className="pathway-logo"
                        src={mark}
                        alt={school}
                        title={school}
                      />
                    ) : (
                      <span key={school} className="pathway-school">
                        {school}
                      </span>
                    );
                  })}
                </span>
                <span className="pathway-count">
                  {courses} {courses === 1 ? 'course' : 'courses'}
                </span>
              </span>
            </button>
          </SketchBox>
        );
      })}
    </div>
  );
}
