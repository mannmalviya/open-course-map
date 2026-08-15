import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  borderPoint, center, childGroups, coursesIn, edgesOn, gapRect, gapsIn, ghostsIn,
  courseRect, ghostRect, map, seedFor, totalCourseCount,
} from './model';
import type { Rect } from './types';
import { CourseNode, GapNode, GhostNode, GroupNode } from './nodes';
import { SketchArrow, SketchText } from './sketch';

export type Background = 'plain' | 'grid' | 'dots';

interface CanvasProps {
  groupId: string;
  background: Background;
  onSelectCourse: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onJumpToNode: (id: string) => void;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

/** Cell size in world units, doubled/halved so it stays legible at any zoom */
function cellSize(k: number): number {
  let cell = 20;
  while (cell * k < 14) cell *= 2;
  while (cell * k > 56) cell /= 2;
  return cell;
}

interface BgPatternProps {
  id: string;
  background: Background;
  cell: number;
  /** Pan/zoom applied to the pattern; identity off the canvas */
  transform?: string;
  k?: number;
}

/** The grid/dot fill, shared so the course page paints the same background as the map. */
function BgPattern({ id, background, cell, transform, k = 1 }: BgPatternProps) {
  return (
    <>
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={cell}
          height={cell}
          patternTransform={transform}
        >
          {background === 'grid' ? (
            <path
              d={`M ${cell / 2} 0 V ${cell} M 0 ${cell / 2} H ${cell}`}
              fill="none"
              stroke="var(--grid-line)"
              strokeWidth={1 / k}
            />
          ) : (
            <circle cx={cell / 2} cy={cell / 2} r={1.3 / k} fill="var(--dot)" />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </>
  );
}

/**
 * Full-bleed background for pages that replace the canvas, so navigating into a
 * course does not silently drop the user's background setting.
 */
export function BackgroundLayer({ background }: { background: Background }) {
  if (background === 'plain') return null;
  return (
    <svg className="bg-layer" aria-hidden="true">
      <BgPattern id="page-bg" background={background} cell={20} />
    </svg>
  );
}

export function Canvas({ groupId, background, onSelectCourse, onOpenGroup, onJumpToNode }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ startX: number; startY: number; tx: number; ty: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const courses = coursesIn(groupId);
  const groups = childGroups(groupId);
  const ghosts = ghostsIn(groupId);
  const gaps = gapsIn(groupId);
  const edges = edgesOn(groupId);

  // Fit content on page change
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rects: Rect[] = [
      ...courses.map((id) => courseRect(map.courses[id])),
      ...ghosts.map(ghostRect),
      ...gaps.map(gapRect),
      ...groups
        .map((id) => map.groups[id])
        .filter((g) => g.pos && g.size)
        .map((g) => ({ x: g.pos!.x, y: g.pos!.y - 30, w: g.size!.w, h: g.size!.h + 30 })),
    ];
    if (rects.length === 0) {
      setT({ x: 0, y: 0, k: 1 });
      return;
    }
    const pad = 70;
    // Extra top clearance so content never hides under the breadcrumb island
    const minX = Math.min(...rects.map((r) => r.x)) - pad;
    const minY = Math.min(...rects.map((r) => r.y)) - pad - 60;
    const maxX = Math.max(...rects.map((r) => r.x + r.w)) + pad;
    const maxY = Math.max(...rects.map((r) => r.y + r.h)) + pad;
    const { width, height } = svg.getBoundingClientRect();
    const k = Math.min(width / (maxX - minX), height / (maxY - minY), 1.4);
    setT({
      x: (width - (maxX - minX) * k) / 2 - minX * k,
      y: (height - (maxY - minY) * k) / 2 - minY * k,
      k,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Wheel: plain scroll pans (like Excalidraw), ctrl/cmd+scroll zooms at cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setT((prev) => {
          const k = Math.min(4, Math.max(0.15, prev.k * Math.exp(-e.deltaY * 0.0012)));
          const scale = k / prev.k;
          return { k, x: mx - (mx - prev.x) * scale, y: my - (my - prev.y) * scale };
        });
      } else {
        setT((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { startX: e.clientX, startY: e.clientY, tx: t.x, ty: t.y, moved: false };
    suppressClick.current = false;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    if (Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY) > 4) {
      drag.current.moved = true;
    }
    // Read drag state now, not inside the updater: React may run the updater
    // after pointerup has already cleared drag.current (fast fling release)
    const x = drag.current.tx + e.clientX - drag.current.startX;
    const y = drag.current.ty + e.clientY - drag.current.startY;
    setT((prev) => ({ ...prev, x, y }));
  };
  const onPointerUp = () => {
    // Pointer capture makes the browser fire a click on the pressed node even
    // after a long pan — swallow that click so panning never navigates
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const empty =
    courses.length === 0 && groups.length === 0 && ghosts.length === 0 && gaps.length === 0;
  // The pattern rides the same transform as the content, so it pans and zooms
  // with the map; strokes are divided by k to stay one screen pixel wide
  const cell = cellSize(t.k);

  return (
    <svg
      ref={svgRef}
      className="canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {background !== 'plain' && (
        <BgPattern
          id="canvas-bg"
          background={background}
          cell={cell}
          transform={`translate(${t.x} ${t.y}) scale(${t.k})`}
          k={t.k}
        />
      )}
      <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
        {edges.map((e, i) => {
          const from = borderPoint(e.fromRect, center(e.toRect));
          const to = borderPoint(e.toRect, center(e.fromRect));
          return (
            <SketchArrow
              key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              seed={seedFor(e.from + '->' + e.to)}
              stroke="var(--arrow)"
            />
          );
        })}
        {groups.map((id) => (
          <GroupNode key={id} id={id} group={map.groups[id]} onOpen={onOpenGroup} />
        ))}
        {ghosts.map((g, i) => (
          <GhostNode key={i} ghost={g} onJump={onJumpToNode} />
        ))}
        {gaps.map((g) => (
          <GapNode key={g.id} gap={g} onSelectCourse={onSelectCourse} />
        ))}
        {courses.map((id) => (
          <CourseNode key={id} id={id} course={map.courses[id]} onSelect={onSelectCourse} />
        ))}
        {empty && (
          <SketchText
            x={0} y={0}
            lines={[
              totalCourseCount(groupId) > 0
                ? 'Everything here is hidden by your school filter'
                : 'Nothing here yet — add a file in src/data/subjects/',
            ]}
            size={18}
            fill="var(--muted)"
          />
        )}
      </g>
    </svg>
  );
}
