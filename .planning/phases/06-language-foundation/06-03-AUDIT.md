# Phase 6 — Plan 03 Full-Sweep Audit

**Completed:** 2026-04-07
**Scope:** Every `.tsx` file under `src/components/` and `src/pages/` with user-facing text.
**Method:** Manual file read + grep of forbidden vocabulary.

## Forbidden vocabulary grep result

Command:
```
grep -rnE '(Dashboard|Calendar Integration|Calendar Settings|Calendar Connections|"Sync now"|Syncing…|"Synced"|"Alerts"|Let.{1,3}s get you connected|Your schedule is clear)' src/components src/pages
```

Result: **CLEAN**

The only grep hits in `src/` are in `src/copy/glossary.ts` lines 8–9 (comments `// D-01 — was "Calendar Integration"` and `// D-02 — was "Calendar Settings"`). These are code comments documenting the deprecation history, not user-facing rendered text. Per plan rules, comment/identifier references are excluded from the prohibition.

## Files reviewed

| File | Status | Notes |
|------|--------|-------|
| src/components/calendar/CalendarHub.tsx | swept | Plan 02 — all hardcoded strings replaced with COPY constants; tab labels use TAB_LABELS map driven by COPY.nav.* |
| src/components/calendar/EmptyStates.tsx | swept | Plan 02 — NoMeetingsEmpty, NoCalendarEmpty, NoConnectionsEmpty, MeetingsError all use COPY.empty.* and COPY.errors.* |
| src/components/calendar/CalendarConnections.tsx | swept | Plan 02 — header uses COPY.nav.connections; empty state uses COPY.empty.noConnectionTitle/Body; "Welcome! Let's get you connected" removed |
| src/components/calendar/settings/SettingsHeader.tsx | swept | Plan 02 + Plan 03 — "Calendar Settings" replaced with COPY.settings.heading; subheading uses COPY.settings.subheading |
| src/components/Hero.tsx | swept | Plan 03 Task 1 — "Calendar Integration" card title → "Your Calendar"; description → wellness framing |
| src/components/Features.tsx | swept | Plan 03 Task 1 (first card only) — "Calendar Integration" → "Your Calendar"; description and badge updated. Remaining 5 cards flagged below |
| src/components/MinimalHero.tsx | clean | Active landing page hero; no forbidden terms; strings: "Redefine digital meetings.", "Make it your MeeThing", "Let's go for a walk" |
| src/components/Header.tsx | clean | Nav links: "Features", "How it Works", "Pricing", "Get Started" — utility nav labels, no forbidden terms; this component is unused in the current landing (Index.tsx uses MinimalHero only) |
| src/components/Footer.tsx | clean | Unused marketing footer; strings: "MeeThing", footer nav link labels, "Made with [heart] for healthier meetings"; no forbidden terms |
| src/components/MinimalFooter.tsx | clean | Active footer; strings: "MeeThing", "Made with [heart] for healthier meetings"; no forbidden terms |
| src/components/calendar/MeetingsList.tsx | has-flags | "Upcoming Meetings" heading, "Your next 7 days of events" subtitle — utility framing without a locked decision; "Wellness Tip" hardcoded tip text |
| src/components/calendar/CalendarSettings.tsx | clean | Delegate component; no user-facing strings of its own — delegates to SettingsHeader, BackgroundSettings, SyncSettings, NotificationSettings, WellnessSection; toast messages use generic labels |
| src/components/calendar/settings/BackgroundSettings.tsx | has-flags | "Background" section heading; "Choose your preferred nature scene" — borderline utility/wellness; "Background Scene" label |
| src/components/calendar/settings/NotificationSettings.tsx | has-flags | "Notifications" section heading; "Manage your meeting reminders and alerts" — "alerts" (lowercase, in description) is borderline but not the forbidden "Alerts" label; "Meeting Notifications", "Wellness Tips", "Auto Wellness Breaks", "Reminder Time" toggle labels |
| src/components/calendar/settings/SyncSettings.tsx | has-flags | "Sync Preferences" heading; "Configure how often your calendars update" description; "Sync Frequency" label; select options "Every 5 minutes" etc. |
| src/components/calendar/settings/WellnessSection.tsx | has-flags | "Wellness Integration" heading; 4 bullet strings: "Smart break suggestions", "Mindfulness reminders", "Personalized wellness tips", "Focus time protection" — v1 feature list, no locked decisions |
| src/components/wellness/BreathingOverlay.tsx | clean | "This moment is yours before your next meeting." (calm framing); "[meeting] in N minutes"; "Dismiss" button |
| src/components/wellness/MissedReminderBanner.tsx | clean | "You had a breathing moment before [meeting]. Take a moment now." (calm framing); "Dismiss" aria-label |
| src/pages/Index.tsx | clean | No user-facing strings; renders MinimalHero + trademark line "2025 MeeThing™ ~ All rights reserved." |
| src/pages/Login.tsx | clean | "Welcome back", "Sign in to your account", "Email", "Password", "Forgot password?", "Sign in", "Don't have an account?", "Sign up" — standard auth labels, not in scope |
| src/pages/Signup.tsx | clean | "Create account", "Start your wellness journey", "Full Name", "Email", "Password", "Create account", "Already have an account?", "Sign in" — standard auth labels |
| src/pages/VerifyEmail.tsx | clean | "Check your email", verification copy, "Resend verification email", "Back to sign in" — functional email flow copy |
| src/pages/ForgotPassword.tsx | clean | "Reset your password", "Enter your email and we'll send you a reset link", "Send reset link", "Try a different email", "Back to sign in" — standard password reset copy |
| src/pages/ResetPassword.tsx | clean | "Set a new password", "Choose a strong password for your account", "New password", "Confirm password", "Update password", "Verifying your reset link..." — standard password reset copy |
| src/pages/NotFound.tsx | clean | "404", "Oops! Page not found", "Return to Home" — standard error page |
| src/pages/Calendar.tsx | clean | No user-facing strings; renders CalendarHub |
| src/pages/AuthCallback.tsx | clean | "Connecting your calendar…" spinner text; toast strings: "Google Calendar connected", "Connected successfully. Syncing events may take a moment.", "Connection failed" — functional one-off strings for OAuth callback |

