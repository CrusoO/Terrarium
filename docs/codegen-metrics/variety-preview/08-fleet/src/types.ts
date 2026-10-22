export interface Van {
  id: string;
  name: string;
  route: string;
  status: string;
  miles: number;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_VAN: Van = {
  "id": "VAN-1001",
  "name": "Van 12 1",
  "route": "East 1",
  "status": "Out",
  "miles": 840
}
