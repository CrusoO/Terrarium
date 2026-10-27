export interface Expense {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  spentOn: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_EXPENSE: Expense = {
  "id": "EXP-1001",
  "merchant": "Tram 1",
  "category": "Travel",
  "amount": 18,
  "spentOn": "2024-06-08 1"
}
