# Domain Pitfalls

**Domain:** Wellness-focused calendar OAuth web app (public launch)
**Researched:** 2026-03-22
**Confidence:** HIGH for OAuth/security pitfalls (verified against codebase), MEDIUM for Microsoft-specific and browser notification pitfalls (training data only, no web verification available)

## Critical Pitfalls

Mistakes that cause security breaches, data loss, or require architectural rewrites.

### Pitfall 1: Plaintext OAuth Tokens in Database

**What goes wrong:** OAuth access and refresh tokens are stored as plaintext strings in `calendar_connections.access_token_encrypted` and `refresh_token_encrypted`. A database breach (SQL injection, Supabase dashboard compromise, backup leak, or overly permissive RLS) exposes every user's Google Calendar to attackers. The `_encrypted` column naming creates a false sense of security.
**Why it happens:** Encryption was planned but never implemented. The column names were aspirational.
**Consequences:** Full read access to every connected user's calendar. Attackers can use refresh tokens indefinitely until revoked. Potential GDPR/privacy violation requiring breach notification. App store / review rejection if applying for Google OAuth verification.
**Prevention:** Encrypt tokens with AES-256-GCM using a key stored in Supabase Vault (or environment variable, not in the database). Decrypt only in Edge Functions at the moment of use. Never return decrypted tokens to the client.
**Detection:** Audit: query `calendar_connections` and check if token values are base64-encoded ciphertext vs raw `ya29.*` / `1//` patterns. If they look like Google token formats, they are plaintext.
**Phase:** Security hardening -- must be completed before any public launch or beta.

### Pitfall 2: Static OAuth State Parameter Enables CSRF

**What goes wrong:** The OAuth `state` parameter is hardcoded as `"google"` in `CalendarConnections.tsx` (line 76). An attacker can craft a URL like `/auth/callback?code=ATTACKER_CODE&state=google` and trick a logged-in user into clicking it. The victim's account then gets connected to the attacker's Google Calendar tokens, or worse, the attacker's authorization code gets exchanged under the victim's account.
**Why it happens:** State parameter was added as a provider identifier rather than as the CSRF protection mechanism it is designed to be.
**Consequences:** Account takeover via OAuth CSRF. Attacker can inject their own calendar connection into a victim's account, or exfiltrate the victim's tokens.
**Prevention:** Generate a cryptographically random `state` value per OAuth initiation. Store it in `sessionStorage` (keyed by a nonce). On callback, verify the returned `state` matches. Reject if it does not. Include the provider name as a prefix if needed (e.g., `google:a8f3b2c1d4e5`).
**Detection:** Check `AuthCallback.tsx` -- if line 28 compares `state` against a static string rather than a session-stored value, it is vulnerable.
**Phase:** Security hardening -- must fix before public launch.

### Pitfall 3: CORS Wildcard Allows Cross-Origin Token Theft

**What goes wrong:** Both Edge Functions set `Access-Control-Allow-Origin: *`. Any malicious website can invoke `google-oauth` or `google-calendar-sync` with a stolen or leaked JWT, and the browser will happily deliver the response. Combined with XSS or token leakage, this is a direct path to data exfiltration.
**Why it happens:** Wildcard CORS is the "get it working" default. Developers forget to restrict it before launch.
**Consequences:** Cross-origin requests to Edge Functions succeed from any domain. If a user's Supabase JWT leaks (XSS, browser extension, shared computer), any site can call the sync endpoint and read their calendar data.
**Prevention:** Set `Access-Control-Allow-Origin` to the exact app origin (e.g., `https://meething.app`). For local dev, use an environment variable to conditionally allow `http://localhost:8080`. Never use `*` when the request includes credentials (Authorization header).
**Detection:** Read the `corsHeaders` object in any Edge Function. If `Access-Control-Allow-Origin` is `*`, it is vulnerable.
**Phase:** Security hardening -- must fix before public launch.

### Pitfall 4: Microsoft Graph OAuth Has Different Token Semantics Than Google

