/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} buyer
 * @property {string} town
 * @property {string} paymentStatus
 * @property {string} pickupDate
 * @property {string} note
 * @property {string} phone
 * @property {string} window
 */

/**
 * @typedef {Object} DailyTotal
 * @property {string} date
 * @property {number} count
 * @property {number} total
 */

export const SAMPLE_ORDER = {
  "id": "ORD-1001",
  "buyer": "Alice Marsh 1",
  "town": "Portland 1",
  "paymentStatus": "Paid",
  "pickupDate": "2024-06-10 1",
  "note": "Leave at door 1",
  "phone": "555-0100 1",
  "window": "Morning 1"
}
