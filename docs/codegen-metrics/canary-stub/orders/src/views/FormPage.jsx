import { useState } from 'react'
import { useOrderActions } from '../hooks/useData.js'
export default function FormPage() {
  const { addItem } = useOrderActions()
  const [value, setValue] = useState('')
  return <form onSubmit={(event) => { event.preventDefault(); addItem({ customer: value }) }}><label>customer<input value={value} onChange={(event) => setValue(event.target.value)} /></label></form>
}
