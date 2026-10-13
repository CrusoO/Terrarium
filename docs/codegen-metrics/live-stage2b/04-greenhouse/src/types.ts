export interface Plant {
  id: string;
  name: string;
  bed: string;
  status: string;
  watered: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_PLANT: Plant = {
  "id": "PLA-1001",
  "name": "Basil 1",
  "bed": "South 1",
  "status": "Growing",
  "watered": "2024-07-01 1"
}
