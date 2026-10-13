import { useState } from 'react'
import { useRecipeTestActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useRecipeTestActions()
  const [values, setValues] = useState({ dishName: "", dateTried: "", score: "1", notes: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>dishName<input type="text" value={values.dishName} onChange={(event) => setValues({ ...values, dishName: event.target.value })} /></label>
      <label>dateTried<input type="date" value={values.dateTried} onChange={(event) => setValues({ ...values, dateTried: event.target.value })} /></label>
      <label>score<select value={values.score} onChange={(event) => setValues({ ...values, score: event.target.value })}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select></label>
      <label>notes<input type="text" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
