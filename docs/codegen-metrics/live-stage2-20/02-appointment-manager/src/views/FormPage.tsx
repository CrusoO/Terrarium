import { useState } from 'react'
import { useAppointmentActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useAppointmentActions()
  const [values, setValues] = useState({ clientName: "", dateTime: "", duration: "", serviceType: "", notes: "", status: "scheduled" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>clientName<input type="text" value={values.clientName} onChange={(event) => setValues({ ...values, clientName: event.target.value })} /></label>
      <label>dateTime<input type="date" value={values.dateTime} onChange={(event) => setValues({ ...values, dateTime: event.target.value })} /></label>
      <label>duration<input type="number" value={values.duration} onChange={(event) => setValues({ ...values, duration: event.target.value })} /></label>
      <label>serviceType<input type="text" value={values.serviceType} onChange={(event) => setValues({ ...values, serviceType: event.target.value })} /></label>
      <label>notes<input type="text" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="scheduled">scheduled</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
          <option value="no-show">no-show</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
