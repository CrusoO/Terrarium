import { useState } from 'react'
import { useBatchActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useBatchActions()
  const [values, setValues] = useState({ name: "", baker: "", status: "Proofing", due: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>baker<input type="text" value={values.baker} onChange={(event) => setValues({ ...values, baker: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Proofing">Proofing</option>
          <option value="Baked">Baked</option>
          <option value="Overdue">Overdue</option>
        </select></label>
      <label>due<input type="text" value={values.due} onChange={(event) => setValues({ ...values, due: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
