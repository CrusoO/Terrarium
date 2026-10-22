export interface Item {
  id: string;
  name: string;
  status: string;
  note: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_ITEM: Item = {
  "id": "ITE-1001",
  "name": "Sample 1",
  "status": "Open",
  "note": "Note 1"
}
