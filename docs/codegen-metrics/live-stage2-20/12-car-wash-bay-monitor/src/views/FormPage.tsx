import { useState } from 'react'
import { useBayActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useBayActions()
  const [values, setValues] = useState({ bayNumber: "", status: "available", currentVehicle: "", washesCompletedToday: "", timeStarted: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>bayNumber<input type="number" value={values.bayNumber} onChange={(event) => setValues({ ...values, bayNumber: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="available">available</option>
          <option value="washing">washing</option>
          <option value="maintenance">maintenance</option>
        </select></label>
      <label>currentVehicle<input type="text" value={values.currentVehicle} onChange={(event) => setValues({ ...values, currentVehicle: event.target.value })} /></label>
      <label>washesCompletedToday<input type="number" value={values.washesCompletedToday} onChange={(event) => setValues({ ...values, washesCompletedToday: event.target.value })} /></label>
      <label>timeStarted<input type="text" value={values.timeStarted} onChange={(event) => setValues({ ...values, timeStarted: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
