---
phase: 05-auth-hardening
plan: 02
subsystem: auth
tags: [password-reset, auth, supabase]
dependency_graph:
  requires: [supabase-auth]
  provides: [password-recovery-flow, forgot-password-page, reset-password-page]
  affects: [Login, App.tsx, auth-schemas]
tech_stack:
  added: []
  patterns: [recovery-token-detection, inline-confirmation, useRef-for-timeout-closure]
key_files:
  created:
    - src/pages/ForgotPassword.tsx
    - src/pages/ResetPassword.tsx
  modified:
    - src/lib/auth-schemas.ts
    - src/pages/Login.tsx
    - src/App.tsx
decisions:
  - "Inline confirmation on ForgotPassword instead of navigation -- better UX and avoids extra route"
  - "useRef for recovery detection to avoid stale closure in setTimeout redirect"
  - "2-second timeout before redirecting away from /reset-password without token -- balances UX with security"
metrics:
  duration_seconds: 133
  completed: "2026-04-04T10:48:00Z"
---

# Phase 5 Plan 2: Password Recovery Flow Summary

JWT-style password recovery via Supabase resetPasswordForEmail + updateUser with glass-panel ForgotPassword and ResetPassword pages, recovery token detection via URL hash and onAuthStateChange, and Forgot password link on Login.

## What Was Built

### Task 1: resetPasswordSchema + ForgotPassword page
- Added `resetPasswordSchema` to `src/lib/auth-schemas.ts` with password + confirmPassword fields and `.refine()` match validation
- Created `src/pages/ForgotPassword.tsx` with two states:
  - Form state: email input calling `supabase.auth.resetPasswordForEmail` with redirect to `/reset-password`
  - Confirmation state: inline "Check your email" message with Mail icon (no navigation away)
- Uses the same glass-panel layout pattern as Login/Signup

### Task 2: ResetPassword page, Login link, routes
- Created `src/pages/ResetPassword.tsx` with:
  - Recovery mode detection from URL hash (`type=recovery`) and `onAuthStateChange(PASSWORD_RECOVERY)`
  - `useRef` to track recovery detection for the 2-second timeout (avoids stale closure)
  - Password form validated with `resetPasswordSchema.safeParse()`
  - Expired token handling with specific error message
  - Redirect to `/login` on success
  - Redirect to `/forgot-password` after 2s if no recovery token detected
- Added `Forgot password?` link to Login page between password field and submit button
- Added `/forgot-password` and `/reset-password` as public routes in `App.tsx`

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | d2669a3 | feat(05-02): add resetPasswordSchema and ForgotPassword page |
| 2 | 2ca27eb | feat(05-02): add ResetPassword page, forgot-password link, and routes |

## Verification

- `npm run lint`: 0 errors (10 pre-existing warnings)
- `npm run build`: success in 2.12s

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all pages are fully wired to Supabase auth APIs.

## Notes

**Manual Supabase Dashboard step required before deployment:** Add `http://localhost:8080/reset-password` and `https://<production-domain>/reset-password` to the Redirect URLs allowlist in Supabase Dashboard > Authentication > URL Configuration.
