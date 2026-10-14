import React, { useState, useMemo } from 'react'
import styles from './App.module.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import ItemList from './components/ItemList'
import ItemDetail from './components/ItemDetail'
import AddItemModal from './components/AddItemModal'
import { initialItems } from './data/initialItems'

export default function App() {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [view, setView] = useState('inventory') // 'dashboard' | 'inventory'

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCategory === 'All' || item.category === filterCategory
      const matchLow = !filterLowStock || item.stock <= item.minStock
      return matchSearch && matchCat && matchLow
    })
  }, [items, search, filterCategory, filterLowStock])

  const handleUpdateStock = (id, delta, note) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const newStock = Math.max(0, item.stock + delta)
      const today = new Date().toISOString().split('T')[0]
      return {
        ...item,
        stock: newStock,
        history: [...item.history, { date: today, change: delta, note: note || (delta > 0 ? 'Restock' : 'Adjustment') }]
      }
    }))
    setSelectedItem(prev => {
      if (!prev || prev.id !== id) return prev
      const updated = items.find(i => i.id === id)
      if (!updated) return prev
      const newStock = Math.max(0, updated.stock + delta)
      const today = new Date().toISOString().split('T')[0]
      return { ...updated, stock: newStock, history: [...updated.history, { date: today, change: delta, note: note || (delta > 0 ? 'Restock' : 'Adjustment') }] }
    })
  }

  const handleAddItem = (newItem) => {
    const id = Math.max(...items.map(i => i.id)) + 1
    setItems(prev => [...prev, { ...newItem, id, history: [{ date: new Date().toISOString().split('T')[0], change: newItem.stock, note: 'Initial stock' }] }])
    setShowAddModal(false)
  }

  const handleSelectItem = (item) => {
    const fresh = items.find(i => i.id === item.id) || item
    setSelectedItem(fresh)
  }

  // Keep selectedItem in sync with items
  const freshSelected = selectedItem ? items.find(i => i.id === selectedItem.id) || selectedItem : null

  return (
    <div className={styles.app}>
      <Sidebar view={view} setView={setView} items={items} />
      <div className={styles.main}>
        <Header
          search={search}
          setSearch={setSearch}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterLowStock={filterLowStock}
          setFilterLowStock={setFilterLowStock}
          onAdd={() => setShowAddModal(true)}
          view={view}
        />
        <div className={styles.content}>
          {view === 'dashboard' ? (
            <Dashboard items={items} onSelectItem={(item) => { handleSelectItem(item); setView('inventory') }} />
          ) : (
            <ItemList
              items={filtered}
              onSelect={handleSelectItem}
              selectedId={freshSelected?.id}
            />
          )}
        </div>
      </div>

      {freshSelected && (
        <ItemDetail
          item={freshSelected}
          onClose={() => setSelectedItem(null)}
          onUpdateStock={handleUpdateStock}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  )
}