**What goes wrong:** Developers copy the Google OAuth flow for Microsoft and assume the same behavior. Microsoft Graph has critical differences that cause silent failures:
1. **Tenant configuration matters.** Microsoft OAuth requires choosing between `common`, `organizations`, `consumers`, or a specific tenant ID in the authorize URL. Using `common` means both personal Microsoft accounts and work/school accounts can sign in, but they have different token lifetimes and permissions. Using `organizations` excludes personal accounts. Getting this wrong means half your users cannot connect.
2. **Refresh tokens expire.** Google refresh tokens are effectively permanent (unless revoked). Microsoft refresh tokens expire after 90 days of inactivity by default. If a user does not sync for 90 days, the connection silently breaks.
3. **Scopes use a different format.** Google uses URL-style scopes (`https://www.googleapis.com/auth/calendar.readonly`). Microsoft uses short names (`Calendars.Read`). Must also include `offline_access` explicitly to get a refresh token.
4. **Token endpoint is different.** Microsoft uses `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`, not a single global endpoint.
5. **Calendar API response format differs.** Microsoft Graph returns `start.dateTime` and `start.timeZone` as separate fields (not a combined ISO string like Google). The timezone must be applied manually to get correct times.
**Why it happens:** Google and Microsoft both use OAuth 2.0, so the flow looks similar at a glance. The differences are in the details.
**Consequences:** Silent auth failures for certain account types. Broken sync after 90 days. Wrong meeting times due to timezone mishandling. User confusion when personal vs work accounts behave differently.
**Prevention:** Build the Microsoft integration as a separate provider module from the start, not by forking the Google code. Use `common` tenant for maximum compatibility but handle both account types. Store `refresh_token_expiry` and proactively prompt re-auth before it expires. Parse Microsoft's timezone-separated datetime format explicitly.
**Detection:** If the Outlook Edge Function uses the same token exchange URL pattern as Google, or if it does not handle `timeZone` separately from `dateTime`, it will have bugs.
**Phase:** Calendar integration phase (CAL-01/CAL-02). Needs its own Edge Function, not a parameter on the Google one.

### Pitfall 5: No Token Revocation on Disconnect Leaves Zombie Access

**What goes wrong:** When a user clicks "Disconnect" in `CalendarConnections.tsx`, the code sets `is_active: false` on the database row (line 88) but never revokes the OAuth token with Google or Microsoft. The tokens remain valid. If the database is breached, "disconnected" tokens are just as exploitable as active ones.
**Why it happens:** Token revocation is a separate API call to the provider (`https://oauth2.googleapis.com/revoke` for Google, `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout` for Microsoft) that is easy to skip.
**Consequences:** Zombie tokens persist indefinitely. Users believe they have disconnected but their calendar is still accessible via leaked tokens. Privacy liability.
**Prevention:** On disconnect, call the provider's revocation endpoint before or after deactivating the DB row. Delete the row entirely rather than soft-deleting. If revocation fails, log it and retry, but still deactivate the connection.
**Detection:** Search for calls to Google's revoke endpoint or Microsoft's logout endpoint. If none exist, revocation is not implemented.
**Phase:** Security hardening or calendar integration phase (AUTH-03).

## Moderate Pitfalls

### Pitfall 6: Google OAuth Verification Requirements Block Public Launch

**What goes wrong:** Google requires OAuth verification for apps requesting sensitive scopes (like `calendar.readonly`) that serve more than 100 users. Without verification, Google shows a scary "This app isn't verified" warning screen that causes most users to abandon the OAuth flow. The verification process takes 4-6 weeks and requires a privacy policy, homepage, and terms of service.
**Why it happens:** Developers build the full app, then discover at launch time that Google blocks unverified apps from reaching more than 100 users.
**Consequences:** Launch delayed by weeks. Users see warning screens and lose trust. Must have privacy policy and terms of service pages ready.
**Prevention:** Start the Google OAuth verification process early (before the security hardening phase is complete). Prepare a privacy policy, terms of service, and app homepage. Submit for verification as soon as the OAuth scopes are finalized. Use the "limited use" compliance declaration for calendar.readonly.
**Detection:** Check the Google Cloud Console OAuth consent screen. If the publishing status is "Testing," only allowlisted test users can authenticate without warnings.
**Phase:** Should be initiated during security hardening, runs in parallel with development.

### Pitfall 7: Microsoft Azure App Registration Has Its Own Verification Process

**What goes wrong:** Similar to Google, Microsoft requires "publisher verification" for multi-tenant apps. Without it, users see "Unverified" warnings. Additionally, Microsoft requires admin consent for certain calendar permissions in enterprise environments -- individual users cannot grant `Calendars.Read` if their organization's Azure AD admin has restricted it.
**Why it happens:** Enterprise Microsoft 365 environments have strict consent policies. Developers test with personal accounts and everything works, then enterprise users cannot connect.
**Consequences:** Enterprise users (a large portion of the target "knowledge workers who attend 3-6 meetings/day") cannot connect their Outlook calendars. IT admins must approve the app first, which many will not do for an unknown app.
**Prevention:** Use the minimum required scope (`Calendars.Read`). Register as a multi-tenant app in Azure AD. Complete publisher verification (requires a Microsoft Partner Network account). Document the admin consent flow for enterprise customers. Consider supporting the admin consent endpoint (`/adminconsent`) for organizations.
**Detection:** Test with a Microsoft 365 work account (not a personal outlook.com account). If it fails or shows "Need admin approval," this pitfall is active.
**Phase:** Calendar integration phase (CAL-01). Start Azure app registration early.

### Pitfall 8: Browser Tab Suspension Kills Wellness Reminders

