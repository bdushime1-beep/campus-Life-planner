// Local storage management and JSON import/export

const TASKS_KEY = 'campus_planner_tasks';
const SETTINGS_KEY = 'campus_planner_settings';

// Load stored tasks from localStorage
export function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading tasks from localStorage:', err);
    return [];
  }
}

// Save tasks array to localStorage
export function saveTasks(tasks) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
    return false;
  }
}

// Load user settings (unit preference, daily cap, theme)
export function loadSettings() {
  const defaults = {
    timeUnit: 'minutes', // 'minutes' or 'hours'
    dailyCap: 180,        // 3 hours daily target
    theme: 'light'
  };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

// Save settings to localStorage
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

// Export tasks as a downloaded JSON file
export function exportTasksToJson(tasks) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `campus-planner-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Validate imported JSON data before applying to state
export function validateImportedTasks(data) {
  if (!Array.isArray(data)) {
    return { valid: false, message: 'JSON root must be an array of task objects.' };
  }

  if (data.length === 0) {
    return { valid: false, message: 'JSON array is empty.' };
  }

  // Check required fields on each item
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (typeof item !== 'object' || item === null) {
      return { valid: false, message: `Item at index ${i} is not a valid object.` };
    }

    if (!item.title || !item.duration || !item.dueDate || !item.tag) {
      return { valid: false, message: `Item at index ${i} is missing required fields (title, duration, dueDate, tag).` };
    }
  }

  return { valid: true, data };
}
