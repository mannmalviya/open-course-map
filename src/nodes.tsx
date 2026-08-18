import type { Course, Gap, Ghost, Group, Rect } from './types';
import {
  COURSE_W, COURSE_H, COURSE_H_COMPACT, GAP_W,
  GAP_TITLE_TOP, GAP_TITLE_LINE, GAP_STATUS_GAP, GAP_NOTE_TOP, GAP_NOTE_LINE,
  GAP_ALTS_TOP, GAP_ALT_ROW,
  borderPoint, center, childGroups, courseCount, courseRect, coursesIn, courseTerm,
  edgesOn, gapAltLabel, gapAlternates, gapNoteLines, gapRect, gapsIn, gapTitleLines,
  ghostNoteLines, ghostRect, ghostsIn, ghostTitleLines, ghostWidth,
  isCompact, levelLabel, logoFor, map,
  primaryVersion, seedFor, thumbUrl, wrapText,
  STEP_W, STEP_PAD, STEP_THUMB_TOP, STEP_THUMB_W, STEP_THUMB_H,
  STEP_TITLE_LINE, STEP_NOTE_TOP, stepNoteLines, stepTitleBase, stepTitleLines,
} from './model';
import { SketchRect, SketchText } from './sketch';

interface CourseNodeProps {
  id: string;
  course: Course;
  onSelect: (id: string) => void;
}

