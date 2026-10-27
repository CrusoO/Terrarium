import { useState } from 'react'
import { usePlantActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = usePlantActions()
  const [values, setValues] = useState({ name: "", bed: "", status: "Growing", watered: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>name<input type="text" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
      <label>bed<input type="text" value={values.bed} onChange={(event) => setValues({ ...values, bed: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Growing">Growing</option>
          <option value="Harvest">Harvest</option>
          <option value="Resting">Resting</option>
        </select></label>
      <label>watered<input type="text" value={values.watered} onChange={(event) => setValues({ ...values, watered: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
