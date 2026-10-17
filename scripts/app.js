// Main application logic for Campus Life Planner

import { validateTask, validateField } from './validators.js';
import { compileRegex, matchTask, highlightMatch } from './search.js';
import {
  loadTasks,
  saveTasks,
  loadSettings,
  saveSettings,
  exportTasksToJson,
  validateImportedTasks
} from './storage.js';

// Application state
let tasks = [];
let settings = loadSettings();
let sortField = 'dueDate';
let sortDirection = 'asc';
let searchQuery = '';
let caseInsensitive = true;
let editingTaskId = null;

// DOM references
const taskForm = document.getElementById('taskForm');
const formHeading = document.getElementById('formHeading');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const submitTaskBtn = document.getElementById('submitTaskBtn');
const tasksContainer = document.getElementById('tasksContainer');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const searchError = document.getElementById('searchError');
const caseToggle = document.getElementById('caseToggle');
const timeUnitSelect = document.getElementById('timeUnitSelect');
const dailyCapInput = document.getElementById('dailyCapInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFileInput = document.getElementById('importFileInput');
const loadSeedBtn = document.getElementById('loadSeedBtn');
const capStatusAlert = document.getElementById('capStatusAlert');

// Initial setup
async function init() {
  applyTheme(settings.theme);

  // Load stored tasks or fetch seed data if empty
  tasks = loadTasks();
  if (tasks.length === 0) {
    await loadInitialSeed();
  }

  // Set initial settings inputs
  if (timeUnitSelect) timeUnitSelect.value = settings.timeUnit;
  if (dailyCapInput) dailyCapInput.value = settings.dailyCap;

  setupEventListeners();
  renderApp();
}

// Fetch seed.json if first time running
async function loadInitialSeed() {
  try {
    const res = await fetch('./seed.json');
    if (res.ok) {
      const seedData = await res.json();
      tasks = seedData;
      saveTasks(tasks);
    }
  } catch (err) {
    console.log('No seed.json found or fetch failed, starting empty.', err);
  }
}

// Attach all UI event listeners
function setupEventListeners() {
  // Real-time input validation on form fields
  ['title', 'duration', 'dueDate', 'tag'].forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.addEventListener('input', () => {
        const err = validateField(field, input.value);
        showFieldError(field, err);
      });
    }
  });

  // Task form submit (Add or Edit)
  taskForm.addEventListener('submit', handleFormSubmit);

  // Cancel edit button
  cancelEditBtn.addEventListener('click', resetForm);

  // Live regex search input
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderTasks();
  });

  // Case insensitive checkbox toggle
  caseToggle.addEventListener('change', e => {
    caseInsensitive = e.target.checked;
    renderTasks();
  });

  // Table header sorting
  document.querySelectorAll('[data-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort');
      if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDirection = 'asc';
      }
      updateSortIndicators();
      renderTasks();
    });
  });

  // Settings: Unit conversion (minutes <-> hours)
  timeUnitSelect.addEventListener('change', e => {
    settings.timeUnit = e.target.value;
    saveSettings(settings);
    renderApp();
  });

  // Settings: Daily duration cap
  dailyCapInput.addEventListener('change', e => {
    const val = Number(e.target.value);
    if (val > 0) {
      settings.dailyCap = val;
      saveSettings(settings);
      renderStats();
    }
  });

  // Settings: Dark/Light theme toggle
  themeToggleBtn.addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings(settings);
    applyTheme(settings.theme);
  });

  // Settings: Export JSON backup
  exportJsonBtn.addEventListener('click', () => {
    exportTasksToJson(tasks);
  });

  // Settings: Import JSON
  importFileInput.addEventListener('change', handleJsonImport);

  // Settings: Reload Seed Data
  loadSeedBtn.addEventListener('click', async () => {
    if (confirm('Replace current tasks with default campus seed data?')) {
      await loadInitialSeed();
      renderApp();
    }
  });
}

