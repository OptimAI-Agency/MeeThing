# MeeThing Copy Glossary

**Source of truth for all user-facing language.**
Implementation: `src/copy/glossary.ts`
Phase: 6 — Language Foundation (COPY-01)

## Voice principles

- Calm before action — lead with the feeling, then the verb
- Celebratory, not broken, when nothing to show
- Ambient, not urgent — syncing is invisible, errors are low-stakes
- Human, not utility — "Your Calendar", not "Calendar Integration"
- No gamification language anywhere — no streaks, scores, counters

## Deprecated → Replacement

| Deprecated | Replacement | Reason | Decision |
|------------|-------------|--------|----------|
| Calendar Integration | Your Calendar | Utility vocabulary replaced with possessive calm | D-01 |
| Calendar Settings | Your Settings | Same framing pivot | D-02 |
| Calendar Connections | Your Calendars | Human framing over system framing | D-03 |
| Connections (tab) | Your Calendars | Same | D-03 |
| "Connect your calendars and streamline your meeting management" | "A calmer view of your week. Connect your calendar to begin." | Wellness positioning — feeling before action | D-04, D-10 |
| "Sync now" (button label) | (icon-only; aria-label "Refresh your calendar") | Demoted; syncing is ambient | D-05, D-07 |
| "Syncing…" (visible text) | (spinner only, no text) | In-flight state is ambient | D-07 |
| "Synced" / "Your calendar events have been refreshed." | "All caught up" / "Your day is up to date." | Soft confirmation, not technical | D-06 |
| "Sync failed" / "Sync failed — check your connection and try again." | "Couldn't reach your calendar" / "Try again in a moment." | Low-urgency framing, not red-banner failure | D-08 |
| "Your schedule is clear" / "Enjoy the space" | "A spacious day" / "Nothing on the books today. Enjoy the quiet." | Celebratory and specific — empty calendar is a gift | D-09 |
| "Welcome! Let's get you connected" / "Let's get you connected" | "A calmer view of your week starts here" / "Connect your calendar to begin." | Lead with calm outcome, then action | D-10 |
| "Welcome to Calendar Integration" | "Your Calendar" (heading) + D-04 subheading | Same | D-01, D-04 |

## Key mapping (TS → human)

| Glossary key | Human copy |
|--------------|------------|
| `COPY.nav.calendar` | Your Calendar |
| `COPY.nav.settings` | Your Settings |
| `COPY.nav.connections` | Your Calendars |
| `COPY.welcome.heading` | Your Calendar |
| `COPY.welcome.subheading` | A calmer view of your week. Connect your calendar to begin. |
| `COPY.welcome.cta` | Connect your calendar |
| `COPY.sync.iconAriaLabel` | Refresh your calendar |
| `COPY.sync.successTitle` | All caught up |
| `COPY.sync.successBody` | Your day is up to date. |
| `COPY.sync.errorTitle` | Couldn't reach your calendar |
| `COPY.sync.errorBody` | Try again in a moment. |
| `COPY.sync.sessionExpiredTitle` | Reconnect to continue |
| `COPY.sync.sessionExpiredBody` | Your Google Calendar needs to reconnect — just a moment. |
| `COPY.empty.noMeetingsTitle` | A spacious day |
| `COPY.empty.noMeetingsBody` | Nothing on the books today. Enjoy the quiet. |
| `COPY.empty.noConnectionTitle` | A calmer view of your week starts here |
| `COPY.empty.noConnectionBody` | Connect your calendar to begin. |
| `COPY.errors.meetingsLoadTitle` | Couldn't refresh your calendar |
| `COPY.errors.meetingsLoadBody` | Try again in a moment. |
| `COPY.errors.retry` | Try again |
| `COPY.settings.heading` | Your Settings |

## How to use

1. Import: `import { COPY } from "@/copy/glossary";`
2. Reference in JSX: `<h1>{COPY.welcome.heading}</h1>`
3. Reference in toasts: `toast({ title: COPY.sync.successTitle, description: COPY.sync.successBody })`
4. Adding new copy: add the key to `src/copy/glossary.ts` FIRST, then this doc, then use it in a component. Never hardcode user-facing strings.

