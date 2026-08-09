import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  borderPoint, center, childGroups, coursesIn, edgesOn, ghostsIn,
  courseRect, ghostRect, map, seedFor,
} from './model';
import type { Rect } from './types';
import { CourseNode, GhostNode, GroupNode } from './nodes';
import { SketchArrow, SketchText } from './sketch';

interface CanvasProps {
  groupId: string;
  onSelectCourse: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onJumpToNode: (id: string) => void;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

export function Canvas({ groupId, onSelectCourse, onOpenGroup, onJumpToNode }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  const courses = coursesIn(groupId);
  const groups = childGroups(groupId);
  const ghosts = ghostsIn(groupId);
  const edges = edgesOn(groupId);

  // Fit content on page change
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rects: Rect[] = [
      ...courses.map((id) => courseRect(map.courses[id])),
      ...ghosts.map(ghostRect),
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
    drag.current = { startX: e.clientX, startY: e.clientY, tx: t.x, ty: t.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    setT((prev) => ({
      ...prev,
      x: drag.current!.tx + e.clientX - drag.current!.startX,
      y: drag.current!.ty + e.clientY - drag.current!.startY,
    }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const empty = courses.length === 0 && groups.length === 0 && ghosts.length === 0;

  return (
    <svg
      ref={svgRef}
      className="canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
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
        {courses.map((id) => (
          <CourseNode key={id} id={id} course={map.courses[id]} onSelect={onSelectCourse} />
        ))}
        {empty && <SketchText x={0} y={0} lines={['Nothing here yet — add courses to map.json']} size={18} fill="var(--muted)" />}
      </g>
    </svg>
  );
}
