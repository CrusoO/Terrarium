export interface ElectricityReading {
  id: string;
  month: string;
  usage: number;
  billAmount: number;
  isHighest: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_ELECTRICITYREADING: ElectricityReading = {
  "id": "ELE-1001",
  "month": "January",
  "usage": 487,
  "billAmount": 68.5,
  "isHighest": "true 1"
}
