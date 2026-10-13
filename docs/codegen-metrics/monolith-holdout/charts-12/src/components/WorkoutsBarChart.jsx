import React, { useState } from 'react';

const PADDING = { top: 20, right: 16, bottom: 48, left: 40 };
const HEIGHT = 220;
const MAX_COUNT = 6;

export default function WorkoutsBarChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const W = 600;
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const barCount = data.length;
  const groupW = innerW / barCount;
  const barW = Math.min(groupW * 0.55, 48);

  const yScale = (v) => PADDING.top + innerH - (v / MAX_COUNT) * innerH;
  const barHeight = (v) => (v / MAX_COUNT) * innerH;

  // Y-axis ticks 0–6
  const yTicks = [0, 1, 2, 3, 4, 5, 6];

  // Color by count
  const barColor = (count, isHovered) => {
    if (isHovered) return '#16a34a';
    if (count >= 5) return '#22c55e';
    if (count >= 3) return '#4ade80';
    return '#86efac';
  };

  return (
    <div className="chart-svg-wrapper">
      <svg
        viewBox={`0 0 ${W} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="chart-svg"
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="1" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((val) => {
          const ty = yScale(val);
          return (
            <g key={val}>
              <line
                x1={PADDING.left} y1={ty}
                x2={PADDING.left + innerW} y2={ty}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray={val === 0 ? 'none' : '4 3'}
              />
              <text
                x={PADDING.left - 8} y={ty + 4}
                textAnchor="end" fontSize="11" fill="#9ca3af"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = PADDING.left + i * groupW + groupW / 2;
          const bx = cx - barW / 2;
          const by = yScale(d.count);
          const bh = barHeight(d.count);
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hover hit area */}
              <rect
                x={cx - groupW / 2} y={PADDING.top}
                width={groupW} height={innerH}
                fill="transparent"
              />

              {/* Bar */}
              <rect
                x={bx} y={by}
                width={barW} height={Math.max(bh, 2)}
                rx="5" ry="5"
                fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradient)'}
                opacity={isHovered ? 1 : 0.85}
              />

              {/* Count label on top of bar */}
              {d.count > 0 && (
                <text
                  x={cx} y={by - 6}
                  textAnchor="middle" fontSize="11"
                  fill={isHovered ? '#15803d' : '#4ade80'}
                  fontWeight="600"
                >
                  {d.count}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={cx}
                y={PADDING.top + innerH + 18}
                textAnchor="middle" fontSize="10" fill="#9ca3af"
              >
                {d.week}
              </text>
              <text
                x={cx}
                y={PADDING.top + innerH + 30}
                textAnchor="middle" fontSize="9" fill="#c4c9d4"
              >
                Wk {i + 1}
              </text>

              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(cx - 44, W - PADDING.right - 90)}
                    y={by - 52}
                    width="88" height="34"
                    rx="6" fill="#1e293b" opacity="0.92"
                  />
                  <text
                    x={Math.min(cx, W - PADDING.right - 46)}
                    y={by - 34}
                    textAnchor="middle" fontSize="10" fill="#94a3b8"
                  >
                    Week {i + 1} · {d.week}
                  </text>
                  <text
                    x={Math.min(cx, W - PADDING.right - 46)}
                    y={by - 22}
                    textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600"
                  >
                    {d.count} session{d.count !== 1 ? 's' : ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="bar-legend">
        <span className="legend-dot" style={{ background: '#86efac' }} /> 1–2 sessions
        <span className="legend-dot" style={{ background: '#4ade80', marginLeft: 16 }} /> 3–4 sessions
        <span className="legend-dot" style={{ background: '#22c55e', marginLeft: 16 }} /> 5–6 sessions
      </div>
    </div>
  );
}
