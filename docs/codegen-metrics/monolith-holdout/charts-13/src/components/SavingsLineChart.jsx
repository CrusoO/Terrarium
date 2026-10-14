import React, { useState } from 'react';
import { savingsData } from '../data/budgetData.js';

const CHART_HEIGHT = 280;
const PADDING = { top: 20, right: 24, bottom: 40, left: 56 };
const LINE_COLOR = '#4f6ef7';
const AREA_COLOR = 'rgba(79,110,247,0.10)';

/**
 * Custom SVG line chart for monthly savings trend.
 * No external charting library — pure SVG + React.
 */
export default function SavingsLineChart() {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxSavings = Math.max(...savingsData.map(d => d.savings));
  const yMax = Math.ceil(maxSavings / 200) * 200;
  const numPoints = savingsData.length;

  // Dynamic width based on container — use a fixed logical width
  const svgWidth = 520;
  const innerWidth = svgWidth - PADDING.left - PADDING.right;

  function xPos(i) {
    return PADDING.left + (i / (numPoints - 1)) * innerWidth;
  }
  function yPos(val) {
    return PADDING.top + innerHeight - (val / yMax) * innerHeight;
  }

  // Build polyline points
  const points = savingsData.map((d, i) => `${xPos(i)},${yPos(d.savings)}`).join(' ');

  // Build area path (closed polygon)
  const areaPath = [
    `M ${xPos(0)},${PADDING.top + innerHeight}`,
    ...savingsData.map((d, i) => `L ${xPos(i)},${yPos(d.savings)}`),
    `L ${xPos(numPoints - 1)},${PADDING.top + innerHeight}`,
    'Z'
  ].join(' ');

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));

  return (
    <div className="line-chart-wrap">
      <svg
        width="100%" viewBox={`0 0 ${svgWidth} ${CHART_HEIGHT}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => { setTooltip(null); setHoveredIdx(null); }}
      >
        {/* Y-axis grid lines & labels */}
        {yTicks.map(tick => {
          const y = yPos(tick);
          return (
            <g key={tick}>
              <line
                x1={PADDING.left} y1={y}
                x2={PADDING.left + innerWidth} y2={y}
                stroke="#e5e7eb" strokeWidth="1"
              />
              <text
                x={PADDING.left - 8} y={y + 4}
                textAnchor="end" fontSize="11" fill="#9ca3af"
              >
                ${tick >= 1000 ? `${tick / 1000}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={AREA_COLOR} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {savingsData.map((d, i) => (
          <g key={d.month}>
            {/* Invisible hit area */}
            <circle
              cx={xPos(i)} cy={yPos(d.savings)}
              r={14} fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => {
                setHoveredIdx(i);
                setTooltip({ month: d.month, val: d.savings, x: e.clientX, y: e.clientY });
              }}
              onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
              onMouseLeave={() => { setTooltip(null); setHoveredIdx(null); }}
            />
            {/* Visible dot */}
            <circle
              cx={xPos(i)} cy={yPos(d.savings)}
              r={hoveredIdx === i ? 7 : 5}
              fill={hoveredIdx === i ? LINE_COLOR : '#fff'}
              stroke={LINE_COLOR}
              strokeWidth="2.5"
              style={{ transition: 'r 0.15s' }}
              pointerEvents="none"
            />
            {/* Month label */}
            <text
              x={xPos(i)} y={PADDING.top + innerHeight + 20}
              textAnchor="middle" fontSize="12" fill="#6b7280"
            >
              {d.month}
            </text>
          </g>
        ))}

        {/* Y-axis line */}
        <line
          x1={PADDING.left} y1={PADDING.top}
          x2={PADDING.left} y2={PADDING.top + innerHeight}
          stroke="#d1d5db" strokeWidth="1"
        />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36, position: 'fixed' }}
        >
          <span className="tooltip-dot" style={{ background: LINE_COLOR }} />
          <strong>Savings</strong> — {tooltip.month}: <strong>${tooltip.val.toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
}
