import { useOrders, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'

/**
 * DashboardPage component
 * Displays order totals and summary information
 * @component
 * @returns {JSX.Element} The dashboard page with totals card
 */
export default function DashboardPage() {
  const orders = useOrders()
  const totals = useTotals(orders)

  return (
    <div className="page">
      <TotalsCard totals={totals} />
    </div>
  )
}
