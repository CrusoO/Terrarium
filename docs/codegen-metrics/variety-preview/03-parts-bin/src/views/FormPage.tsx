import { useState } from 'react'
import { usePartActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = usePartActions()
  const [values, setValues] = useState({ name: "", bin: "", condition: "New", qty: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>bin<input type="text" value={values.bin} onChange={(event) => setValues({ ...values, bin: event.target.value })} /></label>
      <label>condition<select value={values.condition} onChange={(event) => setValues({ ...values, condition: event.target.value })}>
          <option value="New">New</option>
          <option value="Worn">Worn</option>
          <option value="Scrap">Scrap</option>
        </select></label>
      <label>qty<input type="number" value={values.qty} onChange={(event) => setValues({ ...values, qty: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