## Replaced strings

Cross-reference to Plans 01–03.

- **Plan 01** — Created `src/copy/glossary.ts` with all D-01..D-10 canonical strings plus discretionary keys
- **Plan 02** — Replaced hardcoded strings in CalendarHub.tsx, EmptyStates.tsx, CalendarConnections.tsx, SettingsHeader.tsx with COPY constants
- **Plan 03 Task 1** — Replaced "Calendar Integration" in Hero.tsx and Features.tsx (first card) with inline literal "Your Calendar" + wellness descriptions

## Flagged for reviewer judgment

These strings were reviewed and left unchanged because they have no locked decision in CONTEXT.md. They are candidates for Phase 7, 8, or 9 when those phases define their copy.

| File | Line | Current string | Why flagged | Suggested phase |
|------|------|----------------|-------------|-----------------|
| src/components/Features.tsx | ~17 | "Meeting Analysis" card title | Marketing positioning; no glossary key | Phase 9 (copywriting) |
| src/components/Features.tsx | ~24 | "Environment Suggestions" card title | Out-of-scope v2.0 feature; likely removed | Phase 9 |
| src/components/Features.tsx | ~31 | "Smart Notifications" / "Productivity" badge | "Productivity" contradicts calm brand | Phase 9 |
| src/components/Features.tsx | ~38 | "Role-Based Suggestions" card title | Out-of-scope | Phase 9 |
| src/components/Features.tsx | ~45 | "Wellness Tracking" / "Monitor your meeting wellness score" | "score" is gamification language; contradicts no-gamification rule | Phase 9 |
| src/components/calendar/CalendarConnections.tsx | ~277 | "Events sync on connection" | Utility bullet under success block; acceptable but could be warmer | Phase 7 (today-first layout) |
| src/components/calendar/CalendarConnections.tsx | ~281 | "Next 7 days of events" | Same success block; references "Overview tab" is now "Your Calendar" tab | Phase 7 |
| src/components/calendar/CalendarConnections.tsx | ~285 | "View in Overview tab" | References renamed tab — "Overview" is now "Your Calendar"; stale label | Phase 7 (tab rename follow-up) |
| src/components/Hero.tsx | ~13 | "Transform Your Meetings with Wellness-Focused Suggestions" | v1 marketing hero; likely rewritten entirely; not the active landing hero | Phase 9 |
| src/components/Hero.tsx | ~27 | "Start Free Trial" / "Watch Demo" | CTA strings; product has no free trial — stale copy; Hero.tsx not active | Phase 9 |
| src/components/calendar/MeetingsList.tsx | ~34 | "Upcoming Meetings" heading | Utility framing; no locked decision for this heading | Phase 7 (today-first layout rewrite) |
| src/components/calendar/MeetingsList.tsx | ~36 | "Your next 7 days of events" subtitle | Same as above; specific to 7-day window | Phase 7 |
| src/components/calendar/MeetingsList.tsx | ~155–158 | "Wellness Tip" / hardcoded breathing tip text | Hardcoded; should be dynamic; tip copy needs Phase 9 voice review | Phase 9 |
| src/components/calendar/settings/SyncSettings.tsx | ~19 | "Sync Preferences" heading | "Sync" vocabulary is borderline; kept as section heading since it's functional settings copy | Phase 8 (settings UX) |
| src/components/calendar/settings/SyncSettings.tsx | ~21 | "Configure how often your calendars update" | Functional description; calm enough; borderline | Phase 8 |
| src/components/calendar/settings/NotificationSettings.tsx | ~36 | "Manage your meeting reminders and alerts" | "alerts" (lowercase) appears in description prose — not the forbidden "Alerts" label | Phase 8 |
| src/components/calendar/settings/WellnessSection.tsx | ~12 | "Wellness Integration" heading | "Integration" is borderline (cf. D-01); in a wellness context, arguably acceptable | Phase 8 |
| src/components/pages/AuthCallback.tsx | ~65 | "Google Calendar connected" / "Your events are ready." | Functional OAuth callback toast; could be warmed up to COPY pattern | Phase 7 |

