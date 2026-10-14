import { useState } from 'react'
import { useMemberActions } from '../hooks/useData.ts'
export default function FormPage({ onDone }: { onDone?: () => void }) {
  const { addItem } = useMemberActions()
  const [values, setValues] = useState({ fullName: "", email: "", membershipMonths: "", emergencyContactName: "", emergencyContactPhone: "", joinDate: "", signupStatus: "started" })
  return (
    <form onSubmit={(event) => { event.preventDefault(); addItem(values); onDone && onDone() }}>
      <label>fullName<input type="text" value={values.fullName} onChange={(event) => setValues({ ...values, fullName: event.target.value })} /></label>
      <label>email<input type="text" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label>
      <label>membershipMonths<input type="number" value={values.membershipMonths} onChange={(event) => setValues({ ...values, membershipMonths: event.target.value })} /></label>
      <label>emergencyContactName<input type="text" value={values.emergencyContactName} onChange={(event) => setValues({ ...values, emergencyContactName: event.target.value })} /></label>
      <label>emergencyContactPhone<input type="text" value={values.emergencyContactPhone} onChange={(event) => setValues({ ...values, emergencyContactPhone: event.target.value })} /></label>
      <label>joinDate<input type="date" value={values.joinDate} onChange={(event) => setValues({ ...values, joinDate: event.target.value })} /></label>
      <label>signupStatus<select value={values.signupStatus} onChange={(event) => setValues({ ...values, signupStatus: event.target.value })}>
          <option value="started">started</option>
          <option value="details_entered">details_entered</option>
          <option value="contact_added">contact_added</option>
          <option value="completed">completed</option>
        </select></label>
      <button type="submit">Add</button>
    </form>
  )
}
