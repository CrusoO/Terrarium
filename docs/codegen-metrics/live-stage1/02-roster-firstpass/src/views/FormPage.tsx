import { useState } from 'react'
import { useStudentActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }) {
  const { addItem } = useStudentActions()
  const [values, setValues] = useState({ name: "", homeroom: "", status: "Present", guardian: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>homeroom<input type="text" value={values.homeroom} onChange={(event) => setValues({ ...values, homeroom: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select></label>
      <label>guardian<input type="text" value={values.guardian} onChange={(event) => setValues({ ...values, guardian: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
