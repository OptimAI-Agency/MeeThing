# Phase 5: Auth Hardening - Research

**Researched:** 2026-04-02
**Domain:** Supabase Auth (email verification, password recovery) + React Router SPA routing
**Confidence:** HIGH

## Summary

Phase 5 closes three authentication gaps before public launch: email verification gating (AUTH-01), password recovery (AUTH-02), and token revocation on disconnect (AUTH-03). AUTH-03 is already complete from Phase 2's `disconnect-google-calendar` edge function -- no new work needed.

The remaining work is entirely client-side: three new public pages (`/verify-email`, `/forgot-password`, `/reset-password`), modifications to `ProtectedRoute` to gate unverified users, updates to `AuthContext.signUp` to redirect correctly, a "Forgot password?" link on Login, and a "Sign out" button in CalendarSettings. All Supabase Auth methods needed (`resend`, `resetPasswordForEmail`, `updateUser`, `onAuthStateChange` for PASSWORD_RECOVERY) are well-documented and stable in `@supabase/supabase-js` v2.

**Primary recommendation:** Split into two plans -- Plan 1 covers AUTH-01 (verification gate + verify-email page + signup flow change) and the logout button; Plan 2 covers AUTH-02 (forgot-password page + reset-password page + login page link).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: After signup, redirect to dedicated `/verify-email` route (not inline on Signup page)
- D-02: `/verify-email` displays user's email, "Resend verification email" button (60s cooldown), "Back to login" link, glass-panel layout
- D-03: Verification enforced in `ProtectedRoute` via `user.email_confirmed_at` null check; redirect to `/verify-email`
- D-04: `/verify-email` is a public route (no auth required)
- D-05: `emailRedirectTo` in signUp updated to point to `/calendar`
- D-06: "Forgot password?" link on Login page, below password field, routes to `/forgot-password`
- D-07: `/forgot-password` -- public page, email input, "Send reset link" button, inline success confirmation, glass-panel layout
- D-08: `/reset-password` -- public page, handles Supabase recovery tokens from URL, "New password" + "Confirm password" form, redirects to `/login` on success
- D-09: `/auth/callback` remains a ProtectedRoute for Google Calendar OAuth -- NOT repurposed for password reset
- D-10: "Sign out" button at bottom of Settings tab, separated by divider
- D-11: Plain secondary/ghost button labeled "Sign out", no destructive styling, no confirmation dialog
- D-12: AUTH-03 is fully satisfied by Phase 2 -- no additional work

### Claude's Discretion
- Exact Supabase API call patterns for `resetPasswordForEmail`, `updateUser`, `resend`
- Whether reset-password reads token from URL fragment or query param
- Rate-limiting pattern for resend button (client-side 60s cooldown)
- Copy for verify-email and forgot-password screens (calm wellness tone)

### Deferred Ideas (OUT OF SCOPE)
- Social login (Google Sign-In as auth method)
- Multi-factor authentication
- Account deletion
- Session management / device list
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | New users must verify email before accessing the app | ProtectedRoute `email_confirmed_at` check, `/verify-email` page with `supabase.auth.resend()`, signUp redirect change |
| AUTH-02 | User can request password reset email and set new password via link | `/forgot-password` with `resetPasswordForEmail()`, `/reset-password` with `onAuthStateChange` PASSWORD_RECOVERY event + `updateUser()` |
| AUTH-03 | OAuth token revoked on provider disconnect | CLOSED -- Phase 2 `disconnect-google-calendar` edge function already handles this |
</phase_requirements>

## Current State

