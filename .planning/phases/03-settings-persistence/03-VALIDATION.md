---
phase: 3
slug: settings-persistence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — linting is the only automated quality check (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint`
- **Before `/gsd:verify-work`:** Lint green + manual verification of all 3 success criteria
- **Max feedback latency:** ~5 seconds (lint)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | SET-01, SET-02 | lint | `npm run lint` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | SET-01, SET-02 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 3-01-03 | 01 | 1 | SET-01 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 3-01-04 | 01 | 2 | SET-01, SET-02 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 3-01-05 | 01 | 2 | SET-01, SET-02 | lint + manual | `npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure required. CLAUDE.md explicitly states "No test framework is configured — linting is the only automated quality check." The migration (Wave 0 task) is its own atomic deliverable; lint covers TypeScript correctness of new hook and updated types.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sync frequency persists across page refresh | SET-01 SC-1 | No test framework; DB round-trip requires browser session | Change sync freq, press Save, refresh page — verify saved value shown |
| Notification prefs persist across logout/login | SET-02 SC-2 | No test framework; requires auth session cycle | Toggle notifications, press Save, log out, log back in — verify saved values |
| Wellness toggles persist to DB for Phase 4 | SET-02 SC-3 | No test framework; requires DB inspection | Toggle wellness tips / auto breaks, press Save — verify `user_settings` row updated in Supabase dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
