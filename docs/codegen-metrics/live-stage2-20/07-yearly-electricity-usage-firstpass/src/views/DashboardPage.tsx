import { useElectricityReadings, useTotals } from '../hooks/useData.ts'
import TotalsCard from '../components/TotalsCard.tsx'
export default function DashboardPage() {
  const items = useElectricityReadings()
  const totals = useTotals(items)
  return <section className="page"><h2>Totals</h2><TotalsCard totals={totals} /></section>
}
