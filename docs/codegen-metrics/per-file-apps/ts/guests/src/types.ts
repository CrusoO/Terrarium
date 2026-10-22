export interface Guest {
  id: string;
  name: string;
  party: string;
  status: string;
  seats: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_GUEST: Guest = {
  "id": "GUE-1001",
  "name": "Imani Cole 1",
  "party": "Cole 1",
  "status": "Yes",
  "seats": 2
}
