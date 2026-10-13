export interface Visit {
  id: string;
  client: string;
  service: string;
  status: string;
  when: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_VISIT: Visit = {
  "id": "VIS-1001",
  "client": "Noah Patel 1",
  "service": "Consult 1",
  "status": "Booked",
  "when": "2024-06-11 09:00 1"
}
