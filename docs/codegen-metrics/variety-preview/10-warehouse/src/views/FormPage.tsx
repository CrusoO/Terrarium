import { useState } from 'react'
import { usePalletActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = usePalletActions()
  const [values, setValues] = useState({ code: "", aisle: "", status: "Staged", weight: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>code<input type="text" value={values.code} onChange={(event) => setValues({ ...values, code: event.target.value })} /></label>
      <label>aisle<input type="text" value={values.aisle} onChange={(event) => setValues({ ...values, aisle: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Staged">Staged</option>
          <option value="Shipped">Shipped</option>
          <option value="Hold">Hold</option>
        </select></label>
      <label>weight<input type="number" value={values.weight} onChange={(event) => setValues({ ...values, weight: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
