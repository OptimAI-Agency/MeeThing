# Project Research Summary

**Project:** MeeThing
**Domain:** Wellness-focused calendar companion (multi-provider OAuth + meeting awareness)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

MeeThing is a wellness-focused calendar companion for knowledge workers, occupying a niche that no current product owns well: read-only multi-provider calendar awareness delivered through a calming, nature-inspired interface. Competitors split between smart scheduling tools (Reclaim.ai, Fantastical) and mindfulness apps (Headspace, Calm) — MeeThing sits at the intersection without attempting to compete on scheduling automation or guided meditation breadth. The recommended build approach respects a strict dependency graph: security hardening first, then Microsoft Outlook integration, then settings persistence, then the wellness engine. No new npm packages are required; the entire v1 build uses the existing stack, built-in browser APIs, built-in Deno runtime APIs, and raw HTTP to Microsoft endpoints.

The most critical finding is that three confirmed security vulnerabilities exist in current production code: OAuth tokens are stored as plaintext despite column names implying encryption, the OAuth state parameter is hardcoded as the string `"google"` (offering zero CSRF protection), and Edge Functions respond with `Access-Control-Allow-Origin: *`. These must be resolved before adding Microsoft OAuth or any public launch — shipping a second provider on a vulnerable foundation doubles the attack surface. Token encryption uses AES-256-GCM via the Web Crypto API (`crypto.subtle`), natively available in Deno, with the key stored as an edge function secret (a separate security boundary from the database). This is straightforward to implement and requires no new dependencies.

The wellness engine — breathing exercises and transition buffer awareness — is the product's core differentiator and is architecturally the simplest part of the build: entirely client-side, driven by meeting data already in the TanStack Query cache and user preferences in the existing `user_settings` table. The main risks are reminder fatigue (default all wellness features to OFF, make everything dismissible) and browser tab throttling (use the Page Visibility API to catch missed timers). The decision to avoid service workers for v1 is correct — it is a significant complexity increase for a feature that works adequately from a foreground tab.

## Key Findings

### Recommended Stack

No new npm packages are needed. All additions use existing dependencies (`@supabase/supabase-js`, `date-fns`, TanStack Query), built-in browser APIs (CSS animations, Notification API, Page Visibility API, `crypto.randomUUID()`), built-in Deno APIs (Web Crypto `crypto.subtle`), and raw HTTP calls to Microsoft Identity Platform and Graph API endpoints.

See `.planning/research/STACK.md` for detailed implementation patterns and verified endpoint URLs.

**Core technologies:**
- **Microsoft Identity Platform v2.0 (raw HTTP fetch):** Outlook OAuth — same authorization code flow as existing Google; no SDK; use `common` tenant for personal + work accounts
- **Microsoft Graph API v1.0 `/me/calendarView`:** Calendar sync — functionally equivalent to Google Calendar events.list; `calendarView` auto-expands recurring events
- **AES-256-GCM via `crypto.subtle`:** Token encryption — key lives in edge function env vars (separate security boundary from DB); each token gets a unique random IV; shared module across both edge functions
- **`crypto.randomUUID()` + `sessionStorage`:** CSRF protection — tab-scoped, automatic cleanup, no database table needed
- **Browser Notification API + `setTimeout` + `visibilitychange`:** Wellness reminders — no service worker; falls back to in-app overlay if permission denied
- **TanStack Query `useQuery`/`useMutation` (existing):** Settings persistence — wire existing UI to existing `user_settings` table

### Expected Features

See `.planning/research/FEATURES.md` for full competitive analysis and feature dependency graph.

**Must have (table stakes):**
- Multi-provider calendar sync (Google + Microsoft Outlook) — single-provider is a non-starter for knowledge workers who have both
- Secure OAuth token storage — `_encrypted` column names that hold plaintext is a trust-breaker if ever discovered
- Settings that persist across sessions — fake settings that reset on refresh actively mislead users
- Email verification + password reset — baseline for any email/password auth system
- Loading, error, and empty states — users judge app quality by edge cases

**Should have (differentiators):**
- Breathing exercise (WEL-01) — the flagship differentiator; one animated circle, box breathing (4-4-4-4), follows Headspace's "visual IS the instruction" principle; keep to one exercise type for v1
- Transition buffer awareness (WEL-02) — detect back-to-back meetings, show inline gentle nudge; awareness without automation (Reclaim territory)
- Meeting density indicator — low-effort, high-impact visual busyness gauge using the nature color palette
- Meeting-free day celebration — delightful empty state that signals the app's values
- Daily wellness tip rotation — replace hardcoded tip with client-side rotation of 10-15 curated tips; no backend needed

