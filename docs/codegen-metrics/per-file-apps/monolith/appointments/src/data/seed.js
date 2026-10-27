import { v4 as uuid } from 'uuid'
import { subDays, addDays, setHours, setMinutes } from 'date-fns'

const now = new Date()

const dt = (daysOffset, h, m) => {
  const d = daysOffset >= 0 ? addDays(now, daysOffset) : subDays(now, -daysOffset)
  return setMinutes(setHours(d, h), m).toISOString()
}

export const STATUSES = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show']

export const STATUS_COLOR = {
  Scheduled:   { bg: '#e0e7ff', text: '#3730a3' },
  Confirmed:   { bg: '#dcfce7', text: '#166534' },
  'In Progress':{ bg: '#fef9c3', text: '#854d0e' },
  Completed:   { bg: '#f0fdf4', text: '#15803d' },
  Cancelled:   { bg: '#fee2e2', text: '#991b1b' },
  'No Show':   { bg: '#fce7f3', text: '#9d174d' },
}

export const PROVIDERS = [
  { id: 'p1', name: 'Dr. Sarah Chen', specialty: 'General Practice' },
  { id: 'p2', name: 'Dr. Marcus Webb', specialty: 'Cardiology' },
  { id: 'p3', name: 'Dr. Priya Nair', specialty: 'Dermatology' },
  { id: 'p4', name: 'Dr. James Okafor', specialty: 'Orthopedics' },
]

export const VISIT_TYPES = ['New Patient', 'Follow-Up', 'Annual Physical', 'Urgent Care', 'Consultation', 'Procedure']

const PATIENTS = [
  { name: 'Alice Johnson', dob: '1985-03-12', phone: '555-0101', email: 'alice@example.com' },
  { name: 'Bob Martinez', dob: '1972-07-24', phone: '555-0102', email: 'bob@example.com' },
  { name: 'Carol White', dob: '1990-11-05', phone: '555-0103', email: 'carol@example.com' },
  { name: 'David Kim', dob: '1968-01-30', phone: '555-0104', email: 'david@example.com' },
  { name: 'Eva Brown', dob: '2001-09-18', phone: '555-0105', email: 'eva@example.com' },
  { name: 'Frank Lee', dob: '1955-06-22', phone: '555-0106', email: 'frank@example.com' },
  { name: 'Grace Patel', dob: '1995-12-01', phone: '555-0107', email: 'grace@example.com' },
  { name: 'Henry Nguyen', dob: '1980-04-14', phone: '555-0108', email: 'henry@example.com' },
]

const raw = [
  { days: -3, h: 9,  m: 0,  pi: 0, pr: 'p1', type: 'Follow-Up',       status: 'Completed',   notes: 'Patient reported improvement. Continue current medication.' },
  { days: -2, h: 10, m: 30, pi: 1, pr: 'p2', type: 'Consultation',    status: 'Completed',   notes: 'EKG normal. Schedule stress test in 3 months.' },
  { days: -1, h: 14, m: 0,  pi: 2, pr: 'p3', type: 'Annual Physical', status: 'No Show',     notes: 'Patient did not arrive. Left voicemail.' },
  { days: 0,  h: 8,  m: 30, pi: 3, pr: 'p1', type: 'Urgent Care',     status: 'In Progress', notes: 'Presenting with acute knee pain.' },
  { days: 0,  h: 9,  m: 0,  pi: 4, pr: 'p4', type: 'New Patient',     status: 'Confirmed',   notes: 'First visit. Bring prior imaging.' },
  { days: 0,  h: 11, m: 0,  pi: 5, pr: 'p2', type: 'Follow-Up',       status: 'Scheduled',   notes: 'Review lab results.' },
  { days: 0,  h: 13, m: 30, pi: 6, pr: 'p3', type: 'Procedure',       status: 'Confirmed',   notes: 'Mole removal. Consent form signed.' },
  { days: 1,  h: 9,  m: 30, pi: 7, pr: 'p1', type: 'Annual Physical', status: 'Scheduled',   notes: '' },
  { days: 1,  h: 10, m: 0,  pi: 0, pr: 'p4', type: 'Consultation',    status: 'Scheduled',   notes: 'Second opinion on surgery.' },
  { days: 2,  h: 15, m: 0,  pi: 1, pr: 'p3', type: 'Follow-Up',       status: 'Scheduled',   notes: 'Post-procedure check.' },
  { days: 3,  h: 8,  m: 0,  pi: 2, pr: 'p2', type: 'New Patient',     status: 'Scheduled',   notes: '' },
  { days: 4,  h: 14, m: 30, pi: 3, pr: 'p1', type: 'Urgent Care',     status: 'Cancelled',   notes: 'Patient cancelled due to travel.' },
]

export const seedVisits = raw.map(r => ({
  id: uuid(),
  patientName: PATIENTS[r.pi].name,
  patientDob:  PATIENTS[r.pi].dob,
  patientPhone:PATIENTS[r.pi].phone,
  patientEmail:PATIENTS[r.pi].email,
  providerId:  r.pr,
  providerName: PROVIDERS.find(p => p.id === r.pr).name,
  providerSpecialty: PROVIDERS.find(p => p.id === r.pr).specialty,
  visitType:   r.type,
  status:      r.status,
  dateTime:    dt(r.days, r.h, r.m),
  duration:    30,
  notes:       r.notes,
  createdAt:   new Date().toISOString(),
}))
