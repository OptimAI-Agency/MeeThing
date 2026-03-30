# Roadmap: MeeThing

## Overview

MeeThing ships as a wellness-focused Google Calendar companion for public launch. The existing codebase has working auth, Google OAuth, and meeting display, but three confirmed security vulnerabilities must be resolved before any public exposure. After security hardening, we make Google Calendar sync robust and reliable, wire the existing settings UI to the database, build the wellness engine (the product differentiator), and close auth gaps. Google OAuth verification (4-6 weeks) must be initiated in parallel with Phase 1 to avoid blocking launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security Hardening** - Encrypt OAuth tokens, fix CSRF, restrict CORS
- [x] **Phase 2: Google Calendar Reliability** - Pagination, error handling, clean disconnect (completed 2026-03-26)
- [ ] **Phase 3: Settings Persistence** - Wire existing settings UI to the database
- [ ] **Phase 4: Wellness Engine** - Breathing exercises, transition buffers, polish
- [ ] **Phase 5: Auth Hardening** - Email verification, password reset, token revocation

## Phase Details

### Phase 1: Security Hardening
**Goal**: All OAuth tokens are encrypted at rest and the OAuth flow is protected against CSRF and cross-origin attacks
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. OAuth tokens stored in `calendar_connections` are AES-256-GCM encrypted -- no plaintext tokens exist in the database
  2. Connecting Google Calendar uses a cryptographically random state parameter that is validated on callback -- static string "google" is gone
  3. Edge functions reject requests from origins other than the app's own domain
  4. Existing Google Calendar connections continue to work after token migration (no user-visible disruption)
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Shared crypto/CORS modules, edge function encryption, forced-reconnect migration
- [ ] 01-02-PLAN.md — CSRF state parameter fix (sessionStorage-based)

**Parallel workstream**: Initiate Google OAuth verification process (privacy policy, terms of service, verification application). This is a 4-6 week external process that runs alongside development.

### Phase 2: Google Calendar Reliability
**Goal**: Google Calendar sync is robust enough for users with dense schedules -- no silently missing events, clear error feedback, clean disconnect
**Depends on**: Phase 1
**Requirements**: CAL-01, CAL-02, CAL-03
**Success Criteria** (what must be TRUE):
  1. A user with more than 50 events in a 7-day window sees all of them -- sync paginates until all events are fetched
  2. "Sync now" reports success or a clear error message to the user -- no silent failures
  3. When a user disconnects Google Calendar, the OAuth token is revoked with Google and all synced meetings are deleted from the database
  4. Token refresh failures during sync surface a "re-connect" prompt rather than failing silently
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Pagination + structured error responses in sync edge function, new disconnect edge function
- [x] 02-02-PLAN.md — Frontend error handling toasts, disconnect confirmation dialog, last-synced display

### Phase 3: Settings Persistence
**Goal**: User preferences actually persist -- sync frequency, notification preferences, and wellness toggles survive page refreshes and sessions
**Depends on**: Phase 1
**Requirements**: SET-01, SET-02
**Success Criteria** (what must be TRUE):
  1. User changes sync frequency in settings, refreshes the page, and sees the saved value
  2. User changes notification preferences, logs out and back in, and sees the saved values
  3. Wellness settings (breathing enabled, minutes before, transition buffer) persist to the database and are available for the wellness engine in Phase 4
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Settings data layer: migration, types, useUserSettings hook
- [x] 03-02-PLAN.md -- Wire settings UI to database

### Phase 4: Wellness Engine
**Goal**: Users experience MeeThing's core differentiator -- mindful breathing before meetings and awareness of back-to-back scheduling -- with polished loading, error, and empty states throughout
**Depends on**: Phase 2, Phase 3
**Requirements**: WEL-01, WEL-02, POL-01, POL-02
**Success Criteria** (what must be TRUE):
  1. A user with breathing reminders enabled sees a guided breathing animation (inhale/hold/exhale) at the configured time before their next meeting
  2. A user with back-to-back meetings sees a visible transition buffer warning identifying the gap-free sequence
  3. The breathing overlay is always dismissible and conforms to the glassmorphism design system
  4. All data-fetching screens show explicit loading spinners, error messages with recovery actions, and informative empty states (no calendars, no meetings, sync error)
  5. The app works correctly when the browser tab is backgrounded and refocused -- missed reminders are caught up via Page Visibility API
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Breathing overlay system: useBreathingReminder hook, BreathingOverlay + BreathingCircle components, MissedReminderBanner, CSS keyframes
- [ ] 04-02-PLAN.md — Transition buffer warnings, skeleton loading states, calm empty/error states across all data-fetching paths

### Phase 5: Auth Hardening
**Goal**: Authentication meets public-launch standards -- unverified emails cannot access the app, users can recover forgotten passwords, and disconnecting a provider fully cleans up
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A new user who signs up is shown a "check your email" screen and cannot access /calendar until they verify
  2. A user who forgets their password can request a reset email, click the link, and set a new password
  3. When a user disconnects a calendar provider, the OAuth token is revoked with the provider (not just deleted from the database)
  4. Existing verified users are not disrupted by the email verification enforcement
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
Note: Phases 2 and 3 share Phase 1 as their only dependency, so they could execute in either order. Phase 4 requires both 2 and 3. Phase 5 only requires Phase 1 and can run any time after it.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 2/2 | Complete | 2026-03-25 |
| 2. Google Calendar Reliability | 2/2 | Complete   | 2026-03-26 |
| 3. Settings Persistence | 1/2 | In progress | - |
| 4. Wellness Engine | 0/2 | Not started | - |
| 5. Auth Hardening | 0/TBD | Not started | - |
