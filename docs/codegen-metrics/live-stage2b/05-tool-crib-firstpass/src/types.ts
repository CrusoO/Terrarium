export interface Tool {
  id: string;
  name: string;
  hook: string;
  status: string;
  borrower: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_TOOL: Tool = {
  "id": "TOO-1001",
  "name": "Torque wrench 1",
  "hook": "H-8 1",
  "status": "Out",
  "borrower": "Mina Cole 1"
}
