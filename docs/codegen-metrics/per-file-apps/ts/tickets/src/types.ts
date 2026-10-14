export interface Ticket {
  id: string;
  subject: string;
  requester: string;
  status: string;
  openedOn: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_TICKET: Ticket = {
  "id": "TIC-1001",
  "subject": "Login loop 1",
  "requester": "Sam Lee 1",
  "status": "Open",
  "openedOn": "2024-06-09 1"
}
