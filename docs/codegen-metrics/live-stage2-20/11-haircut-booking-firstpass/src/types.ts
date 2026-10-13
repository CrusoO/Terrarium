export interface Appointment {
  id: string;
  stylist: string;
  time: string;
  phone: string;
  status: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_APPOINTMENT: Appointment = {
  "id": "APP-1001",
  "stylist": "Maria Santos 1",
  "time": "2024-01-15 2:30 PM 1",
  "phone": "+1-555-0147 1",
  "status": "available"
}
