/**
 * DashboardPage component
 * @component
 * Displays dashboard with order totals and summary information
 * @returns {JSX.Element} Dashboard page with totals card
 */

import { useOrders, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'

/**
 * DashboardPage
 * Shows daily totals and order summary statistics
 * @returns {JSX.Element}
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
