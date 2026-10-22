import { useState } from 'react'
import { useLeadActions } from '../hooks/useData.js'
export default function FormPage({ onDone }) {
  const { addItem } = useLeadActions()
  const [values, setValues] = useState({ name: "", mail: "", plan: "Studio" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>mail<input type="text" value={values.mail} onChange={(event) => setValues({ ...values, mail: event.target.value })} /></label>
      <label>plan<select value={values.plan} onChange={(event) => setValues({ ...values, plan: event.target.value })}>
          <option value="Studio">Studio</option>
          <option value="Workshop">Workshop</option>
          <option value="Private">Private</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
