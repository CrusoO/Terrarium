export interface Recipe {
  id: string;
  name: string;
  course: string;
  minutes: number;
  serves: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_RECIPE: Recipe = {
  "id": "REC-1001",
  "name": "Lemon pasta 1",
  "course": "Breakfast",
  "minutes": 25,
  "serves": 2
}
