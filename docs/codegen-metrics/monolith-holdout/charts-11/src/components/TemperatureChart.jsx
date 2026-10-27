import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Custom tooltip for temperature chart
function TempTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="chart-tooltip__row">
          {entry.name}: <strong>{entry.value}°C</strong>
        </p>
      ))}
    </div>
  );
}

/**
 * TemperatureChart — Recharts LineChart showing daily high and low temperatures.
 * Props: data — array of { day, tempHigh, tempLow }
 */
export default function TemperatureChart({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <span className="chart-card__icon">🌡️</span>
        <h2 className="chart-card__title">Temperature</h2>
        <span className="chart-card__subtitle">Daily high &amp; low (°C)</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
          <XAxis
            dataKey="day"
            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}°`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<TempTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            formatter={(value) => (
              <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="tempHigh"
            name="High"
            stroke="var(--color-high)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'var(--color-high)', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="tempLow"
            name="Low"
            stroke="var(--color-low)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'var(--color-low)', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
