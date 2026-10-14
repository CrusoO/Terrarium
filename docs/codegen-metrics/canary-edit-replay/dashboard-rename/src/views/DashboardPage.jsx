import { useJobs, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'
export default function DashboardPage() {
  const items = useJobs()
  const totals = useTotals(items)
  return <section className="page"><h2>Totals</h2><TotalsCard totals={totals} /></section>
}
