export interface Produce {
  id: string;
  name: string;
  stall: string;
  status: string;
  price: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_PRODUCE: Produce = {
  "id": "PRO-1001",
  "name": "Peaches 1",
  "stall": "North 1",
  "status": "Fresh",
  "price": 4
}
