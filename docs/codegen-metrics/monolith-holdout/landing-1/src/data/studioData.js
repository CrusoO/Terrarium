export const studio = {
  name: 'Clay & Fire',
  tagline: 'Shape Something Beautiful',
  subtagline:
    'A community pottery studio where beginners and seasoned throwers alike find their rhythm on the wheel, in the kiln, and in good company.',
  ctaLabel: 'Book a Class',
  ctaHref: '#pricing',
  secondaryCtaLabel: 'Learn About Us',
  secondaryCtaHref: '#about',
  contact: 'hello@clayandfire.studio',
  address: '42 Kiln Lane, Portland, OR 97201',
  phone: '(503) 555-0182',
};

export const pricingTiers = [
  {
    id: 'drop-in',
    name: 'Drop-In Session',
    price: 28,
    unit: 'per session',
    badge: null,
    description: 'Perfect for curious newcomers or occasional visitors.',
    features: [
      '2-hour open studio access',
      'All tools & equipment provided',
      'Glazing materials included',
      'Kiln firing (pick up in 2 weeks)',
      'Friendly staff on hand',
    ],
    cta: 'Reserve a Spot',
  },
  {
    id: 'monthly',
    name: 'Monthly Membership',
    price: 89,
    unit: 'per month',
    badge: 'Most Popular',
    description: 'Unlimited creativity for the dedicated studio regular.',
    features: [
      'Unlimited open studio hours',
      'Two guided workshops per month',
      'Personal shelf storage space',
      'Priority kiln scheduling',
      '10% off clay & supply shop',
      'Access to members-only events',
    ],
    cta: 'Join Now',
  },
  {
    id: 'workshop',
    name: 'Private Workshop',
    price: 195,
    unit: 'per group (up to 6)',
    badge: null,
    description: 'Ideal for date nights, birthdays, and team outings.',
    features: [
      '3-hour private studio session',
      'Dedicated instructor throughout',
      'All materials & aprons provided',
      'Complimentary wine & refreshments',
      'Kiln firing & shipping available',
      'Custom scheduling any day',
    ],
    cta: 'Inquire Now',
  },
];

export const about = {
  headline: 'Rooted in Clay, Built on Community',
  body: [
    'Clay & Fire was founded in 2014 by ceramicist Maya Okafor after she converted a century-old warehouse into a light-filled studio where anyone — regardless of experience — could get their hands dirty and make something real.',
    'We believe pottery is more than a craft. It\'s a practice of patience, presence, and play. Our 4,000 sq ft studio houses 18 wheels, two wood-fired kilns, and a small shop stocked with locally sourced clay and hand-selected glazes.',
    'Over the past decade we\'ve welcomed more than 6,000 students, hosted hundreds of private events, and shipped handmade pieces to all 50 states. Whether you\'re throwing your first bowl or refining your hundredth, there\'s a place for you here.',
  ],
  stats: [
    { value: '10+', label: 'Years Open' },
    { value: '6,000+', label: 'Students Taught' },
    { value: '18', label: 'Pottery Wheels' },
    { value: '2', label: 'Wood-Fired Kilns' },
  ],
};
