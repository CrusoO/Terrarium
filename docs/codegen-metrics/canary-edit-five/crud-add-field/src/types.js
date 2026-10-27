/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} customer
 * @property {string} city
 * @property {string} paymentStatus
 * @property {string} pickupDate
 * @property {string} note
 */

/**
 * @typedef {Object} DailyTotal
 * @property {string} date
 * @property {number} count
 * @property {number} total
 */

export const SAMPLE_ORDER = {
  "id": "ORD-1001",
  "customer": "Alice Marsh 1",
  "city": "Portland 1",
  "paymentStatus": "Paid",
  "pickupDate": "2024-06-10 1",
  "note": "Leave at door 1"
}
