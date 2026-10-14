/** @param {{ value: string, onChange: (value: string) => void, placeholder?: string }} props */
export default function SearchBar({ value, onChange, placeholder }) {
  return <input value={value} placeholder={placeholder || 'Search'} onChange={(event) => onChange(event.target.value)} />
}
