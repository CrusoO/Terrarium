import React from 'react';
import AppShell from '../components/AppShell';
import Navbar from '../components/Navbar';
import TotalsCard from '../components/TotalsCard';
import { useTotals } from '../hooks/useData.ts';

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