**Defer to v1.5 or v2:**
- Quiet hours indicator (medium complexity, needs gap analysis logic)
- Energy/mood check-in after meetings (high complexity — new DB table, reflection UI, pattern detection)
- Focus time summary (needs weeks of data accumulation before it is meaningful)
- Apple Calendar integration (per PROJECT.md scope)
- Any event creation, scheduling links, push notifications, or calendar write access (explicit anti-features)

### Architecture Approach

The architecture extends the existing SPA + BaaS pattern with three new subsystems: a provider-agnostic OAuth/sync layer, application-level token encryption, and a client-side wellness engine. The most important structural decision is to consolidate `google-oauth` and `google-calendar-sync` into unified `provider-oauth` and `provider-calendar-sync` edge functions with provider-specific adapters, rather than creating parallel Microsoft functions. This eliminates code duplication for auth validation, encryption, DB operations, error handling, and CORS headers.

See `.planning/research/ARCHITECTURE.md` for data flow diagrams, adapter patterns, and build order.

**Major components:**
1. **`provider-oauth` edge function (new):** Replaces `google-oauth`; routes by provider, exchanges auth code, encrypts tokens, stores in `calendar_connections`
2. **`provider-calendar-sync` edge function (new):** Replaces `google-calendar-sync`; decrypts tokens, fetches events via provider-specific adapters, upserts meetings
3. **`_shared/crypto.ts` module (new):** `encryptToken` / `decryptToken` using AES-256-GCM; shared by both edge functions; reads key from Deno env
4. **`useSettings` hook (new):** TanStack Query CRUD for `user_settings` with `staleTime: Infinity`; consumed by settings UI and wellness engine
5. **`WellnessEngine` (new, client-side):** `MeetingAnalyzer` (pure function) + `ReminderScheduler` (setTimeout + Notification API) + `BreathingOverlay` (modal using existing `breathe` animation)
6. **`AuthCallback.tsx` (modified):** Parse provider + CSRF token from state param; validate against `sessionStorage`; dispatch to `provider-oauth`

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full analysis of 16 pitfalls with detection methods and prevention strategies.

1. **Plaintext OAuth tokens in database** — AES-256-GCM encrypt in edge functions before write; include a one-time migration script to encrypt existing plaintext rows; never return decrypted tokens to the client; confirm rows are encrypted before launch by checking for `ya29.*` / `1//` patterns in `access_token_encrypted`
2. **Static OAuth state enables CSRF** — replace hardcoded `"google"` state with `crypto.randomUUID()` stored in `sessionStorage`; encode as `provider:csrfToken`; validate on every callback before processing the auth code
3. **CORS wildcard on edge functions** — replace `Access-Control-Allow-Origin: *` with the exact app origin from an env var; return 403 for other origins; credential-bearing requests must never use wildcard
4. **Microsoft token semantics differ from Google** — refresh tokens expire after 90 days of inactivity (not permanent like Google); store `refresh_token_expiry` at connection time; proactively prompt re-auth; parse `start.dateTime` + `start.timeZone` as separate fields (not a combined ISO string)
5. **Browser tab throttling kills wellness reminders** — `setTimeout` is throttled in background tabs; use `document.visibilitychange` to check for missed reminders when tab regains focus; communicate tab-must-be-open requirement honestly; service worker is a v2 option

## Implications for Roadmap

The dependency chain is firm and non-negotiable: security before Microsoft OAuth (never ship a second insecure provider), settings persistence before wellness engine (engine reads settings), and both Microsoft OAuth and settings persistence before the full wellness engine (engine benefits from multi-provider data). Auth improvements are independent and can run in parallel.

### Phase 1: Security Foundations

**Rationale:** Three confirmed vulnerabilities exist in current production code. They affect the shared OAuth/sync edge functions, so fixing them first means all subsequent work inherits a secure foundation. This phase is dependency-free — it blocks nothing and is blocked by nothing.
**Delivers:** Shared `_shared/crypto.ts` module, AES-256-GCM encryption on all tokens, CSRF-protected OAuth flow for Google, restricted CORS headers on all edge functions, one-time migration script for existing plaintext tokens
**Addresses:** SEC-01 (token encryption), SEC-02 (CSRF), SEC-03 (CORS); also Pitfall 15 (outdated Deno std)
**Avoids:** Pitfalls 1, 2, 3 (the three critical security bugs confirmed in codebase)
**Research flag:** Skip — implementation is fully specified in STACK.md and ARCHITECTURE.md; no unknowns

### Phase 2: Microsoft Outlook Integration

