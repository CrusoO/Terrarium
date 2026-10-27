import { useState } from 'react'
import { useOrderActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useOrderActions()
  const [values, setValues] = useState({ customerName: "", tacoItems: "", paymentStatus: "Pending", orderTime: "", totalAmount: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>customerName<input type="text" value={values.customerName} onChange={(event) => setValues({ ...values, customerName: event.target.value })} /></label>
      <label>tacoItems<input type="text" value={values.tacoItems} onChange={(event) => setValues({ ...values, tacoItems: event.target.value })} /></label>
      <label>paymentStatus<select value={values.paymentStatus} onChange={(event) => setValues({ ...values, paymentStatus: event.target.value })}>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </select></label>
      <label>orderTime<input type="text" value={values.orderTime} onChange={(event) => setValues({ ...values, orderTime: event.target.value })} /></label>
      <label>totalAmount<input type="number" value={values.totalAmount} onChange={(event) => setValues({ ...values, totalAmount: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
