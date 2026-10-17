// Campus Life Planner - Validation Rules & Helpers
(function (global) {
  'use strict';

  const regexRules = {
    // Rule 1: No leading or trailing spaces
    title: /^\S(?:.*\S)?$/,
    // Rule 2: Numeric duration (positive integer or decimal up to 2 places)
    duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    // Rule 3: Valid date in YYYY-MM-DD format
    dueDate: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    // Rule 4: Letters, spaces, and hyphens only
    tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    // Rule 5 (Advanced): Detect accidental duplicate consecutive words
    duplicateWords: /\b(\w+)\s+\1\b/i
  };

  function validateField(field, value) {
    const str = String(value ?? '');

    switch (field) {
      case 'title':
        if (!str.trim()) return 'Title is required.';
        if (!regexRules.title.test(str)) {
          return 'Title cannot start or end with spaces.';
        }
        if (regexRules.duplicateWords.test(str)) {
          return 'Title contains duplicate consecutive words.';
        }
        return '';

      case 'duration': {
        const s = str.trim();
        if (!s) return 'Duration is required.';
        if (!regexRules.duration.test(s) || Number(s) <= 0) {
          return 'Enter a valid positive number for duration.';
        }
        return '';
      }

      case 'dueDate': {
        const s = str.trim();
        if (!s) return 'Due date is required.';
        if (!regexRules.dueDate.test(s)) {
          return 'Date must be formatted as YYYY-MM-DD.';
        }
        return '';
      }

      case 'tag': {
        const s = str.trim();
        if (!s) return 'Tag/category is required.';
        if (!regexRules.tag.test(s)) {
          return 'Tag can only contain letters, spaces, or hyphens.';
        }
        return '';
      }

      default:
        return '';
    }
  }

  function validateTask(task) {
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

  function isValidTag(tagString) {
    const clean = String(tagString || '').trim();
    return regexRules.tag.test(clean);
  }

  const moduleExports = {
    regexRules,
    validateField,
    validateTask,
    isValidTag
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = moduleExports;
  }
  global.AppValidators = moduleExports;
})(typeof window !== 'undefined' ? window : globalThis);