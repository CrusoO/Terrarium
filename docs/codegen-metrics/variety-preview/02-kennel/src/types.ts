export interface Dog {
  id: string;
  name: string;
  kennel: string;
  status: string;
  owner: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_DOG: Dog = {
  "id": "DOG-1001",
  "name": "Bingo 1",
  "kennel": "C3 1",
  "status": "Boarding",
  "owner": "Leah Ortiz 1"
}
