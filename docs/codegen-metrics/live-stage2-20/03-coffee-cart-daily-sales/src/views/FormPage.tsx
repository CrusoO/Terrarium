import { useState } from 'react'
import { useSaleActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useSaleActions()
  const [values, setValues] = useState({ drinkType: "", quantity: "", hour: "", price: "", timestamp: "", status: "completed" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>drinkType<input type="text" value={values.drinkType} onChange={(event) => setValues({ ...values, drinkType: event.target.value })} /></label>
      <label>quantity<input type="number" value={values.quantity} onChange={(event) => setValues({ ...values, quantity: event.target.value })} /></label>
      <label>hour<input type="number" value={values.hour} onChange={(event) => setValues({ ...values, hour: event.target.value })} /></label>
      <label>price<input type="number" value={values.price} onChange={(event) => setValues({ ...values, price: event.target.value })} /></label>
      <label>timestamp<input type="text" value={values.timestamp} onChange={(event) => setValues({ ...values, timestamp: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="completed">completed</option>
          <option value="pending">pending</option>
          <option value="voided">voided</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