export function CourseNode({ id, course, onSelect }: CourseNodeProps) {
  const { x, y } = course.pos;
  const seed = seedFor(id);

  if (isCompact()) {
    const titleLines = wrapText(course.title, 24);
    // First baseline placed so the text block sits vertically centered
    const baseY = y + COURSE_H_COMPACT / 2 + 5 - ((titleLines.length - 1) * 15 * 1.25) / 2;
    return (
      <g
        className="node course-node"
        onClick={() => onSelect(id)}
      >
        <SketchRect x={x} y={y} w={COURSE_W} h={COURSE_H_COMPACT} seed={seed} fill="var(--node-fill)" />
        <SketchText x={x + COURSE_W / 2} y={baseY} lines={titleLines} size={15} />
      </g>
    );
  }

  const primary = primaryVersion(course);
  const thumb = thumbUrl(primary);
  const logo = logoFor(course.university);
  const term = courseTerm(course);
  const extra = course.versions.length - 1;
  const titleLines = wrapText(course.title, 26);
  // Two-line titles trade thumbnail height for title room so they clear the footer
  const twoLines = titleLines.length > 1;
  const thumbX = x + 14;
  const thumbY = y + 12;
  const thumbW = COURSE_W - 28;
  const thumbH = twoLines ? 88 : 100;
  const titleY = y + (twoLines ? 116 : 130);
  // footer row tucked under the title: school logo bottom-left, term bottom-right
  const footerBaseline = y + COURSE_H - 14;
  const levelText = course.level ? levelLabel(course.level) : '';
  const levelW = levelText.length * 5.4 + 12;
  const levelInk = course.level === 'grad' ? 'var(--accent)' : 'var(--muted)';

  return (
    <g
      className="node course-node"
      onClick={() => onSelect(id)}
    >
      <SketchRect x={x} y={y} w={COURSE_W} h={COURSE_H} seed={seed} fill="var(--node-fill)" />
      {thumb ? (
        <image
          href={thumb}
          x={thumbX} y={thumbY} width={thumbW} height={thumbH}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : logo ? (
        <image
          href={logo}
          x={x + COURSE_W / 2 - 24} y={thumbY + thumbH / 2 - 24}
          width={48} height={48}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <SketchText
          x={x + COURSE_W / 2}
          y={thumbY + thumbH / 2 + 6}
          lines={[course.university ?? 'Lectures']}
          size={20}
          fill="var(--muted)"
        />
      )}
      <SketchRect x={thumbX} y={thumbY} w={thumbW} h={thumbH} seed={seed + 1} strokeWidth={1} />
      <SketchText
        x={x + COURSE_W / 2}
        y={titleY}
        lines={titleLines}
        size={15}
      />
      {logo ? (
        <image
          href={logo}
          x={x + 14} y={y + COURSE_H - 32}
          width={22} height={22}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{course.university}</title>
        </image>
      ) : (
        course.university && (
          <SketchText
            x={x + 14} y={footerBaseline}
            lines={[course.university]}
            size={11} fill="var(--muted)" anchor="start"
          />
        )
      )}
      {term && (
        <SketchText
          x={x + COURSE_W - 14} y={footerBaseline}
          lines={[term]}
          size={11} fill="var(--muted)" anchor="end"
        />
      )}
      {/* Level sits inside the outline over the thumbnail's top-left, deliberately
          lighter than the +N badge so it reads as metadata, not a callout */}
      {course.level && (
        <g>
          <SketchRect
            x={thumbX + 6} y={thumbY + 6} w={levelW} h={18}
            seed={seed + 3} stroke={levelInk} fill="var(--bg)" strokeWidth={0.9}
          />
          <SketchText
            x={thumbX + 6 + levelW / 2} y={thumbY + 19}
            lines={[levelText]} size={10} fill={levelInk}
          />
        </g>
      )}
      {extra > 0 && (
        <g>
          <SketchRect
            x={x + COURSE_W - 34} y={y - 12} w={48} h={24}
            seed={seed + 2} stroke="var(--accent)" fill="var(--bg)" strokeWidth={1.2}
          />
          <SketchText x={x + COURSE_W - 10} y={y + 5} lines={[`+${extra}`]} size={13} fill="var(--accent)" />
        </g>
      )}
    </g>
  );
}

/** Which preview style group boxes use — flip to compare. */
const GROUP_PREVIEW = 'collage' as 'minimap' | 'collage';

/** Rects that make up a group's page, keyed like edgesOn() endpoints. */
function pageRects(groupId: string): Array<{ rect: Rect; kind: 'course' | 'group' | 'ghost' }> {
  const out: Array<{ rect: Rect; kind: 'course' | 'group' | 'ghost' }> = [];
  for (const id of coursesIn(groupId)) out.push({ rect: courseRect(map.courses[id]), kind: 'course' });
  for (const id of childGroups(groupId)) {
    const g = map.groups[id];
    if (g.pos && g.size) out.push({ rect: { x: g.pos.x, y: g.pos.y, w: g.size.w, h: g.size.h }, kind: 'group' });
  }
  for (const g of ghostsIn(groupId)) out.push({ rect: ghostRect(g), kind: 'ghost' });
  // Gaps preview like ghosts — dashed and unfilled, which is what they are
  for (const g of gapsIn(groupId)) out.push({ rect: gapRect(g), kind: 'ghost' });
  return out;
}

interface MiniMapProps {
  groupId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Tiny preview of a group's own page: its course boxes, child groups, ghosts
 * and prerequisite edges, scaled to fit. Drawn crisp (no rough.js) — at this
 * scale jitter reads as noise, thin clean lines read as a pencil preview.
 */
function MiniMap({ groupId, x, y, w, h }: MiniMapProps) {
  const items = pageRects(groupId);
  if (items.length === 0) return null;
  const rects = items.map((i) => i.rect);
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  // Cap the scale so a page with one or two courses doesn't blow up to fill the box
  const s = Math.min(w / (maxX - minX), h / (maxY - minY), 0.28);
  const ox = x + (w - (maxX - minX) * s) / 2;
  const oy = y + (h - (maxY - minY) * s) / 2;
  const px = (v: number) => ox + (v - minX) * s;
  const py = (v: number) => oy + (v - minY) * s;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {edgesOn(groupId).map((e, i) => {
        const p1 = borderPoint(e.fromRect, center(e.toRect));
        const p2 = borderPoint(e.toRect, center(e.fromRect));
        return (
          <line
            key={i}
            x1={px(p1.x)} y1={py(p1.y)} x2={px(p2.x)} y2={py(p2.y)}
            stroke="var(--muted)" strokeWidth={1}
          />
        );
      })}
      {items.map(({ rect, kind }, i) => (
        <rect
          key={i}
          x={px(rect.x)} y={py(rect.y)} width={rect.w * s} height={rect.h * s}
          rx={1.5}
          fill={kind === 'ghost' ? 'none' : kind === 'group' ? 'var(--group-fill)' : 'var(--node-fill)'}
          stroke={kind === 'ghost' ? 'var(--muted)' : 'var(--ink)'}
          strokeWidth={1}
          strokeDasharray={kind === 'ghost' ? '3 3' : undefined}
        />
      ))}
    </g>
  );
}

/**
 * Salt fixed for the life of the page, so a group's collage draws a different
 * four courses on every refresh but stays put while you are looking at it.
 */
const COLLAGE_SALT = String(Math.random());

/**
 * `limit` course thumbnails from a group's subtree, picked at random per page
 * load. Ordering by a hash keeps the pick a pure function of what is visible,
 * so hiding a school reshuffles honestly instead of leaving a stale cache.
 */
function collectThumbs(groupId: string, limit = 4): string[] {
  const found: string[] = [];
  const walk = (gid: string) => {
    for (const id of coursesIn(gid)) {
      const t = thumbUrl(primaryVersion(map.courses[id]));
      if (t) found.push(id);
    }
    for (const cid of childGroups(gid)) walk(cid);
  };
  walk(groupId);
  return found
    .sort((a, b) => seedFor(COLLAGE_SALT + a) - seedFor(COLLAGE_SALT + b))
    .slice(0, limit)
    .map((id) => thumbUrl(primaryVersion(map.courses[id])) as string);
}

interface CollageProps {
  thumbs: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
}

/** Spotify-playlist-style grid of course thumbnails, muted to sit with the sketch look. */
function Collage({ thumbs, x, y, w, h, seed }: CollageProps) {
  const gap = 6;
  const cw = (w - gap) / 2;
  const ch = (h - gap) / 2;
  let cells: Rect[];
  if (thumbs.length === 1) {
    cells = [{ x, y, w, h }];
  } else if (thumbs.length === 2) {
    cells = [
      { x, y, w: cw, h },
      { x: x + cw + gap, y, w: cw, h },
    ];
  } else if (thumbs.length === 3) {
    cells = [
      { x, y, w: cw, h: ch },
      { x: x + cw + gap, y, w: cw, h: ch },
      { x, y: y + ch + gap, w, h: ch },
    ];
  } else {
    cells = [
      { x, y, w: cw, h: ch },
      { x: x + cw + gap, y, w: cw, h: ch },
      { x, y: y + ch + gap, w: cw, h: ch },
      { x: x + cw + gap, y: y + ch + gap, w: cw, h: ch },
    ];
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {thumbs.map((t, i) => (
        <g key={i}>
          <image
            className="collage-img"
            href={t}
            x={cells[i].x} y={cells[i].y} width={cells[i].w} height={cells[i].h}
            preserveAspectRatio="xMidYMid slice"
          />
          <SketchRect
            x={cells[i].x} y={cells[i].y} w={cells[i].w} h={cells[i].h}
            seed={seed + 3 + i} strokeWidth={1}
          />
        </g>
      ))}
    </g>
  );
}

interface GroupNodeProps {
  id: string;
  group: Group;
  onOpen: (id: string) => void;
}

export function GroupNode({ id, group, onOpen }: GroupNodeProps) {
  if (!group.pos || !group.size) return null;
  const { x, y } = group.pos;
  const { w, h } = group.size;
  const seed = seedFor(id);
  const count = courseCount(id);
  const countLabel = `${count} course${count === 1 ? '' : 's'}`;
  const thumbs = GROUP_PREVIEW === 'collage' ? collectThumbs(id) : [];
  const hasPreview = thumbs.length > 0 || pageRects(id).length > 0;

  return (
    <g
      className="node group-node"
      onClick={() => onOpen(id)}
    >
      <SketchRect x={x} y={y} w={w} h={h} seed={seed} fill="var(--group-fill)" strokeWidth={1.8} />
      <SketchText x={x + w / 2} y={y - 14} lines={[group.title]} size={22} />
      {thumbs.length > 0 ? (
        <Collage thumbs={thumbs} x={x + 14} y={y + 14} w={w - 28} h={h - 52} seed={seed} />
      ) : hasPreview ? (
        <MiniMap groupId={id} x={x + 14} y={y + 14} w={w - 28} h={h - 52} />
      ) : (
        <SketchText
          x={x + w / 2} y={y + h / 2 + 6}
          lines={[countLabel]}
          size={14} fill="var(--muted)"
        />
      )}
      {hasPreview && (
        <SketchText
          x={x + 14} y={y + h - 12}
          lines={[countLabel]}
          size={12} anchor="start" fill="var(--muted)"
        />
      )}
      <SketchText x={x + w - 14} y={y + h - 12} lines={['open ↗']} size={12} anchor="end" fill="var(--accent)" />
    </g>
  );
}

interface GhostNodeProps {
  ghost: Ghost;
  onJump: (nodeId: string) => void;
}

export function GhostNode({ ghost, onJump }: GhostNodeProps) {
  const course = map.courses[ghost.node];
  const homeId = course ? course.group : map.groups[ghost.node]?.parent;
  const home = homeId ? map.groups[homeId] : undefined;
  const { x, y } = ghost.pos;
  const { h } = ghostRect(ghost);
  const w = ghostWidth(ghost);
  const seed = seedFor(ghost.node + ghost.inGroup);
  const titleLines = ghostTitleLines(ghost);
  const noteLines = ghostNoteLines(ghost);

  return (
    <g
      className="node ghost"
      onClick={() => onJump(ghost.node)}
    >
      <SketchRect
        x={x} y={y} w={w} h={h}
        seed={seed} stroke="var(--ghost-ink, var(--muted))" fill="var(--node-fill)"
        dash="6 6" strokeWidth={1.2}
      />
      <SketchText
        x={x + 14} y={y + 24}
        lines={titleLines} size={14} anchor="start"
        fill="var(--ghost-ink, var(--ink))"
      />
      {noteLines.length > 0 && (
        <SketchText
          x={x + 14} y={y + 24 + (titleLines.length - 1) * 18 + 20}
          lines={noteLines} size={12} anchor="start"
          fill="var(--muted)"
        />
      )}
      <SketchText
        x={x + 14} y={y + h - 13}
        lines={[`in ${home?.title ?? '?'}`]} size={11} anchor="start"
        fill="var(--ghost-ink, var(--muted))"
      />
    </g>
  );
}

interface PathwayStepNodeProps {
  ghost: Ghost;
  onJump: (nodeId: string) => void;
}

/**
 * A course step on a pathway page. Steps are the content there, so they draw
 * like the map's course boxes — thumbnail, title, school — with the step's
 * note in between, and a solid outline: this is the course, not a pointer to it.
 */
export function PathwayStepNode({ ghost, onJump }: PathwayStepNodeProps) {
  const course = map.courses[ghost.node];
  const { x, y } = ghost.pos;
  const { h } = ghostRect(ghost);
  const seed = seedFor(ghost.node + ghost.inGroup);
  const compact = isCompact();
  const thumb = thumbUrl(primaryVersion(course));
  const logo = logoFor(course.university);
  const titleLines = stepTitleLines(ghost);
  const noteLines = stepNoteLines(ghost);
  const thumbX = x + STEP_PAD;
  const thumbY = y + STEP_THUMB_TOP;
  const titleBase = y + stepTitleBase();
  const noteBase = titleBase + (titleLines.length - 1) * STEP_TITLE_LINE + STEP_NOTE_TOP;

  return (
    <g
      className="node course-node"
      onClick={() => onJump(ghost.node)}
    >
      <SketchRect x={x} y={y} w={STEP_W} h={h} seed={seed} fill="var(--node-fill)" />
      {!compact && (
        <>
          {thumb ? (
            <image
              href={thumb}
              x={thumbX} y={thumbY} width={STEP_THUMB_W} height={STEP_THUMB_H}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : logo ? (
            <image
              href={logo}
              x={x + STEP_W / 2 - 24} y={thumbY + STEP_THUMB_H / 2 - 24}
              width={48} height={48}
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <SketchText
              x={x + STEP_W / 2}
              y={thumbY + STEP_THUMB_H / 2 + 6}
              lines={[course.university ?? 'Lectures']}
              size={20}
              fill="var(--muted)"
            />
          )}
          <SketchRect
            x={thumbX} y={thumbY} w={STEP_THUMB_W} h={STEP_THUMB_H}
            seed={seed + 1} strokeWidth={1}
          />
        </>
      )}
      <SketchText x={x + STEP_W / 2} y={titleBase} lines={titleLines} size={15} />
      {noteLines.length > 0 && (
        <SketchText
          x={x + STEP_PAD} y={noteBase}
          lines={noteLines} size={12} anchor="start"
          fill="var(--muted)"
        />
      )}
      {!compact && (logo ? (
        <image
          href={logo}
          x={x + STEP_PAD} y={y + h - 32}
          width={22} height={22}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>{course.university}</title>
        </image>
      ) : (
        course.university && (
          <SketchText
            x={x + STEP_PAD} y={y + h - 14}
            lines={[course.university]}
            size={11} fill="var(--muted)" anchor="start"
          />
        )
      ))}
    </g>
  );
}

interface GapNodeProps {
  gap: Gap;
  onSelectCourse: (id: string) => void;
}

/**
 * A required step nobody has put online. Drawn deliberately unlike a course
 * card — no thumbnail, no accent — so it reads as a hole in the sequence, with
 * other schools' coverage offered underneath rather than swapped in silently.
 */
export function GapNode({ gap, onSelectCourse }: GapNodeProps) {
  const { x, y } = gap.pos;
  const { h } = gapRect(gap);
  const seed = seedFor(gap.id);
  const titleLines = gapTitleLines(gap);
  const noteLines = gapNoteLines(gap);
  const alts = gapAlternates(gap);

  const titleBase = y + GAP_TITLE_TOP;
  const statusY = titleBase + (titleLines.length - 1) * GAP_TITLE_LINE + GAP_STATUS_GAP;
  const noteBase = statusY + GAP_NOTE_TOP;
  const afterNote = noteLines.length > 0 ? noteBase + (noteLines.length - 1) * GAP_NOTE_LINE : statusY;
  const altsBase = afterNote + GAP_ALTS_TOP;

  return (
    <g className="node gap-node">
      <SketchRect
        x={x} y={y} w={GAP_W} h={h}
        seed={seed} stroke="var(--muted)" fill="var(--bg)"
        dash="4 5" strokeWidth={1.2}
      />
      <SketchText
        x={x + 14} y={titleBase}
        lines={titleLines} size={15} anchor="start" fill="var(--muted)"
      />
      <SketchText
        x={x + 14} y={statusY}
        lines={['⌀ not uploaded anywhere']} size={12} anchor="start" fill="var(--muted)"
      />
      {noteLines.length > 0 && (
        <SketchText
          x={x + 14} y={noteBase}
          lines={noteLines} size={11} anchor="start" fill="var(--muted)"
        />
      )}
      {alts.length > 0 && (
        <>
          <SketchText
            x={x + 14} y={altsBase}
            lines={['covered elsewhere:']} size={11} anchor="start" fill="var(--muted)"
          />
          {alts.map((id, i) => (
            <g key={id} className="gap-alt" onClick={() => onSelectCourse(id)}>
              {/* transparent hit area: SVG text alone is a thin target */}
              <rect
                x={x + 10} y={altsBase + 6 + i * GAP_ALT_ROW}
                width={GAP_W - 20} height={GAP_ALT_ROW}
                fill="transparent"
              />
              <SketchText
                x={x + 14} y={altsBase + GAP_ALT_ROW + i * GAP_ALT_ROW}
                lines={[gapAltLabel(id)]}
                size={12} anchor="start" fill="var(--accent)"
              />
            </g>
          ))}
        </>
      )}
    </g>
  );
}
