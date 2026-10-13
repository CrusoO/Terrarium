export interface Member {
  id: string;
  fullName: string;
  email: string;
  membershipMonths: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  joinDate: string;
  signupStatus: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_MEMBER: Member = {
  "id": "MEM-1001",
  "fullName": "Alex Rivera 1",
  "email": "alex.rivera@email.com 1",
  "membershipMonths": 12,
  "emergencyContactName": "Jordan Rivera 1",
  "emergencyContactPhone": "+1-555-0147 1",
  "joinDate": "2025-01-15 1",
  "signupStatus": "started"
}