// Handle Add / Edit form submission
function handleFormSubmit(e) {
  e.preventDefault();

  const taskData = {
    title: document.getElementById('title').value.trim(),
    duration: Number(document.getElementById('duration').value),
    dueDate: document.getElementById('dueDate').value,
    tag: document.getElementById('tag').value.trim()
  };

  const validation = validateTask(taskData);
  if (!validation.isValid) {
    Object.keys(validation.errors).forEach(field => {
      showFieldError(field, validation.errors[field]);
    });
    return;
  }

  const now = new Date().toISOString();

  if (editingTaskId) {
    // Update existing task
    const index = tasks.findIndex(t => t.id === editingTaskId);
    if (index !== -1) {
      tasks[index] = {
        ...tasks[index],
        ...taskData,
        updatedAt: now
      };
    }
  } else {
    // Create new task
    const newTask = {
      id: 'task_' + Date.now(),
      ...taskData,
      createdAt: now,
      updatedAt: now
    };
    tasks.unshift(newTask);
  }

  saveTasks(tasks);
  resetForm();
  renderApp();
}

// Inline edit: load task into form and scroll
function startEditTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingTaskId = id;
  formHeading.textContent = 'Edit Task';
  submitTaskBtn.textContent = 'Save Changes';
  cancelEditBtn.hidden = false;

  document.getElementById('title').value = task.title;
  document.getElementById('duration').value = task.duration;
  document.getElementById('dueDate').value = task.dueDate;
  document.getElementById('tag').value = task.tag;

  clearAllErrors();
  taskForm.scrollIntoView({ behavior: 'smooth' });
}

// Delete task with confirmation
function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (confirm(`Delete "${task.title}"?`)) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(tasks);
    if (editingTaskId === id) resetForm();
    renderApp();
  }
}

// Reset form to clean add mode
function resetForm() {
  editingTaskId = null;
  formHeading.textContent = 'Add New Task';
  submitTaskBtn.textContent = 'Add Task';
  cancelEditBtn.hidden = true;
  taskForm.reset();
  clearAllErrors();
}

function showFieldError(field, message) {
  const errEl = document.getElementById(field + 'Error');
  if (errEl) {
    errEl.textContent = message || '';
  }
}

function clearAllErrors() {
  ['title', 'duration', 'dueDate', 'tag'].forEach(field => {
    showFieldError(field, '');
  });
}

// Filter and sort tasks
function getFilteredAndSortedTasks() {
  let result = [...tasks];

  // Regex Search filtering
  if (searchQuery.trim()) {
    const compiled = compileRegex(searchQuery, caseInsensitive);
    if (compiled && compiled.error) {
      searchError.textContent = 'Invalid regex: ' + compiled.error;
    } else {
      searchError.textContent = '';
      result = result.filter(task => matchTask(task, compiled, searchQuery));
    }
  } else {
    searchError.textContent = '';
  }

  // Sorting
  result.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'duration') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
}

