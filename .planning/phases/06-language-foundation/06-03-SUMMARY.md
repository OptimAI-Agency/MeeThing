---
phase: 06-language-foundation
plan: 03
subsystem: copy
tags: [copy, audit, landing, sweep, glossary]
dependency_graph:
  requires: [06-01, 06-02]
  provides: [.planning/phases/06-language-foundation/06-03-AUDIT.md, docs/copy-glossary.md#flagged]
  affects: [src/components/Hero.tsx, src/components/Features.tsx, docs/copy-glossary.md]
tech_stack:
  added: []
  patterns: [inline-literal-for-isolated-marketing-copy, audit-doc-pattern]
key_files:
  created:
    - .planning/phases/06-language-foundation/06-03-AUDIT.md
  modified:
    - src/components/Hero.tsx
    - src/components/Features.tsx
    - docs/copy-glossary.md
decisions:
  - "Used inline literal 'Your Calendar' in Hero.tsx and Features.tsx (not glossary import) — these are isolated marketing cards that will never reuse these strings, so a glossary key would add overhead with no benefit"
  - "Features.tsx remaining 5 cards left unchanged and flagged — no locked decisions exist for these marketing strings; Phase 9 owns copywriting"
  - "18 borderline strings documented in audit and flagged to Phase 7/8/9 — none replaced without a locked decision (D-12 rule)"
  - "SettingsHeader.tsx and CalendarConnections.tsx violations were already fixed by Plan 02 (commits e6b54c8 and b9b88bc) before this plan ran"
metrics:
  duration_seconds: 900
  completed_date: "2026-04-07T04:00:00Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 3
---

# Phase 6 Plan 03: D-12 Full-Sweep Audit Summary

**One-liner:** Landing-page "Calendar Integration" replaced with "Your Calendar" (D-01), plus a 27-file full-sweep audit documenting 18 flagged borderline strings for Phase 7/8/9 reviewers.

## What Was Built

### Task 1 — Landing page violations fixed

Two isolated marketing components updated with direct literal replacements (no glossary import — per plan design):

**`src/components/Hero.tsx`** (feature card, line ~37):
- Before: `Calendar Integration` / `Seamlessly connect with your existing calendar apps`
- After: `Your Calendar` / `A calmer view of your week, synced from your existing calendar`

**`src/components/Features.tsx`** (first feature entry):
- Before: title `"Calendar Integration"`, description `"Connect with Google Calendar, Outlook, and other popular calendar applications to automatically analyze your meeting schedule."`, badge `"Core Feature"`
- After: title `"Your Calendar"`, description `"Connect Google Calendar to see your meetings in a calmer, more human way."`, badge `"Core"`

### Task 2 — D-12 full-sweep audit

**`.planning/phases/06-language-foundation/06-03-AUDIT.md`** — 27 files across `src/components/` and `src/pages/` reviewed:
- 8 files: swept in Plans 01/02/03 (COPY constants or Task 1 replacements)
- 6 files: clean (no forbidden terms, no borderline items)
- 5 files: has-flags (borderline strings documented, not changed)
- 8 page files: clean (auth pages use standard form labels)

**`docs/copy-glossary.md`** — "Flagged for reviewer judgment" section populated (was a placeholder). Now contains 18 flagged strings with file, line, current value, reason, and suggested downstream phase.

## Total counts

- Files audited: 27
- Borderline items flagged: 18
- Forbidden-term grep result: **CLEAN** (0 user-facing hits)
- Strings replaced in this plan: 4 (Hero title, Hero description, Features title, Features description/badge)

## Forbidden-term grep final result

```
grep -rnE '(Dashboard|Calendar Integration|Calendar Settings|Calendar Connections|"Sync now"|Syncing…|"Synced"|"Alerts"|Let.{1,3}s get you connected|Your schedule is clear)' src/components src/pages
```

Result: **CLEAN** — zero hits in user-facing code.

The only regex matches in the full `src/` tree are in `src/copy/glossary.ts` lines 8–9 (code comments documenting deprecated → replacement history). Per plan rules, comment/identifier references are excluded from the prohibition.

## Deviations from Plan

### Auto-fixed Issues

None triggered by this plan's tasks.

### Discovery: Plan 02 already executed

The audit table in the plan spec listed SettingsHeader.tsx and CalendarConnections.tsx as "swept in Plan 02" — this was accurate. Plan 02 commits `e6b54c8` and `b9b88bc` had already replaced "Calendar Settings", "Calendar Connections", and "Welcome! Let's get you connected" with COPY constants before this plan ran. The pre-task grep scan confirmed this; no additional fixes were needed in those files.

The audit doc accurately records these files as `swept` (Plan 02) rather than claiming Plan 03 fixed them.

### Audit scope expansion

The plan's audit table seed included 19 rows. This plan audited 27 files total (added: MinimalHero.tsx, Header.tsx, Footer.tsx, MinimalFooter.tsx, CalendarHub.tsx context review, wellness/ components). All added files classified appropriately.

### Flagged table additions beyond the 7 seed rows

The plan specified a minimum of 7 seed rows for the flagged table. This plan added 11 additional items beyond the seed (total 18), discovered during file-by-file review:

- Features.tsx "Wellness Tracking" card (gamification "score" language)
- MeetingsList.tsx "Upcoming Meetings" and "Your next 7 days of events"
- MeetingsList.tsx hardcoded "Wellness Tip" text
- SyncSettings.tsx heading and description
- NotificationSettings.tsx "alerts" in prose
- WellnessSection.tsx "Wellness Integration" heading
- AuthCallback.tsx OAuth toast strings

These are flagged, not replaced, consistent with D-12's rule against rewriting without locked decisions.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 1fdf823 | feat(06-03): replace Calendar Integration with Your Calendar on landing page |
| Task 2 | a290f29 | feat(06-03): write D-12 full-sweep audit and populate glossary flagged section |

## Known Stubs

None. This plan creates documentation and replaces isolated string literals. No data sources, no UI rendering paths introduced.

## Self-Check: PASSED
