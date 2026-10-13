import { useState } from 'react'
import { useBookActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useBookActions()
  const [values, setValues] = useState({ title: "", borrower: "", status: "Out", due: "", isbn: "" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>title<input type="text" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} /></label>
      <label>borrower<input type="text" value={values.borrower} onChange={(event) => setValues({ ...values, borrower: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="Out">Out</option>
          <option value="Shelf">Shelf</option>
          <option value="Hold">Hold</option>
        </select></label>
      <label>due<input type="text" value={values.due} onChange={(event) => setValues({ ...values, due: event.target.value })} /></label>
      <label>isbn<input type="text" value={values.isbn} onChange={(event) => setValues({ ...values, isbn: event.target.value })} /></label>
      <button type="submit">Add</button>
    </form>
  )
}
