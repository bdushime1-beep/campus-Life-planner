// Regex search compiler and accessible match highlighter

// Safely compile user input into RegExp using try/catch
export function compileRegex(query, caseInsensitive = true) {
  if (!query || typeof query !== 'string') return null;
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const flags = caseInsensitive ? 'i' : '';
    return new RegExp(trimmed, flags);
  } catch (err) {
    return { error: err.message };
  }
}

// Escape special HTML characters to prevent XSS
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Highlight matched search tokens with <mark> tags
export function highlightMatch(text, regex) {
  if (!text) return '';
  const safeText = escapeHtml(text);
  if (!regex || regex.error) return safeText;

  try {
    const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
    const globalRegex = new RegExp(regex.source, flags);
    return safeText.replace(globalRegex, match => `<mark>${match}</mark>`);
  } catch {
    return safeText;
  }
}

// Filter task against a compiled regex or special @tag prefix
export function matchTask(task, regex, rawQuery = '') {
  if (!regex || regex.error) return true;

  // Support @tag:Category search filter
  const tagMatch = rawQuery.match(/^@tag:([\w-]+)$/i);
  if (tagMatch) {
    const targetTag = tagMatch[1].toLowerCase();
    return (task.tag || '').toLowerCase() === targetTag;
  }

  // Check title, tag, due date, and duration
  const fields = [
    task.title || '',
    task.tag || '',
    task.dueDate || '',
    String(task.duration || '')
  ];

  return fields.some(field => {
    try {
      regex.lastIndex = 0;
      return regex.test(String(field));
    } catch {
      return false;
    }
  });
}
