import { useJobs, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'

/**
 * DashboardPage component
 * Displays job totals and statistics
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const jobs = useJobs()
  const totals = useTotals(jobs)

  return (
    <div className="page">
      <TotalsCard totals={totals} />
    </div>
  )
}