**Rationale:** Multi-provider sync is the single most important table-stakes feature. The refactor-first approach (consolidate Google functions into provider-agnostic pattern, then add Microsoft) avoids building parallel duplicate functions. Microsoft OAuth is structurally identical to Google at the flow level — same auth code flow, different endpoints and field names.
**Delivers:** `provider-oauth` edge function (consolidates Google + adds Microsoft), `provider-calendar-sync` edge function (consolidates Google + adds Microsoft Graph adapter), Microsoft OAuth URL construction in `CalendarConnections.tsx`, updated `AuthCallback.tsx` with provider dispatch
**Uses:** Microsoft Identity Platform v2.0, Microsoft Graph API v1.0, existing Web Crypto module from Phase 1
**Implements:** Provider adapter pattern from ARCHITECTURE.md
**Avoids:** Pitfalls 4 (Microsoft token semantics), 12 (sync pagination), 14 (timezone fragility)
**External dependency:** Azure app registration and Microsoft publisher verification (Pitfall 7) must start early — run in parallel with development, not after
**Research flag:** Low — Microsoft OAuth endpoints and Graph API field mappings are verified and documented in STACK.md; Azure enterprise consent flow (Pitfall 7) needs validation with a real Microsoft 365 work account

### Phase 3: Settings Persistence

**Rationale:** The settings UI exists and looks functional but is entirely disconnected from the database. Fake settings that reset on refresh are worse than no settings — they actively mislead users and erode trust. This phase is wiring, not building: a new hook, a migration for wellness columns, and connecting existing UI components.
**Delivers:** `useSettings` hook with TanStack Query, database-backed sync/notification/wellness preferences, migration adding wellness columns to `user_settings`, settings UI that actually persists
**Uses:** TanStack Query (existing), Supabase `user_settings` table (existing)
**Avoids:** Pitfall 16 (fake settings), prerequisite for wellness engine configuration
**Research flag:** Skip — standard TanStack Query CRUD pattern; `user_settings` table and RLS already exist

### Phase 4: Wellness Engine

**Rationale:** The product's core differentiator. Depends on multi-provider meeting data (Phase 2 complete) and persisted settings (Phase 3 complete). All required technology is already in the project — the `breathe` CSS animation, `date-fns`, TanStack Query cache. This phase is pure product work on top of solid infrastructure.
**Delivers:** `BreathingOverlay` component (box breathing, animated circle, always-dismissible), `TransitionBufferCard` inline indicators in meeting list, meeting density indicator, meeting-free day celebration, daily tip rotation (10-15 tips, client-side rotation by date), `useWellnessEngine` hook
**Uses:** CSS `@keyframes breathe` (existing), `date-fns` `differenceInMinutes` (existing), Browser Notification API, Page Visibility API, `setTimeout`
**Implements:** Client-side WellnessEngine architecture from ARCHITECTURE.md
**Avoids:** Pitfall 8 (tab throttling — visibilitychange catch-up), Pitfall 9 (notification permission — pre-permission dialog, in-tab fallback)
**Research flag:** Low for implementation; the pre-permission dialog pattern for Notification API (Pitfall 9) is the highest-risk UX decision and should be prototyped early in the phase

### Phase 5: Auth Improvements

**Rationale:** Email verification and password reset are baseline requirements for public launch but are entirely independent of all other phases — purely Supabase configuration changes plus UI screens. Token revocation on disconnect closes the zombie token security gap.
**Delivers:** Email verification enforcement in `AuthContext` / `ProtectedRoute`, "check your email" post-signup screen, password reset flow (Supabase Auth built-in), OAuth token revocation on disconnect (Google + Microsoft revocation endpoints)
**Uses:** Supabase Auth built-in email verification and password recovery (existing `@supabase/supabase-js`)
**Avoids:** Pitfall 5 (zombie tokens), Pitfall 10 (email verification bypass)
**External dependency:** Google OAuth verification process (Pitfall 6, 4-6 weeks) must be initiated no later than Phase 2; track as a parallel workstream
**Research flag:** Skip — Supabase Auth email/password is fully documented and already integrated in the codebase

### Phase Ordering Rationale

- Security must come first: three active vulnerabilities in the shared OAuth/sync infrastructure; adding Microsoft OAuth on a vulnerable base doubles the attack surface without doubling the security work to fix it later
- Microsoft OAuth before wellness: meeting data from both providers feeds the wellness engine's analysis; a Google-only wellness engine undersells the feature and creates a dependency on users having already connected Google
- Settings before wellness: the wellness engine reads `wellness_breathing_enabled` and `wellness_breathing_minutes_before` from `user_settings`; without persisted settings the engine has no configuration to act on
- Auth improvements are independent: Supabase handles the hard parts; can run partially in parallel with Phase 3 or 4 if resources allow

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Microsoft Outlook):** Validate enterprise admin consent behavior (Pitfall 7) with a real Microsoft 365 work account before finalizing the AuthCallback flow; the Azure portal app registration walkthrough should be researched during phase planning

