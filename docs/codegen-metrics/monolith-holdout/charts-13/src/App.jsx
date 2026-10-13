import React, { useState } from 'react';
import ChartCard from './components/ChartCard.jsx';
import SpendingBarChart from './components/SpendingBarChart.jsx';
import SavingsLineChart from './components/SavingsLineChart.jsx';
import {
  spendingData,
  savingsData,
  categories,
  categoryColors,
  computeStats,
} from './data/budgetData.js';
import { TrendingDown, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const PERIOD_OPTIONS = ['Jan–Jun 2024', 'All Months'];

export default function App() {
  const [activePeriod, setActivePeriod] = useState(PERIOD_OPTIONS[0]);
  const { totalSpent, totalSaved, netBalance } = computeStats(spendingData, savingsData);

  const stats = [
    {
      label: 'Total Spent',
      value: `$${totalSpent.toLocaleString()}`,
      icon: TrendingDown,
      color: '#ef4444',
      bg: '#fef2f2',
      sub: 'Across 6 categories',
    },
    {
      label: 'Total Saved',
      value: `$${totalSaved.toLocaleString()}`,
      icon: TrendingUp,
      color: '#22c55e',
      bg: '#f0fdf4',
      sub: 'Net deposits',
    },
    {
      label: 'Net Balance',
      value: `${netBalance < 0 ? '-' : '+'}$${Math.abs(netBalance).toLocaleString()}`,
      icon: DollarSign,
      color: netBalance >= 0 ? '#4f6ef7' : '#f97316',
      bg: netBalance >= 0 ? '#eff2ff' : '#fff7ed',
      sub: netBalance >= 0 ? 'Surplus' : 'Deficit',
    },
    {
      label: 'Period',
      value: 'Jan – Jun',
      icon: Calendar,
      color: '#a855f7',
      bg: '#faf5ff',
      sub: '6 months tracked',
    },
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title-group">
            <span className="header-icon">💰</span>
            <div>
              <h1 className="header-title">Budget Dashboard</h1>
              <p className="header-sub">Track your spending and savings at a glance</p>
            </div>
          </div>
          <div className="period-tabs">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p}
                className={`period-tab ${activePeriod === p ? 'active' : ''}`}
                onClick={() => setActivePeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Summary Stats */}
        <section className="stats-row">
          {stats.map(s => {
            const Icon = s.icon;
            return (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon-wrap" style={{ background: s.bg }}>
                  <Icon size={20} color={s.color} strokeWidth={2.2} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                  <span className="stat-sub">{s.sub}</span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Charts Grid */}
        <section className="charts-grid">
          <ChartCard
            title="Monthly Spending"
            subtitle="Breakdown by category — click a legend item to isolate"
          >
            <SpendingBarChart />
          </ChartCard>

          <ChartCard
            title="Monthly Savings"
            subtitle="Savings trend over the past 6 months"
          >
            <SavingsLineChart />
          </ChartCard>
        </section>

        {/* Category breakdown table */}
        <section className="breakdown-section">
          <h2 className="breakdown-title">Category Breakdown</h2>
          <div className="breakdown-table-wrap">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Category</th>
                  {spendingData.map(d => <th key={d.month}>{d.month}</th>)}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const total = spendingData.reduce((s, row) => s + (row[cat] || 0), 0);
                  return (
                    <tr key={cat}>
                      <td>
                        <span className="cat-label-wrap">
                          <span
                            className="cat-dot"
                            style={{ background: categoryColors[cat] }}
                          />
                          {cat}
                        </span>
                      </td>
                      {spendingData.map(row => (
                        <td key={row.month}>${(row[cat] || 0).toLocaleString()}</td>
                      ))}
                      <td className="total-cell">${total.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td>Monthly Total</td>
                  {spendingData.map(row => {
                    const t = categories.reduce((s, cat) => s + (row[cat] || 0), 0);
                    return <td key={row.month}>${t.toLocaleString()}</td>;
                  })}
                  <td className="total-cell">${totalSpent.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Budget Dashboard · Data for Jan–Jun 2024 · All figures in USD</p>
      </footer>
    </div>
  );
}
