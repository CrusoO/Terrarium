import { useState } from 'react'
import { useSaleActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useSaleActions()
  const [values, setValues] = useState({ month: "January", total: "", year: "", transactionCount: "", averageOrderValue: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>month<select value={values.month} onChange={(event) => setValues({ ...values, month: event.target.value })}>
          <option value="January">January</option>
          <option value="February">February</option>
          <option value="March">March</option>
          <option value="April">April</option>
        </select></label>
      <label>total<input type="number" value={values.total} onChange={(event) => setValues({ ...values, total: event.target.value })} /></label>
      <label>year<input type="number" value={values.year} onChange={(event) => setValues({ ...values, year: event.target.value })} /></label>
      <label>transactionCount<input type="number" value={values.transactionCount} onChange={(event) => setValues({ ...values, transactionCount: event.target.value })} /></label>
      <label>averageOrderValue<input type="number" value={values.averageOrderValue} onChange={(event) => setValues({ ...values, averageOrderValue: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