Phases with standard patterns (skip research-phase):
- **Phase 1 (Security):** Implementation fully specified; Web Crypto AES-256-GCM is a Web Standard with verified Deno support
- **Phase 3 (Settings):** Standard TanStack Query mutation pattern; no architectural decisions remaining
- **Phase 4 (Wellness):** Browser APIs are well-documented; the breathing animation approach is established; only UX calibration (timing, defaults) remains
- **Phase 5 (Auth):** Supabase Auth email/password is authoritative and already partially integrated

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Microsoft Identity Platform endpoints verified via official docs (2026-03-22); Web Crypto API is a Web Standard available natively in Deno; no new npm packages required; all additions use existing project dependencies |
| Features | MEDIUM | Competitive analysis based on training data up to May 2025; specific competitor feature sets may have evolved; structural analysis and anti-feature recommendations are sound regardless |
| Architecture | HIGH | Provider adapter and edge function routing patterns verified against existing codebase; Supabase Vault assessment is LOW confidence (docs access denied during research — see Gaps) |
| Pitfalls | HIGH (security, browser APIs), MEDIUM (Microsoft-specific, Google verification process) | Security bugs confirmed by direct codebase inspection; browser tab throttling is stable well-documented browser behavior; Microsoft token semantics and Google verification process based on training data |

**Overall confidence:** HIGH

### Gaps to Address

- **Supabase Vault `pgsodium`:** Architecture research could not access current Vault docs. The recommendation to use application-level edge function encryption over Vault is justified on security principles (key in separate security boundary), but Vault's transparent column encryption should be validated against current docs before Phase 1 planning concludes.
- **Microsoft enterprise consent flow:** Pitfall 7 documents that enterprise Microsoft 365 organizations may block individual user consent for `Calendars.Read`. Validate with a real Microsoft 365 work account during Phase 2 planning — not after implementation.
- **Google OAuth verification timeline:** Pitfall 6 notes a 4-6 week verification process for apps with sensitive scopes. Initiate no later than Phase 2 to avoid blocking the public launch. Prepare privacy policy and terms of service pages as parallel workstreams.
- **Token migration script:** Existing Google tokens are stored as plaintext. A one-time edge function that reads each `calendar_connections` row, encrypts in-memory, and writes back is needed as part of Phase 1. Must run before any code change that expects encrypted tokens. Plan deployment sequencing carefully to avoid a window where old code expects plaintext and new code expects ciphertext.
- **Microsoft 90-day refresh token expiry:** Store `refresh_token_expiry` at connection time. Implement proactive re-auth prompting before expiry. The exact behavior at the boundary needs integration testing — not resolvable through research alone.

## Sources

### Primary (HIGH confidence)
- Microsoft Identity Platform OAuth 2.0 auth code flow: https://learn.microsoft.com/en-us/graph/auth-v2-user (verified 2026-03-22)
- Microsoft Graph calendarView API: https://learn.microsoft.com/en-us/graph/api/user-list-calendarview (verified 2026-03-22)
- Microsoft Graph calendar list events: https://learn.microsoft.com/en-us/graph/api/calendar-list-events (verified 2026-03-22)
- Web Crypto API (AES-GCM): Web Standard, natively available in Deno runtime
- Browser Notification API: W3C Notifications API specification, works from foreground tabs without service worker
- Page Visibility API: W3C specification, stable behavior across major browsers since 2020
- OAuth 2.0 RFC 6749: state parameter CSRF protection, well-established standard
- Existing MeeThing codebase: `google-oauth/index.ts`, `google-calendar-sync/index.ts`, `AuthCallback.tsx`, `CalendarConnections.tsx`, migration files (direct code review, 2026-03-22)

### Secondary (MEDIUM confidence)
- Competitor feature analysis (Reclaim.ai, Fantastical, Notion Calendar, Amie, Headspace, Calm): training data up to May 2025; structural patterns are stable; specific feature sets may have evolved
- Google OAuth verification requirements: training data; process steps and timeline may have changed
- Microsoft Graph API enterprise consent behavior: Azure AD consent model is well-established but organizational policies vary

### Tertiary (LOW confidence)
- Supabase Vault `pgsodium` transparent column encryption: docs access denied during research; recommendation based on training data and security principles

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
