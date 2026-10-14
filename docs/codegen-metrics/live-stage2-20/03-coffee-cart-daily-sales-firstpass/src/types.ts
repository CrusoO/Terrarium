export interface Sale {
  id: string;
  drinkType: string;
  quantity: number;
  hour: number;
  price: number;
  timestamp: string;
  status: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_SALE: Sale = {
  "id": "SAL-1001",
  "drinkType": "Espresso 1",
  "quantity": 12,
  "hour": 9,
  "price": 4.5,
  "timestamp": "2025-01-15T09:30:00Z 1",
  "status": "completed"
}
