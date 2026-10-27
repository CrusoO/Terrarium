export const STATUSES = ['Pending', 'Paid', 'Refunded', 'Cancelled']

export const ITEMS_CATALOG = [
  { id: 'p1', name: 'Espresso', price: 3.5 },
  { id: 'p2', name: 'Cappuccino', price: 4.5 },
  { id: 'p3', name: 'Latte', price: 5.0 },
  { id: 'p4', name: 'Croissant', price: 3.0 },
  { id: 'p5', name: 'Bagel', price: 3.5 },
  { id: 'p6', name: 'Muffin', price: 2.5 },
  { id: 'p7', name: 'Sandwich', price: 7.5 },
  { id: 'p8', name: 'Salad Bowl', price: 9.0 },
  { id: 'p9', name: 'Orange Juice', price: 4.0 },
  { id: 'p10', name: 'Green Tea', price: 3.0 },
]

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

let idCounter = 1000

export function generateOrders(count = 40) {
  const names = ['Alice Johnson','Bob Martinez','Carol White','David Lee','Eva Brown',
    'Frank Wilson','Grace Kim','Henry Davis','Iris Chen','Jack Taylor']
  const now = Date.now()
  const DAY = 86400000
  const orders = []
  for (let i = 0; i < count; i++) {
    const daysAgo = randomInt(0, 6)
    const ts = now - daysAgo * DAY - randomInt(0, DAY - 1)
    const itemCount = randomInt(1, 4)
    const items = []
    for (let j = 0; j < itemCount; j++) {
      const cat = randomItem(ITEMS_CATALOG)
      const existing = items.find(x => x.id === cat.id)
      if (existing) existing.qty += 1
      else items.push({ ...cat, qty: randomInt(1, 3) })
    }
    const total = items.reduce((s, x) => s + x.price * x.qty, 0)
    orders.push({
      id: `ORD-${++idCounter}`,
      customer: randomItem(names),
      status: randomItem(STATUSES),
      items,
      total: +total.toFixed(2),
      createdAt: ts,
      note: Math.random() > 0.7 ? 'Please pack separately.' : '',
    })
  }
  return orders.sort((a, b) => b.createdAt - a.createdAt)
}

export function nextId() { return `ORD-${++idCounter}` }
