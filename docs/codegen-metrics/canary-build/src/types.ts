export interface Part {
  id: string;
  name: string;
  bin: string;
  condition: string;
  quantity: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_PART: Part = {
  "id": "PAR-1001",
  "name": "Brake pad 1",
  "bin": "A-12 1",
  "condition": "New",
  "quantity": 4
}
