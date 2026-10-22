import { useState, useCallback } from 'react'
import { generateOrders, nextId } from '../data/seed'

const initialOrders = generateOrders(40)

let _orders = initialOrders
let _listeners = []

function notify() { _listeners.forEach(fn => fn([..._orders])) }

export function useOrders() {
  const [orders, setOrders] = useState([..._orders])

  const subscribe = useCallback(() => {
    const fn = (next) => setOrders(next)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(l => l !== fn) }
  }, [])

  useState(() => { return subscribe() })

  const addOrder = useCallback((order) => {
    const newOrder = { ...order, id: nextId(), createdAt: Date.now() }
    _orders = [newOrder, ..._orders]
    notify()
  }, [])

  const updateStatus = useCallback((id, status) => {
    _orders = _orders.map(o => o.id === id ? { ...o, status } : o)
    notify()
  }, [])

  return { orders, addOrder, updateStatus }
}
