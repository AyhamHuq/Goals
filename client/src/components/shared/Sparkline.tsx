import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
}

/**
 * Minimal SVG line chart — no dependencies.
 * Useful for showing progress trends inside drawers and cards.
 */
export default function Sparkline({
  data,
  width = 120,
  height = 36,
  color = '#6C5CE7',
  filled = true,
  strokeWidth = 2,
}: SparklineProps) {
  if (data.length < 2) return null;

  const pad = strokeWidth + 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + (1 - (v - min) / range) * h;
    return [x, y] as [number, number];
  });

  const polyline = points.map((p) => p.join(',')).join(' ');

  // Filled area path
  const area = filled
    ? [
        `M ${points[0][0]},${pad + h}`,
        ...points.map(([x, y]) => `L ${x},${y}`),
        `L ${points[points.length - 1][0]},${pad + h}`,
        'Z',
      ].join(' ')
    : '';

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      overflow="visible"
      style={{ display: 'block' }}
    >
      {filled && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
      )}
      {filled && (
        <path d={area} fill={`url(#${gradId})`} />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={strokeWidth + 1}
        fill={color}
      />
    </svg>
  );
}
