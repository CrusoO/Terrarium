import { useState } from 'react'
import { useSessionActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useSessionActions()
  const [values, setValues] = useState({ name: "", producer: "", status: "Booked", hours: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>producer<input type="text" value={values.producer} onChange={(event) => setValues({ ...values, producer: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Booked">Booked</option>
          <option value="Done">Done</option>
          <option value="Overdue">Overdue</option>
        </select></label>
      <label>hours<input type="number" value={values.hours} onChange={(event) => setValues({ ...values, hours: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