### What exists
- **AuthContext** (`src/contexts/AuthContext.tsx`): Provides `signIn`, `signUp`, `signOut`. The `signUp` method currently sets `emailRedirectTo` to `window.location.origin + '/'` and navigates to `/calendar` immediately after signup -- both must change.
- **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`): Checks `user` and `loading` only. No `email_confirmed_at` check. Redirects to `/login` if no user.
- **Login** (`src/pages/Login.tsx`): Standard email/password form with Zod validation. No "Forgot password?" link.
- **Signup** (`src/pages/Signup.tsx`): Standard form. After successful signup, shows "Account created!" toast and navigates to `/calendar` (via AuthContext.signUp).
- **App.tsx**: Routes: `/`, `/login`, `/signup`, `/calendar` (protected), `/auth/callback` (protected), `*` (NotFound).
- **CalendarSettings** (`src/components/calendar/CalendarSettings.tsx`): Settings tab with sync, notifications, wellness sections, and a Save button. No sign-out button.
- **Separator component**: Available at `src/components/ui/separator.tsx` (shadcn).
- **Auth schemas** (`src/lib/auth-schemas.ts`): `signUpSchema` and `signInSchema` with Zod. Password requires 8+ chars, uppercase, lowercase, number. Will need a `resetPasswordSchema` for the new password form.
- **Supabase client**: Configured with `persistSession: true`, `autoRefreshToken: true`, `localStorage` storage. The `onAuthStateChange` listener in AuthContext will automatically pick up PASSWORD_RECOVERY events.

### What's broken/missing
1. No email verification enforcement -- users go straight to `/calendar` after signup
2. `emailRedirectTo` points to `/` instead of `/calendar`
3. No password recovery flow at all
4. No sign-out button anywhere in the UI (signOut function exists but is not wired to any UI)

## Supabase Auth APIs

All methods verified against `@supabase/supabase-js` v2.101.1 (installed: `^2.84.0` in package.json, registry latest: 2.101.1).

### Resend verification email (AUTH-01)
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-resend
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com',
});
```
- `type: 'signup'` resends the email confirmation link
- Returns `{ data: { message_id }, error }`
- Rate-limited server-side by Supabase (default: 60s between sends)
- Client-side 60s cooldown button is UX polish on top of server-side limit

### Request password reset (AUTH-02)
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```
- Sends a password reset email with a link
- `redirectTo` tells Supabase where to send the user after token verification
- Returns `{ data: {}, error }` -- no way to distinguish "email exists" from "email doesn't exist" (security by design)
- Supports PKCE flow automatically

### Update password (AUTH-02)
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-updateuser
const { data, error } = await supabase.auth.updateUser({
  password: 'new_password',
});
```
- Requires an active session (user must be "logged in" via the recovery token)
- Returns `{ data: { user }, error }`

