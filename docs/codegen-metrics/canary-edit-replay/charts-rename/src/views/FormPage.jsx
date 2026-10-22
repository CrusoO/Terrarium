import { useState } from 'react'
import { usePointActions } from '../hooks/useData.js'
export default function FormPage({ onDone }) {
  const { addItem } = usePointActions()
  const [values, setValues] = useState({ month: "", value: "", series: "Revenue" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>month<input type="text" value={values.month} onChange={(event) => setValues({ ...values, month: event.target.value })} /></label>
      <label>value<input type="number" value={values.value} onChange={(event) => setValues({ ...values, value: event.target.value })} /></label>
      <label>series<select value={values.series} onChange={(event) => setValues({ ...values, series: event.target.value })}>
          <option value="Revenue">Revenue</option>
          <option value="Orders">Orders</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
