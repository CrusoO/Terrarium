const pricingData = [
  {
    id: 'community',
    name: 'Community',
    price: 10,
    period: 'month',
    tagline: 'Perfect for casual riders',
    features: [
      'Access to shared tool library',
      '2 DIY repair sessions/month',
      'Member discounts on parts (10%)',
      'Community newsletter',
      'Attend open shop nights',
    ],
    cta: 'Join as Community',
    highlighted: false,
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    price: 25,
    period: 'month',
    tagline: 'For the dedicated cyclist',
    features: [
      'Everything in Community',
      'Unlimited DIY repair sessions',
      'Member discounts on parts (20%)',
      'One free tune-up per quarter',
      'Priority stand reservations',
      'Access to advanced tool loaner program',
    ],
    cta: 'Join as Mechanic',
    highlighted: true,
  },
  {
    id: 'steward',
    name: 'Steward',
    price: 50,
    period: 'month',
    tagline: 'Support the whole community',
    features: [
      'Everything in Mechanic',
      'Member discounts on parts (30%)',
      'Two free tune-ups per quarter',
      'Name on co-op donor wall',
      'Vote in co-op governance decisions',
      'Annual co-op appreciation event invite',
    ],
    cta: 'Become a Steward',
    highlighted: false,
  },
];

export default pricingData;
