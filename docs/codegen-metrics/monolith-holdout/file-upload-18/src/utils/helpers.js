const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Format bytes into a human-readable string.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format an ISO date string into a readable local date + time.
 */
export function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Validate the homework drop box form.
 * Returns an object of field -> error message strings.
 */
export function validateForm({ studentName, period, assignmentTitle, selectedFile }) {
  const errors = {};

  if (!studentName || studentName.trim().length === 0) {
    errors.studentName = 'Student name is required.';
  } else if (studentName.trim().length < 2) {
    errors.studentName = 'Please enter your full name.';
  }

  if (!period) {
    errors.period = 'Please select your class period.';
  }

  if (!assignmentTitle || assignmentTitle.trim().length === 0) {
    errors.assignmentTitle = 'Assignment title is required.';
  } else if (assignmentTitle.trim().length < 3) {
    errors.assignmentTitle = 'Please enter a more descriptive title.';
  }

  if (!selectedFile) {
    errors.selectedFile = 'Please attach a file before submitting.';
  } else if (selectedFile.size > MAX_FILE_SIZE) {
    errors.selectedFile = `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`;
  } else if (selectedFile.size === 0) {
    errors.selectedFile = 'The selected file appears to be empty.';
  }

  return errors;
}
