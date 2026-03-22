# MeeThing

## What This Is

MeeThing is a wellness-focused calendar companion for people who want a calmer, more intentional relationship with their meetings. It connects Google and Microsoft Outlook calendars, shows upcoming meetings in a beautiful distraction-free interface, and provides mindful moments — breathing reminders and transition time — to help users feel grounded rather than overwhelmed by their schedule.

## Core Value

A calm, beautiful alternative to your calendar app that makes meetings feel manageable, not draining.

## Requirements

### Validated

These capabilities exist and work in the current codebase:

- ✓ User can sign up with email and password — existing
- ✓ User can sign in and sign out — existing
- ✓ User can connect Google Calendar via OAuth — existing
- ✓ Upcoming meetings (7-day window) sync from Google Calendar — existing
- ✓ Meetings are displayed in a clean, organised list — existing
- ✓ Protected routes require authentication — existing
- ✓ Glassmorphism / nature design system established — existing

### Active

Requirements for public v1 launch.

**Security (must fix before public launch)**

- [ ] **SEC-01**: OAuth tokens are encrypted at rest (currently stored plaintext despite `_encrypted` column naming)
- [ ] **SEC-02**: OAuth CSRF protection uses a random state token (currently static string "google")
- [ ] **SEC-03**: Edge Function CORS restricted to app origin (currently wildcard `*`)

**Authentication**

- [ ] **AUTH-01**: Email verification is required before accessing the app (currently bypassed)
- [ ] **AUTH-02**: User can reset password via email link (no reset flow exists)
- [ ] **AUTH-03**: OAuth token is revoked with provider when a calendar is disconnected

**Calendar Integration**

- [ ] **CAL-01**: User can connect a Microsoft Outlook calendar via OAuth
- [ ] **CAL-02**: Meetings sync from Outlook with the same 7-day window as Google
- [ ] **CAL-03**: Manual sync ("Sync now") works for all connected providers

**Settings**

- [ ] **SET-01**: Sync frequency setting reads from and writes to the database (currently disconnected)
- [ ] **SET-02**: Notification preferences read from and write to the database (currently disconnected)

**Wellness**

- [ ] **WEL-01**: User can enable breathing reminders (mindful moment before or between meetings)
- [ ] **WEL-02**: App surfaces a configurable transition buffer between back-to-back meetings

**Polish**

- [ ] **POL-01**: All loading and error states are handled gracefully across the app
- [ ] **POL-02**: Empty states are informative (no connected calendars, no meetings today, etc.)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Energy & mood tracking after meetings | Core to the long-term wellness vision but deferred to v2 — ships the UI skeleton without the reflection loop |
| Apple Calendar integration | Deprioritised in favour of Google + Outlook for v1 |
| Meeting notes and takeaways | v2 — requires richer meeting detail UI |
| Meeting quality ratings | v2 — part of the track & reflect loop |
| Real-time push notifications | v2 — high complexity, not required for core calm experience |
| Mobile app | Web-first; mobile is a future milestone |

## Context

**Existing codebase state (from `/gsd:map-codebase` 2026-03-22):**

- Auth scaffolding is complete (Supabase Auth + AuthContext + ProtectedRoute)
- Google Calendar OAuth flow works end-to-end (AuthCallback → Edge Function → meetings sync)
- Microsoft Outlook and Apple Calendar show "Coming soon" UI — no backend implementation
- `CalendarSettings.tsx` and all its sub-components (`SyncSettings`, `NotificationSettings`, `WellnessSection`) are fully disconnected from the database — nothing persists
- `user_settings` table exists in the DB schema but is never read or written by the app
- OAuth tokens have `*_encrypted` column names but are stored as plaintext strings — no encryption is implemented
- Two conflicting lockfiles (`package-lock.json` + `bun.lockb`) — standardise on one package manager before public launch
- No test framework configured; `npm run lint` is the only automated quality check

**Target user:** Knowledge workers who attend 3–6 meetings per day and feel drained rather than productive. The audience is broad but the aesthetic and wellness positioning will self-select for users who resonate with intentional, calm software.

## Constraints

- **Tech stack**: React 18 + Vite + TypeScript + Supabase — established, do not migrate
- **Providers**: Google Calendar and Microsoft Outlook for v1; Apple Calendar deferred
- **Design system**: Glassmorphism + wellness/nature palette is the brand — all new UI must conform
- **Backend**: Supabase Edge Functions (Deno) for all server-side logic — no custom API server

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Wellness / nature aesthetic as brand differentiator | Intentional — this is what makes MeeThing distinct from productivity-first calendar tools | — Pending |
| Track & reflect (energy/mood) deferred to v2 | Keeps v1 achievable while preserving the deeper wellness vision | — Pending |
| Apple Calendar deferred to v2 | Google + Outlook covers the majority of target users; Apple adds OAuth complexity | — Pending |
| Google-only OAuth today needs encryption fix before multi-user public launch | Security risk is acceptable at personal/small-group scale but not for public launch | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after initialization*
