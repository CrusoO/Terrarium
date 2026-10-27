export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_PRODUCT: Product = {
  "id": "PRO-1001",
  "name": "Ceramic Bowl 1",
  "category": "Kitchen",
  "price": 24,
  "stock": 12
}
