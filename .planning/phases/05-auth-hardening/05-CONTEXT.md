# Phase 5: Auth Hardening - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the last three auth gaps before public launch:

1. **AUTH-01** — Email verification gate: new users see a "check your email" screen and cannot access `/calendar` until their email is confirmed
2. **AUTH-02** — Password recovery: forgot-password request form, reset-password form (handles Supabase email link), and "Forgot password?" link on the Login page
3. **AUTH-03** — Token revocation on provider disconnect: **CLOSED by Phase 2** — the `disconnect-google-calendar` edge function already revokes OAuth tokens. No additional work required.

Out of scope: social login, multi-factor auth, account deletion, device session management.

</domain>

<decisions>
## Implementation Decisions

### Email verification gate (AUTH-01)

- **D-01:** After signup, redirect to a dedicated `/verify-email` route (not an inline state on the Signup page). The route is persistent and navigatable — if the user closes the tab and returns, they can still reach the confirmation screen.
- **D-02:** `/verify-email` displays: the user's email address (passed via query param or stored in session), a "Resend verification email" button (rate-limited — disable for 60s after click), and a "Back to login" link. Uses the same glass-panel layout as Login/Signup.
- **D-03:** Verification is enforced in `ProtectedRoute` — after sign-in, check `user.email_confirmed_at`. If null, redirect to `/verify-email` instead of rendering children. Existing verified users are unaffected (their `email_confirmed_at` is already set).
- **D-04:** `/verify-email` is a public route (no auth required) — an unverified user who signed in but was gated there must still be able to reach the page.
- **D-05:** The `emailRedirectTo` URL in `AuthContext.signUp` should be updated to point to `/calendar` (not `/`) so that after clicking the verification link, the user lands on the app and `ProtectedRoute` passes them through immediately.

### Password recovery (AUTH-02)

- **D-06:** Add a "Forgot password?" link to the Login page, below the password field. Routes to `/forgot-password`.
- **D-07:** `/forgot-password` — a new public page with a single email input and a "Send reset link" button. On success, show an inline confirmation ("Check your email — we've sent a reset link") without redirecting. On error, show a toast. Uses the glass-panel layout.
- **D-08:** `/reset-password` — a new public page that handles Supabase password recovery tokens from the URL. Supabase appends the token as a URL fragment or query param after the user clicks the reset link. The page presents a "New password" + "Confirm password" form. On success, redirect to `/login` with a success toast ("Password updated — sign in with your new password").
- **D-09:** The existing `/auth/callback` route handles Supabase OAuth redirects for Google Calendar. It must remain a `ProtectedRoute` and must NOT be repurposed for password reset — keep them separate.

### Logout button

- **D-10:** Add a "Sign out" button at the bottom of the Settings tab in `CalendarHub`, separated from the settings content by a divider. Uses the existing `signOut()` from `useAuth` (already implemented in AuthContext).
- **D-11:** Tone: a plain secondary/ghost button labeled "Sign out" — no destructive styling, no confirmation dialog. Signing out is reversible.

### AUTH-03 — Closed

- **D-12:** AUTH-03 is fully satisfied by the Phase 2 `disconnect-google-calendar` edge function, which revokes the Google OAuth token before deleting the database record. No additional implementation required. Mark the requirement as complete.

### Claude's Discretion

- Exact Supabase `resetPasswordForEmail` and `updateUser` API call patterns — researcher will confirm current SDK signatures
- Whether the reset-password page reads the token from the URL fragment (`#access_token=...&type=recovery`) or a query param — depends on Supabase's current email template configuration
- Rate-limiting the resend button (client-side 60s cooldown is sufficient — no server-side rate limiting needed for v1)
- Copy for the verify-email and forgot-password screens (calm, non-alarming tone consistent with the wellness brand)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Authentication — AUTH-01, AUTH-02, AUTH-03 acceptance criteria
- `.planning/ROADMAP.md` §Phase 5 — Success criteria 1–4 define what must be TRUE after this phase

### Existing auth files to extend
- `src/contexts/AuthContext.tsx` — `signUp` (update emailRedirectTo), `signIn` (no change), `signOut` (already correct). `ProtectedRoute` must gain email verification check.
- `src/components/auth/ProtectedRoute.tsx` — Add `email_confirmed_at` check; redirect unverified users to `/verify-email`
- `src/pages/Login.tsx` — Add "Forgot password?" link below password field
- `src/pages/Signup.tsx` — After successful signup, navigate to `/verify-email` instead of `/calendar`
- `src/App.tsx` — Add routes: `/verify-email`, `/forgot-password`, `/reset-password` (all public)

### Existing settings UI (logout button target)
- `src/pages/Calendar.tsx` or the settings tab component inside `CalendarHub` — locate the Settings tab, add Sign out button at the bottom with a divider

### Design system (new pages must match)
- `src/pages/Login.tsx` and `src/pages/Signup.tsx` — Reference layout: `min-h-screen`, nature background, `bg-black/40` overlay, `glass-panel rounded-3xl` card, `useBackground` hook
- `tailwind.config.ts` — Glass utilities, wellness color palette
- `src/index.css` — Custom animations if needed

### Phase 2 implementation (AUTH-03 closed here)
- `.planning/phases/02-google-calendar-reliability/02-01-PLAN.md` — Disconnect edge function with token revocation (already complete)

</canonical_refs>

<specifics>
## Specific Ideas

- The `/verify-email` page should show the user's email address so they know which inbox to check. Pass it as a query param from Signup: `navigate('/verify-email?email=...')`.
- The "Resend verification email" button calls `supabase.auth.resend({ type: 'signup', email })`. After clicking, disable the button for 60 seconds with a countdown: "Resend in 54s".
- The `/reset-password` page should guard against landing without a valid recovery token (e.g., someone navigating directly) — check for the token on mount and redirect to `/forgot-password` if absent.
- The Sign out button in Settings should be the last element in the tab, after a `<Separator />` component. Label: "Sign out" (not "Log out" — consistent with the existing "Sign in" / "Sign up" language throughout).

</specifics>

<deferred>
## Deferred Ideas

- **Social login** (Google Sign-In as an auth method, not just calendar OAuth) — different from Google Calendar connection; deferred to v2
- **Multi-factor authentication** — adds friction; deferred to v2
- **Account deletion** — needs data cleanup pipeline; deferred to v2
- **Session management / device list** — "sign out of all devices" — deferred to v2

</deferred>

---

*Phase: 05-auth-hardening*
*Context gathered: 2026-04-02*
