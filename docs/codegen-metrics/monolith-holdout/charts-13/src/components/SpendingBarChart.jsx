import React, { useState } from 'react';
import { spendingData, categoryColors, categories } from '../data/budgetData.js';

const BAR_WIDTH = 32;
const GROUP_GAP = 24;
const CHART_HEIGHT = 280;
const PADDING = { top: 20, right: 20, bottom: 40, left: 56 };

/**
 * Custom SVG bar chart for monthly spending by category.
 * No external charting library — pure SVG + React.
 */
export default function SpendingBarChart() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Determine visible categories
  const visibleCats = activeCategory ? [activeCategory] : categories;

  // Compute max value for Y axis
  const maxVal = Math.max(
    ...spendingData.map(row =>
      categories.reduce((s, cat) => s + (row[cat] || 0), 0)
    )
  );
  const yMax = Math.ceil(maxVal / 500) * 500;

  const numMonths = spendingData.length;
  const groupWidth = visibleCats.length * BAR_WIDTH + GROUP_GAP;
  const innerWidth = numMonths * groupWidth;
  const svgWidth = innerWidth + PADDING.left + PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));

  function barY(value) {
    return PADDING.top + innerHeight - (value / yMax) * innerHeight;
  }
  function barH(value) {
    return (value / yMax) * innerHeight;
  }

  return (
    <div className="bar-chart-wrap">
      {/* Legend */}
      <div className="legend">
        {categories.map(cat => (
          <button
            key={cat}
            className={`legend-item ${activeCategory === cat ? 'active' : ''} ${activeCategory && activeCategory !== cat ? 'dimmed' : ''}`}
            onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
            title={`Toggle ${cat}`}
          >
            <span className="legend-dot" style={{ background: categoryColors[cat] }} />
            {cat}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="svg-scroll">
        <svg
          width={svgWidth}
          height={CHART_HEIGHT}
          style={{ display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y-axis grid lines & labels */}
          {yTicks.map(tick => {
            const y = barY(tick);
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

          {/* Bars */}
          {spendingData.map((row, mi) => {
            const groupX = PADDING.left + mi * groupWidth;
            return (
              <g key={row.month}>
                {visibleCats.map((cat, ci) => {
                  const val = row[cat] || 0;
                  const x = groupX + ci * BAR_WIDTH;
                  const y = barY(val);
                  const h = barH(val);
                  const isHovered = tooltip && tooltip.month === row.month && tooltip.cat === cat;
                  return (
                    <rect
                      key={cat}
                      x={x + 2} y={y}
                      width={BAR_WIDTH - 4} height={h}
                      rx="4"
                      fill={categoryColors[cat]}
                      opacity={isHovered ? 1 : 0.82}
                      style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => setTooltip({ month: row.month, cat, val, x: e.clientX, y: e.clientY })}
                      onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
                {/* Month label */}
                <text
                  x={groupX + (visibleCats.length * BAR_WIDTH) / 2}
                  y={PADDING.top + innerHeight + 20}
                  textAnchor="middle" fontSize="12" fill="#6b7280"
                >
                  {row.month}
                </text>
              </g>
            );
          })}

          {/* Y-axis line */}
          <line
            x1={PADDING.left} y1={PADDING.top}
            x2={PADDING.left} y2={PADDING.top + innerHeight}
            stroke="#d1d5db" strokeWidth="1"
          />
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36, position: 'fixed' }}
        >
          <span className="tooltip-dot" style={{ background: categoryColors[tooltip.cat] }} />
          <strong>{tooltip.cat}</strong> — {tooltip.month}: <strong>${tooltip.val.toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
}
