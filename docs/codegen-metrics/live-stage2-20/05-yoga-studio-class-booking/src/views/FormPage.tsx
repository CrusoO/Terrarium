import { useState } from 'react'
import { useClassBookingActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useClassBookingActions()
  const [values, setValues] = useState({ memberName: "", className: "", classDate: "", classTime: "", matsAvailable: "", status: "reserved" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>memberName<input type="text" value={values.memberName} onChange={(event) => setValues({ ...values, memberName: event.target.value })} /></label>
      <label>className<input type="text" value={values.className} onChange={(event) => setValues({ ...values, className: event.target.value })} /></label>
      <label>classDate<input type="date" value={values.classDate} onChange={(event) => setValues({ ...values, classDate: event.target.value })} /></label>
      <label>classTime<input type="text" value={values.classTime} onChange={(event) => setValues({ ...values, classTime: event.target.value })} /></label>
      <label>matsAvailable<input type="number" value={values.matsAvailable} onChange={(event) => setValues({ ...values, matsAvailable: event.target.value })} /></label>
      <label>status<select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
          <option value="reserved">reserved</option>
          <option value="cancelled">cancelled</option>
          <option value="completed">completed</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
