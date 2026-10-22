let nextId = 9;

export const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const CATEGORIES = ['Billing', 'Technical', 'Account', 'General'];

const AGENTS = ['Alice Chen', 'Bob Martinez', 'Carol White', 'David Kim'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const seed = [
  { id: 1, title: 'Cannot log into my account', status: 'Open', priority: 'High', category: 'Account', requester: 'john.doe@example.com', agent: 'Alice Chen', created: '2024-06-01T09:12:00Z', updated: '2024-06-01T09:12:00Z', description: 'I keep getting an "Invalid credentials" error even though I reset my password twice.', comments: [{ author: 'Alice Chen', time: '2024-06-01T10:00:00Z', body: 'Hi John, I am looking into this now.' }] },
  { id: 2, title: 'Incorrect charge on invoice #4421', status: 'In Progress', priority: 'Critical', category: 'Billing', requester: 'sarah.k@example.com', agent: 'Bob Martinez', created: '2024-06-02T11:30:00Z', updated: '2024-06-03T08:00:00Z', description: 'I was charged $199 instead of $99 for the Pro plan this month.', comments: [] },
  { id: 3, title: 'App crashes on startup (iOS 17)', status: 'Open', priority: 'Critical', category: 'Technical', requester: 'mike.t@example.com', agent: 'Carol White', created: '2024-06-02T14:00:00Z', updated: '2024-06-02T14:00:00Z', description: 'After the latest update the app crashes immediately on launch on my iPhone 15.', comments: [{ author: 'Carol White', time: '2024-06-02T15:00:00Z', body: 'We have reproduced the issue and a fix is being prepared.' }] },
  { id: 4, title: 'How do I export data to CSV?', status: 'Resolved', priority: 'Low', category: 'General', requester: 'anna.l@example.com', agent: 'David Kim', created: '2024-05-30T08:00:00Z', updated: '2024-05-30T10:00:00Z', description: 'I need to export my project data to CSV for a report.', comments: [{ author: 'David Kim', time: '2024-05-30T09:00:00Z', body: 'Go to Settings → Export → CSV. Let me know if that helps!' }, { author: 'anna.l@example.com', time: '2024-05-30T10:00:00Z', body: 'Perfect, thank you!' }] },
  { id: 5, title: 'Two-factor auth not sending SMS', status: 'In Progress', priority: 'High', category: 'Account', requester: 'peter.n@example.com', agent: 'Alice Chen', created: '2024-06-03T07:45:00Z', updated: '2024-06-03T09:00:00Z', description: 'I enabled 2FA but I never receive the SMS code.', comments: [] },
  { id: 6, title: 'Request to upgrade team plan', status: 'Open', priority: 'Medium', category: 'Billing', requester: 'lisa.m@example.com', agent: 'Bob Martinez', created: '2024-06-03T12:00:00Z', updated: '2024-06-03T12:00:00Z', description: 'We want to upgrade from 5 seats to 20 seats. Please advise on pricing.', comments: [] },
  { id: 7, title: 'Dashboard widgets not loading', status: 'Closed', priority: 'Medium', category: 'Technical', requester: 'tom.b@example.com', agent: 'Carol White', created: '2024-05-28T16:00:00Z', updated: '2024-05-29T11:00:00Z', description: 'The analytics widgets on the dashboard show a spinner indefinitely.', comments: [{ author: 'Carol White', time: '2024-05-29T10:00:00Z', body: 'This was a caching issue on our end. Deployed a fix.' }] },
  { id: 8, title: 'Need GDPR data deletion', status: 'Open', priority: 'High', category: 'Account', requester: 'nina.r@example.com', agent: 'David Kim', created: '2024-06-04T08:30:00Z', updated: '2024-06-04T08:30:00Z', description: 'Please delete all personal data associated with my account per GDPR Article 17.', comments: [] },
];

let tickets = seed.map(t => ({ ...t }));

export function getTickets() { return [...tickets]; }

export function getTicket(id) { return tickets.find(t => t.id === id) || null; }

export function createTicket(data) {
  const now = new Date().toISOString();
  const ticket = {
    id: nextId++,
    ...data,
    agent: rnd(AGENTS),
    created: now,
    updated: now,
    comments: [],
  };
  tickets = [ticket, ...tickets];
  return ticket;
}

export function updateTicket(id, patch) {
  tickets = tickets.map(t => t.id === id ? { ...t, ...patch, updated: new Date().toISOString() } : t);
  return getTicket(id);
}

export function addComment(id, author, body) {
  const ticket = getTicket(id);
  if (!ticket) return null;
  const comment = { author, time: new Date().toISOString(), body };
  ticket.comments = [...ticket.comments, comment];
  tickets = tickets.map(t => t.id === id ? { ...ticket, updated: new Date().toISOString() } : t);
  return getTicket(id);
}
