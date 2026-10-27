import { useState } from 'react'
import { useToolActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useToolActions()
  const [values, setValues] = useState({ name: "", hook: "", status: "Out", borrower: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>hook<input type="text" value={values.hook} onChange={(event) => setValues({ ...values, hook: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Out">Out</option>
          <option value="In">In</option>
          <option value="Repair">Repair</option>
        </select></label>
      <label>borrower<input type="text" value={values.borrower} onChange={(event) => setValues({ ...values, borrower: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
