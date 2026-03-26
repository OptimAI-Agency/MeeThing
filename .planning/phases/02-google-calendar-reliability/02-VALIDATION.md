---
phase: 2
slug: google-calendar-reliability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (linting only — per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full lint + build must be green, manual verification of all 3 requirements
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| pagination | 02-01 | 1 | CAL-01 | manual | `npm run lint` | ✅ | ⬜ pending |
| sync-errors | 02-01 | 1 | CAL-02 | manual | `npm run lint` | ✅ | ⬜ pending |
| disconnect-fn | 02-02 | 1 | CAL-03 | manual | `npm run lint && npm run build` | ✅ | ⬜ pending |
| disconnect-ui | 02-02 | 2 | CAL-03 | manual | `npm run lint && npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing infrastructure covers all phase requirements. No test framework to install.

*Project uses lint + build as quality gates. All phase requirements involve external API integration (Google OAuth, Supabase edge functions) that require live credentials and browser interaction.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pagination fetches all events | CAL-01 | Edge function calls live Google Calendar API; requires account with >50 events in 7-day window | Connect account with dense schedule, run sync, verify all events visible |
| Sync errors show specific messages | CAL-02 | Requires expired/revoked token state and browser interaction | Force token expiry, trigger sync, verify re-connect toast appears with action button |
| Disconnect revokes token + deletes meetings | CAL-03 | Requires live Google OAuth revocation API call and DB verification | Disconnect calendar, verify meetings removed from UI, check Google account permissions page shows app removed |
| Token refresh failure surfaces re-connect prompt | CAL-02 | Requires expired refresh token state | Test with invalid refresh token in DB, trigger sync, verify specific error toast |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
