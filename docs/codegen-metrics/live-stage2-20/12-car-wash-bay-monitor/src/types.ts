export interface Bay {
  id: string;
  bayNumber: number;
  status: string;
  currentVehicle: string;
  washesCompletedToday: number;
  timeStarted: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_BAY: Bay = {
  "id": "BAY-1001",
  "bayNumber": 1,
  "status": "available",
  "currentVehicle": "Blue Honda Civic 1",
  "washesCompletedToday": 12,
  "timeStarted": "2:45 PM 1"
}
