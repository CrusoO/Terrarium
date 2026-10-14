export interface Reservation {
  id: string;
  court: string;
  date: string;
  startTime: string;
  neighborName: string;
  duration: number;
  status: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_RESERVATION: Reservation = {
  "id": "RES-1001",
  "court": "Court A 1",
  "date": "2025-01-15 1",
  "startTime": "09:00 1",
  "neighborName": "John Smith 1",
  "duration": 1,
  "status": "available"
}
