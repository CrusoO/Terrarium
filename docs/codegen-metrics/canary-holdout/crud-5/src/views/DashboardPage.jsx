import { useSkus, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'

/**
 * DashboardPage component
 * Displays inventory totals and summary information
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const skus = useSkus()
  const totals = useTotals(skus)

  return (
    <div className="page">
      <TotalsCard totals={totals} />
    </div>
  )
}
