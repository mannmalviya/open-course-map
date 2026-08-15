import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import rough from 'roughjs';
import { COURSE_W, seedFor } from './model';

const gen = rough.generator();

interface SketchRectProps {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  dash?: string;
  roughness?: number;
  bowing?: number;
}

/** Hand-drawn rectangle rendered as SVG paths via rough.js (Excalidraw's shape library). */
export function SketchRect({
  x, y, w, h, seed, stroke = 'var(--ink)', fill, strokeWidth = 1.5, dash,
  roughness = 1.4, bowing = 1,
}: SketchRectProps) {
  const paths = useMemo(() => {
    const drawable = gen.rectangle(0, 0, w, h, {
      seed,
      roughness,
      bowing,
      strokeWidth,
      ...(fill ? { fill: 'placeholder', fillStyle: 'solid' } : {}),
    });
    return gen.toPaths(drawable);
  }, [w, h, seed, strokeWidth, fill, roughness, bowing]);

  return (
    <g transform={`translate(${x} ${y})`}>
      {paths.map((p, i) => {
        const isFill = p.fill !== undefined && p.fill !== 'none';
        return (
          <path
            key={i}
            d={p.d}
            style={
              isFill
                ? { fill: fill, stroke: 'none' }
                : { fill: 'none', stroke, strokeWidth, strokeDasharray: dash }
            }
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/**
 * rough.js deviation is roughly absolute, so a page-width card drawn at the
 * canvas's roughness looks almost straight next to a 220px map card. Scale the
 * wobble with the box so both read as the same hand.
 */
function boxRoughness(w: number, h: number): number {
  return Math.min(1.4 * Math.sqrt(Math.max(w, h) / COURSE_W), 2.6);
}

interface SketchBoxProps {
  /** Stable string so a card's jitter stays put across re-renders */
  seedKey: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  children: ReactNode;
}

/**
 * A hand-drawn border around an HTML box — the map's card look, outside the canvas.
 * rough.js needs pixel geometry, so the frame trails the element's measured size.
 */
export function SketchBox({
  seedKey, className, fill = 'var(--node-fill)', stroke, strokeWidth, children,
}: SketchBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const rough = boxRoughness(size.w, size.h);
  // strokes wander further as roughness climbs, so the frame is inset to match
  const inset = 2 + rough;

  return (
    <div ref={ref} className={'sketch-box' + (className ? ' ' + className : '')}>
      {size.w > 0 && size.h > 0 && (
        <svg className="sketch-box-frame" width={size.w} height={size.h} aria-hidden="true">
          <SketchRect
            x={inset}
            y={inset}
            w={size.w - inset * 2}
            h={size.h - inset * 2}
            seed={seedFor(seedKey)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            roughness={rough}
            bowing={Math.min(rough, 2)}
          />
        </svg>
      )}
      <div className="sketch-box-body">{children}</div>
    </div>
  );
}

interface SketchArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  seed: number;
  stroke?: string;
}

export function SketchArrow({ x1, y1, x2, y2, seed, stroke = 'var(--ink)' }: SketchArrowProps) {
  const paths = useMemo(() => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = 14;
    const spread = Math.PI / 7;
    const shapes = [
      gen.line(x1, y1, x2, y2, { seed, roughness: 1, strokeWidth: 1.5 }),
      gen.line(
        x2, y2,
        x2 - head * Math.cos(angle - spread), y2 - head * Math.sin(angle - spread),
        { seed: seed + 1, roughness: 1, strokeWidth: 1.5 },
      ),
      gen.line(
        x2, y2,
        x2 - head * Math.cos(angle + spread), y2 - head * Math.sin(angle + spread),
        { seed: seed + 2, roughness: 1, strokeWidth: 1.5 },
      ),
    ];
    return shapes.flatMap((s) => gen.toPaths(s));
  }, [x1, y1, x2, y2, seed]);

  return (
    <g>
      {paths.map((p, i) => (
        <path key={i} d={p.d} style={{ fill: 'none', stroke, strokeWidth: 1.5 }} strokeLinecap="round" />
      ))}
    </g>
  );
}

interface SketchTextProps {
  x: number;
  y: number;
  lines: string[];
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
}

export function SketchText({ x, y, lines, size = 15, anchor = 'middle', fill = 'var(--ink)' }: SketchTextProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{ fill, fontFamily: 'var(--hand-font)', fontSize: size, userSelect: 'none' }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * 1.25}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
