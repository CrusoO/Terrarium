import { useState } from 'react'
import { useReservationActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useReservationActions()
  const [values, setValues] = useState({ court: "", date: "", startTime: "", neighborName: "", duration: "", status: "available" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>court<input type="text" value={values.court} onChange={(event) => setValues({ ...values, court: event.target.value })} /></label>
      <label>date<input type="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} /></label>
      <label>startTime<input type="text" value={values.startTime} onChange={(event) => setValues({ ...values, startTime: event.target.value })} /></label>
      <label>neighborName<input type="text" value={values.neighborName} onChange={(event) => setValues({ ...values, neighborName: event.target.value })} /></label>
      <label>duration<input type="number" value={values.duration} onChange={(event) => setValues({ ...values, duration: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="available">available</option>
          <option value="booked">booked</option>
          <option value="cancelled">cancelled</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
