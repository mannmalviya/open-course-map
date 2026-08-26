import { SketchBox } from './sketch';
import { pathways, pathwayCourseCount, pathwaySchools, wordmarkFor } from './model';
import type { Group } from './types';

/** The sections the list is broken into, in the order they are shown. */
const SECTIONS = ['CS', 'Math', 'Physics', 'Chemistry', 'Bio'];

interface PathwayCardsProps {
  onOpen: (groupId: string) => void;
}

/** The pathway list, drawn the same way on the landing page and the Pathways tab. */
export function PathwayCards({ onOpen }: PathwayCardsProps) {
  const byField = new Map<string, Array<{ id: string; group: Group }>>();
  for (const pathway of pathways()) {
    const field = pathway.group.field ?? 'Other';
    const bucket = byField.get(field);
    if (bucket) bucket.push(pathway);
    else byField.set(field, [pathway]);
  }
  // A heading with nothing under it is a hole rather than a section, and a
  // field nobody thought to list still gets one — better shown late than lost
  const fields = [
    ...SECTIONS.filter((field) => byField.has(field)),
    ...[...byField.keys()].filter((field) => !SECTIONS.includes(field)),
  ];

  return (
    <div className="pathway-sections">
      {fields.map((field) => (
        <section key={field} className="pathway-section">
          <h3 className="pathway-section-title">{field}</h3>
          <div className="pathway-cards">
            {byField.get(field)!.map(({ id, group }) => (
              <PathwayCard key={id} id={id} group={group} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface PathwayCardProps {
  id: string;
  group: Group;
  onOpen: (groupId: string) => void;
}

function PathwayCard({ id, group, onOpen }: PathwayCardProps) {
  const courses = pathwayCourseCount(id);
  // A hand-set list still wins, but the default is simply whoever taught
  // the steps — the card credits the schools the route actually uses
  const schools = group.logos ?? pathwaySchools(id);

  return (
    <SketchBox
      seedKey={'pathway:' + id}
      className="pathway-card"
      stroke="var(--sketch-ink, var(--ink))"
      fill="var(--sketch-fill, var(--node-fill))"
    >
      <button className="pathway-hit" onClick={() => onOpen(id)}>
        <span className="pathway-title">{group.title}</span>
        <span className="pathway-blurb">{group.blurb}</span>
        <span className="pathway-meta">
          <span className="pathway-logos">
            {schools.map((school) => {
              const mark = wordmarkFor(school);
              // A school with no mark on file is still owed the credit
              return mark ? (
                <img key={school} className="pathway-logo" src={mark} alt={school} title={school} />
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
}