## Kept as-is (reference for next reviewer)

| String | File | Why kept |
|--------|------|----------|
| "Google Calendar" | multiple | Third-party product name — must not change |
| "Microsoft Outlook" | CalendarConnections.tsx | Third-party product name |
| "Apple Calendar" | CalendarConnections.tsx | Third-party product name |
| "Email" / "Password" | auth pages | Standard form field labels; domain terms |
| "Full Name" | Signup.tsx | Standard form field label |
| "Cancel" | dialogs | Standard UI verb; COPY.disconnect.cancel |
| "Dismiss" | BreathingOverlay.tsx, MissedReminderBanner.tsx | Standard UI verb |
| "Sign in" / "Sign up" / "Create account" | auth pages | Standard auth labels |
| "Forgot password?" / "Reset your password" | ForgotPassword.tsx, ResetPassword.tsx | Standard auth flow labels |
| "Connecting your calendar…" | AuthCallback.tsx | Single-use OAuth callback spinner; functional |
| "Connection failed" | AuthCallback.tsx | Toast on OAuth error; functional |
| "Let's go for a walk" | MinimalHero.tsx | Active landing CTA; calm, branded, no locked decision but fits voice |

## Sign-off

- [x] Forbidden vocab grep returns CLEAN
- [x] Every file in read_first has a status row
- [x] Every borderline string has a flagged row with suggested phase
- [x] Glossary doc has been updated with the flagged items
