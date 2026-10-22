export interface Order {
  id: string;
  customer: string;
  city: string;
  paymentStatus: string;
  pickupDate: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_ORDER: Order = {
  "id": "ORD-1001",
  "customer": "Alice Marsh 1",
  "city": "Portland 1",
  "paymentStatus": "Paid",
  "pickupDate": "2024-06-10 1"
}
