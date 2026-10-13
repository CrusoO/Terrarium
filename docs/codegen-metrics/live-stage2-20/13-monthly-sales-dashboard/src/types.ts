export interface Sale {
  id: string;
  month: string;
  total: number;
  year: number;
  transactionCount: number;
  averageOrderValue: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_SALE: Sale = {
  "id": "SAL-1001",
  "month": "January",
  "total": 4250.5,
  "year": 2024,
  "transactionCount": 187,
  "averageOrderValue": 22.73
}
