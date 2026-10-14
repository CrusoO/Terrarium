export interface Walk {
  id: string;
  date: string;
  time: string;
  duration: number;
  clientName: string;
  dogName: string;
  notes: string;
  status: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_WALK: Walk = {
  "id": "WAL-1001",
  "date": "2024-01-15 1",
  "time": "10:00 AM 1",
  "duration": 30,
  "clientName": "Sarah Chen 1",
  "dogName": "Max 1",
  "notes": "Prefers park over street walks 1",
  "status": "available"
}
