import { useMemo, useSyncExternalStore } from 'react'
import { SEED_MEMBERS } from '../data/seed.ts'
import type { Member } from '../types.ts'
let items: Member[] = SEED_MEMBERS.slice()
let selectedId: string | null = null
const listeners = new Set<() => void>()
function emit() { listeners.forEach((fn: () => void) => fn()) }
function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn) }
function snapshot(): Member[] { return items }
export function useMembers() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
export function useMemberActions() {
  return {
    addItem(draft: { [key: string]: string | number | undefined } | ((row: { [key: string]: string | number | undefined }) => void)) {
      const row: { [key: string]: string | number | undefined } = draft && typeof draft === 'object' ? { ...draft } : {}
      if (typeof draft === 'function') draft(row)
      const id = row.id ? String(row.id) : 'MEM-' + String(1000 + items.length + 1)
      items = items.concat([{ ...row, id } as Member])
      selectedId = id
      emit()
    },
    select(id: string) { selectedId = id; emit() },
  }
}
export function useSelectedMember(id: string | null = null): Member | null {
  const rows = useMembers()
  const chosen = id ?? selectedId
  return rows.find((item) => item.id === chosen) ?? null
}
