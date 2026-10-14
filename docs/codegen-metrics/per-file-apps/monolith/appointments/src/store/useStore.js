import { create } from 'zustand'
import { seedVisits } from '../data/seed'

const load = () => {
  try {
    const s = localStorage.getItem('appt-visits')
    return s ? JSON.parse(s) : seedVisits
  } catch { return seedVisits }
}

const save = visits => {
  try { localStorage.setItem('appt-visits', JSON.stringify(visits)) } catch {}
}

export const useStore = create((set, get) => ({
  visits: load(),
  addVisit: visit => {
    const next = [visit, ...get().visits]
    save(next)
    set({ visits: next })
  },
  updateVisit: updated => {
    const next = get().visits.map(v => v.id === updated.id ? updated : v)
    save(next)
    set({ visits: next })
  },
  deleteVisit: id => {
    const next = get().visits.filter(v => v.id !== id)
    save(next)
    set({ visits: next })
  },
}))
