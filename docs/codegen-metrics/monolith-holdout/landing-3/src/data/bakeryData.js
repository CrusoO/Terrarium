export const bakeryInfo = {
  name: 'Golden Crumb Bakery',
  tagline: 'Artisan breads, pastries & cakes — baked fresh every morning.',
  established: '2009',
  address: '142 Maple Street, Riverside, CA 92501',
  phone: '(951) 555-0184',
  email: 'hello@goldencrumbbakery.com',
  hours: {
    'Mon – Fri': '6:30 am – 6:00 pm',
    'Saturday': '7:00 am – 5:00 pm',
    'Sunday': '8:00 am – 2:00 pm',
  },
};

export const menuItems = [
  {
    id: 1,
    name: 'Country Sourdough',
    category: 'bread',
    description: 'Slow-fermented 48-hour levain with a crackly crust and open, chewy crumb.',
    price: 9.50,
    emoji: '🍞',
    badge: 'Bestseller',
  },
  {
    id: 2,
    name: 'Rosemary Focaccia',
    category: 'bread',
    description: 'Pillowy olive-oil focaccia topped with fresh rosemary and flaky sea salt.',
    price: 7.00,
    emoji: '🫓',
    badge: null,
  },
  {
    id: 3,
    name: 'Butter Croissant',
    category: 'pastry',
    description: 'Classic laminated dough with 27 layers of French butter — golden and flaky.',
    price: 4.25,
    emoji: '🥐',
    badge: 'Fan Favorite',
  },
  {
    id: 4,
    name: 'Almond Danish',
    category: 'pastry',
    description: 'Flaky pastry filled with house-made almond cream and topped with toasted slivers.',
    price: 4.75,
    emoji: '🥧',
    badge: null,
  },
  {
    id: 5,
    name: 'Lemon Olive Oil Cake',
    category: 'cake',
    description: 'Moist, fragrant cake with Meyer lemon zest, a drizzle of glaze, and candied peel.',
    price: 6.50,
    emoji: '🍋',
    badge: 'Seasonal',
  },
  {
    id: 6,
    name: 'Dark Chocolate Tart',
    category: 'cake',
    description: 'Crisp butter shell filled with 70% Valrhona ganache and a pinch of fleur de sel.',
    price: 7.25,
    emoji: '🍫',
    badge: null,
  },
];

export const categories = [
  { key: 'all', label: 'All Items' },
  { key: 'bread', label: 'Breads' },
  { key: 'pastry', label: 'Pastries' },
  { key: 'cake', label: 'Cakes & Tarts' },
];