## Flagged for reviewer judgment

> Sourced from Phase 6 Plan 03 full sweep audit — see `.planning/phases/06-language-foundation/06-03-AUDIT.md` for methodology.

| File | Line | Current string | Why flagged | Suggested phase |
|------|------|----------------|-------------|-----------------|
| src/components/Features.tsx | ~17 | "Meeting Analysis" card title | Marketing positioning; no glossary key | Phase 9 (copywriting) |
| src/components/Features.tsx | ~24 | "Environment Suggestions" card title | Out-of-scope v2.0 feature; likely removed | Phase 9 |
| src/components/Features.tsx | ~31 | "Smart Notifications" / "Productivity" badge | "Productivity" contradicts calm brand | Phase 9 |
| src/components/Features.tsx | ~38 | "Role-Based Suggestions" card title | Out-of-scope | Phase 9 |
| src/components/Features.tsx | ~45 | "Wellness Tracking" / "Monitor your meeting wellness score" | "score" is gamification language; contradicts no-gamification rule | Phase 9 |
| src/components/calendar/CalendarConnections.tsx | ~277 | "Events sync on connection" | Utility bullet under success block; could be warmer | Phase 7 (today-first layout) |
| src/components/calendar/CalendarConnections.tsx | ~281 | "Next 7 days of events" | Same success block | Phase 7 |
| src/components/calendar/CalendarConnections.tsx | ~285 | "View in Overview tab" | References renamed tab — "Overview" is now "Your Calendar"; stale label | Phase 7 (tab rename follow-up) |
| src/components/Hero.tsx | ~13 | "Transform Your Meetings with Wellness-Focused Suggestions" | v1 marketing hero; Hero.tsx is not the active landing hero | Phase 9 |
| src/components/Hero.tsx | ~27 | "Start Free Trial" / "Watch Demo" | Stale CTAs; product has no free trial; Hero.tsx not active | Phase 9 |
| src/components/calendar/MeetingsList.tsx | ~34 | "Upcoming Meetings" heading | Utility framing; no locked decision | Phase 7 (today-first layout rewrite) |
| src/components/calendar/MeetingsList.tsx | ~36 | "Your next 7 days of events" subtitle | Specific to 7-day window; may change with layout | Phase 7 |
| src/components/calendar/MeetingsList.tsx | ~155–158 | "Wellness Tip" / hardcoded breathing tip text | Hardcoded tip; needs Phase 9 voice review | Phase 9 |
| src/components/calendar/settings/SyncSettings.tsx | ~19 | "Sync Preferences" heading | "Sync" borderline; functional settings context | Phase 8 (settings UX) |
| src/components/calendar/settings/SyncSettings.tsx | ~21 | "Configure how often your calendars update" | Functional description; calm enough; borderline | Phase 8 |
| src/components/calendar/settings/NotificationSettings.tsx | ~36 | "Manage your meeting reminders and alerts" | "alerts" lowercase in prose — not the forbidden label, but borderline | Phase 8 |
| src/components/calendar/settings/WellnessSection.tsx | ~12 | "Wellness Integration" heading | "Integration" borderline (cf. D-01); acceptable in wellness context | Phase 8 |
| src/pages/AuthCallback.tsx | ~65 | "Google Calendar connected" / "Your events are ready." | Functional OAuth toast; could be warmed up to COPY pattern | Phase 7 |

## Forbidden vocabulary

The following terms must not appear in user-facing text anywhere in `src/`:

- Dashboard
- Calendar Integration
- Calendar Settings (as a label — the settings section)
- Calendar Connections (as a label)
- Connections (as a tab/section label)
- Alerts (as notifications label)
- Sync now (as a visible button label)
- Syncing (as visible in-flight text)
- Sync failed / Synced (as toast/status text)

Referenced only in code identifiers, class names, or comments is acceptable — the prohibition is on **user-facing rendered text**.
