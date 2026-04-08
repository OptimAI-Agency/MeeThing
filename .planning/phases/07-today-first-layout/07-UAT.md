---
status: complete
phase: 07-today-first-layout
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md]
started: 2026-04-08T09:45:00Z
updated: 2026-04-09T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Today-first default view
expected: Open /calendar with no ?view param. Page shows only today's meetings. URL stays clean (no ?view= added).
result: issue
reported: "It says: 'Upcoming Meetings' - Your next 7 days of events, but I only have 1 event"
severity: major

### 2. Toggle to week view
expected: Click "This week" in the pill toggle. URL changes to ?view=week. The meeting list expands to show all meetings across the full 7-day range. The toggle visually highlights "This week".
result: issue
reported: "No, it's still the same"
severity: major

### 3. URL persistence on refresh
expected: While on ?view=week, refresh the page. The week view is still shown after refresh — ?view=week is preserved in the URL and the meeting list still shows 7 days.
result: blocked
blocked_by: prior-phase
reason: "Still the same — toggle not working so can't reach ?view=week state"

### 4. Toggle back to today
expected: Click "Today" in the toggle. URL goes back to clean /calendar (no ?view param). Meeting list returns to today-only view.
result: blocked
blocked_by: prior-phase
reason: "Toggle not working — can't reach week view to toggle back"

### 5. Browser back/forward
expected: Toggle to week view (?view=week), then click browser Back. Returns to today view. Click browser Forward — returns to week view. History navigation works correctly.
result: blocked
blocked_by: prior-phase
reason: "Toggle not working — can't test history navigation"

### 6. View-aware headers
expected: In today view, the heading reads "Today" with subheading "Your meetings for today". In week view, it changes to "This week" with subheading "Your next 7 days".
result: issue
reported: "It doesn't change, it's always 'Upcoming Meetings - Your next 7 days of events'"
severity: major

### 7. Today empty state week hint
expected: If you have no meetings today but do have meetings later this week — the today view shows an empty state. It should display something like "A spacious day" with a subtle hint like "You have X meetings later this week". (Skip with "n/a" if you have meetings today.)
result: issue
reported: "Still exactly the same, ref: 'Upcoming Meetings' - Your next 7 days of events ~ and nowhere can I see 'Today'?"
severity: major

## Summary

total: 7
passed: 0
issues: 4
pending: 0
skipped: 0
blocked: 3

## Gaps

- truth: "Default /calendar view shows only today's meetings with 'Today' heading and clean URL"
  status: failed
  reason: "User reported: It says: 'Upcoming Meetings' - Your next 7 days of events, but I only have 1 event"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "Pill toggle switches between today and week view, updating URL to ?view=week"
  status: failed
  reason: "User reported: No, it's still the same"
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: "View-aware headings change based on active view (Today / This week)"
  status: failed
  reason: "User reported: It doesn't change, it's always 'Upcoming Meetings - Your next 7 days of events'"
  severity: major
  test: 6
  artifacts: []
  missing: []

- truth: "Today empty state shows 'A spacious day' with week hint when no meetings today"
  status: failed
  reason: "User reported: Still exactly the same, nowhere can I see 'Today'"
  severity: major
  test: 7
  artifacts: []
  missing: []
