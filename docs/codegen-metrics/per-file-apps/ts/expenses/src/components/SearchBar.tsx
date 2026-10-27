export default function SearchBar({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder?: string }) {
  return <input value={value} placeholder={placeholder || 'Search'} onChange={(event) => onChange(event.target.value)} />
}
