import { useEffect, useState } from 'react';
import {
  groupChain, lecturesFor, levelLabel, logoFor, map, playlistId, prereqsOf, thumbUrl, unlocksOf,
} from './model';
import type { Version } from './types';
import { ViewsChart } from './ViewsChart';
import { BackgroundLayer, type Background } from './Canvas';
import { SketchBox } from './sketch';

interface CoursePageProps {
  courseId: string;
  background: Background;
  onJumpToNode: (id: string) => void;
}

function groupLabel(groupId: string): string {
  return groupChain(groupId)
    .filter((id) => id !== 'root')
    .map((id) => map.groups[id].title)
    .join(' › ');
}

/** Link to a related node — a course or a whole subject group. */
function NodeLink({ id, onJump }: { id: string; onJump: (id: string) => void }) {
  const course = map.courses[id];
  const title = course ? course.title : map.groups[id]?.title ?? id;
  const sub = course ? groupLabel(course.group) : groupLabel(map.groups[id]?.parent ?? 'root');
  return (
    <button className="course-link" onClick={() => onJump(id)}>
      <span className="course-link-title">{title}</span>
      <span className="course-link-group">{sub}</span>
    </button>
  );
}

/** Prefer the full-res thumbnail, fall back to the guaranteed medium one. */
function HeroThumb({ version, university }: { version: Version; university?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [version]);
  const mq = thumbUrl(version);
  if (!mq) {
    const logo = logoFor(university);
    return (
      <div className="hero-thumb-placeholder">
        {logo ? <img className="placeholder-logo" src={logo} alt={university} /> : '▶'}
      </div>
    );
  }
  const src = failed || !version.youtubeId ? mq : `https://i.ytimg.com/vi/${version.youtubeId}/maxresdefault.jpg`;
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      // YouTube serves a tiny gray placeholder with HTTP 200 when maxres is missing
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth < 200) setFailed(true);
      }}
    />
  );
}

/** "MIT 8.04 · Adams · 2013" -> "Adams · 2013"; falls back to the full label */
function shortLabel(v: Version): string {
  const rest = v.label.split('·').slice(1).join('·').trim();
  return rest || v.label;
}

