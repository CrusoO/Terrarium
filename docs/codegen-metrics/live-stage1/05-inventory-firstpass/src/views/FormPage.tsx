import { useState } from 'react'
import { useSkuActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }) {
  const { addItem } = useSkuActions()
  const [values, setValues] = useState({ name: "", aisle: "", status: "Ok", onHand: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>aisle<input type="text" value={values.aisle} onChange={(event) => setValues({ ...values, aisle: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Ok">Ok</option>
          <option value="Low">Low</option>
          <option value="Out">Out</option>
        </select></label>
      <label>onHand<input type="number" value={values.onHand} onChange={(event) => setValues({ ...values, onHand: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
