import React, { useState } from 'react'
import Header from './components/Header'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'
import CreateOrder from './components/CreateOrder'
import DailyTotals from './components/DailyTotals'
import { useOrders } from './store/useStore'
import styles from './App.module.css'

export default function App() {
  const { orders, addOrder, updateStatus } = useOrders()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'totals'

  const filtered = orders.filter(o => {
    const matchSearch = search === '' ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const selectedOrder = orders.find(o => o.id === selectedId) || null

  return (
    <div className={styles.app}>
      <Header
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onCreateOrder={() => setShowCreate(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className={styles.main}>
        {activeTab === 'orders' ? (
          <div className={styles.layout}>
            <OrderList
              orders={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {selectedOrder ? (
              <OrderDetail
                order={selectedOrder}
                onClose={() => setSelectedId(null)}
                onStatusChange={updateStatus}
              />
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyInner}>
                  <span className={styles.emptyIcon}>📋</span>
                  <p>Select an order to view details</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <DailyTotals orders={orders} />
        )}
      </main>
      {showCreate && (
        <CreateOrder
          onClose={() => setShowCreate(false)}
          onSubmit={(order) => { addOrder(order); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
