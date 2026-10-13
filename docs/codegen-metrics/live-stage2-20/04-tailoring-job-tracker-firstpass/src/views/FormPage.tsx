import { useState } from 'react'
import { useTailoringJobActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useTailoringJobActions()
  const [values, setValues] = useState({ garmentType: "", dueDate: "", hemStatus: "pending", customerName: "", notes: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>garmentType<input type="text" value={values.garmentType} onChange={(event) => setValues({ ...values, garmentType: event.target.value })} /></label>
      <label>dueDate<input type="date" value={values.dueDate} onChange={(event) => setValues({ ...values, dueDate: event.target.value })} /></label>
      <label>hemStatus<select value={values.hemStatus} onChange={(event) => setValues({ ...values, hemStatus: event.target.value })}>
          <option value="pending">pending</option>
          <option value="in-progress">in-progress</option>
          <option value="finished">finished</option>
          <option value="delivered">delivered</option>
        </select></label>
      <label>customerName<input type="text" value={values.customerName} onChange={(event) => setValues({ ...values, customerName: event.target.value })} /></label>
      <label>notes<input type="text" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
