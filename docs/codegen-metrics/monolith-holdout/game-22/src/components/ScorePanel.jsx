import React from 'react';
import { formatMs, getRating } from '../utils/helpers.js';

export default function ScorePanel({ reactionTime, bestTime, attempts, phase, isFalseStart }) {
  const hasAttempts = attempts.length > 0;
  const average =
    hasAttempts
      ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
      : null;

  const lastTime = attempts[attempts.length - 1] ?? null;

  return (
    <aside className="score-panel">
      <h2 className="panel-title">Scoreboard</h2>

      {/* Key stats row */}
      <div className="stats-grid">
        <StatCard
          label="Last Time"
          value={lastTime !== null ? formatMs(lastTime) : '—'}
          unit={lastTime !== null ? 'ms' : ''}
          highlight={phase === 'result'}
          color="var(--color-accent-blue)"
        />
        <StatCard
          label="Best Time"
          value={bestTime !== null ? formatMs(bestTime) : '—'}
          unit={bestTime !== null ? 'ms' : ''}
          color="var(--color-accent-green)"
        />
        <StatCard
          label="Average"
          value={average !== null ? formatMs(average) : '—'}
          unit={average !== null ? 'ms' : ''}
          color="var(--color-accent-purple)"
        />
      </div>

      {/* Rating badge */}
      {bestTime !== null && (
        <div className="rating-row">
          <span className="rating-label">Rating:</span>
          <span className={`rating-badge rating-${getRating(bestTime).level}`}>
            {getRating(bestTime).emoji} {getRating(bestTime).label}
          </span>
        </div>
      )}

      {/* False-start notice */}
      {isFalseStart && (
        <div className="false-start-notice">
          ⚠ False start — this attempt was not counted
        </div>
      )}

      {/* Attempt history */}
      <div className="attempts-section">
        <h3 className="attempts-title">
          Last {Math.min(attempts.length, 10)} Attempts
          {hasAttempts && <span className="attempts-count">{attempts.length}</span>}
        </h3>

        {!hasAttempts ? (
          <p className="attempts-empty">No attempts yet. Start playing!</p>
        ) : (
          <ol className="attempts-list">
            {[...attempts].reverse().slice(0, 10).map((time, idx) => {
              const rank = attempts.length - idx;
              const isBest = time === bestTime;
              return (
                <li key={idx} className={`attempt-item ${isBest ? 'attempt-best' : ''}`}>
                  <span className="attempt-rank">#{rank}</span>
                  <div className="attempt-bar-wrap">
                    <div
                      className="attempt-bar"
                      style={{ width: `${Math.min((time / 1000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="attempt-time">
                    {formatMs(time)} ms
                    {isBest && <span className="best-tag">PB</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

function StatCard({ label, value, unit, highlight, color }) {
  return (
    <div className={`stat-card ${highlight ? 'stat-card--highlight' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
    </div>
  );
}
