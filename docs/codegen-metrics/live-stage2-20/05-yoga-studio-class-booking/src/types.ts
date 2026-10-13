export interface ClassBooking {
  id: string;
  memberName: string;
  className: string;
  classDate: string;
  classTime: string;
  matsAvailable: number;
  status: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_CLASSBOOKING: ClassBooking = {
  "id": "CLA-1001",
  "memberName": "Sarah Chen 1",
  "className": "Vinyasa Flow 1",
  "classDate": "2024-01-15 1",
  "classTime": "09:00 AM 1",
  "matsAvailable": 3,
  "status": "reserved"
}
