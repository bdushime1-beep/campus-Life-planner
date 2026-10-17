// Campus Life Planner - Main Application Logic
(function (global) {
  'use strict';

  // Dependency extraction from universal namespaces
  const { validateTask, validateField } = global.AppValidators || {};
  const { compileRegex, matchTask, highlightMatch } = global.AppSearch || {};
  const {
    loadTasks,
    saveTasks,
    loadSettings,
    saveSettings,
    exportTasksToJson,
    validateImportedTasks,
    DEFAULT_SEEDS
  } = global.AppStorage || {};

  // Application State
  let tasks = [];
  let settings = (loadSettings && loadSettings()) || { timeUnit: 'minutes', dailyCap: 240, theme: 'light' };
  let sortField = 'dueDate';
  let sortDirection = 'asc';
  let searchQuery = '';
  let activeTagFilter = 'all';
  let caseInsensitive = true;
  let editingTaskId = null;
  let currentTab = 'dashboard';

  // DOM Elements
  const taskForm = document.getElementById('taskForm');
  const formHeading = document.getElementById('formHeading');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const submitTaskBtn = document.getElementById('submitTaskBtn');
  const tasksContainer = document.getElementById('tasksContainer');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const searchError = document.getElementById('searchError');
  const searchMatchBadge = document.getElementById('searchMatchBadge');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const caseToggle = document.getElementById('caseToggle');
  const timeUnitSelect = document.getElementById('timeUnitSelect');
  const dailyCapInput = document.getElementById('dailyCapInput');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importFileInput = document.getElementById('importFileInput');
  const loadSeedBtn = document.getElementById('loadSeedBtn');
  const capStatusAlert = document.getElementById('capStatusAlert');

  // Immediately apply theme to root
  applyTheme(settings.theme);

  // Tab View Switching
  function switchTab(tabId) {
    currentTab = tabId;
    const allSections = ['dashboard', 'tasks', 'add-task', 'settings', 'about'];
    const navButtons = document.querySelectorAll('.site-nav [data-tab]');

    navButtons.forEach(btn => {
      const id = btn.getAttribute('data-tab');
      if (id === tabId) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    if (tabId === 'all') {
      allSections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.hidden = false;
      });
      return;
    }

    allSections.forEach(id => {
      const sec = document.getElementById(id);
      if (sec) {
        sec.hidden = id !== tabId;
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // App Initialization
  function init() {
    applyTheme(settings.theme);

    // Load tasks (auto populates with DEFAULT_SEEDS if storage was empty)
    tasks = (loadTasks && loadTasks()) || (DEFAULT_SEEDS ? [...DEFAULT_SEEDS] : []);

    // Sync input controls with loaded settings
    if (timeUnitSelect) timeUnitSelect.value = settings.timeUnit;
    if (dailyCapInput) dailyCapInput.value = settings.dailyCap;

    bindEvents();

    // Route view from hash if present, otherwise default to overview
    const hash = (window.location.hash || '').replace('#', '');
    if (['dashboard', 'tasks', 'add-task', 'settings', 'about', 'all'].includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('dashboard');
    }

    renderApp();
  }

  // Event Listeners Binding
  function bindEvents() {
    // Navigation Tab Clicks
    document.querySelectorAll('.site-nav [data-tab]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
        window.location.hash = '#' + tab;
      });
    });

    // Real-time Field Validation
    ['title', 'duration', 'dueDate', 'tag'].forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        input.addEventListener('input', () => {
          const err = validateField ? validateField(field, input.value) : '';
          setFieldError(field, err);
        });
      }
    });

    // Form Submit
    if (taskForm) {
      taskForm.addEventListener('submit', handleFormSubmit);
    }

    // Cancel Edit
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', resetForm);
    }

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderTasks();
      });
    }

    // Clear Search
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        renderTasks();
        searchInput?.focus();
      });
    }

    // Category Filter Chips
    document.querySelectorAll('[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeTagFilter = chip.getAttribute('data-filter') || 'all';
        renderTasks();
      });
    });

    // Case Sensitive Toggle
    if (caseToggle) {
      caseToggle.addEventListener('change', e => {
        caseInsensitive = e.target.checked;
        renderTasks();
      });
    }

    // Table Header Sorting
    document.querySelectorAll('[data-sort]').forEach(header => {
      header.addEventListener('click', () => {
        const field = header.getAttribute('data-sort');
        if (sortField === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortDirection = 'asc';
        }
        updateSortIcons();
        renderTasks();
      });
    });

    // Settings: Unit Toggle
    if (timeUnitSelect) {
      timeUnitSelect.addEventListener('change', e => {
        settings.timeUnit = e.target.value;
        saveSettings(settings);
        renderApp();
      });
    }

    // Settings: Daily Cap Input
    if (dailyCapInput) {
      dailyCapInput.addEventListener('change', e => {
        const val = Number(e.target.value);
        if (val > 0) {
          settings.dailyCap = val;
          saveSettings(settings);
          renderStats();
        }
      });
    }

    // Settings: Theme Toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
        saveSettings(settings);
        applyTheme(settings.theme);
      });
    }

    // Settings: Export JSON
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        exportTasksToJson(tasks);
      });
    }

    // Settings: Import JSON
    if (importFileInput) {
      importFileInput.addEventListener('change', handleImport);
    }

    // Settings: Reset Seed Data
    if (loadSeedBtn) {
      loadSeedBtn.addEventListener('click', () => {
        if (confirm('Reset planner tasks to original campus seed data?')) {
          tasks = DEFAULT_SEEDS ? [...DEFAULT_SEEDS] : [];
          saveTasks(tasks);
          renderApp();
        }
      });
    }
  }

  // Handle Form Submission
  function handleFormSubmit(e) {
    e.preventDefault();

    const titleInput = document.getElementById('title');
    const durationInput = document.getElementById('duration');
    const dateInput = document.getElementById('dueDate');
    const tagInput = document.getElementById('tag');

    const taskData = {
      title: titleInput ? titleInput.value : '',
      duration: durationInput ? Number(durationInput.value) : 0,
      dueDate: dateInput ? dateInput.value : '',
      tag: tagInput ? tagInput.value : ''
    };

    const validation = validateTask ? validateTask(taskData) : { isValid: true, errors: {} };
    if (!validation.isValid) {
      Object.keys(validation.errors).forEach(f => setFieldError(f, validation.errors[f]));
      return;
    }

    const now = new Date().toISOString();

    if (editingTaskId) {
      tasks = tasks.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            title: taskData.title.trim(),
            duration: taskData.duration,
            dueDate: taskData.dueDate,
            tag: taskData.tag.trim(),
            updatedAt: now
          };
        }
        return t;
      });
    } else {
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: taskData.title.trim(),
        duration: taskData.duration,
        dueDate: taskData.dueDate,
        tag: taskData.tag.trim(),
        createdAt: now,
        updatedAt: now
      };
      tasks.unshift(newTask);
    }

    saveTasks(tasks);
    resetForm();
    renderApp();

    switchTab('tasks');
    window.location.hash = '#tasks';
  }

  // Validation Error Display
  function setFieldError(field, msg) {
    const errEl = document.getElementById(field + 'Error');
    const inputEl = document.getElementById(field);
    if (errEl) errEl.textContent = msg || '';
    if (inputEl) {
      if (msg) {
        inputEl.setAttribute('aria-invalid', 'true');
      } else {
        inputEl.removeAttribute('aria-invalid');
      }
    }
  }

  function clearAllErrors() {
    ['title', 'duration', 'dueDate', 'tag'].forEach(f => setFieldError(f, ''));
  }

  function resetForm() {
    editingTaskId = null;
    if (taskForm) taskForm.reset();
    clearAllErrors();
    if (formHeading) formHeading.textContent = 'Add New Task';
    if (submitTaskBtn) submitTaskBtn.textContent = 'Save Task';
    if (cancelEditBtn) cancelEditBtn.hidden = true;
  }

  function startEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('title').value = task.title;
    document.getElementById('duration').value = task.duration;
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('tag').value = task.tag;

    clearAllErrors();
    if (formHeading) formHeading.textContent = 'Edit Task';
    if (submitTaskBtn) submitTaskBtn.textContent = 'Update Task';
    if (cancelEditBtn) cancelEditBtn.hidden = false;

    switchTab('add-task');
    window.location.hash = '#add-task';
    document.getElementById('title')?.focus();
  }

  function removeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (confirm(`Delete "${task.title}"?`)) {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks(tasks);
      if (editingTaskId === id) resetForm();
      renderApp();
    }
  }

  // Duration Formatter
  function formatDuration(mins) {
    const m = Number(mins) || 0;
    if (settings.timeUnit === 'hours') {
      const h = (m / 60).toFixed(1);
      return `${h} hrs`;
    }
    return `${m} mins`;
  }

  // Date Formatter
  function formatDate(dStr) {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dStr;
    }
  }

  // Tag Styling Helper
  function getTagColorClass(tag) {
    const c = (tag || '').toLowerCase();
    if (c.includes('acad') || c.includes('study')) return 'tag-blue';
    if (c.includes('fit') || c.includes('gym')) return 'tag-green';
    if (c.includes('club') || c.includes('event')) return 'tag-purple';
    if (c.includes('career') || c.includes('work')) return 'tag-orange';
    return 'tag-gray';
  }

  // Filter & Sort Pipeline
  function getFilteredTasks() {
    let list = [...tasks];

    // 1. Tag Chip Filter
    if (activeTagFilter !== 'all') {
      list = list.filter(t => (t.tag || '').toLowerCase() === activeTagFilter.toLowerCase());
    }

    // 2. Search / Regex Filter
    if (searchQuery.trim()) {
      const compiled = compileRegex ? compileRegex(searchQuery, caseInsensitive) : null;
      if (compiled && compiled.error) {
        if (searchError) searchError.textContent = `Regex Error: ${compiled.error}`;
        return [];
      } else {
        if (searchError) searchError.textContent = '';
      }

      if (compiled) {
        list = list.filter(t => (matchTask ? matchTask(t, compiled, searchQuery) : true));
      }
    } else {
      if (searchError) searchError.textContent = '';
    }

    // 3. Sorting
    list.sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];

      if (sortField === 'duration') {
        vA = Number(vA) || 0;
        vB = Number(vB) || 0;
      } else {
        vA = String(vA || '').toLowerCase();
        vB = String(vB || '').toLowerCase();
      }

      if (vA < vB) return sortDirection === 'asc' ? -1 : 1;
      if (vA > vB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  // Render Table / Cards
  function renderTasks() {
    if (!tasksContainer) return;

    const filtered = getFilteredTasks();
    const compiled = searchQuery.trim() && compileRegex ? compileRegex(searchQuery, caseInsensitive) : null;
    const isRegexValid = compiled && !compiled.error;

    // Update match count badge
    if (searchMatchBadge) {
      if (searchQuery.trim() || activeTagFilter !== 'all') {
        searchMatchBadge.textContent = `${filtered.length} of ${tasks.length} tasks`;
      } else {
        searchMatchBadge.textContent = `${tasks.length} tasks`;
      }
    }

    if (filtered.length === 0) {
      tasksContainer.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    tasksContainer.innerHTML = filtered
      .map(task => {
        const safeTitle = isRegexValid && highlightMatch ? highlightMatch(task.title, compiled) : escapeHtml(task.title);
        const safeTag = isRegexValid && highlightMatch ? highlightMatch(task.tag, compiled) : escapeHtml(task.tag);
        const safeDate = formatDate(task.dueDate);
        const safeDuration = formatDuration(task.duration);
        const tagClass = getTagColorClass(task.tag);

        return `
          <tr class="task-row" data-id="${task.id}">
            <td data-label="Task Description" style="font-weight: 600;">${safeTitle}</td>
            <td data-label="Category"><span class="badge ${tagClass}">${safeTag}</span></td>
            <td data-label="Due Date">${safeDate}</td>
            <td data-label="Duration">${safeDuration}</td>
            <td data-label="Actions" class="actions-cell" style="text-align: right;">
              <button type="button" class="btn btn-sm btn-outline edit-btn" data-id="${task.id}" aria-label="Edit task ${task.title}">Edit</button>
              <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${task.id}" aria-label="Delete task ${task.title}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach row events
    tasksContainer.querySelectorAll('.edit-btn').forEach(b => {
      b.addEventListener('click', () => startEdit(b.getAttribute('data-id')));
    });

    tasksContainer.querySelectorAll('.delete-btn').forEach(b => {
      b.addEventListener('click', () => removeTask(b.getAttribute('data-id')));
    });
  }

  // HTML Escape Utility
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Render Stats & Trend Chart
  function renderStats() {
    const totalTasksEl = document.getElementById('statTotalTasks');
    const totalDurationEl = document.getElementById('statTotalDuration');
    const topTagEl = document.getElementById('statTopTag');
    const trendBarsEl = document.getElementById('trendBars');

    if (!totalTasksEl || !totalDurationEl || !topTagEl) return;

    const totalCount = tasks.length;
    const totalMins = tasks.reduce((sum, t) => sum + (Number(t.duration) || 0), 0);

    totalTasksEl.textContent = totalCount;
    totalDurationEl.textContent = formatDuration(totalMins);

    // Primary Category calculation
    const tagCounts = {};
    tasks.forEach(t => {
      const tg = t.tag || 'General';
      tagCounts[tg] = (tagCounts[tg] || 0) + 1;
    });

    let topTag = 'None';
    let max = 0;
    Object.keys(tagCounts).forEach(tg => {
      if (tagCounts[tg] > max) {
        max = tagCounts[tg];
        topTag = tg;
      }
    });
    topTagEl.textContent = totalCount > 0 ? `${topTag} (${max})` : 'None';

    // 7-Day Trend Bars
    if (trendBarsEl) {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }

      const dayMins = {};
      days.forEach(d => (dayMins[d] = 0));

      tasks.forEach(t => {
        if (t.dueDate && dayMins[t.dueDate] !== undefined) {
          dayMins[t.dueDate] += Number(t.duration) || 0;
        }
      });

      const maxDay = Math.max(...Object.values(dayMins), 60);

      trendBarsEl.innerHTML = days
        .map(dayStr => {
          const m = dayMins[dayStr] || 0;
          const pct = Math.round((m / maxDay) * 100);
          const label = new Date(dayStr).toLocaleDateString(undefined, { weekday: 'narrow' });

          return `
            <div class="chart-col" title="${dayStr}: ${m} mins planned">
              <div class="bar-fill" style="height: ${Math.max(pct, 4)}%;"></div>
              <span class="bar-label">${label}</span>
            </div>
          `;
        })
        .join('');
    }

    // Daily Cap Status Check
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMins = tasks
      .filter(t => t.dueDate === todayStr)
      .reduce((sum, t) => sum + (Number(t.duration) || 0), 0);

    if (capStatusAlert) {
      const cap = Number(settings.dailyCap) || 240;
      if (todayMins > cap) {
        capStatusAlert.className = 'cap-status cap-exceeded';
        capStatusAlert.innerHTML = `⚠️ <strong>Daily Target Exceeded:</strong> Today has ${formatDuration(todayMins)} scheduled, which exceeds your target limit of ${formatDuration(cap)}.`;
      } else {
        capStatusAlert.className = 'cap-status cap-ok';
        capStatusAlert.innerHTML = `✓ <strong>Daily Schedule on Track:</strong> Today has ${formatDuration(todayMins)} scheduled (Target limit: ${formatDuration(cap)}).`;
      }
    }
  }

  // Sort Icons Update
  function updateSortIcons() {
    document.querySelectorAll('[data-sort]').forEach(header => {
      const f = header.getAttribute('data-sort');
      const icon = header.querySelector('.sort-icon');
      if (!icon) return;
      if (f === sortField) {
        icon.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
      } else {
        icon.textContent = ' ↕';
      }
    });
  }

  // Theme Applier
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  // JSON Import Handler
  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const val = validateImportedTasks ? validateImportedTasks(parsed) : { valid: true };

        if (!val.valid) {
          alert('Import Error: ' + val.message);
          return;
        }

        if (confirm(`Import ${parsed.length} tasks from file?`)) {
          const existingIds = new Set(tasks.map(t => t.id));
          const newItems = parsed.map((t, i) => ({
            ...t,
            id: t.id && !existingIds.has(t.id) ? t.id : 'task_imp_' + Date.now() + '_' + i,
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          tasks = [...newItems, ...tasks];
          saveTasks(tasks);
          renderApp();
          alert(`Successfully imported ${newItems.length} tasks.`);
        }
      } catch (err) {
        alert('Invalid JSON file format: ' + err.message);
      }
      importFileInput.value = '';
    };

    reader.readAsText(file);
  }

  // Master Render
  function renderApp() {
    renderTasks();
    renderStats();
    updateSortIcons();
  }

  // Public Interface on window.App
  global.App = {
    init,
    switchTab,
    renderApp
  };

  // Safe DOM ready execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
