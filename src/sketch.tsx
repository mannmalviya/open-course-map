import { useMemo } from 'react';
import rough from 'roughjs';

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
}

/** Hand-drawn rectangle rendered as SVG paths via rough.js (Excalidraw's shape library). */
export function SketchRect({ x, y, w, h, seed, stroke = 'var(--ink)', fill, strokeWidth = 1.5, dash }: SketchRectProps) {
  const paths = useMemo(() => {
    const drawable = gen.rectangle(0, 0, w, h, {
      seed,
      roughness: 1.4,
      bowing: 1,
      strokeWidth,
      ...(fill ? { fill: 'placeholder', fillStyle: 'solid' } : {}),
    });
    return gen.toPaths(drawable);
  }, [w, h, seed, strokeWidth, fill]);

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