export function CoursePage({ courseId, background, onJumpToNode }: CoursePageProps) {
  const course = map.courses[courseId];
  const versions = course?.versions ?? [];
  const primaryIdx = Math.max(0, versions.findIndex((v) => v.primary));
  const chartable = versions.map((v, i) => ({ v, i })).filter(({ v }) => lecturesFor(v));
  const defaultChartIdx = chartable.some(({ i }) => i === primaryIdx)
    ? primaryIdx
    : chartable[0]?.i ?? primaryIdx;
  const [chartIdx, setChartIdx] = useState(defaultChartIdx);
  useEffect(() => setChartIdx(defaultChartIdx), [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!course) return null;
  const prereqs = prereqsOf(courseId);
  const unlocks = unlocksOf(courseId);
  const hero = versions[primaryIdx];
  const rest = versions.filter((_, i) => i !== primaryIdx);
  const chartVersion = versions[chartIdx] ?? hero;
  const lectures = lecturesFor(chartVersion);

  return (
    <main className="course-page">
      <BackgroundLayer background={background} />
      <div className="course-inner">
        <h1>{course.title}</h1>
        <div className="course-sub">
          {course.university &&
            (logoFor(course.university) ? (
              <img
                className="uni-logo"
                src={logoFor(course.university)}
                alt={course.university}
                title={course.university}
              />
            ) : (
              <>{course.university} · </>
            ))}
          {groupLabel(course.group)}
          {course.level && (
            <span className={'level-tag level-' + course.level}>{levelLabel(course.level)}</span>
          )}
        </div>

        <SketchBox seedKey={courseId + ':hero'} className="hero">
          {/* outline over the image, the way map cards frame their thumbnails */}
          <SketchBox seedKey={courseId + ':thumb'} className="thumb-frame" fill="none">
            <a className="hero-thumb" href={hero.youtube ?? hero.url} target="_blank" rel="noreferrer">
              <HeroThumb version={hero} university={course.university} />
            </a>
          </SketchBox>
          <div className="hero-info">
            {hero.primary && versions.length > 1 && <div className="hero-badge">★ Recommended</div>}
            <h2>{hero.label}</h2>
            {hero.date && <div className="hero-meta">{hero.date}</div>}
            <div className="hero-actions">
              {hero.youtube && (
                <a className="btn btn-primary" href={hero.youtube} target="_blank" rel="noreferrer">
                  ▶ Watch playlist
                </a>
              )}
              {hero.url && (
                <a className="btn" href={hero.url} target="_blank" rel="noreferrer">
                  course page ↗
                </a>
              )}
            </div>
          </div>
        </SketchBox>

        {course.textbooks && course.textbooks.length > 0 && (
          <>
            <h3>Textbooks</h3>
            <div className="textbooks">
              {course.textbooks.map((b, i) => (
                <SketchBox key={i} seedKey={`${courseId}:book${i}`} className="textbook">
                  <div className="textbook-title">{b.title}</div>
                  <div className="textbook-authors">{b.authors}</div>
                  {b.url && (
                    <a className="textbook-link" href={b.url} target="_blank" rel="noreferrer">
                      read free ↗
                    </a>
                  )}
                </SketchBox>
              ))}
            </div>
          </>
        )}

        {rest.length > 0 && (
          <>
            <h3>Other versions</h3>
            <div className="offerings">
              {rest.map((v, i) => {
                const thumb = thumbUrl(v);
                return (
                  <SketchBox key={i} seedKey={`${courseId}:v${i}`} className="offering">
                    <a className="offering-thumb" href={v.url ?? v.youtube} target="_blank" rel="noreferrer">
                      {thumb ? (
                        <img src={thumb} alt="" />
                      ) : (
                        <div className="offering-thumb-placeholder">
                          {logoFor(course.university) ? (
                            <img className="placeholder-logo" src={logoFor(course.university)} alt="" />
                          ) : (
                            '▶'
                          )}
                        </div>
                      )}
                    </a>
                    <div className="offering-body">
                      <div className="offering-label">
                        {v.label}
                        {v.date && <div className="offering-date">{v.date}</div>}
                      </div>
                      <div className="offering-links">
                        {v.url && (
                          <a href={v.url} target="_blank" rel="noreferrer">
                            course page ↗
                          </a>
                        )}
                        {v.youtube && (
                          <a href={v.youtube} target="_blank" rel="noreferrer">
                            ▶ playlist
                          </a>
                        )}
                      </div>
                    </div>
                  </SketchBox>
                );
              })}
            </div>
          </>
        )}

        {lectures && (
          <>
            <h3>Lecture viewership</h3>
            {chartable.length > 1 && (
              <div className="chart-tabs">
                {chartable.map(({ v, i }) => (
                  <button
                    key={i}
                    className={'chart-tab' + (i === chartIdx ? ' active' : '')}
                    onClick={() => setChartIdx(i)}
                  >
                    {shortLabel(v)}
                  </button>
                ))}
              </div>
            )}
            <SketchBox seedKey={courseId + ':chart'} className="chart-frame">
              <ViewsChart lectures={lectures} playlistId={playlistId(chartVersion)} />
            </SketchBox>
            <div className="chart-note">YouTube views per lecture</div>
          </>
        )}

        {prereqs.length > 0 && (
          <>
            <h3>Do first</h3>
            <div className="related">
              {prereqs.map((id) => (
                <NodeLink key={id} id={id} onJump={onJumpToNode} />
              ))}
            </div>
          </>
        )}

        {unlocks.length > 0 && (
          <>
            <h3>Unlocks</h3>
            <div className="related">
              {unlocks.map((id) => (
                <NodeLink key={id} id={id} onJump={onJumpToNode} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