### Listen for recovery event (AUTH-02)
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // User arrived via password reset link -- show new password form
  }
});
```

### Read email verification status
```typescript
const { data: { user } } = await supabase.auth.getUser();
const isVerified = user?.email_confirmed_at !== null;
// Also available on the user object from onAuthStateChange and getSession
```
- `user.email_confirmed_at` is a timestamp string (ISO 8601) or `null`
- Available on the `User` object from `useAuth().user`

## URL Handling for Recovery/Verification Tokens

### How Supabase delivers tokens (SPA flow)

Supabase's default email templates use a confirmation URL that goes through Supabase's hosted endpoint:

```
https://<project-ref>.supabase.co/auth/v1/verify?token=<token_hash>&type=recovery&redirect_to=<redirectTo>
```

When the user clicks this link:
1. Supabase's server verifies the token
2. Supabase redirects the user to the `redirectTo` URL with session data in the **URL fragment** (hash):
   ```
   https://yourapp.com/reset-password#access_token=...&refresh_token=...&type=recovery&expires_in=3600
   ```
3. The `supabase-js` client automatically parses the URL fragment on page load
4. `onAuthStateChange` fires a `PASSWORD_RECOVERY` event with the session

### Critical SPA behavior

- The supabase-js client (`createClient` with default settings) automatically detects and parses hash fragments on initialization
- The `AuthContext`'s existing `onAuthStateChange` listener will automatically receive the `PASSWORD_RECOVERY` event
- **No manual URL parsing needed** -- supabase-js handles it
- The `PASSWORD_RECOVERY` event fires ONCE when the page loads with the recovery fragment
- After the event fires, the user has a valid session and can call `updateUser({ password })`

### For email verification (signup confirmation)

Same flow: user clicks link in email, Supabase verifies token server-side, redirects to `emailRedirectTo` with session fragments. The `onAuthStateChange` fires `SIGNED_IN` event. The user's `email_confirmed_at` is now set.

### Key configuration: `redirectTo` URLs

Both `resetPasswordForEmail` and `signUp` accept a `redirectTo`/`emailRedirectTo` option. These URLs must be:
1. Added to the **Redirect URLs** allowlist in the Supabase Dashboard (Authentication > URL Configuration)
2. Matching the app's actual domain

Current state: `emailRedirectTo` in signUp is `window.location.origin + '/'`. Must change to `window.location.origin + '/calendar'`.

For password reset: `redirectTo` should be `window.location.origin + '/reset-password'`.

## ProtectedRoute Changes

### Current implementation (17 lines)
```typescript
// Checks: loading → user exists → render children
if (loading) return <AppLoadingScreen />;
if (!user) return <Navigate to="/login" replace />;
return <>{children}</>;
```

### Required changes
Add a third check between `!user` and render:
```typescript
if (!user) return <Navigate to="/login" replace />;
// NEW: email verification gate
if (!user.email_confirmed_at) {
  return <Navigate to="/verify-email" replace />;
}
return <>{children}</>;
```

### Edge cases
- **Existing verified users**: `email_confirmed_at` is already a timestamp string -- they pass through unaffected
- **User with session but unverified**: Supabase still creates a session on signup (even before verification). The user object exists but `email_confirmed_at` is `null`. ProtectedRoute catches this.
- **Verify-email page accessibility**: Since `/verify-email` is a public route (outside ProtectedRoute), the redirect works even if the user has no session at all (e.g., they closed the browser and came back).

## Route Architecture

| Route | Public/Protected | Purpose | Key Logic |
|-------|-----------------|---------|-----------|
| `/verify-email` | Public | Show "check your email" screen | Read email from query param, resend button with 60s cooldown, "Back to login" link |
| `/forgot-password` | Public | Request password reset | Email input, calls `resetPasswordForEmail`, shows inline success message |
| `/reset-password` | Public | Set new password after clicking reset link | supabase-js auto-parses fragment, listen for PASSWORD_RECOVERY event via onAuthStateChange, show password form, call `updateUser` |

### Why all three must be public
- `/verify-email`: An unverified user who is gated by ProtectedRoute must be able to reach this page. If it were protected, ProtectedRoute would redirect them here, but they couldn't access it -- infinite loop.
- `/forgot-password`: The user is not signed in (they forgot their password).
- `/reset-password`: The user arrives from an email link. supabase-js will create a session from the URL fragment, but the page must render first for supabase-js to parse it.

### Reset-password page flow (detailed)

1. User clicks link in email, lands on `/reset-password#access_token=...&type=recovery`
2. supabase-js auto-parses the fragment and establishes a session
3. `onAuthStateChange` fires `PASSWORD_RECOVERY` event
4. The page detects this event (via a local `useEffect` listening to onAuthStateChange, or by checking if the URL hash contains `type=recovery`)
5. Page shows "New password" + "Confirm password" form
6. User submits, page calls `supabase.auth.updateUser({ password })`
7. On success, navigate to `/login` with success toast

### Guard against direct navigation to /reset-password

If someone navigates to `/reset-password` without a recovery token:
- No `PASSWORD_RECOVERY` event fires
- No hash fragment present
- The page should detect this (check `window.location.hash` for `type=recovery` on mount) and redirect to `/forgot-password`

