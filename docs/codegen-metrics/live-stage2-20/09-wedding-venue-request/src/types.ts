export interface VenueRequest {
  id: string;
  preferredDate: string;
  guestCount: number;
  cateringStyle: string;
  coupleEmail: string;
  couplePhone: string;
  stage: string;
}

export interface DailyTotal { date: string; count: number; total: number }

export const SAMPLE_VENUEREQUEST: VenueRequest = {
  "id": "VEN-1001",
  "preferredDate": "2025-06-14 1",
  "guestCount": 85,
  "cateringStyle": "plated-dinner 1",
  "coupleEmail": "sarah.james@email.com 1",
  "couplePhone": "+1-555-0147 1",
  "stage": "date-selection"
}
