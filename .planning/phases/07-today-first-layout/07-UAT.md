---
status: testing
phase: 07-today-first-layout
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-04-08T09:45:00Z
updated: 2026-04-08T09:45:00Z
---

## Current Test

number: 1
name: Today-first default view
expected: |
  Open http://localhost:8080/calendar with no ?view param in the URL.
  The page should show only today's meetings (not a full 7-day list).
  The URL stays clean — no ?view= parameter is added.
awaiting: user response

## Tests

### 1. Today-first default view
expected: Open /calendar with no ?view param. Page shows only today's meetings. URL stays clean (no ?view= added).
result: [pending]

### 2. Toggle to week view
expected: Click "This week" in the pill toggle. URL changes to ?view=week. The meeting list expands to show all meetings across the full 7-day range. The toggle visually highlights "This week".
result: [pending]

### 3. URL persistence on refresh
expected: While on ?view=week, refresh the page. The week view is still shown after refresh — ?view=week is preserved in the URL and the meeting list still shows 7 days.
result: [pending]

### 4. Toggle back to today
expected: Click "Today" in the toggle. URL goes back to clean /calendar (no ?view param). Meeting list returns to today-only view.
result: [pending]

### 5. Browser back/forward
expected: Toggle to week view (?view=week), then click browser Back. Returns to today view. Click browser Forward — returns to week view. History navigation works correctly.
result: [pending]

### 6. View-aware headers
expected: In today view, the heading reads "Today" with subheading "Your meetings for today". In week view, it changes to "This week" with subheading "Your next 7 days".
result: [pending]

### 7. Today empty state week hint
expected: If you have no meetings today but do have meetings later this week — the today view shows an empty state. It should display something like "A spacious day" with a subtle hint like "You have X meetings later this week". (Skip with "n/a" if you have meetings today.)
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
