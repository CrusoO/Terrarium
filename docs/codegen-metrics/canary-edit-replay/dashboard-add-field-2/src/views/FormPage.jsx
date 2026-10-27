import { useState } from 'react'
import { useJobActions } from '../hooks/useData.js'
export default function FormPage({ onDone }) {
  const { addItem } = useJobActions()
  const [values, setValues] = useState({ title: "", owner: "", status: "Open", dueDate: "", phone: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>title<input type="text" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} /></label>
      <label>owner<input type="text" value={values.owner} onChange={(event) => setValues({ ...values, owner: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Open">Open</option>
          <option value="Done">Done</option>
          <option value="Overdue">Overdue</option>
        </select></label>
      <label>dueDate<input type="date" value={values.dueDate} onChange={(event) => setValues({ ...values, dueDate: event.target.value })} /></label>
      <label>phone<input type="text" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
