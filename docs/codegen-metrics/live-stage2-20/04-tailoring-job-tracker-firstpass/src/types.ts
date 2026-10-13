export interface TailoringJob {
  id: string;
  garmentType: string;
  dueDate: string;
  hemStatus: string;
  customerName: string;
  notes: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_TAILORINGJOB: TailoringJob = {
  "id": "TAI-1001",
  "garmentType": "Dress Pants 1",
  "dueDate": "2024-02-15 1",
  "hemStatus": "pending",
  "customerName": "John Smith 1",
  "notes": "Shorten by 2 inches 1"
}
