/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} customer
 * @property {string} town
 * @property {string} paymentStatus
 * @property {string} pickupDate
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
  "town": "Portland 1",
  "paymentStatus": "Paid",
  "pickupDate": "2024-06-10 1"
}
