import { useState } from 'react'
import { useProduceActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useProduceActions()
  const [values, setValues] = useState({ name: "", stall: "", status: "Fresh", price: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>stall<input type="text" value={values.stall} onChange={(event) => setValues({ ...values, stall: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Fresh">Fresh</option>
          <option value="Sold">Sold</option>
          <option value="Held">Held</option>
        </select></label>
      <label>price<input type="number" value={values.price} onChange={(event) => setValues({ ...values, price: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
