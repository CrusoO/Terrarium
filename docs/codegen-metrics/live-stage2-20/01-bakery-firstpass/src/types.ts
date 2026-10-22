export interface Batch {
  id: string;
  name: string;
  baker: string;
  status: string;
  due: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_BATCH: Batch = {
  "id": "BAT-1001",
  "name": "Rye loaves 1",
  "baker": "Noor 1",
  "status": "Proofing",
  "due": "2024-07-02 1"
}
