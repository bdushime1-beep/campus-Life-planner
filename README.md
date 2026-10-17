# Campus Life Planner

A responsive, accessible web application for university students to track daily study tasks, campus activities, deadlines, and time budgets.

**Live Demo (GitHub Pages):** [https://bdushime1-beep.github.io/campus-Life-planner/](https://bdushime1-beep.github.io/campus-Life-planner/)  
**Video Walkthrough (Demo):** [https://github.com/bdushime1-beep/campus-Life-planner/releases/download/v1.0.0/demo.mp4](https://github.com/bdushime1-beep/campus-Life-planner/releases/download/v1.0.0/demo.mp4)  
**Repository:** [https://github.com/bdushime1-beep/campus-Life-planner](https://github.com/bdushime1-beep/campus-Life-planner)  
**Author:** B. Dushime (`b.dushime1@alustudent.com`)

---

## Demo Video Walkthrough

A comprehensive video walkthrough demonstrating all rubric milestones:
* **Direct Video Link:** [Watch Demo Video (demo.mp4)](https://github.com/bdushime1-beep/campus-Life-planner/releases/download/v1.0.0/demo.mp4)
* **What is demonstrated:**
  1. Accessible skip link and keyboard navigation.
  2. Dark and light color theme toggle.
  3. Workload overview metrics and 7-day trend chart.
  4. Real-time regex search with `<mark>` match highlighting and safe syntax error handling.
  5. Category filter chips (`All`, `Academics`, `Fitness`, `Club`, `Career`).
  6. Task creation, inline editing, and deletion.
  7. Form regex validation (whitespace trimming, positive duration, and duplicate word detection).
  8. Settings configuration (duration units, daily study target cap, and JSON backup/restore).
  9. Mobile-first responsive card transformation.
  10. Automated test suite execution (`tests.html` 17/17 assertions passing).

---

## Chosen Theme & Overview

* **Theme:** Campus Life Planner
* **Target Audience:** College / university students managing academic deadlines and extracurricular schedules.
* **Architecture:** Vanilla HTML5, CSS3, and ES Modules. No external UI frameworks.

---

## Features

1. **Dashboard & Workload Stats**:
   * Total scheduled tasks counter.
   * Total planned time counter (with dynamic Minutes ↔ Hours conversion).
   * Most frequent task tag/category.
   * 7-day workload distribution trend bar chart.
   * Configurable daily workload cap with ARIA live feedback (`polite` when on target, `assertive` when exceeded).

2. **Scheduled Tasks Table & Mobile Cards**:
   * Desktop table view that automatically transforms into mobile-friendly stacked cards on screens < 600px.
   * Multi-column sorting: Due Date, Title (A-Z), and Duration (low to high).
   * Inline task editing and deletion with user confirmation.

3. **Live Regex Search & Highlighting**:
   * Interactive regex search bar with real-time `try/catch` error messaging.
   * Case-insensitive search toggle.
   * Accessible `<mark>` match highlighting.
   * Tag search syntax support (e.g. `^@tag:Academics`).

4. **Persistence & Data Portability**:
   * Automatic state persistence in `localStorage`.
   * Defensive JSON import with structural validation.
   * One-click JSON data export backup.
   * Built-in seed data loader.

5. **Theme Support**:
   * Dark and light mode toggle persisted in user settings.

---

## Regex Catalog

| Field / Purpose | Regular Expression | Description & Example Matches |
| :--- | :--- | :--- |
| **Title / Description** | `/^\S(?:.*\S)?$/` | Forbids leading or trailing spaces; requires at least one non-space character.<br>• *Matches:* `"Math Homework"`, `"Lab 2"`<br>• *Rejects:* `" Math"`, `"Done "` |
| **Numeric Duration** | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Positive integer or decimal up to 2 places in minutes.<br>• *Matches:* `"45"`, `"90.5"`<br>• *Rejects:* `"-10"`, `"abc"`, `"0"` |
| **Due Date** | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Enforces YYYY-MM-DD calendar date formatting.<br>• *Matches:* `"2026-10-25"`<br>• *Rejects:* `"25-10-2026"`, `"2026/10/25"` |
| **Tag / Category** | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Letters, single spaces, or hyphens for clean categorization.<br>• *Matches:* `"Academics"`, `"Study-Group"`<br>• *Rejects:* `"Study#1"`, `"Gym & Run"` |
| **Advanced Regex (Duplicate Words)** | `/\b(\w+)\s+\1\b/i` | Uses a capture group and back-reference `\1` to detect accidental consecutive duplicate words.<br>• *Catches:* `"Study study session"`, `"Review review notes"` |

---

## Accessibility (a11y) Notes

* **Landmarks:** Fully semantic HTML layout using `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>`.
* **Headings:** Single `<h1>` with sequential `<h2>` and `<h3>` hierarchy.
* **Skip Link:** Includes a keyboard-accessible `.skip-link` to jump directly to `#main-content`.
* **Focus States:** Custom visible `:focus-visible` rings on all interactive elements.
* **Labels & Errors:** Every form input has an associated `<label for="...">` and dynamic `aria-describedby` error span with `aria-live="polite"`.
* **Contrast:** Checked against WCAG AA standards in both light and dark themes.

---

## Keyboard Navigation Map

* <kbd>Tab</kbd>: Navigate through skip link, navigation links, search input, sort headers, and form fields.
* <kbd>Shift</kbd> + <kbd>Tab</kbd>: Navigate backward through interactive elements.
* <kbd>Enter</kbd> / <kbd>Space</kbd>: Trigger buttons, sort headers, and toggle checkboxes.
* <kbd>Esc</kbd>: Cancel active task edit mode.

---

## Running the Test Suite

1. Open `tests.html` directly in any modern web browser:
   * Double click `tests.html`, or
   * From the live app, click the **"Run Tests"** link in the navigation header.
2. The suite executes unit assertions against all regex rules and the safe regex compiler, displaying pass/fail badges in a clean report table.
