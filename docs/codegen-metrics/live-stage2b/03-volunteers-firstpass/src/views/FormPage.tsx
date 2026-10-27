import { useState } from 'react'
import { useVolunteerActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useVolunteerActions()
  const [values, setValues] = useState({ name: "", role: "", status: "Confirmed", shift: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>role<input type="text" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Confirmed">Confirmed</option>
          <option value="Waitlist">Waitlist</option>
          <option value="Declined">Declined</option>
        </select></label>
      <label>shift<input type="text" value={values.shift} onChange={(event) => setValues({ ...values, shift: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
