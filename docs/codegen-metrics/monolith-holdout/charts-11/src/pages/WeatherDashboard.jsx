import React, { useState } from 'react';
import { weatherData, city, dateRange } from '../data/weatherData.js';
import { calcAverage, calcTotal } from '../utils/helpers.js';
import StatCard from '../components/StatCard.jsx';
import TemperatureChart from '../components/TemperatureChart.jsx';
import RainfallChart from '../components/RainfallChart.jsx';

// Derive summary statistics from seed data
const avgHigh = calcAverage(weatherData.map((d) => d.tempHigh));
const avgLow = calcAverage(weatherData.map((d) => d.tempLow));
const totalRain = calcTotal(weatherData.map((d) => d.rainfall));
const maxRainDay = weatherData.reduce((a, b) => (a.rainfall > b.rainfall ? a : b));

export default function WeatherDashboard() {
  const [activeView, setActiveView] = useState('both'); // 'both' | 'temperature' | 'rainfall'

  const showTemp = activeView === 'both' || activeView === 'temperature';
  const showRain = activeView === 'both' || activeView === 'rainfall';

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <div className="dashboard__city-row">
            <span className="dashboard__city-icon">🌤</span>
            <h1 className="dashboard__city">{city}</h1>
          </div>
          <p className="dashboard__date-range">{dateRange}</p>
        </div>
        <div className="dashboard__header-right">
          <div className="view-toggle" role="group" aria-label="Chart view">
            {[
              { key: 'both', label: 'All Charts' },
              { key: 'temperature', label: 'Temperature' },
              { key: 'rainfall', label: 'Rainfall' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`view-toggle__btn${activeView === key ? ' view-toggle__btn--active' : ''}`}
                onClick={() => setActiveView(key)}
                aria-pressed={activeView === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <section className="stats-row" aria-label="Summary statistics">
        <StatCard
          icon="🔆"
          label="Avg High"
          value={avgHigh}
          unit="°C"
          accent="var(--color-high)"
        />
        <StatCard
          icon="🌙"
          label="Avg Low"
          value={avgLow}
          unit="°C"
          accent="var(--color-low)"
        />
        <StatCard
          icon="💧"
          label="Total Rainfall"
          value={totalRain}
          unit=" mm"
          accent="var(--color-rain)"
        />
        <StatCard
          icon="⛈️"
          label="Wettest Day"
          value={maxRainDay.day}
          unit={` (${maxRainDay.rainfall} mm)`}
          accent="var(--color-rain-peak)"
        />
      </section>

      {/* ── Charts ── */}
      <section className="charts-section">
        {showTemp && <TemperatureChart data={weatherData} />}
        {showRain && <RainfallChart data={weatherData} />}
      </section>

      {/* ── Footer ── */}
      <footer className="dashboard__footer">
        <p>Data shown is a 7-day illustrative forecast for {city}. Updated: {dateRange}.</p>
      </footer>
    </div>
  );
}