**What goes wrong:** MeeThing's wellness features (breathing reminders, transition buffers) rely on the browser tab being active. Modern browsers aggressively throttle or suspend background tabs to save battery and memory. `setTimeout`, `setInterval`, and even `requestAnimationFrame` are paused or severely throttled (to once per minute or less) when the tab is not focused.
**Why it happens:** Chrome, Firefox, and Safari all implement tab throttling. A user opens MeeThing, switches to another tab to work, and the breathing reminder that was supposed to fire 5 minutes before their meeting simply never fires (or fires 10 minutes late).
**Consequences:** Wellness reminders are unreliable. Users miss the core value proposition. The app appears broken or useless for its primary differentiating feature.
**Prevention:**
1. Use the `Page Visibility API` (`document.visibilitychange`) to detect when the tab becomes visible again and immediately check for missed reminders.
2. Use `Web Workers` for timing -- they are throttled less aggressively than main-thread timers (though still throttled in some browsers).
3. Use the `Notification API` with `navigator.serviceWorker` for reminders that fire even when the tab is background. This requires a service worker, which is a meaningful addition.
4. Clearly communicate to users that the tab must remain open (honest UX) or invest in a service worker approach.
5. Consider using `navigator.scheduling.isInputPending` or `scheduler.postTask` for better timing fidelity where supported.
**Detection:** Open MeeThing, set a reminder for 2 minutes, switch to another tab. If the reminder does not fire on time, this pitfall is active.
**Phase:** Wellness features phase (WEL-01/WEL-02). Architecture decision needed early: service worker vs tab-only.

### Pitfall 9: Notification API Permission Is a One-Shot Request

**What goes wrong:** The browser `Notification.requestPermission()` prompt can only be triggered once per origin. If the user clicks "Block" (which many do reflexively), there is no way to programmatically ask again. The user must manually go to browser settings to re-enable notifications. Most users will never do this.
**Why it happens:** Browsers are aggressive about preventing notification spam. The permission prompt is designed to be difficult to re-trigger.
**Consequences:** Users who block notifications on first prompt permanently lose access to wellness reminders (if implemented via Notification API). No programmatic recovery path.
**Prevention:**
1. Never request notification permission on page load or first visit. Wait until the user explicitly opts into reminders in settings.
2. Show a custom in-app "pre-permission" dialog explaining what the notifications will be used for before triggering the browser prompt. This gives users context and dramatically increases acceptance rates.
3. Have a fallback: in-tab visual/audio alerts that work without Notification API permission.
4. If permission is denied, show a settings-page guide explaining how to re-enable notifications in their browser.
**Detection:** Check if the app calls `Notification.requestPermission()` before the user has expressed intent to receive reminders.
**Phase:** Wellness features phase (WEL-01).

### Pitfall 10: Email Verification Bypass Allows Account Enumeration and Abuse

**What goes wrong:** The app currently redirects to `/calendar` immediately after signup without requiring email verification (AUTH-01). This means anyone can create accounts with arbitrary email addresses, potentially: (a) reserving email addresses that belong to others, (b) using the app to probe whether emails are valid (account enumeration), (c) connecting OAuth calendars to unverified accounts, creating a confusing ownership model.
**Why it happens:** Email verification was deferred during initial development for faster iteration.
**Consequences:** Abuse potential. Unverified accounts with OAuth tokens create audit nightmares. GDPR complications if someone signs up with another person's email.
**Prevention:** Enable Supabase's email verification requirement. Block access to protected routes until `user.email_confirmed_at` is set. Show a "check your email" screen after signup rather than redirecting to the app.
**Detection:** Sign up with a fake email and check if you can access `/calendar` immediately.
**Phase:** Authentication phase (AUTH-01). Must be before public launch.

### Pitfall 11: Token Refresh Race Condition During Sync

**What goes wrong:** In `google-calendar-sync/index.ts`, the token refresh and sync happen sequentially in a single Edge Function invocation. If two sync requests fire simultaneously (e.g., user clicks "Sync now" twice quickly, or a background sync fires while manual sync is in progress), both detect the token as expired, both attempt to refresh, and one gets a new token while the other's refresh may fail or write stale data.
**Why it happens:** No locking or deduplication on the sync operation. The refresh token can only be exchanged once in some edge cases (Google sometimes rotates refresh tokens on use).
**Consequences:** Sync silently fails. Token gets into an inconsistent state. User must reconnect their calendar.
**Prevention:** Use optimistic locking (check `token_expires_at` before and after refresh, abort if another process updated it). Alternatively, use a `sync_in_progress` flag with a TTL to prevent concurrent syncs for the same user/provider combination. Debounce the "Sync now" button on the client side.
**Detection:** Click "Sync now" rapidly multiple times and check Edge Function logs for errors.
**Phase:** Calendar integration phase or polish phase.

## Minor Pitfalls

