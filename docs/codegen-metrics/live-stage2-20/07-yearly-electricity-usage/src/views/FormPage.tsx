import { useState } from 'react'
import { useElectricityReadingActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useElectricityReadingActions()
  const [values, setValues] = useState({ month: "January", usage: "", billAmount: "", isHighest: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>month<select value={values.month} onChange={(event) => setValues({ ...values, month: event.target.value })}>
          <option value="January">January</option>
          <option value="February">February</option>
          <option value="March">March</option>
          <option value="April">April</option>
        </select></label>
      <label>usage<input type="number" value={values.usage} onChange={(event) => setValues({ ...values, usage: event.target.value })} /></label>
      <label>billAmount<input type="number" value={values.billAmount} onChange={(event) => setValues({ ...values, billAmount: event.target.value })} /></label>
      <label>isHighest<input type="text" value={values.isHighest} onChange={(event) => setValues({ ...values, isHighest: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