**Recommended approach:** Use a state variable `isRecoveryMode` initialized to `false`. Set it to `true` when `PASSWORD_RECOVERY` event fires. If after a short timeout (~2 seconds) it's still `false` and no hash is present, redirect.

## Email Configuration

### emailRedirectTo changes

| Context | Current Value | New Value |
|---------|--------------|-----------|
| `signUp` in AuthContext | `window.location.origin + '/'` | `window.location.origin + '/calendar'` |
| `resetPasswordForEmail` (new) | N/A | `window.location.origin + '/reset-password'` |

### Supabase Dashboard configuration

The following URLs must be in the Redirect URLs allowlist (Authentication > URL Configuration):
- `http://localhost:8080/calendar` (dev)
- `http://localhost:8080/reset-password` (dev)
- `https://<production-domain>/calendar` (production)
- `https://<production-domain>/reset-password` (production)

This is a **manual dashboard step** -- it cannot be done from code. Must be documented as a pre-deployment task.

### Email templates

The default Supabase email templates work correctly for this flow. The confirmation email template uses `{{ .ConfirmationURL }}` which Supabase constructs automatically. No template customization is needed for v1.

## Risk Register

### R1: Existing verified users disrupted (LOW risk)
**What could go wrong:** ProtectedRoute's new `email_confirmed_at` check breaks access for existing users.
**Why it's LOW:** All existing users who signed up and confirmed their email already have `email_confirmed_at` set. The check `!user.email_confirmed_at` only catches truly unverified users.
**Mitigation:** Test with both a new signup and an existing account.

### R2: Redirect URL not in allowlist (MEDIUM risk)
**What could go wrong:** Supabase silently ignores `redirectTo` if the URL isn't in the allowlist, falling back to Site URL. User lands on wrong page after clicking email link.
**Mitigation:** Document the allowlist step. Add both localhost and production URLs.

### R3: Recovery token expiry (LOW risk)
**What could go wrong:** User clicks reset link hours/days later, token has expired.
**Default expiry:** Supabase recovery tokens expire after 24 hours (configurable in dashboard).
**Mitigation:** The `/reset-password` page should handle the error gracefully -- show "This link has expired. Request a new one." with a link to `/forgot-password`.

### R4: signUp navigates before redirect completes (LOW risk)
**What could go wrong:** The `signUp` function in AuthContext currently does `navigate('/calendar')` after the API call. The change redirects to `/verify-email?email=...` instead. But if the Supabase API call creates a session, the `onAuthStateChange` listener might also fire and trigger navigation.
**Mitigation:** The signUp function should navigate to `/verify-email` directly (not rely on onAuthStateChange). Remove the existing `navigate('/calendar')` from signUp and replace with `navigate('/verify-email?email=...')`.

### R5: User navigates directly to /reset-password without token (LOW risk)
**What could go wrong:** Page shows a password form with no session, updateUser fails.
**Mitigation:** Guard on mount -- check for hash fragment or PASSWORD_RECOVERY event. Redirect to `/forgot-password` if absent.

### R6: onAuthStateChange PASSWORD_RECOVERY fires in AuthContext, not in ResetPassword page (MEDIUM risk)
**What could go wrong:** The existing `onAuthStateChange` in AuthContext does not check for `PASSWORD_RECOVERY` event type. It just sets the user/session. The reset-password page needs to independently detect this event to know it should show the password form.
**Mitigation:** The `/reset-password` page should set up its own `onAuthStateChange` listener, OR check for `type=recovery` in the URL hash on mount. Both approaches work; the hash check is simpler and more reliable for this case.

