import React, { useState, useRef, useCallback } from 'react';

/**
 * Pure-SVG ComposedChart rendering:
 *   - Bar series  → Monthly Revenue (left Y-axis)
 *   - Line series → Monthly Orders  (right Y-axis)
 *
 * Features: hover tooltips, animated bars, responsive via viewBox.
 */
export default function SalesChart({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  // ── Layout constants ──────────────────────────────────────────────────────
  const W = 900, H = 380;
  const marginTop = 24, marginRight = 64, marginBottom = 48, marginLeft = 72;
  const chartW = W - marginLeft - marginRight;
  const chartH = H - marginTop - marginBottom;

  // ── Data ranges ───────────────────────────────────────────────────────────
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxOrders  = Math.max(...data.map(d => d.orders));

  // Round up to a nice ceiling for grid lines
  const revCeil   = Math.ceil(maxRevenue / 50000) * 50000;
  const ordCeil   = Math.ceil(maxOrders  / 100)   * 100;
  const gridCount = 5;

  // ── Scale helpers ─────────────────────────────────────────────────────────
  const xStep    = chartW / data.length;
  const barWidth = xStep * 0.52;

  const scaleRev = v => chartH - (v / revCeil) * chartH;
  const scaleOrd = v => chartH - (v / ordCeil) * chartH;

  const xCenter = i => marginLeft + i * xStep + xStep / 2;

  // ── Tooltip handler ───────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e, d, i) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      data: d,
      index: i,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // ── Line path for orders ──────────────────────────────────────────────────
  const linePath = data
    .map((d, i) => {
      const x = xCenter(i);
      const y = marginTop + scaleOrd(d.orders);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // ── Grid Y values ─────────────────────────────────────────────────────────
  const gridLines = Array.from({ length: gridCount + 1 }, (_, k) =>
    (revCeil / gridCount) * k
  );

  const fmt = v =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  const fmtOrd = v =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;

  return (
    <div className="chart-wrapper" style={{ position: 'relative' }}>
      {/* Legend */}
      <div className="chart-legend">
        <span className="legend-item legend-bar">
          <span className="legend-swatch" style={{ background: 'var(--color-bar)' }} />
          Monthly Revenue
        </span>
        <span className="legend-item legend-line">
          <span className="legend-swatch legend-swatch--line" style={{ background: 'var(--color-line)' }} />
          Monthly Orders
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="chart-svg"
        onMouseLeave={handleMouseLeave}
        aria-label="Sales chart showing monthly revenue and orders"
        role="img"
      >
        {/* ── Grid lines ── */}
        {gridLines.map((val, k) => {
          const y = marginTop + scaleRev(val);
          return (
            <g key={k}>
              <line
                x1={marginLeft} y1={y}
                x2={marginLeft + chartW} y2={y}
                stroke="var(--color-grid)" strokeWidth="1"
                strokeDasharray={k === 0 ? '0' : '4 3'}
              />
              {/* Left axis label — Revenue */}
              <text
                x={marginLeft - 8} y={y + 4}
                textAnchor="end"
                className="axis-label"
              >
                {fmt(val)}
              </text>
              {/* Right axis label — Orders */}
              <text
                x={marginLeft + chartW + 8} y={y + 4}
                textAnchor="start"
                className="axis-label axis-label--right"
              >
                {fmtOrd((ordCeil / gridCount) * k)}
              </text>
            </g>
          );
        })}

        {/* ── Axis lines ── */}
        <line
          x1={marginLeft} y1={marginTop}
          x2={marginLeft} y2={marginTop + chartH}
          stroke="var(--color-axis)" strokeWidth="1.5"
        />
        <line
          x1={marginLeft} y1={marginTop + chartH}
          x2={marginLeft + chartW} y2={marginTop + chartH}
          stroke="var(--color-axis)" strokeWidth="1.5"
        />
        <line
          x1={marginLeft + chartW} y1={marginTop}
          x2={marginLeft + chartW} y2={marginTop + chartH}
          stroke="var(--color-axis)" strokeWidth="1" strokeDasharray="4 3"
          opacity="0.5"
        />

        {/* ── Bars (Revenue) ── */}
        {data.map((d, i) => {
          const barH  = (d.revenue / revCeil) * chartH;
          const x     = xCenter(i) - barWidth / 2;
          const y     = marginTop + chartH - barH;
          const isHov = tooltip?.index === i;
          return (
            <rect
              key={d.month}
              x={x} y={y}
              width={barWidth} height={barH}
              rx="4" ry="4"
              fill={isHov ? 'var(--color-bar-hover)' : 'var(--color-bar)'}
              opacity={tooltip && !isHov ? 0.55 : 1}
              className="chart-bar"
              onMouseMove={e => handleMouseMove(e, d, i)}
            />
          );
        })}

        {/* ── Line area fill (Orders) ── */}
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-line)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-line)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path
          d={`${linePath} L ${xCenter(data.length - 1)} ${marginTop + chartH} L ${xCenter(0)} ${marginTop + chartH} Z`}
          fill="url(#lineGrad)"
        />

        {/* ── Line (Orders) ── */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Line dots ── */}
        {data.map((d, i) => {
          const cx    = xCenter(i);
          const cy    = marginTop + scaleOrd(d.orders);
          const isHov = tooltip?.index === i;
          return (
            <circle
              key={`dot-${d.month}`}
              cx={cx} cy={cy}
              r={isHov ? 6 : 4}
              fill={isHov ? 'var(--color-line)' : '#fff'}
              stroke="var(--color-line)"
              strokeWidth="2.5"
              className="chart-dot"
              onMouseMove={e => handleMouseMove(e, d, i)}
            />
          );
        })}

        {/* ── X-axis labels ── */}
        {data.map((d, i) => (
          <text
            key={`lbl-${d.month}`}
            x={xCenter(i)}
            y={marginTop + chartH + 20}
            textAnchor="middle"
            className="axis-label"
          >
            {d.month}
          </text>
        ))}

        {/* ── Axis titles ── */}
        <text
          x={-(marginTop + chartH / 2)}
          y={16}
          transform="rotate(-90)"
          textAnchor="middle"
          className="axis-title"
          fill="var(--color-bar)"
        >
          Revenue (USD)
        </text>
        <text
          x={marginLeft + chartW + marginRight - 4}
          y={marginTop - 8}
          textAnchor="end"
          className="axis-title"
          fill="var(--color-line)"
        >
          Orders
        </text>
      </svg>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x + 14,
            top:  tooltip.y - 60,
          }}
        >
          <div className="tooltip-month">{tooltip.data.month} 2024</div>
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ background: 'var(--color-bar)' }} />
            <span>Revenue</span>
            <strong>${tooltip.data.revenue.toLocaleString()}</strong>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ background: 'var(--color-line)' }} />
            <span>Orders</span>
            <strong>{tooltip.data.orders.toLocaleString()}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
