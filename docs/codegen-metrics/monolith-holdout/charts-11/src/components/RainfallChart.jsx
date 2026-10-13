import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

// Custom tooltip for rainfall chart
function RainTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p style={{ color: 'var(--color-rain)' }} className="chart-tooltip__row">
        Rainfall: <strong>{payload[0].value} mm</strong>
      </p>
    </div>
  );
}

/**
 * RainfallChart — Recharts BarChart showing daily rainfall in mm.
 * Props: data — array of { day, rainfall }
 */
export default function RainfallChart({ data }) {
  // Highlight the wettest day
  const maxRain = Math.max(...data.map((d) => d.rainfall));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <span className="chart-card__icon">🌧️</span>
        <h2 className="chart-card__title">Rainfall</h2>
        <span className="chart-card__subtitle">Daily total (mm)</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
            axisLine={false}
            tickLine={false}
            width={36}
            label={{
              value: 'mm',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fill: 'var(--text-secondary)', fontSize: 12 },
            }}
          />
          <Tooltip content={<RainTooltip />} cursor={{ fill: 'var(--rain-hover)' }} />
          <Bar dataKey="rainfall" name="Rainfall" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.day}
                fill={entry.rainfall === maxRain && maxRain > 0 ? 'var(--color-rain-peak)' : 'var(--color-rain)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
