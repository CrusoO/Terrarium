/**
 * Validates Step 1 contact info fields.
 * Returns an object of field-level error messages.
 */
export function validateContactInfo(info) {
  const errors = {};

  if (!info.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }
  if (!info.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }
  if (!info.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!info.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!/^\+?[\d\s\-().]{7,20}$/.test(info.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }

  return errors;
}

/**
 * Validates Step 2 course selection.
 */
export function validateCourseSelection(course) {
  if (!course) return { course: 'Please select a course to continue.' };
  return {};
}

/**
 * Validates Step 3 waiver acceptance.
 */
export function validateWaiver(accepted) {
  if (!accepted) return { waiver: 'You must agree to the waiver to continue.' };
  return {};
}

/**
 * Formats a phone number for display.
 */
export function formatPhone(phone) {
  return phone || '—';
}

/**
 * Returns true if an errors object has no keys.
 */
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}
