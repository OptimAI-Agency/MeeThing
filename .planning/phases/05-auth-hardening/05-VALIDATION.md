# Phase 5: Auth Hardening - Validation Strategy

**Created:** 2026-04-02
**Phase:** 05-auth-hardening
**Requirements:** AUTH-01, AUTH-02, AUTH-03

## Test Framework

| Property | Value |
|----------|-------|
| Framework | None (no test framework configured per CLAUDE.md) |
| Lint command | `npm run lint` |
| Build command | `npm run build` |
| Per-task gate | `npm run lint && npm run build` |

## Requirement Coverage

| Req ID | Behavior Under Test | Validation Method |
|--------|--------------------|--------------------|
| AUTH-01 | ProtectedRoute redirects unverified user to /verify-email | Manual browser: sign up new account, confirm redirect |
| AUTH-01 | /verify-email renders email, resend button, back-to-login link | Manual browser: check page renders correctly with query param |
| AUTH-01 | Resend button calls supabase.auth.resend and shows 60s cooldown | Manual browser: click resend, verify button disables with countdown |
| AUTH-01 | After clicking email verification link, user can access /calendar | Manual browser: click verification email link, verify redirect |
| AUTH-01 | Existing verified users are not disrupted | Manual browser: log in with existing account, verify /calendar loads |
| AUTH-02 | "Forgot password?" link on Login routes to /forgot-password | Manual browser: check link presence and navigation |
| AUTH-02 | /forgot-password sends reset email and shows inline confirmation | Manual browser: enter email, submit, check confirmation text appears |
| AUTH-02 | /reset-password detects recovery token and shows password form | Manual browser: click reset link from email, verify form renders |
| AUTH-02 | Password update succeeds and redirects to /login with toast | Manual browser: submit new password, verify redirect and toast |
| AUTH-02 | Direct navigation to /reset-password without token redirects | Manual browser: navigate directly, verify redirect to /forgot-password |
| AUTH-03 | CLOSED — Phase 2 already handles token revocation | N/A |
| LOGOUT | Sign out button in Settings tab works | Manual browser: click "Sign out", verify redirect to /login |

## Automated Gates (per task)

```bash
npm run lint && npm run build
```

These catch TypeScript type errors and import issues before browser testing.

## Wave 0 Notes

No test framework setup needed. All auth flows require manual browser testing against the hosted Supabase project (local Supabase may auto-confirm emails per config.toml settings, making AUTH-01 flow untestable locally).

**Pre-testing prerequisite:** Add redirect URLs to Supabase Dashboard allowlist (Authentication > URL Configuration):
- `http://localhost:8080/calendar`
- `http://localhost:8080/reset-password`
- `https://<production-domain>/calendar`
- `https://<production-domain>/reset-password`
