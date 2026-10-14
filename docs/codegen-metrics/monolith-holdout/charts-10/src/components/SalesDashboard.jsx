import React, { useState } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import StatCard from './StatCard.jsx';
import SalesChart from './SalesChart.jsx';
import { salesData, totalRevenue, totalOrders, avgOrderValue } from '../data/salesData.js';

const RANGES = ['Full Year', 'H1', 'H2', 'Q4'];

function filterData(range) {
  switch (range) {
    case 'H1': return salesData.slice(0, 6);
    case 'H2': return salesData.slice(6, 12);
    case 'Q4': return salesData.slice(9, 12);
    default:   return salesData;
  }
}

function computeStats(data) {
  const rev    = data.reduce((s, d) => s + d.revenue, 0);
  const orders = data.reduce((s, d) => s + d.orders,  0);
  const avg    = orders > 0 ? Math.round(rev / orders) : 0;
  return { rev, orders, avg };
}

export default function SalesDashboard() {
  const [activeRange, setActiveRange] = useState('Full Year');
  const filtered = filterData(activeRange);
  const stats    = computeStats(filtered);

  // YoY trend placeholders (realistic-looking)
  const trends = {
    revenue: { label: '18.4% vs last year', up: true },
    orders:  { label: '22.1% vs last year', up: true },
    avg:     { label: '3.2% vs last year',  up: false },
  };

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard__header">
        <div className="header__left">
          <h1 className="header__title">Sales Dashboard</h1>
          <p className="header__subtitle">Annual performance overview · 2024</p>
        </div>
        <div className="header__right">
          <div className="range-tabs" role="tablist" aria-label="Date range">
            {RANGES.map(r => (
              <button
                key={r}
                role="tab"
                aria-selected={activeRange === r}
                className={`range-tab ${activeRange === r ? 'active' : ''}`}
                onClick={() => setActiveRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <section className="stat-grid" aria-label="Key performance indicators">
        <StatCard
          icon={<DollarSign size={22} />}
          label="Total Revenue"
          value={`$${(stats.rev / 1000).toFixed(1)}k`}
          trend={trends.revenue.label}
          trendUp={trends.revenue.up}
        />
        <StatCard
          icon={<ShoppingCart size={22} />}
          label="Total Orders"
          value={stats.orders.toLocaleString()}
          trend={trends.orders.label}
          trendUp={trends.orders.up}
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Avg Order Value"
          value={`$${stats.avg.toLocaleString()}`}
          trend={trends.avg.label}
          trendUp={trends.avg.up}
        />
      </section>

      {/* ── Chart card ── */}
      <section className="chart-card" aria-label="Monthly revenue and orders chart">
        <div className="chart-card__header">
          <div>
            <h2 className="chart-card__title">Monthly Performance</h2>
            <p className="chart-card__desc">
              Revenue (bars) vs. Orders (line) — {activeRange === 'Full Year' ? 'Jan – Dec 2024' : activeRange + ' 2024'}
            </p>
          </div>
          <div className="chart-card__badge">
            <Calendar size={14} />
            <span>2024</span>
          </div>
        </div>
        <SalesChart data={filtered} />
      </section>

      {/* ── Monthly breakdown table ── */}
      <section className="table-card" aria-label="Monthly breakdown table">
        <h2 className="table-card__title">Monthly Breakdown</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Avg Order Value</th>
                <th>Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const aov   = Math.round(d.revenue / d.orders);
                const share = ((d.revenue / stats.rev) * 100).toFixed(1);
                return (
                  <tr key={d.month}>
                    <td className="td-month">{d.month}</td>
                    <td className="td-revenue">${d.revenue.toLocaleString()}</td>
                    <td>{d.orders.toLocaleString()}</td>
                    <td>${aov.toLocaleString()}</td>
                    <td>
                      <div className="share-bar-wrap">
                        <div
                          className="share-bar"
                          style={{ width: `${share}%` }}
                          aria-label={`${share}%`}
                        />
                        <span>{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