### Pitfall 12: 50-Event Sync Cap Silently Drops Meetings

**What goes wrong:** The Google Calendar sync fetches `maxResults: 50` with no pagination. Users with dense calendars (the target user has 3-6 meetings per day, so 21-42 per week) may be fine, but users with many short meetings, recurring events expanded into individual instances, or multiple calendars feeding into "primary" will hit the cap silently.
**Prevention:** Implement pagination using `nextPageToken` from the Google Calendar API response. Log the total count vs fetched count to detect when truncation occurs.
**Phase:** Calendar integration phase (CAL-03).

### Pitfall 13: Conflicting Package Lockfiles Cause Deployment Failures

**What goes wrong:** Both `package-lock.json` and `bun.lockb` exist. CI/CD or deployment environments may pick the wrong one, leading to different dependency versions in production vs development.
**Prevention:** Delete one lockfile and standardize on a single package manager. Add a `preinstall` script that warns if the wrong package manager is used (e.g., `only-allow npm`).
**Phase:** Polish phase (POL-01) or immediately.

### Pitfall 14: Stale Meeting Deletion Query Is Timezone-Fragile

**What goes wrong:** The cleanup query in `google-calendar-sync` (lines 142-151) deletes meetings in the 7-day window that are no longer returned by Google. The `timeMin`/`timeMax` boundaries use server-side `new Date()` which is UTC, but meeting times may be stored in different timezones. Edge cases at day boundaries can cause meetings to be incorrectly deleted or retained.
**Prevention:** Normalize all stored meeting times to UTC. Use the same timezone-aware comparison in the cleanup query as in the fetch query.
**Phase:** Calendar integration phase.

### Pitfall 15: Deno Standard Library Is Severely Outdated

**What goes wrong:** Edge Functions import `deno.land/std@0.168.0` which is from 2022. The current Deno std is 1.x. There may be unfixed security issues in the HTTP server module.
**Prevention:** Update to current Deno std before public launch. Test Edge Functions after upgrade as there may be breaking API changes.
**Phase:** Security hardening or polish phase.

### Pitfall 16: Settings UI Creates False Expectations

**What goes wrong:** The Settings page (`CalendarSettings.tsx`, `SyncSettings.tsx`, `NotificationSettings.tsx`) renders toggles and dropdowns that do nothing -- they do not read from or write to `user_settings`. Users will change settings, see them "save" (or not), and then discover nothing changed. This is worse than having no settings page at all because it actively misleads users.
**Prevention:** Either connect the settings to the database or remove/disable the settings UI components until they are functional. Show "Coming soon" badges on unimplemented settings rather than rendering functional-looking controls.
**Phase:** Settings phase (SET-01/SET-02).

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Security hardening | Token encryption breaks existing connections | Migrate existing plaintext tokens in a one-time migration script; encrypt on write, decrypt on read. Do not delete and re-auth existing users. |
| Security hardening | CSRF state change breaks in-flight OAuth flows | Deploy state validation and old static-state support simultaneously for a brief window, then remove static support. |
| Microsoft Outlook integration | Assuming Google OAuth code can be reused | Build as a separate Edge Function. Microsoft token endpoint, scope format, response format, and token expiry semantics all differ. |
| Microsoft Outlook integration | Enterprise users blocked by admin consent | Test with a real Microsoft 365 work account, not just personal outlook.com. Document the admin consent flow. |
| Wellness reminders | Timer-based reminders unreliable in background tabs | Decide architecture early: service worker (reliable but complex) vs in-tab-only (simple but limited). Honest UX messaging either way. |
| Wellness reminders | Notification permission denied permanently | Use pre-permission pattern. Never auto-request on page load. Always have in-tab fallback. |
| Google OAuth verification | Verification blocks launch | Start the process 4-6 weeks before planned launch date. Prepare privacy policy and ToS early. |
| Testing | Zero test coverage makes refactoring risky | Add tests for OAuth flows and sync logic first (highest-risk code paths), not UI components. |

## Sources

- Direct codebase analysis of `CalendarConnections.tsx`, `AuthCallback.tsx`, `google-oauth/index.ts`, `google-calendar-sync/index.ts`
- `.planning/codebase/CONCERNS.md` -- existing security and tech debt inventory
- `.planning/PROJECT.md` -- requirements and constraints
- OAuth 2.0 RFC 6749 (state parameter CSRF protection) -- HIGH confidence, well-established standard
- Google OAuth verification requirements -- MEDIUM confidence (training data, process details may have changed)
- Microsoft Graph API OAuth differences -- MEDIUM confidence (training data, Azure AD consent model is well-established but details evolve)
- Browser tab throttling behavior -- HIGH confidence (well-documented browser behavior, stable across major browsers since 2020)
- Notification API permission model -- HIGH confidence (W3C Notifications API specification, stable)
