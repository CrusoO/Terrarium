export interface RecipeTest {
  id: string;
  dishName: string;
  dateTried: string;
  score: number;
  notes: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_RECIPETEST: RecipeTest = {
  "id": "REC-1001",
  "dishName": "Chocolate Souffl\u00e9 1",
  "dateTried": "2024-01-15 1",
  "score": "1",
  "notes": "Reduce baking time by 2 minutes, add vanilla extract 1"
}
