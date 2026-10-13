/**
 * Validation helpers and static data for the permit wizard.
 */

// --- Validation ---

export function validateAddress({ street, city, state, zip }) {
  const errors = {};
  if (!street.trim()) errors.street = 'Street address is required.';
  if (!city.trim()) errors.city = 'City is required.';
  if (!state) errors.state = 'Please select a state.';
  if (!zip.trim()) {
    errors.zip = 'ZIP code is required.';
  } else if (!/^\d{5}(-\d{4})?$/.test(zip.trim())) {
    errors.zip = 'Enter a valid ZIP code (e.g. 62701 or 62701-1234).';
  }
  return errors;
}

export function validateWorkType({ type, description }) {
  const errors = {};
  if (!type) errors.type = 'Please select a work category.';
  if (!description.trim()) {
    errors.description = 'A project description is required.';
  } else if (description.trim().length < 20) {
    errors.description = 'Please provide at least 20 characters of description.';
  } else if (description.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }
  return errors;
}

// --- Formatters ---

export function formatWorkType(value) {
  const found = WORK_TYPES.find((wt) => wt.value === value);
  return found ? found.label : value;
}

export function generatePermitNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `BP-${year}-${rand}`;
}

// --- Static Data ---

export const WORK_TYPES = [
  {
    value: 'new_construction',
    label: 'New Construction',
    icon: '🏗️',
    description: 'Erecting a new structure from the ground up',
  },
  {
    value: 'renovation',
    label: 'Renovation',
    icon: '🔨',
    description: 'Remodeling or altering an existing structure',
  },
  {
    value: 'electrical',
    label: 'Electrical',
    icon: '⚡',
    description: 'Wiring, panel upgrades, or electrical installations',
  },
  {
    value: 'plumbing',
    label: 'Plumbing',
    icon: '🔧',
    description: 'Pipe installation, repairs, or fixture replacements',
  },
  {
    value: 'other',
    label: 'Other',
    icon: '📋',
    description: 'Demolition, grading, fencing, or miscellaneous work',
  },
];

export const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },
  { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WY', name: 'Wyoming' },
];
