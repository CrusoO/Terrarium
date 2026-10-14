export interface Supply {
  id: string;
  name: string;
  cabinet: string;
  status: string;
  count: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_SUPPLY: Supply = {
  "id": "SUP-1001",
  "name": "Gauze 1",
  "cabinet": "B2 1",
  "status": "Stocked",
  "count": 40
}
