import { useState } from 'react'
import { useVanActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useVanActions()
  const [values, setValues] = useState({ name: "", route: "", status: "Out", miles: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>route<input type="text" value={values.route} onChange={(event) => setValues({ ...values, route: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Out">Out</option>
          <option value="Yard">Yard</option>
          <option value="Shop">Shop</option>
        </select></label>
      <label>miles<input type="number" value={values.miles} onChange={(event) => setValues({ ...values, miles: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
