# Roadmap: MeeThing

## Overview

MeeThing ships as a wellness-focused Google Calendar companion for public launch. The existing codebase has working auth, Google OAuth, and meeting display, but three confirmed security vulnerabilities must be resolved before any public exposure. After security hardening, we make Google Calendar sync robust and reliable, wire the existing settings UI to the database, build the wellness engine (the product differentiator), and close auth gaps. Google OAuth verification (4-6 weeks) must be initiated in parallel with Phase 1 to avoid blocking launch.

Milestone v2.0 (Companion Experience) transforms MeeThing from glassmorphic utility into a lingering daily companion. It is an additive milestone on a solid foundation: language overhaul, today-first layout, companion UI components (greeting, rhythm timeline, proportional cards), ambient beauty (typeface, breathing background, glass hierarchy), wind-down experience, and a self-contained web push infrastructure track.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### v1.0 — Public Launch

- [x] **Phase 1: Security Hardening** - Encrypt OAuth tokens, fix CSRF, restrict CORS
- [x] **Phase 2: Google Calendar Reliability** - Pagination, error handling, clean disconnect (completed 2026-03-26)
- [ ] **Phase 3: Settings Persistence** - Wire existing settings UI to the database
- [ ] **Phase 4: Wellness Engine** - Breathing exercises, transition buffers, polish (gap closure in progress)
- [ ] **Phase 5: Auth Hardening** - Email verification, password reset, token revocation

### v2.0 — Companion Experience

- [ ] **Phase 6: Language Foundation** - Copy glossary + sweep across all existing UI strings
- [ ] **Phase 7: Today-First Layout** - Default today view with URL-persisted week toggle
- [ ] **Phase 8: Ambient Beauty Foundation** - Fraunces typeface, breathing background, glass hierarchy audit
- [ ] **Phase 9: Companion UI Components** - Contextual greeting, Today's Rhythm timeline, proportional time-tinted cards, weekly tone
- [ ] **Phase 10: Wind-Down Experience** - Calm end-of-day acknowledgment with optional 1-tap reflection
- [ ] **Phase 11: Push Notification Infrastructure** - Pre-prompt UX, VAPID push dispatch, settings management

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
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Breathing overlay system: useBreathingReminder hook, BreathingOverlay + BreathingCircle components, MissedReminderBanner, CSS keyframes
- [x] 04-02-PLAN.md — Transition buffer warnings, skeleton loading states, calm empty/error states across all data-fetching paths
- [x] 04-03-PLAN.md — Gap closure: replace CalendarHub overview tab bare spinner with skeleton loading state

### Phase 5: Auth Hardening
**Goal**: Authentication meets public-launch standards -- unverified emails cannot access the app, users can recover forgotten passwords, and disconnecting a provider fully cleans up
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A new user who signs up is shown a "check your email" screen and cannot access /calendar until they verify
  2. A user who forgets their password can request a reset email, click the link, and set a new password
  3. When a user disconnects a calendar provider, the OAuth token is revoked with the provider (not just deleted from the database)
  4. Existing verified users are not disrupted by the email verification enforcement
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Email verification gate + logout button (AUTH-01)
- [x] 05-02-PLAN.md — Password recovery flow (AUTH-02)

### Phase 6: Language Foundation
**Goal**: Every user-facing string in MeeThing reflects a calm, human-first voice — utility/dashboard vocabulary is gone and a reusable copy glossary governs all future text
**Depends on**: Nothing (first v2.0 phase; hard prerequisite for all text-bearing work in Phases 8–11)
**Requirements**: COPY-01
**Success Criteria** (what must be TRUE):
  1. A user browsing the app never encounters the words "Dashboard", "Calendar Integration", "Connections", "Alerts", or a primary "Sync now" button — replacements from the glossary appear instead ("Today", "Your Calendar", auto-sync is ambient)
  2. A documented copy glossary artifact exists in the repo mapping every deprecated term to its calm-voice replacement, and every existing UI string has been reviewed against it
  3. Empty and light-day states read as celebratory, not broken (e.g. "A spacious day — enjoy the quiet")
  4. Downstream phases can reference the glossary as the single source of truth for all new text (greeting, wind-down, notifications, tone language)
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Create src/copy/glossary.ts (frozen COPY constant) + docs/copy-glossary.md mirror
- [ ] 06-02-PLAN.md — Sweep calendar app surfaces (CalendarHub, EmptyStates, CalendarConnections, SettingsHeader) + demote sync to icon-only
- [ ] 06-03-PLAN.md — Sweep landing surfaces (Hero, Features) + D-12 full-sweep audit + populate glossary flagged section

### Phase 7: Today-First Layout
**Goal**: The calendar opens on today by default and the today/week toggle is URL-persistent, giving all companion features a stable today context to derive from
**Depends on**: Phase 6
**Requirements**: TODAY-01, TODAY-02
**Success Criteria** (what must be TRUE):
  1. A user who opens the app lands on a today-only view by default, not the full week
  2. A user can toggle between today-only and full week; the active view is reflected in the URL (`?view=today` | `?view=week`) and survives refresh, back/forward, and link sharing
  3. The underlying `useTodayMeetings` hook is always filtered to today regardless of the active view toggle — the greeting, rhythm, and wind-down never show week-scoped counts
  4. Switching views preserves scroll position and does not cause layout flicker
**Plans**: TBD
**UI hint**: yes

