export interface Job {
  id: string;
  title: string;
  owner: string;
  status: string;
  dueDate: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_JOB: Job = {
  "id": "JOB-1001",
  "title": "Packing 1",
  "owner": "Mina 1",
  "status": "Open",
  "dueDate": "2024-06-12 1"
}
