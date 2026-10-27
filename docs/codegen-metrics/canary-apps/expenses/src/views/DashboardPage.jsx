import { useExpenses, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'

/**
 * DashboardPage component
 * Displays expense totals and summary information
 * @returns {JSX.Element} Dashboard page with totals card
 */
export default function DashboardPage() {
  const expenses = useExpenses()
  const totals = useTotals()

  return (
    <div className="page">
      <TotalsCard totals={totals} />
    </div>
  )
}
