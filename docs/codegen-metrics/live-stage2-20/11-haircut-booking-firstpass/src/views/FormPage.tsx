import { useState } from 'react'
import { useAppointmentActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useAppointmentActions()
  const [values, setValues] = useState({ stylist: "", time: "", phone: "", status: "available" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>stylist<input type="text" value={values.stylist} onChange={(event) => setValues({ ...values, stylist: event.target.value })} /></label>
      <label>time<input type="text" value={values.time} onChange={(event) => setValues({ ...values, time: event.target.value })} /></label>
      <label>phone<input type="text" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></label>
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
