import { useState } from 'react'
import { useJobActions } from '../hooks/useData.js'
export default function FormPage() {
  const { addItem } = useJobActions()
  const [value, setValue] = useState('')
  return <form onSubmit={(event) => { event.preventDefault(); addItem({ title: value }) }}><label>title<input value={value} onChange={(event) => setValue(event.target.value)} /></label></form>
}
