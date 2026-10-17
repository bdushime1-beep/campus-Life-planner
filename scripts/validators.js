// Form regex validation rules for Campus Life Planner

export const regexRules = {
  // Rule 1: No leading or trailing spaces, collapse doubles
  title: /^\S(?:.*\S)?$/,

  // Rule 2: Numeric duration (positive integer or up to 2 decimal places)
  duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,

  // Rule 3: Valid date in YYYY-MM-DD format
  dueDate: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

  // Rule 4: Letters, spaces, and hyphens only
  tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,

  // Rule 5 (Advanced): Detect accidental duplicate words like "study study"
  duplicateWords: /\b(\w+)\s+\1\b/i
};

// Validate individual task field
export function validateField(field, value) {
  const str = String(value || '').trim();

  switch (field) {
    case 'title':
      if (!str) return 'Title is required.';
      if (!regexRules.title.test(str)) {
        return 'Title cannot start or end with spaces.';
      }
      if (regexRules.duplicateWords.test(str)) {
        return 'Title contains duplicate consecutive words.';
      }
      return '';

    case 'duration':
      if (!str) return 'Duration is required.';
      if (!regexRules.duration.test(str) || Number(str) <= 0) {
        return 'Enter a valid positive number for duration.';
      }
      return '';

    case 'dueDate':
      if (!str) return 'Due date is required.';
      if (!regexRules.dueDate.test(str)) {
        return 'Date must be formatted as YYYY-MM-DD.';
      }
      return '';

    case 'tag':
      if (!str) return 'Tag/category is required.';
      if (!regexRules.tag.test(str)) {
        return 'Tag can only contain letters, spaces, or hyphens.';
      }
      return '';

    default:
      return '';
  }
}

// Validate the complete task object
export function validateTask(task) {
  const errors = {};

  const titleError = validateField('title', task.title);
  if (titleError) errors.title = titleError;

  const durationError = validateField('duration', task.duration);
  if (durationError) errors.duration = durationError;

  const dateError = validateField('dueDate', task.dueDate);
  if (dateError) errors.dueDate = dateError;

  const tagError = validateField('tag', task.tag);
  if (tagError) errors.tag = tagError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
