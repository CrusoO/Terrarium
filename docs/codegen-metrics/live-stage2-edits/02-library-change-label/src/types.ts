export interface Book {
  id: string;
  title: string;
  borrower: string;
  status: string;
  due: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_BOOK: Book = {
  "id": "BOO-1001",
  "title": "Kindred 1",
  "borrower": "Ada Marsh 1",
  "status": "Out",
  "due": "2024-07-01 1"
}
