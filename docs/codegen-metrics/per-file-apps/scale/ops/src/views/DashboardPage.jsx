import React from 'react';
import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import TotalsCard from '../components/TotalsCard.jsx';
import { useTotals } from '../hooks/useData.js';

/**
 * DashboardPage component
 * Displays job totals and statistics
 * @returns {React.ReactNode}
 */
export default function DashboardPage() {
  const totals = useTotals();

  return (
    <AppShell>
      <Navbar title="Operations" />
      <div className="page">
        <TotalsCard totals={totals} />
      </div>
    </AppShell>
  );
}
