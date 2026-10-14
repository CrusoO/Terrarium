export interface Sku {
  id: string;
  name: string;
  aisle: string;
  status: string;
  onHand: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_SKU: Sku = {
  "id": "SKU-1001",
  "name": "Flour 1",
  "aisle": "Dry goods 1",
  "status": "Ok",
  "onHand": 4
}
