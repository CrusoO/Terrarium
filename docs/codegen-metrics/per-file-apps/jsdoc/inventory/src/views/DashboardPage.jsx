import React from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import TotalsCard from '../components/TotalsCard.jsx';
import { useTotals } from '../hooks/useData.js';

/**
 * DashboardPage component
 * Displays inventory totals and summary information
 * @returns {React.ReactNode}
 */
export default function DashboardPage() {
  const totals = useTotals();

  return (
    <AppShell>
      <div className="page">
        <Navbar title="Dashboard" />
        <div style={{ padding: '1rem' }}>
          <TotalsCard totals={totals} />
        </div>
      </div>
    </AppShell>
  );
}
