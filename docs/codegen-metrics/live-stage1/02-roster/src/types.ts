export interface Student {
  id: string;
  name: string;
  homeroom: string;
  status: string;
  guardian: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_STUDENT: Student = {
  "id": "STU-1001",
  "name": "Priya Shah 1",
  "homeroom": "4B 1",
  "status": "Present",
  "guardian": "Anil Shah 1"
}
