import { useState } from 'react'
import { useLeadActions } from '../hooks/useData.js'
export default function FormPage({ onDone }) {
  const { addItem } = useLeadActions()
  const [values, setValues] = useState({ name: "", email: "", plan: "Studio" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>email<input type="text" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label>
      <label>plan<select value={values.plan} onChange={(event) => setValues({ ...values, plan: event.target.value })}>
          <option value="Studio">Studio</option>
          <option value="Workshop">Workshop</option>
          <option value="Private">Private</option>
          <option value="Waiting">Waiting</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
