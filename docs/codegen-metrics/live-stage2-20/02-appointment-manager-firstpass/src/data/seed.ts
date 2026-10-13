import type { Appointment } from '../types.ts'
export const SEED_APPOINTMENTS: Appointment[] = [
  {
    "id": "APP-1001",
    "clientName": "Sarah Johnson 1",
    "dateTime": "2024-01-15T14:30:00Z 1",
    "duration": 60,
    "serviceType": "Haircut 1",
    "notes": "Prefers fade on sides 1",
    "status": "scheduled"
  },
  {
    "id": "APP-1002",
    "clientName": "Sarah Johnson 2",
    "dateTime": "2024-01-15T14:30:00Z 2",
    "duration": 60,
    "serviceType": "Haircut 2",
    "notes": "Prefers fade on sides 2",
    "status": "completed"
  },
  {
    "id": "APP-1003",
    "clientName": "Sarah Johnson 3",
    "dateTime": "2024-01-15T14:30:00Z 3",
    "duration": 60,
    "serviceType": "Haircut 3",
    "notes": "Prefers fade on sides 3",
    "status": "cancelled"
  },
  {
    "id": "APP-1004",
    "clientName": "Sarah Johnson 4",
    "dateTime": "2024-01-15T14:30:00Z 4",
    "duration": 60,
    "serviceType": "Haircut 4",
    "notes": "Prefers fade on sides 4",
    "status": "no-show"
  }
]