// Render the tasks table on desktop, cards on mobile
function renderTasks() {
  const displayTasks = getFilteredAndSortedTasks();
  const compiled = compileRegex(searchQuery, caseInsensitive);

  if (displayTasks.length === 0) {
    tasksContainer.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const rowsHtml = displayTasks
    .map(task => {
      const displayTitle = highlightMatch(task.title, compiled);
      const displayTag = highlightMatch(task.tag, compiled);
      const displayDuration = formatDuration(task.duration);

      return `
        <tr class="task-row">
          <td data-label="Task Title" class="font-medium">${displayTitle}</td>
          <td data-label="Tag"><span class="badge tag-${getBadgeColor(task.tag)}">${displayTag}</span></td>
          <td data-label="Due Date">${task.dueDate}</td>
          <td data-label="Duration">${displayDuration}</td>
          <td data-label="Actions" class="actions-cell">
            <button class="btn-sm btn-outline edit-btn" data-id="${task.id}" aria-label="Edit ${task.title}">Edit</button>
            <button class="btn-sm btn-danger delete-btn" data-id="${task.id}" aria-label="Delete ${task.title}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');

  tasksContainer.innerHTML = rowsHtml;

  // Attach row action listeners
  tasksContainer.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => startEditTask(btn.getAttribute('data-id')));
  });

  tasksContainer.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.getAttribute('data-id')));
  });
}

// Render summary stats and the 7-day trend chart
function renderStats() {
  const totalTasksEl = document.getElementById('statTotalTasks');
  const totalDurationEl = document.getElementById('statTotalDuration');
  const topTagEl = document.getElementById('statTopTag');
  const trendBarsEl = document.getElementById('trendBars');

  // Total count
  totalTasksEl.textContent = tasks.length;

  // Total duration (converted if hours selected)
  const totalMins = tasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);
  totalDurationEl.textContent = formatDuration(totalMins);

  // Top tag
  if (tasks.length === 0) {
    topTagEl.textContent = 'None';
  } else {
    const tagCounts = {};
    tasks.forEach(t => {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
    });
    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
    topTagEl.textContent = sortedTags[0] + ` (${tagCounts[sortedTags[0]]})`;
  }

  // 7-day trend chart (past 7 days including today)
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const dailyTotals = days.map(dateStr => {
    const sum = tasks
      .filter(t => t.dueDate === dateStr)
      .reduce((s, t) => s + (Number(t.duration) || 0), 0);
    return { date: dateStr, minutes: sum };
  });

  const maxDayMinutes = Math.max(...dailyTotals.map(d => d.minutes), 60);

  trendBarsEl.innerHTML = dailyTotals
    .map(d => {
      const heightPercent = Math.round((d.minutes / maxDayMinutes) * 100);
      const dayLabel = d.date.slice(5); // MM-DD
      return `
        <div class="chart-col" title="${d.date}: ${d.minutes} mins">
          <div class="bar-fill" style="height: ${Math.max(heightPercent, 4)}%"></div>
          <span class="bar-label">${dayLabel}</span>
        </div>
      `;
    })
    .join('');

  // Daily cap status and ARIA live announcement
  const todayStr = today.toISOString().split('T')[0];
  const todayMinutes = tasks
    .filter(t => t.dueDate === todayStr)
    .reduce((s, t) => s + (Number(t.duration) || 0), 0);

  const cap = Number(settings.dailyCap) || 180;
  if (todayMinutes > cap) {
    const over = todayMinutes - cap;
    capStatusAlert.setAttribute('aria-live', 'assertive');
    capStatusAlert.className = 'cap-alert cap-exceeded';
    capStatusAlert.textContent = `Warning: Today's planned workload (${todayMinutes}m) exceeds daily cap by ${over}m!`;
  } else {
    const remaining = cap - todayMinutes;
    capStatusAlert.setAttribute('aria-live', 'polite');
    capStatusAlert.className = 'cap-alert cap-ok';
    capStatusAlert.textContent = `Today: ${todayMinutes}m planned. ${remaining}m remaining under daily cap of ${cap}m.`;
  }
}

// Helper: Format duration based on timeUnit setting
function formatDuration(minutes) {
  const mins = Number(minutes) || 0;
  if (settings.timeUnit === 'hours') {
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} hrs`;
  }
  return `${mins} mins`;
}

// Helper: Map tags to color classes
function getBadgeColor(tag) {
  const clean = (tag || '').toLowerCase();
  if (clean.includes('academic') || clean.includes('study')) return 'blue';
  if (clean.includes('fit') || clean.includes('gym')) return 'green';
  if (clean.includes('club') || clean.includes('event')) return 'purple';
  if (clean.includes('career') || clean.includes('work')) return 'orange';
  return 'gray';
}

// Update sorting indicator icons in table header
function updateSortIndicators() {
  document.querySelectorAll('[data-sort]').forEach(th => {
    const field = th.getAttribute('data-sort');
    const icon = th.querySelector('.sort-icon');
    if (field === sortField) {
      icon.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
    } else {
      icon.textContent = ' ↕';
    }
  });
}

// Theme applier
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

// Handle JSON file import
function handleJsonImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    try {
      const parsed = JSON.parse(event.target.result);
      const validation = validateImportedTasks(parsed);

      if (!validation.valid) {
        alert('Import Error: ' + validation.message);
        return;
      }

      if (confirm(`Import ${parsed.length} tasks? This will merge with existing tasks.`)) {
        // Merge without duplicating existing IDs
        const existingIds = new Set(tasks.map(t => t.id));
        const newTasks = parsed.map((t, idx) => ({
          ...t,
          id: t.id && !existingIds.has(t.id) ? t.id : 'task_imp_' + Date.now() + '_' + idx,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        tasks = [...newTasks, ...tasks];
        saveTasks(tasks);
        renderApp();
        alert(`Successfully imported ${newTasks.length} tasks!`);
      }
    } catch (err) {
      alert('Invalid JSON file format. ' + err.message);
    }
    importFileInput.value = '';
  };

  reader.readAsText(file);
}

// Full re-render helper
function renderApp() {
  renderTasks();
  renderStats();
  updateSortIndicators();
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
