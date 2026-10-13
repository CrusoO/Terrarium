export interface Order {
  id: string;
  customerName: string;
  tacoItems: string;
  paymentStatus: string;
  orderTime: string;
  totalAmount: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_ORDER: Order = {
  "id": "ORD-1001",
  "customerName": "Carlos Mendez 1",
  "tacoItems": "3x Al Pastor, 2x Carnitas, 1x Barbacoa 1",
  "paymentStatus": "Pending",
  "orderTime": "14:30 1",
  "totalAmount": 185.5
}
