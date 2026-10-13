import { useState } from 'react'
import { useSupplyActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useSupplyActions()
  const [values, setValues] = useState({ name: "", cabinet: "", status: "Stocked", count: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>cabinet<input type="text" value={values.cabinet} onChange={(event) => setValues({ ...values, cabinet: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Stocked">Stocked</option>
          <option value="Low">Low</option>
          <option value="Ordered">Ordered</option>
        </select></label>
      <label>count<input type="number" value={values.count} onChange={(event) => setValues({ ...values, count: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
