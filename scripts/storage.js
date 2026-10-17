// Campus Life Planner - Storage & JSON Backup Manager
(function (global) {
  'use strict';

  const TASKS_KEY = 'campus_planner_tasks';
  const SETTINGS_KEY = 'campus_planner_settings';

  const DEFAULT_SEEDS = [
    { id: 'task_seed_01', title: 'Computer Science Problem Set 3', duration: 120, dueDate: '2026-10-17', tag: 'Academics', createdAt: '2026-10-15T09:00:00.000Z', updatedAt: '2026-10-15T09:00:00.000Z' },
    { id: 'task_seed_02', title: 'Morning Gym Cardio Session', duration: 45, dueDate: '2026-10-17', tag: 'Fitness', createdAt: '2026-10-16T07:30:00.000Z', updatedAt: '2026-10-16T07:30:00.000Z' },
    { id: 'task_seed_03', title: 'Robotics Club Weekly Sprint', duration: 90, dueDate: '2026-10-18', tag: 'Club', createdAt: '2026-10-14T14:15:00.000Z', updatedAt: '2026-10-14T14:15:00.000Z' },
    { id: 'task_seed_04', title: 'Campus Library Research Reading', duration: 60, dueDate: '2026-10-18', tag: 'Academics', createdAt: '2026-10-16T11:00:00.000Z', updatedAt: '2026-10-16T11:00:00.000Z' },
    { id: 'task_seed_05', title: 'Resume Review with Career Advisor', duration: 30, dueDate: '2026-10-19', tag: 'Career', createdAt: '2026-10-15T16:45:00.000Z', updatedAt: '2026-10-15T16:45:00.000Z' },
    { id: 'task_seed_06', title: 'Data Structures Midterm Prep', duration: 150, dueDate: '2026-10-19', tag: 'Academics', createdAt: '2026-10-13T10:20:00.000Z', updatedAt: '2026-10-13T10:20:00.000Z' },
    { id: 'task_seed_07', title: 'Intramural Basketball Match', duration: 75, dueDate: '2026-10-20', tag: 'Fitness', createdAt: '2026-10-16T18:00:00.000Z', updatedAt: '2026-10-16T18:00:00.000Z' },
    { id: 'task_seed_08', title: 'Student Union Budget Meeting', duration: 60, dueDate: '2026-10-21', tag: 'Club', createdAt: '2026-10-14T15:30:00.000Z', updatedAt: '2026-10-14T15:30:00.000Z' },
    { id: 'task_seed_09', title: 'Web Development Final Project Polish', duration: 180, dueDate: '2026-10-22', tag: 'Academics', createdAt: '2026-10-15T20:00:00.000Z', updatedAt: '2026-10-15T20:00:00.000Z' },
    { id: 'task_seed_10', title: 'Campus Peer Mentoring Session', duration: 45, dueDate: '2026-10-23', tag: 'Career', createdAt: '2026-10-16T13:00:00.000Z', updatedAt: '2026-10-16T13:00:00.000Z' }
  ];

  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      saveTasks(DEFAULT_SEEDS);
      return DEFAULT_SEEDS;
    } catch {
      return DEFAULT_SEEDS;
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      return true;
    } catch {
      return false;
    }
  }

  function loadSettings() {
    const defaults = {
      timeUnit: 'minutes',
      dailyCap: 240,
      theme: 'light'
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch {
      return false;
    }
  }

  function exportTasksToJson(tasks) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `campus-planner-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function validateImportedTasks(data) {
    if (!Array.isArray(data)) {
      return { valid: false, message: 'JSON root must be an array of task objects.' };
    }
    if (data.length === 0) {
      return { valid: false, message: 'JSON array is empty.' };
    }
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

  function clearAllStoredTasks() {
    try {
      localStorage.removeItem(TASKS_KEY);
    } catch {}
  }

  const moduleExports = {
    DEFAULT_SEEDS,
    loadTasks,
    saveTasks,
    loadSettings,
    saveSettings,
    exportTasksToJson,
    validateImportedTasks,
    clearAllStoredTasks
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = moduleExports;
  }
  global.AppStorage = moduleExports;
})(typeof window !== 'undefined' ? window : globalThis);