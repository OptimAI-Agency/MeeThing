---
phase: 06-language-foundation
plan: 01
subsystem: copy
tags: [copy, glossary, language, constants, foundation]
dependency_graph:
  requires: []
  provides: [src/copy/glossary.ts, docs/copy-glossary.md]
  affects: [src/components/calendar/CalendarHub.tsx, src/components/calendar/EmptyStates.tsx, src/components/calendar/settings/SettingsHeader.tsx, src/components/calendar/CalendarConnections.tsx]
tech_stack:
  added: []
  patterns: [frozen-as-const-constants, single-source-of-truth-copy]
key_files:
  created:
    - src/copy/glossary.ts
    - docs/copy-glossary.md
  modified: []
decisions:
  - "Used as const (not Object.freeze) for compile-time readonly enforcement with zero runtime overhead"
  - "Exported both COPY and type Copy so consumers get compile-time key checking"
  - "noMeetingsBody uses 'Nothing on the books today. Enjoy the quiet.' (D-09 canonical form)"
metrics:
  duration_seconds: 342
  completed_date: "2026-04-07T02:18:33Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 6 Plan 01: Copy Glossary Foundation Summary

**One-liner:** Frozen `COPY` constant module with all v2.0 user-facing strings mapped to decisions D-01..D-10, plus human-readable deprecated→replacement mirror doc.

## What Was Built

Two files form the copy foundation for all Phase 6–11 text-bearing work:

1. **`src/copy/glossary.ts`** — TypeScript `as const` object with 7 top-level sections and 29 leaf keys. No imports. Exports `COPY` and `type Copy`. Every decision-traced key carries a `// D-xx` comment.

2. **`docs/copy-glossary.md`** — Human-readable mirror with voice principles, deprecated→replacement table (12 rows), key mapping table (21 entries), usage guide, and forbidden vocabulary list.

## COPY Key Tree

```
COPY
├── nav
│   ├── calendar          "Your Calendar"                                     D-01
│   ├── settings          "Your Settings"                                     D-02
│   └── connections       "Your Calendars"                                    D-03
├── welcome
│   ├── heading           "Your Calendar"                                     D-01
│   ├── subheading        "A calmer view of your week. Connect your calendar to begin."  D-04, D-10
│   └── cta               "Connect your calendar"
├── sync
│   ├── iconAriaLabel     "Refresh your calendar"                             D-05, D-07
│   ├── successTitle      "All caught up"                                     D-06
│   ├── successBody       "Your day is up to date."                           D-06
│   ├── errorTitle        "Couldn't reach your calendar"                      D-08
│   ├── errorBody         "Try again in a moment."                            D-08
│   ├── sessionExpiredTitle "Reconnect to continue"                           D-08 tone
│   ├── sessionExpiredBody  "Your Google Calendar needs to reconnect — just a moment."
│   └── sessionExpiredAction "Reconnect"
├── empty
│   ├── noMeetingsTitle   "A spacious day"                                    D-09
│   ├── noMeetingsBody    "Nothing on the books today. Enjoy the quiet."      D-09
│   ├── noConnectionTitle "A calmer view of your week starts here"            D-10
│   └── noConnectionBody  "Connect your calendar to begin."                  D-10
├── errors
│   ├── meetingsLoadTitle "Couldn't refresh your calendar"                    D-08 tone
│   ├── meetingsLoadBody  "Try again in a moment."
│   └── retry             "Try again"
├── settings
│   ├── heading           "Your Settings"                                     D-02
│   └── subheading        "Shape your calendar around the way you want to feel."
└── disconnect
    ├── confirmTitle      "Disconnect your calendar?"
    ├── confirmBody       "This removes synced meetings from MeeThing. You can reconnect anytime."
    ├── confirmCta        "Disconnect"
    ├── cancel            "Cancel"
    ├── successTitle      "Your calendar is disconnected"
    ├── successBody       "Synced meetings have been cleared."
    ├── errorTitle        "Couldn't disconnect"
    └── errorBody         "Try again in a moment."
```

## Decision ID → Key Mapping

| Decision | Key(s) |
|----------|--------|
| D-01 | `COPY.nav.calendar`, `COPY.welcome.heading` |
| D-02 | `COPY.nav.settings`, `COPY.settings.heading` |
| D-03 | `COPY.nav.connections` |
| D-04 | `COPY.welcome.subheading` |
| D-05 | `COPY.sync.iconAriaLabel` |
| D-06 | `COPY.sync.successTitle`, `COPY.sync.successBody` |
| D-07 | `COPY.sync.iconAriaLabel` (no visible label in-flight) |
| D-08 | `COPY.sync.errorTitle`, `COPY.sync.errorBody`, `COPY.sync.sessionExpiredTitle`, `COPY.errors.meetingsLoadTitle` |
| D-09 | `COPY.empty.noMeetingsTitle`, `COPY.empty.noMeetingsBody` |
| D-10 | `COPY.welcome.subheading`, `COPY.empty.noConnectionTitle`, `COPY.empty.noConnectionBody` |

## Discretion Choices Beyond D-01..D-10

| Key | Value | Rationale |
|-----|-------|-----------|
| `COPY.welcome.cta` | "Connect your calendar" | Softened from imperative "Connect Google Calendar"; functional but calm |
| `COPY.settings.subheading` | "Shape your calendar around the way you want to feel." | Calm-voice filler matching D-04 wellness tone; no locked decision |
| `COPY.sync.sessionExpiredBody` | "Your Google Calendar needs to reconnect — just a moment." | D-08 tone applied to auth-expiry edge case |
| `COPY.sync.sessionExpiredAction` | "Reconnect" | Minimal imperative; mirrors D-10 calm-first pattern |
| `COPY.disconnect.*` (all 8 keys) | See tree above | No locked decision; followed D-08 low-urgency pattern throughout |
| `COPY.errors.retry` | "Try again" | Minimal, consistent with D-08 low-stakes framing |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 275912d | feat(06-01): create frozen COPY constant module |
| Task 2 | 5146fad | docs(06-01): create human-readable copy glossary mirror |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. This plan creates constants only — no UI rendering, no data sources.

## Self-Check: PASSED

- `src/copy/glossary.ts` exists: FOUND
- `docs/copy-glossary.md` exists: FOUND
- commit 275912d: FOUND
- commit 5146fad: FOUND
- `npm run lint` exits 0 (0 errors, 10 pre-existing warnings in unrelated files)
- `npx tsc --noEmit` exits 0
- `npm run build` succeeds
