// Seed data: January–June spending by category and monthly savings

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const spendingData = [
  { month: 'Jan', Housing: 1200, Food: 420, Transport: 180, Entertainment: 95, Utilities: 140, Health: 60 },
  { month: 'Feb', Housing: 1200, Food: 390, Transport: 160, Entertainment: 120, Utilities: 130, Health: 200 },
  { month: 'Mar', Housing: 1200, Food: 450, Transport: 200, Entertainment: 80,  Utilities: 125, Health: 75 },
  { month: 'Apr', Housing: 1200, Food: 410, Transport: 175, Entertainment: 150, Utilities: 115, Health: 90 },
  { month: 'May', Housing: 1200, Food: 480, Transport: 220, Entertainment: 110, Utilities: 105, Health: 55 },
  { month: 'Jun', Housing: 1200, Food: 500, Transport: 190, Entertainment: 200, Utilities: 120, Health: 130 },
];

export const savingsData = [
  { month: 'Jan', savings: 850 },
  { month: 'Feb', savings: 620 },
  { month: 'Mar', savings: 940 },
  { month: 'Apr', savings: 780 },
  { month: 'May', savings: 1050 },
  { month: 'Jun', savings: 1200 },
];

export const categoryColors = {
  Housing:       '#4f6ef7',
  Food:          '#f97316',
  Transport:     '#22c55e',
  Entertainment: '#a855f7',
  Utilities:     '#eab308',
  Health:        '#ef4444',
};

export const categories = Object.keys(categoryColors);

// Derived summary stats
export function computeStats(spending, savings) {
  const totalSpent = spending.reduce((sum, row) => {
    return sum + categories.reduce((s, cat) => s + (row[cat] || 0), 0);
  }, 0);

  const totalSaved = savings.reduce((sum, row) => sum + row.savings, 0);
  const netBalance = totalSaved - totalSpent;

  return { totalSpent, totalSaved, netBalance };
}
