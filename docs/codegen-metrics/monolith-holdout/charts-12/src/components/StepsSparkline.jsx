import React, { useState, useRef } from 'react';

const PADDING = { top: 20, right: 16, bottom: 40, left: 52 };
const HEIGHT = 220;

export default function StepsSparkline({ data, goal }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) return null;

  const maxSteps = Math.max(...data.map(d => d.steps), goal * 1.1);
  const minSteps = Math.min(...data.map(d => d.steps)) * 0.9;

  // We'll use a responsive approach: compute in percentages, then scale
  const W = 600; // viewBox width
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const xScale = (i) => PADDING.left + (i / (data.length - 1)) * innerW;
  const yScale = (v) => PADDING.top + innerH - ((v - minSteps) / (maxSteps - minSteps)) * innerH;

  // Build SVG path
  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.steps), ...d }));
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill path
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(PADDING.top + innerH).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(PADDING.top + innerH).toFixed(1)} Z`;

  // Goal line Y
  const goalY = yScale(goal);

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return Math.round(minSteps + ((maxSteps - minSteps) / (yTicks - 1)) * i);
  });

  // X-axis labels: show every ~5th label
  const xLabelStep = Math.max(1, Math.floor(data.length / 6));

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX - PADDING.left;
    const idx = Math.round((mx / innerW) * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setTooltip({ idx: clamped, x: points[clamped].x, y: points[clamped].y });
  };

  return (
    <div className="chart-svg-wrapper">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="chart-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x={PADDING.left} y={PADDING.top} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {/* Y-axis grid lines and labels */}
        {yTickValues.map((val) => {
          const ty = yScale(val);
          return (
            <g key={val}>
              <line
                x1={PADDING.left} y1={ty}
                x2={PADDING.left + innerW} y2={ty}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3"
              />
              <text
                x={PADDING.left - 8} y={ty + 4}
                textAnchor="end" fontSize="11" fill="#9ca3af"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Goal line */}
        <line
          x1={PADDING.left} y1={goalY}
          x2={PADDING.left + innerW} y2={goalY}
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4"
        />
        <text x={PADDING.left + innerW + 4} y={goalY + 4} fontSize="10" fill="#f59e0b">
          Goal
        </text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#stepsGradient)" clipPath="url(#chartClip)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath="url(#chartClip)"
        />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % xLabelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={xScale(i)}
              y={PADDING.top + innerH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {d.date}
            </text>
          );
        })}

        {/* Tooltip */}
        {tooltip !== null && (
          <g>
            <line
              x1={tooltip.x} y1={PADDING.top}
              x2={tooltip.x} y2={PADDING.top + innerH}
              stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
            {/* Tooltip box */}
            <rect
              x={Math.min(tooltip.x - 44, W - PADDING.right - 90)}
              y={tooltip.y - 42}
              width="88" height="34"
              rx="6" fill="#1e293b" opacity="0.92"
            />
            <text
              x={Math.min(tooltip.x, W - PADDING.right - 46) + 0}
              y={tooltip.y - 24}
              textAnchor="middle" fontSize="10" fill="#94a3b8"
            >
              {data[tooltip.idx].date}
            </text>
            <text
              x={Math.min(tooltip.x, W - PADDING.right - 46) + 0}
              y={tooltip.y - 12}
              textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600"
            >
              {data[tooltip.idx].steps.toLocaleString()} steps
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