### R7: Supabase auto-confirms emails in local dev (LOW risk)
**What could go wrong:** Local Supabase might be configured to auto-confirm emails, making the verification flow untestable.
**Mitigation:** Check `supabase/config.toml` for `[auth]` section. The current config.toml only has function configs -- email confirmation behavior depends on the hosted Supabase project settings. Test against the hosted project, not local.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no test framework configured per CLAUDE.md) |
| Config file | None |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| AUTH-01a | ProtectedRoute redirects unverified user to /verify-email | Manual browser | N/A | Sign up new account, verify redirect |
| AUTH-01b | /verify-email shows email and resend button | Manual browser | N/A | Check page renders correctly |
| AUTH-01c | Resend button calls supabase.auth.resend and shows cooldown | Manual browser | N/A | Click resend, verify 60s disable |
| AUTH-01d | After clicking email verification link, user can access /calendar | Manual browser | N/A | Click email link, verify redirect to /calendar |
| AUTH-01e | Existing verified users are unaffected | Manual browser | N/A | Log in with existing account, verify /calendar loads |
| AUTH-02a | "Forgot password?" link on Login routes to /forgot-password | Manual browser | N/A | Check link presence and navigation |
| AUTH-02b | /forgot-password sends reset email and shows confirmation | Manual browser | N/A | Enter email, submit, check confirmation |
| AUTH-02c | /reset-password handles recovery token and shows password form | Manual browser | N/A | Click reset link from email, verify form |
| AUTH-02d | Password update succeeds and redirects to /login | Manual browser | N/A | Submit new password, verify redirect and toast |
| AUTH-02e | Direct navigation to /reset-password without token redirects to /forgot-password | Manual browser | N/A | Navigate directly, verify redirect |
| AUTH-03 | CLOSED -- no new testing | N/A | N/A | Verified in Phase 2 |
| LOGOUT | Sign out button in Settings works | Manual browser | N/A | Click "Sign out", verify redirect to /login |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run build`
- **Per wave merge:** Same (no test suite)
- **Phase gate:** Lint clean + build succeeds + manual browser verification of all flows

### Wave 0 Gaps
None -- no test framework to set up. Linting is the only automated check. Manual browser verification is required for all auth flows (these are interaction-heavy flows that are difficult to unit test without a test framework).

## Code Examples

### ProtectedRoute with verification gate
```typescript
// Source: Current ProtectedRoute.tsx + AUTH-01 requirement
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
```

### Resend verification email with cooldown
```typescript
// Pattern for /verify-email page
const [cooldown, setCooldown] = useState(0);

const handleResend = async () => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: emailFromQueryParam,
  });
  if (error) {
    toast({ variant: 'destructive', title: 'Error', description: error.message });
    return;
  }
  toast({ title: 'Email sent', description: 'Check your inbox for the verification link.' });
  setCooldown(60);
};

useEffect(() => {
  if (cooldown <= 0) return;
  const timer = setInterval(() => setCooldown(c => c - 1), 1000);
  return () => clearInterval(timer);
}, [cooldown]);
```

### Reset password page -- detecting recovery mode
```typescript
// Pattern for /reset-password page
const [isRecoveryMode, setIsRecoveryMode] = useState(false);

