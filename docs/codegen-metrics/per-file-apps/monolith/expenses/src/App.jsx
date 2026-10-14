import React, { useState, useMemo } from 'react'
import { useExpenses } from './hooks/useExpenses'
import { CATEGORIES, STAFF } from './data/initialExpenses'
import Header from './components/Header'
import Totals from './components/Totals'
import Filters from './components/Filters'
import ExpenseTable from './components/ExpenseTable'
import AddExpenseModal from './components/AddExpenseModal'
import styles from './App.module.css'

export default function App() {
  const { expenses, addExpense, deleteExpense, totals } = useExpenses()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStaff, setFilterStaff] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    let list = expenses
    if (filterCategory !== 'all') list = list.filter(e => e.category === filterCategory)
    if (filterStaff !== 'all') list = list.filter(e => e.staff === filterStaff)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.staff.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === 'amount') { va = +va; vb = +vb }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [expenses, filterCategory, filterStaff, search, sortField, sortDir])

  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  return (
    <div className={styles.app}>
      <Header onAdd={() => setShowModal(true)} />
      <main className={styles.main}>
        <Totals totals={totals} categories={CATEGORIES} />
        <Filters
          search={search} onSearch={setSearch}
          filterCategory={filterCategory} onCategory={setFilterCategory}
          filterStaff={filterStaff} onStaff={setFilterStaff}
          categories={CATEGORIES} staff={STAFF}
        />
        <ExpenseTable
          expenses={filtered}
          categories={CATEGORIES}
          filteredTotal={filteredTotal}
          onDelete={deleteExpense}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </main>
      {showModal && (
        <AddExpenseModal
          categories={CATEGORIES}
          staff={STAFF}
          onAdd={addExpense}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
