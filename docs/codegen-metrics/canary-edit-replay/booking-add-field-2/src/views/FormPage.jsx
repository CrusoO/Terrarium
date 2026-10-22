import { useState } from 'react'
import { useVisitActions } from '../hooks/useData.js'
export default function FormPage({ onDone }) {
  const { addItem } = useVisitActions()
  const [values, setValues] = useState({ client: "", service: "", status: "Booked", when: "", phone: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>client<input type="text" value={values.client} onChange={(event) => setValues({ ...values, client: event.target.value })} /></label>
      <label>service<input type="text" value={values.service} onChange={(event) => setValues({ ...values, service: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Booked">Booked</option>
          <option value="Done">Done</option>
          <option value="Cancelled">Cancelled</option>
        </select></label>
      <label>when<input type="date" value={values.when} onChange={(event) => setValues({ ...values, when: event.target.value })} /></label>
      <label>phone<input type="text" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
