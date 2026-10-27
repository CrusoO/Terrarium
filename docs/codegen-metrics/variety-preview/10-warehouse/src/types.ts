export interface Pallet {
  id: string;
  code: string;
  aisle: string;
  status: string;
  weight: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_PALLET: Pallet = {
  "id": "PAL-1001",
  "code": "P-440 1",
  "aisle": "7 1",
  "status": "Staged",
  "weight": 320
}