### Phase 8: Ambient Beauty Foundation
**Goal**: MeeThing's visual and typographic atmosphere matches its calm voice — warm serif on emotional surfaces, a slow breathing background, and a legible glassmorphism depth hierarchy
**Depends on**: Phase 6
**Requirements**: BEAUTY-01, BEAUTY-02, BEAUTY-03
**Success Criteria** (what must be TRUE):
  1. The Fraunces variable serif is self-hosted and applied exclusively to high-emotion surfaces (greeting headline, breathing overlay phase text, wind-down copy) with `size-adjust` fallback producing no visible FOUT; CLS measured under 0.1 on throttled 3G
  2. The background image overlay animates with a slow 10–12s breathing cycle using CSS keyframes on transform + opacity only (never backdrop-filter); animation stops completely under `prefers-reduced-motion` and pauses when the browser tab is hidden
  3. A user can visually distinguish foreground cards (`glass-light`) from primary panels and overlays (`glass-panel`) at a glance — the depth hierarchy is legible across every surface
  4. No visible animation jank on a mid-tier mobile device; battery drain on idle tab is indistinguishable from pre-v2.0
**Plans**: TBD
**UI hint**: yes

### Phase 9: Companion UI Components
**Goal**: Users see the signature companion surfaces — a contextual greeting, Today's Rhythm timeline, proportional time-tinted meeting cards, and weekly tone language — all derived from the existing meetings cache with no new network calls
**Depends on**: Phase 7, Phase 8
**Requirements**: COPY-02, COPY-03, TODAY-03, CARD-01, CARD-02
**Success Criteria** (what must be TRUE):
  1. On opening the app, a user sees a contextual greeting at the top of the today view containing their first name, today's meeting count, and the largest free gap (e.g. "Good morning, Jen. You have 3 meetings today. Biggest breathing room: 2h after 2 PM.")
  2. A user sees Today's Rhythm — a thin horizontal timeline visualizing meeting blocks vs. free gaps for today, with gaps named and labeled, rendered from the existing meetings cache
  3. A user sees meeting cards whose vertical height is proportional to duration — a 2-hour block occupies visibly more space than a 30-minute block
  4. Meeting cards carry a time-of-day accent tint (morning warm amber, midday neutral sage, afternoon/evening cool blue); all variants pass WCAG AA contrast for body text
  5. A user sees weekly tone language somewhere in the week view that reflects the week's density in natural words ("A full week ahead" / "A lighter week — space to think")
**Plans**: TBD
**UI hint**: yes

### Phase 10: Wind-Down Experience
**Goal**: After the user's last meeting of the day ends, the today view transitions into a calm wind-down state that acknowledges the day and optionally invites a 1-tap reflection — with no streaks, scores, or pressure
**Depends on**: Phase 9
**Requirements**: WIND-01, WIND-02
**Success Criteria** (what must be TRUE):
  1. When a user's last meeting of the day has ended (contextual trigger, not wall-clock), the today view smoothly transitions to a wind-down panel rendered inline — not behind a nav link
  2. A user can record an optional 1-tap reflection (free text or emoji) stored locally, or dismiss the wind-down instantly and continue using the app
  3. The wind-down flow contains no streaks, scores, badges, counters, or gamification language — anywhere
  4. Edge cases (all-day events, meetings past midnight, tab backgrounded through the trigger window) resolve cleanly without misfiring or blocking navigation
**Plans**: TBD
**UI hint**: yes

### Phase 11: Push Notification Infrastructure
**Goal**: Users who opt in receive a single calm pre-meeting breathing reminder via the browser, with a pre-prompt UX that protects against permanent denial and server-side rate limiting that enforces the calm brand promise from day one
**Depends on**: Phase 6 (notification copy uses glossary); can run in parallel with Phases 7–10
**Requirements**: PUSH-01, PUSH-02, PUSH-03
**Success Criteria** (what must be TRUE):
  1. A user who chooses to enable push sees an in-app pre-prompt explaining what will be sent and why before the native browser permission dialog ever appears; the browser dialog is never triggered on page load or automatically
  2. With push enabled, a user receives a pre-meeting breathing reminder in their configured window, delivered via a Supabase Edge Function using VAPID; a hard daily cap (≤5) and configurable quiet hours are enforced server-side regardless of client state
  3. A user can enable/disable push and adjust quiet hours in Settings; if browser permission has been denied, the UI detects that state and surfaces a clear per-browser recovery path
  4. The service worker is push-only with no `fetch` handler or `caches.open` calls — the app does not silently become a cached PWA, and an "update available" recovery path exists
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**

v1.0 phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5. Phases 2 and 3 share Phase 1 as their only dependency. Phase 4 requires both 2 and 3. Phase 5 only requires Phase 1.

v2.0 phases execute: 6 -> 7 -> 8 -> 9 -> 10, with 11 running in parallel any time after Phase 6. Phase 7 and Phase 8 both depend on Phase 6 and can run in either order. Phase 9 requires both 7 and 8. Phase 10 requires Phase 9.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 2/2 | Complete | 2026-03-25 |
| 2. Google Calendar Reliability | 2/2 | Complete   | 2026-03-26 |
| 3. Settings Persistence | 1/2 | In progress | - |
| 4. Wellness Engine | 2/3 | Gap closure | - |
| 5. Auth Hardening | 1/2 | In Progress|  |
| 6. Language Foundation | 0/3 | Planned | - |
| 7. Today-First Layout | 0/0 | Not started | - |
| 8. Ambient Beauty Foundation | 0/0 | Not started | - |
| 9. Companion UI Components | 0/0 | Not started | - |
| 10. Wind-Down Experience | 0/0 | Not started | - |
| 11. Push Notification Infrastructure | 0/0 | Not started | - |
