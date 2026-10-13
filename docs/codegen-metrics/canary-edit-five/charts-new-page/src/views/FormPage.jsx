import { useState } from 'react'
import { usePointActions } from '../hooks/useData.js'
export default function FormPage() {
  const { addItem } = usePointActions()
  const [value, setValue] = useState('')
  return <form onSubmit={(event) => { event.preventDefault(); addItem({ label: value }) }}><label>label<input value={value} onChange={(event) => setValue(event.target.value)} /></label></form>
}
