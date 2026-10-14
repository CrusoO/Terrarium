export interface Volunteer {
  id: string;
  name: string;
  role: string;
  status: string;
  shift: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_VOLUNTEER: Volunteer = {
  "id": "VOL-1001",
  "name": "Mina Cole 1",
  "role": "Door 1",
  "status": "Confirmed",
  "shift": "Morning 1"
}
