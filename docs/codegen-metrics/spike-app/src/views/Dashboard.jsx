import AppShell from '../components/AppShell.jsx';
import Navbar from '../components/Navbar.jsx';
import DailyTotalsCard from '../components/DailyTotalsCard.jsx';
import { useOrders } from '../context/OrderContext.jsx';
import { useDailyTotals } from '../hooks/useDailyTotals.js';

export default function Dashboard() {
  const { orders } = useOrders();
  const totals = useDailyTotals(orders);

  return (
    <AppShell>
      <Navbar title="Dashboard" />
      <div className="page">
        <h2>Daily totals</h2>
        {totals.length === 0 ? (
          <p className="empty-state">No orders yet.</p>
        ) : (
          <div className="totals-grid">
            {totals.map((row) => (
              <DailyTotalsCard key={row.date} totals={row} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
