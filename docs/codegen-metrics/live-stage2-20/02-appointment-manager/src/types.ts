export interface Appointment {
  id: string;
  clientName: string;
  dateTime: string;
  duration: number;
  serviceType: string;
  notes: string;
  status: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_APPOINTMENT: Appointment = {
  "id": "APP-1001",
  "clientName": "Sarah Johnson 1",
  "dateTime": "2024-01-15T14:30:00Z 1",
  "duration": 60,
  "serviceType": "Haircut 1",
  "notes": "Prefers fade on sides 1",
  "status": "scheduled"
}
