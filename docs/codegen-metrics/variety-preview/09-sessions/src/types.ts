export interface Session {
  id: string;
  name: string;
  producer: string;
  status: string;
  hours: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_SESSION: Session = {
  "id": "SES-1001",
  "name": "Vocal take 1",
  "producer": "Jules 1",
  "status": "Booked",
  "hours": 3
}
