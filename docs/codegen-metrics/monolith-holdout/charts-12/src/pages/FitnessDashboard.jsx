import React, { useState } from 'react';
import { Activity, Footprints, Flame, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import StepsSparkline from '../components/StepsSparkline.jsx';
import WorkoutsBarChart from '../components/WorkoutsBarChart.jsx';
import { stepsData, workoutsData } from '../data/fitnessData.js';

// Derived stats
function computeStats(steps, workouts) {
  const avgSteps = Math.round(steps.reduce((s, d) => s + d.steps, 0) / steps.length);
  const totalWorkouts = workouts.reduce((s, d) => s + d.count, 0);
  const peak = steps.reduce((best, d) => (d.steps > best.steps ? d : best), steps[0]);
  const streak = computeStreak(steps);
  return { avgSteps, totalWorkouts, peak, streak };
}

function computeStreak(steps) {
  const GOAL = 7500;
  let streak = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].steps >= GOAL) streak++;
    else break;
  }
  return streak;
}

export default function FitnessDashboard() {
  const [activeRange, setActiveRange] = useState('30d');
  const { avgSteps, totalWorkouts, peak, streak } = computeStats(stepsData, workoutsData);

  const filteredSteps = activeRange === '7d' ? stepsData.slice(-7) : stepsData;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-icon">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="header-title">Fitness Dashboard</h1>
            <p className="header-subtitle">Your activity overview for the past 30 days</p>
          </div>
        </div>
        <div className="range-toggle">
          <button
            className={`range-btn ${activeRange === '7d' ? 'active' : ''}`}
            onClick={() => setActiveRange('7d')}
          >
            7 Days
          </button>
          <button
            className={`range-btn ${activeRange === '30d' ? 'active' : ''}`}
            onClick={() => setActiveRange('30d')}
          >
            30 Days
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="stat-cards">
        <StatCard
          icon={<Footprints size={20} />}
          label="Avg Daily Steps"
          value={avgSteps.toLocaleString()}
          unit="steps"
          color="blue"
          note="Goal: 7,500 steps"
          progress={Math.min((avgSteps / 7500) * 100, 100)}
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Total Workouts"
          value={totalWorkouts}
          unit="sessions"
          color="green"
          note="Last 8 weeks"
          progress={Math.min((totalWorkouts / 48) * 100, 100)}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Best Day"
          value={peak.steps.toLocaleString()}
          unit="steps"
          color="purple"
          note={peak.date}
          progress={Math.min((peak.steps / 15000) * 100, 100)}
        />
        <StatCard
          icon={<Flame size={20} />}
          label="Current Streak"
          value={streak}
          unit="days"
          color="orange"
          note="≥ 7,500 steps/day"
          progress={Math.min((streak / 14) * 100, 100)}
        />
      </section>

      {/* Charts */}
      <section className="charts-grid">
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <h2 className="chart-title">Daily Steps</h2>
              <p className="chart-subtitle">
                {activeRange === '7d' ? 'Last 7 days' : 'Last 30 days'} · Goal line at 7,500
              </p>
            </div>
            <div className="chart-badge blue">
              {filteredSteps.length} days
            </div>
          </div>
          <StepsSparkline data={filteredSteps} goal={7500} />
        </div>

        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <h2 className="chart-title">Weekly Workouts</h2>
              <p className="chart-subtitle">Sessions per week · Last 8 weeks</p>
            </div>
            <div className="chart-badge green">
              {totalWorkouts} total
            </div>
          </div>
          <WorkoutsBarChart data={workoutsData} />
        </div>
      </section>
    </div>
  );
}
