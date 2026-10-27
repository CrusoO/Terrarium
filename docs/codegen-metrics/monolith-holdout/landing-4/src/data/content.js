export const business = {
  name: 'Happy Paws',
  tagline: 'Professional Dog Walking',
  phone: '(555) 847-2910',
  email: 'hello@happypawswalks.com',
  location: 'Portland, OR',
  instagram: '@happypawspdx',
  facebook: 'Happy Paws Dog Walking',
  founded: '2018',
};

export const services = [
  {
    id: 1,
    icon: '🦮',
    title: 'Solo Walk',
    description:
      'One-on-one attention for your pup. A 60-minute walk tailored to your dog\'s pace, energy level, and favorite routes.',
    highlight: 'Most popular',
  },
  {
    id: 2,
    icon: '🐕‍🦺',
    title: 'Group Walk',
    description:
      'Socialization and exercise with a small pack of 3–4 friendly dogs. Great for social pups who love making new friends.',
    highlight: null,
  },
  {
    id: 3,
    icon: '🐶',
    title: 'Puppy Visit',
    description:
      'Mid-day check-ins for puppies under 6 months. Includes feeding, playtime, potty break, and a photo update.',
    highlight: null,
  },
  {
    id: 4,
    icon: '🌙',
    title: 'Overnight Stay',
    description:
      'Your dog stays in our home overnight with full attention, cozy sleeping arrangements, and morning walks included.',
    highlight: 'Premium',
  },
];

export const pricingTiers = [
  {
    id: 1,
    name: 'Starter',
    price: 22,
    unit: 'per walk',
    description: 'Perfect for occasional walks',
    features: [
      '30-minute group walk',
      'GPS route tracking',
      'Post-walk photo update',
      'Up to 3 dogs in group',
    ],
    cta: 'Book a Walk',
    featured: false,
  },
  {
    id: 2,
    name: 'Regular',
    price: 35,
    unit: 'per walk',
    description: 'Our most popular package',
    features: [
      '60-minute solo walk',
      'GPS route tracking',
      'Post-walk photo & report',
      'Key holding included',
      'Flexible scheduling',
    ],
    cta: 'Get Started',
    featured: true,
  },
  {
    id: 3,
    name: 'Monthly Bundle',
    price: 280,
    unit: 'per month',
    description: 'Best value for daily walkers',
    features: [
      '10 solo walks per month',
      'Priority scheduling',
      'GPS route tracking',
      'Detailed walk reports',
      'Free puppy visit included',
      'Dedicated walker assigned',
    ],
    cta: 'Subscribe & Save',
    featured: false,
  },
];

export const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Pearl District',
    rating: 5,
    quote:
      'Happy Paws has been a lifesaver for our golden retriever, Biscuit. He comes home tired and happy every single day. The photo updates are adorable and give me so much peace of mind while I\'m at work.',
    dog: 'Golden Retriever',
    avatar: '👩‍🦰',
  },
  {
    id: 2,
    name: 'James T.',
    location: 'Hawthorne',
    rating: 5,
    quote:
      'I was nervous about trusting someone with my anxious rescue pup, but the team at Happy Paws took the time to do a proper meet-and-greet and build trust slowly. Luna now runs to the door when she hears the walker arrive!',
    dog: 'Mixed Rescue',
    avatar: '👨‍💼',
  },
  {
    id: 3,
    name: 'Priya K.',
    location: 'Alberta Arts District',
    rating: 5,
    quote:
      'The overnight stay service is incredible. My two labs were completely at ease, and I got updates throughout the night. I finally took a vacation without worrying about my dogs. Worth every penny.',
    dog: 'Labrador × 2',
    avatar: '👩‍💻',
  },
  {
    id: 4,
    name: 'Marcus & Diane L.',
    location: 'Sellwood',
    rating: 5,
    quote:
      'We\'ve tried three other dog walkers in Portland and none compare. Consistent, communicative, and genuinely passionate about dogs. Our corgi Pretzel is obsessed with his walker.',
    dog: 'Pembroke Corgi',
    avatar: '👫',
  },
  {
    id: 5,
    name: 'Olivia R.',
    location: 'NW Portland',
    rating: 4,
    quote:
      'Fantastic service and super reliable. The monthly bundle is a great deal — I\'ve saved so much compared to booking individually. Scheduling is easy and they always confirm the day before.',
    dog: 'French Bulldog',
    avatar: '👩‍🎨',
  },
];
