import { usePoints, useTotals } from '../hooks/useData.js'
import TotalsCard from '../components/TotalsCard.jsx'
export default function DashboardPage() {
  const items = usePoints()
  const totals = useTotals(items)
  return <section className="page"><h2>Totals</h2><TotalsCard totals={totals} /></section>
}
