import { useState } from 'react'
import { useOrderActions } from '../hooks/useData.js'
export default function FormPage({ onDone }) {
  const { addItem } = useOrderActions()
  const [values, setValues] = useState({ customer: "", town: "", paymentStatus: "Paid", pickupDate: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>customer<input type="text" value={values.customer} onChange={(event) => setValues({ ...values, customer: event.target.value })} /></label>
      <label>town<input type="text" value={values.town} onChange={(event) => setValues({ ...values, town: event.target.value })} /></label>
      <label>paymentStatus<select value={values.paymentStatus} onChange={(event) => setValues({ ...values, paymentStatus: event.target.value })}>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
        </select></label>
      <label>pickupDate<input type="date" value={values.pickupDate} onChange={(event) => setValues({ ...values, pickupDate: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
