---
phase: 6
slug: language-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — linting is the only automated quality check (see CLAUDE.md) |
| **Config file** | `eslint.config.js` / `.eslintrc` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | COPY-01 | — | N/A | lint | `npm run lint` | ✅ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | COPY-01 | — | N/A | build | `npm run build` | ✅ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | COPY-01 | — | N/A | grep | `grep -r "Calendar Integration" src/ \|\| echo "CLEAN"` | ✅ | ⬜ pending |
| 6-02-02 | 02 | 1 | COPY-01 | — | N/A | grep | `grep -r '"Connections"' src/ \|\| echo "CLEAN"` | ✅ | ⬜ pending |
| 6-03-01 | 03 | 2 | COPY-01 | — | N/A | grep | `grep -r "Dashboard\|Sync now\|Alerts" src/ \|\| echo "CLEAN"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — linting and build verification are sufficient for a string-sweep phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Empty-state copy renders correctly in browser | COPY-01 | No E2E test framework | Start `npm run dev`, navigate to calendar with no connections; verify "A calmer view of your week. Connect your calendar to begin." appears |
| No-meetings state renders celebratory copy | COPY-01 | No E2E test framework | Connect calendar with empty day; verify "A spacious day — enjoy the quiet" or approved variant appears |
| Tab label "Your Calendars" renders (not "Connections") | COPY-01 | Requires live tab rendering | Open calendar section; verify tab reads "Your Calendars" |
| Sync icon-only button has aria-label | COPY-01 | Accessibility audit | Inspect element; verify `aria-label` is present on sync button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
