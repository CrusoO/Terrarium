// In-memory receipt store — persists for the server's lifetime
// Seeded with 3 example receipts so the Log screen is never empty on first load

const SEED_RECEIPTS = [
  {
    id: 'seed-001',
    staffName: 'Alex Rivera',
    notes: 'Team lunch at Olive Garden — 6 people',
    originalFilename: 'lunch_receipt.jpg',
    storedFilename: 'seed-lunch.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 4210,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'seed-002',
    staffName: 'Morgan Chen',
    notes: 'Office supplies — printer paper and toner cartridge',
    originalFilename: 'office_supplies.jpg',
    storedFilename: 'seed-office.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 3870,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(), // yesterday
  },
  {
    id: 'seed-003',
    staffName: 'Jamie Patel',
    notes: '',
    originalFilename: 'client_dinner.jpg',
    storedFilename: 'seed-dinner.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 5120,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
  },
];

// Mutable store array
let receipts = [...SEED_RECEIPTS];

export function getAllReceipts() {
  return [...receipts];
}

export function getReceiptById(id) {
  return receipts.find((r) => r.id === id) || null;
}

export function addReceipt(receipt) {
  receipts.unshift(receipt); // newest first
  return receipt;
}
