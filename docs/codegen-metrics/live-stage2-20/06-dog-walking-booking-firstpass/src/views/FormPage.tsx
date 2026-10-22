import { useState } from 'react'
import { useWalkActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useWalkActions()
  const [values, setValues] = useState({ date: "", time: "", duration: "", clientName: "", dogName: "", notes: "", status: "available" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>date<input type="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} /></label>
      <label>time<input type="text" value={values.time} onChange={(event) => setValues({ ...values, time: event.target.value })} /></label>
      <label>duration<input type="number" value={values.duration} onChange={(event) => setValues({ ...values, duration: event.target.value })} /></label>
      <label>clientName<input type="text" value={values.clientName} onChange={(event) => setValues({ ...values, clientName: event.target.value })} /></label>
      <label>dogName<input type="text" value={values.dogName} onChange={(event) => setValues({ ...values, dogName: event.target.value })} /></label>
      <label>notes<input type="text" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="available">available</option>
          <option value="booked">booked</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
