// Campus Life Planner - Safe Regex Compiler and Match Highlighter
(function (global) {
  'use strict';

  function compileRegex(query, caseInsensitive = true) {
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

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightMatch(text, regex) {
    if (!text) return '';
    const safeText = escapeHtml(text);
    if (!regex || regex.error) return safeText;

    try {
      const flags = regex.flags && regex.flags.includes('g') ? regex.flags : (regex.flags || '') + 'g';
      const globalRegex = new RegExp(regex.source, flags);
      return safeText.replace(globalRegex, match => `<mark>${match}</mark>`);
    } catch {
      return safeText;
    }
  }

  function matchTask(task, regex, rawQuery = '') {
    if (!regex || regex.error) return true;

    const tagMatch = String(rawQuery).match(/^@tag:([\w-]+)$/i);
    if (tagMatch) {
      const targetTag = tagMatch[1].toLowerCase();
      return (task.tag || '').toLowerCase() === targetTag;
    }

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

  function hasRegexChars(query) {
    return /[.*+?^${}()|[\]\\]/.test(String(query || ''));
  }

  const moduleExports = {
    compileRegex,
    escapeHtml,
    highlightMatch,
    matchTask,
    hasRegexChars
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = moduleExports;
  }
  global.AppSearch = moduleExports;
})(typeof window !== 'undefined' ? window : globalThis);
