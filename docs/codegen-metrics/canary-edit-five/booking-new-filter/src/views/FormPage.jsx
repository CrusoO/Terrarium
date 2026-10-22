import { useState } from 'react'
import { useVisitActions } from '../hooks/useData.js'
export default function FormPage() {
  const { addItem } = useVisitActions()
  const [value, setValue] = useState('')
  return <form onSubmit={(event) => { event.preventDefault(); addItem({ client: value }) }}><label>client<input value={value} onChange={(event) => setValue(event.target.value)} /></label></form>
}
