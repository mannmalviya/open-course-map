import { useEffect, useRef, useState } from 'react';
import { formatViews } from './model';
import type { Lecture } from './types';

interface ViewsChartProps {
  lectures: Lecture[];
}

/** Clean y-axis ticks from 0 to the first nice step at or above the max, ~4 divisions. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

const HEIGHT = 240;
const M = { top: 12, right: 8, bottom: 26, left: 46 };

/** Chart type is shared across all viewership charts, not per course. */
let sharedMode: 'bar' | 'line' = 'line';

/** Views per lecture as bars or a line, with a per-lecture hover tooltip. */
export function ViewsChart({ lectures }: ViewsChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [mode, setModeState] = useState<'bar' | 'line'>(sharedMode);
  const setMode = (m: 'bar' | 'line') => {
    sharedMode = m;
    setModeState(m);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = lectures.length;
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const max = Math.max(...lectures.map((l) => l.views));
  const ticks = niceTicks(max);
  const yMax = ticks[ticks.length - 1] || 1;
  const band = n > 0 ? innerW / n : 0;
  const barW = Math.min(24, Math.max(2, band - 2));
  const xTickStep = n <= 12 ? 1 : n <= 40 ? 5 : 10;

  const barX = (i: number) => M.left + i * band + (band - barW) / 2;
  const barY = (v: number) => M.top + innerH * (1 - v / yMax);

  const barPath = (i: number, v: number) => {
    const x = barX(i);
    const y = barY(v);
    const h = M.top + innerH - y;
    const r = Math.min(4, barW / 2, h);
    return `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + barW - r} ${y} Q ${x + barW} ${y} ${x + barW} ${y + r} L ${x + barW} ${y + h} Z`;
  };

  const dotX = (i: number) => M.left + (i + 0.5) * band;
  const linePath = lectures
    .map((l, i) => `${i === 0 ? 'M' : 'L'} ${dotX(i)} ${barY(l.views)}`)
    .join(' ');

  const hovered = hover !== null ? lectures[hover] : null;

  return (
    <div className="views-chart" ref={wrapRef}>
      <div className="chart-mode" role="group" aria-label="Chart type">
        <button
          className={'chart-mode-btn' + (mode === 'line' ? ' active' : '')}
          aria-pressed={mode === 'line'}
          title="Line graph"
          onClick={() => setMode('line')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <polyline
              points="1,9.5 4.5,4 7.5,6.5 11,1.5"
              fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className={'chart-mode-btn' + (mode === 'bar' ? ' active' : '')}
          aria-pressed={mode === 'bar'}
          title="Bar graph"
          onClick={() => setMode('bar')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <rect x="1" y="5" width="2.6" height="6" rx="1" fill="currentColor" />
            <rect x="4.7" y="1" width="2.6" height="10" rx="1" fill="currentColor" />
            <rect x="8.4" y="7" width="2.6" height="4" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label="Views per lecture">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.left} x2={width - M.right}
                y1={barY(t)} y2={barY(t)}
                stroke="var(--chart-grid)" strokeWidth={1}
              />
              <text x={M.left - 8} y={barY(t) + 3.5} textAnchor="end" className="chart-tick">
                {formatViews(t)}
              </text>
            </g>
          ))}
          {mode === 'bar' ? (
            lectures.map((l, i) => (
              <path key={i} d={barPath(i, l.views)} fill="var(--chart-bar)" opacity={hover === null || hover === i ? 1 : 0.45} />
            ))
          ) : (
            <>
              {hover !== null && (
                <line
                  x1={dotX(hover)} x2={dotX(hover)}
                  y1={M.top} y2={M.top + innerH}
                  stroke="var(--chart-grid)" strokeWidth={1}
                />
              )}
              <path
                d={linePath}
                fill="none" stroke="var(--chart-bar)" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round"
              />
              {hover !== null && (
                <circle
                  cx={dotX(hover)} cy={barY(lectures[hover].views)} r={4}
                  fill="var(--chart-bar)" stroke="var(--island-bg)" strokeWidth={2}
                />
              )}
            </>
          )}
          {lectures.map((_, i) =>
            (i + 1 === 1 || (i + 1) % xTickStep === 0) &&
            barX(i) + barW / 2 < width - M.right - 56 ? (
              <text key={i} x={barX(i) + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="chart-tick">
                {i + 1}
              </text>
            ) : null
          )}
          <text x={width - M.right} y={HEIGHT - 8} textAnchor="end" className="chart-tick chart-axis-name">
            lecture
          </text>
          {/* full-height hit targets, wider than the marks */}
          {lectures.map((l, i) => (
            <rect
              key={i}
              x={M.left + i * band} y={M.top} width={band} height={innerH}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <title>{`${l.title} — ${formatViews(l.views)} views`}</title>
            </rect>
          ))}
        </svg>
      )}
      {hovered && hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(barX(hover) + barW / 2, 90), width - 90),
            top: barY(hovered.views) - 10,
          }}
        >
          <div className="chart-tooltip-title">{hovered.title}</div>
          <div className="chart-tooltip-value">{formatViews(hovered.views)} views</div>
        </div>
      )}
    </div>
  );
}
