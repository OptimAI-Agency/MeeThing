---
phase: 1
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (CLAUDE.md: "No test framework is configured") |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full lint+build must be green, then manual verification of SEC-01/02/03

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SEC-01 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | SEC-01 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 1-01-03 | 01 | 1 | SEC-01 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 1 | SEC-02 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 1-02-02 | 02 | 1 | SEC-02 | lint + manual | `npm run lint` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 1 | SEC-03 | lint + manual | `npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing infrastructure (lint + build) covers all phase requirements. No test stubs to create.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tokens encrypted at rest | SEC-01 | No test framework; edge function requires running Supabase instance | Connect Google Calendar, open Supabase dashboard → Table Editor → calendar_connections → verify `access_token_encrypted` contains base64 ciphertext (not a plaintext `ya29.*` token) |
| OAuth state is random and validated | SEC-02 | Requires browser interaction; CSRF validation happens client-side | Connect Google Calendar, inspect browser URL — `state` param must be a UUID (not `"google"`). In DevTools → Application → Session Storage → verify `oauth_state` key is present before redirect and absent after callback |
| CORS restricted to app origin | SEC-03 | Requires HTTP request from a different origin | From browser console on a different origin (or curl with `Origin: https://evil.example`), call the edge function endpoint — verify the response is blocked / returns CORS error. Also: temporarily unset `ALLOWED_ORIGIN` in local dev and verify the function throws rather than serving with `*` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
