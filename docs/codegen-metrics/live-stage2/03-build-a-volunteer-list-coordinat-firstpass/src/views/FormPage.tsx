import { useState } from 'react'
import { useItemActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }) {
  const { addItem } = useItemActions()
  const [values, setValues] = useState({ name: "", status: "Open", note: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Open">Open</option>
          <option value="Done">Done</option>
        </select></label>
      <label>note<input type="text" value={values.note} onChange={(event) => setValues({ ...values, note: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
