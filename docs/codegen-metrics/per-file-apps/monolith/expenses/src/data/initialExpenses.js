export const CATEGORIES = [
  { id: 'travel',      label: 'Travel',       color: '#6366f1', bg: '#eef2ff', icon: '✈️' },
  { id: 'meals',       label: 'Meals',        color: '#f59e0b', bg: '#fffbeb', icon: '🍽️' },
  { id: 'software',   label: 'Software',     color: '#10b981', bg: '#ecfdf5', icon: '💻' },
  { id: 'office',     label: 'Office',       color: '#3b82f6', bg: '#eff6ff', icon: '🖊️' },
  { id: 'marketing',  label: 'Marketing',    color: '#ec4899', bg: '#fdf2f8', icon: '📣' },
  { id: 'training',   label: 'Training',     color: '#8b5cf6', bg: '#f5f3ff', icon: '📚' },
  { id: 'other',      label: 'Other',        color: '#64748b', bg: '#f8fafc', icon: '📦' },
]

export const STAFF = [
  'Alice Johnson', 'Bob Martinez', 'Carol White', 'David Lee',
  'Emma Davis', 'Frank Wilson', 'Grace Kim', 'Henry Brown',
]

let idCounter = 100

const make = (staff, category, description, amount, date) => ({
  id: idCounter++,
  staff,
  category,
  description,
  amount,
  date,
})

export const INITIAL_EXPENSES = [
  make('Alice Johnson',  'travel',    'Flight to NYC conference',        420.00, '2024-05-01'),
  make('Bob Martinez',   'meals',     'Team lunch – Q2 kickoff',          87.50, '2024-05-02'),
  make('Carol White',    'software',  'Figma annual subscription',       144.00, '2024-05-03'),
  make('David Lee',      'office',    'Standing desk mat',                59.99, '2024-05-04'),
  make('Emma Davis',     'marketing', 'LinkedIn ad campaign',            300.00, '2024-05-05'),
  make('Frank Wilson',   'training',  'Udemy course bundle',              49.99, '2024-05-06'),
  make('Grace Kim',      'travel',    'Hotel – client visit Chicago',    210.00, '2024-05-07'),
  make('Henry Brown',    'meals',     'Client dinner',                   135.00, '2024-05-08'),
  make('Alice Johnson',  'software',  'GitHub Copilot seats (3)',        114.00, '2024-05-09'),
  make('Bob Martinez',   'office',    'Printer ink cartridges',           34.99, '2024-05-10'),
  make('Carol White',    'travel',    'Uber rides – offsite',             62.40, '2024-05-11'),
  make('David Lee',      'marketing', 'Swag printing',                   175.00, '2024-05-12'),
  make('Emma Davis',     'training',  'Conference ticket',               499.00, '2024-05-13'),
  make('Frank Wilson',   'meals',     'Working lunch x4',                 72.00, '2024-05-14'),
  make('Grace Kim',      'other',     'Miscellaneous supplies',           28.50, '2024-05-15'),
  make('Henry Brown',    'software',  'Slack Pro upgrade',                80.00, '2024-05-16'),
]