useEffect(() => {
  // Check URL hash for recovery token (supabase-js will also parse this)
  const hash = window.location.hash;
  if (hash.includes('type=recovery')) {
    setIsRecoveryMode(true);
  }

  // Also listen for the PASSWORD_RECOVERY event
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setIsRecoveryMode(true);
    }
  });

  // If neither fires after a brief delay, redirect
  const timeout = setTimeout(() => {
    if (!isRecoveryMode) {
      navigate('/forgot-password');
    }
  }, 2000);

  return () => {
    subscription.unsubscribe();
    clearTimeout(timeout);
  };
}, []);
```

### Auth schema for password reset form
```typescript
// Add to src/lib/auth-schemas.ts
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must be less than 72 characters" })
    .regex(/[a-z]/, { message: "Password must contain a lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain a number" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

## Plan Breakdown Recommendation

### Plan 1: Email Verification Gate + Logout Button (AUTH-01 + D-10/D-11)
**Why grouped:** The verification gate is the highest-priority auth fix and the logout button is tiny (5-10 lines). Grouping avoids a plan with just one button.

**Tasks:**
1. Update `AuthContext.signUp`: change `emailRedirectTo` to `/calendar`, change post-signup navigation to `/verify-email?email=...`
2. Update `ProtectedRoute`: add `email_confirmed_at` null check, redirect to `/verify-email`
3. Create `/verify-email` page: glass-panel layout, email display from query param, resend button with 60s cooldown, "Back to login" link
4. Add `/verify-email` route to `App.tsx` (public)
5. Add "Sign out" button to `CalendarSettings`: Separator + ghost button at bottom, wired to `useAuth().signOut()`
6. Update Signup.tsx toast to say "Check your email" instead of "Account created"

**Files touched:** `AuthContext.tsx`, `ProtectedRoute.tsx`, `App.tsx`, `Signup.tsx`, `CalendarSettings.tsx`, new `src/pages/VerifyEmail.tsx`

### Plan 2: Password Recovery (AUTH-02)
**Why separate:** Self-contained feature with its own pages and distinct flow (email request + token handling + password update).

**Tasks:**
1. Add `resetPasswordSchema` to `auth-schemas.ts`
2. Create `/forgot-password` page: glass-panel layout, email input, calls `resetPasswordForEmail`, inline success message
3. Create `/reset-password` page: detect recovery mode from hash/event, password form with confirmation, calls `updateUser`, redirects to `/login`
4. Add "Forgot password?" link to `Login.tsx` below password field
5. Add `/forgot-password` and `/reset-password` routes to `App.tsx` (public)

**Files touched:** `auth-schemas.ts`, `Login.tsx`, `App.tsx`, new `src/pages/ForgotPassword.tsx`, new `src/pages/ResetPassword.tsx`

### No Plan 3 needed
AUTH-03 is closed. Two plans is sufficient.

## Project Constraints (from CLAUDE.md)

- **No test framework** -- linting is the only automated quality check (`npm run lint`)
- **Path alias:** `@/` maps to `src/`
- **UI components:** shadcn-ui in `src/components/ui/` -- Separator already available
- **Design system:** glass-panel, rounded-3xl, nature background, useBackground hook -- new pages must match Login/Signup layout
- **Dev server:** `npm run dev` on localhost:8080
- **Build check:** `npm run build` for production build verification

## Sources

### Primary (HIGH confidence)
- [Supabase JS resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) -- method signature, redirectTo option, PKCE support
- [Supabase JS auth.resend](https://supabase.com/docs/reference/javascript/auth-resend) -- resend verification email API
- [Supabase JS auth.updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser) -- password update method
- [Supabase Password-based Auth guide](https://supabase.com/docs/guides/auth/passwords) -- complete reset flow
- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) -- template variables, confirmation URL format
- [Supabase Redirect URLs guide](https://supabase.com/docs/guides/auth/redirect-urls) -- allowlist configuration

### Secondary (MEDIUM confidence)
- [Supabase onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) -- PASSWORD_RECOVERY event documentation
- [Supabase Discussion #3360](https://github.com/orgs/supabase/discussions/3360) -- community-verified password reset flow for SPAs

### Codebase (HIGH confidence)
- Direct reading of `AuthContext.tsx`, `ProtectedRoute.tsx`, `Login.tsx`, `Signup.tsx`, `App.tsx`, `AuthCallback.tsx`, `CalendarSettings.tsx`, `auth-schemas.ts`, `client.ts`, `config.toml`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using existing `@supabase/supabase-js` v2 already in project, all methods verified against official docs
- Architecture: HIGH -- patterns are well-documented by Supabase, SPA recovery flow is a solved problem
- Pitfalls: HIGH -- recovery token URL fragment handling and redirect URL allowlist are the main gotchas, both well-documented

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (Supabase auth APIs are stable; 30-day validity)
