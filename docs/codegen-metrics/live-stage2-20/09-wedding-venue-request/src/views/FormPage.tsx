import { useState } from 'react'
import { useVenueRequestActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useVenueRequestActions()
  const [values, setValues] = useState({ preferredDate: "", guestCount: "", cateringStyle: "", coupleEmail: "", couplePhone: "", stage: "date-selection" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>preferredDate<input type="date" value={values.preferredDate} onChange={(event) => setValues({ ...values, preferredDate: event.target.value })} /></label>
      <label>guestCount<input type="number" value={values.guestCount} onChange={(event) => setValues({ ...values, guestCount: event.target.value })} /></label>
      <label>cateringStyle<input type="text" value={values.cateringStyle} onChange={(event) => setValues({ ...values, cateringStyle: event.target.value })} /></label>
      <label>coupleEmail<input type="text" value={values.coupleEmail} onChange={(event) => setValues({ ...values, coupleEmail: event.target.value })} /></label>
      <label>couplePhone<input type="text" value={values.couplePhone} onChange={(event) => setValues({ ...values, couplePhone: event.target.value })} /></label>
      <label>stage<select value={values.stage} onChange={(event) => setValues({ ...values, stage: event.target.value })}>
          <option value="date-selection">date-selection</option>
          <option value="guest-details">guest-details</option>
          <option value="catering-choice">catering-choice</option>
          <option value="contact-submitted">contact-submitted</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
