---
phase: 4
slug: wellness-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — per CLAUDE.md, linting is the only automated check |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Build must succeed + manual visual verification of all states
- **Max feedback latency:** ~10 seconds (lint + build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | WEL-01 | lint | `npm run lint` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | WEL-01 | lint | `npm run lint` | ✅ | ⬜ pending |
| 4-01-03 | 01 | 1 | WEL-01 | lint | `npm run lint` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 2 | WEL-02 | lint | `npm run lint` | ✅ | ⬜ pending |
| 4-02-02 | 02 | 2 | POL-01, POL-02 | lint + build | `npm run lint && npm run build` | ✅ | ⬜ pending |
| 4-02-03 | 02 | 2 | POL-01, POL-02 | lint + build | `npm run lint && npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure required. Project has no test framework per CLAUDE.md.

*Existing infrastructure covers all automated verification needs (lint + build).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Breathing overlay triggers at configured time | WEL-01 SC-1 | Requires real-time browser session with live meetings data | Enable breathing reminders, set to 5 min, open app with a meeting ~5 min away, verify overlay appears |
| Breathing overlay dismissible via ESC + button | WEL-01 SC-3 | UI interaction | Open overlay, verify ESC and Dismiss button both close it |
| Back-to-back warning shows between gapless meetings | WEL-02 SC-2 | Requires calendar data with consecutive meetings | Verify amber connector visible between meetings with ≤5 min gap |
| Missed reminder banner shows on tab refocus | WEL-01 SC-5 | Requires backgrounding tab during reminder window | Background tab during trigger window, return, verify banner (not full overlay) |
| All loading states visible | POL-01 SC-4 | Requires slow network simulation | Throttle network in DevTools, refresh app, verify skeletons on meetings + connections |
| Empty state (no calendars) shows CTA | POL-02 SC-4 | Requires disconnected calendar | Disconnect Google Calendar, verify empty state with connect CTA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
