import { useState } from 'react'
import { useDogActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useDogActions()
  const [values, setValues] = useState({ name: "", kennel: "", status: "Boarding", owner: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>kennel<input type="text" value={values.kennel} onChange={(event) => setValues({ ...values, kennel: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Boarding">Boarding</option>
          <option value="Ready">Ready</option>
          <option value="Home">Home</option>
        </select></label>
      <label>owner<input type="text" value={values.owner} onChange={(event) => setValues({ ...values, owner: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
