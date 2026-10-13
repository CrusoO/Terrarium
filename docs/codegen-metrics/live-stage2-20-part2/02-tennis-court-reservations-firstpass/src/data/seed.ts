import type { Reservation } from '../types.ts'
export const SEED_RESERVATIONS: Reservation[] = [
  {
    "id": "RES-1001",
    "court": "Court A 1",
    "date": "2025-01-15 1",
    "startTime": "09:00 1",
    "neighborName": "John Smith 1",
    "duration": 1,
    "status": "available"
  },
  {
    "id": "RES-1002",
    "court": "Court A 2",
    "date": "2025-01-15 2",
    "startTime": "09:00 2",
    "neighborName": "John Smith 2",
    "duration": 1,
    "status": "booked"
  },
  {
    "id": "RES-1003",
    "court": "Court A 3",
    "date": "2025-01-15 3",
    "startTime": "09:00 3",
    "neighborName": "John Smith 3",
    "duration": 1,
    "status": "cancelled"
  },
  {
    "id": "RES-1004",
    "court": "Court A 4",
    "date": "2025-01-15 4",
    "startTime": "09:00 4",
    "neighborName": "John Smith 4",
    "duration": 1,
    "status": "available"
  }
]
