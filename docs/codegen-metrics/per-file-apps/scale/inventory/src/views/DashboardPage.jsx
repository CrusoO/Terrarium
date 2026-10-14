import React from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import TotalsCard from '../components/TotalsCard.jsx';
import { useTotals } = from '../hooks/useData.js';

/**
 * DashboardPage component
 * Displays inventory totals and summary information
 * @returns {React.ReactNode}
 */
export default function DashboardPage() {
  const totals = useTotals();

  return (
    <AppShell>
      <Navbar title="Dashboard" />
      <div className="page">
        <TotalsCard totals={totals} />
      </div>
    </AppShell>
  );
}
