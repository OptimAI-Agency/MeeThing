# Requirements: MeeThing

**Defined:** 2026-03-22
**Core Value:** A calm, beautiful alternative to your calendar app that makes meetings feel manageable, not draining.

---

## v1.0 Requirements (Milestone: Public Launch)

### Security

- [x] **SEC-01**: OAuth access and refresh tokens are encrypted at rest using AES-256-GCM before being stored in `calendar_connections`
- [x] **SEC-02**: OAuth authorization requests use a cryptographically random `state` parameter to prevent CSRF attacks (currently static string `"google"`)
- [x] **SEC-03**: Supabase Edge Functions restrict CORS to the app's own origin (currently `Access-Control-Allow-Origin: *`)

### Authentication

- [ ] **AUTH-01**: New users must verify their email address before accessing the app (currently bypassed — redirects to `/calendar` immediately after signup)
- [x] **AUTH-02**: User can request a password reset email and set a new password via the link
- [ ] **AUTH-03**: When a user disconnects a calendar provider, the OAuth token is revoked with the provider (not just deleted locally)

### Calendar Integration

- [x] **CAL-01**: Google Calendar sync fetches all events in the 7-day window with pagination (currently hard-capped at 50 events, silently missing overflow)
- [x] **CAL-02**: Manual "Sync now" is reliable — handles token refresh, errors surfaced to user rather than failing silently
- [x] **CAL-03**: Disconnecting Google Calendar revokes the OAuth token with Google and clears all synced meetings

### Settings

- [x] **SET-01**: Sync frequency preference reads from and writes to the `user_settings` table (currently disconnected)
- [x] **SET-02**: Notification preferences read from and write to the `user_settings` table (currently disconnected)

### Wellness

- [x] **WEL-01**: User can enable a breathing exercise reminder that surfaces a guided animation (inhale/hold/exhale) before or between meetings
- [x] **WEL-02**: App detects back-to-back meetings and surfaces a configurable transition buffer warning

### Polish

- [x] **POL-01**: All data-fetching paths have explicit loading and error states (no silent failures, no infinite spinners)
- [x] **POL-02**: Empty states are handled gracefully: no calendars connected, no meetings today, sync error recovery

---

## v2.0 Requirements (Milestone: Companion Experience)

### Language & Copy

- [x] **COPY-01**: All UI text conforms to a calm-first copy glossary — no utility/dashboard vocabulary anywhere in the app ("Today" not "Calendar Integration", "Your Calendar" not "Connections", auto-sync replaces the primary "Sync now" button)
- [ ] **COPY-02**: User sees a contextual daily greeting at the top of the Today view containing their first name, today's meeting count, and the largest free gap in their day (e.g. "Good morning, [Name]. You have 3 meetings today. Biggest breathing room: 2h after 2 PM.")
- [ ] **COPY-03**: User sees weekly tone language in the app that reflects the week's meeting density in natural language ("A full week ahead" / "A lighter week — space to think")

### Today-First Layout

- [ ] **TODAY-01**: App defaults to a today-only view when the user opens the calendar; all companion features (greeting, rhythm timeline, wind-down) derive from this today context
- [ ] **TODAY-02**: User can toggle between today-only and full week view; the selected view mode persists in the URL (?view=today | ?view=week) so browser back/forward and sharing work correctly
- [ ] **TODAY-03**: User sees Today's Rhythm — a thin horizontal timeline of the current day visually showing meeting blocks versus free gaps, derived from existing meeting data with no new API calls

### Meeting Cards

- [ ] **CARD-01**: Meeting card height is proportional to meeting duration — a 2-hour block occupies visibly more vertical space than a 30-minute check-in, giving the schedule honest visual weight
- [ ] **CARD-02**: Meeting cards use time-of-day color accents: morning (before noon) warm amber tint, midday (noon–3 PM) neutral sage, late afternoon/evening (after 3 PM) cool blue tint; all variants pass WCAG AA contrast

### Ambient Design

- [ ] **BEAUTY-01**: The Fraunces variable serif typeface is used exclusively on high-emotion wellness surfaces (greeting headline, breathing overlay phase text, wind-down copy); Inter remains for all other UI text; font loads without FOUT using `size-adjust` metric fallback
- [ ] **BEAUTY-02**: The background image overlay animates with a slow 10–12s breathing cycle (CSS keyframes on the overlay layer, not backdrop-filter); animation pauses automatically when `prefers-reduced-motion` is set or the browser tab is hidden
- [ ] **BEAUTY-03**: Glassmorphism visual hierarchy is restored — meeting cards and secondary surfaces use `glass-light`; primary panels and overlays use `glass-panel`; the depth distinction between background and foreground is immediately legible

### Push Notifications

- [ ] **PUSH-01**: Before requesting browser notification permission, the app shows a pre-prompt screen explaining what will be sent and why; the native browser permission dialog only appears after the user explicitly continues
- [ ] **PUSH-02**: When enabled, push notifications deliver the pre-meeting breathing reminder within the user's configured window via a Supabase Edge Function; a hard daily cap (5 pushes/day) and configurable quiet hours are enforced server-side from day one
- [ ] **PUSH-03**: User can manage push notification settings in Settings (enable/disable, quiet hours start/end); if the browser permission was denied, the UI detects this state and shows a clear recovery path (link to browser settings)

### Wind-Down

- [ ] **WIND-01**: After the user's last meeting of the day ends, the Today view transitions to a wind-down state: a quiet acknowledgment of the day and an optional 1-tap reflection prompt (free text or emoji, stored locally); the transition is calm, not abrupt
- [ ] **WIND-02**: Wind-down state is non-blocking — user can dismiss it instantly or navigate away; no streaks, scores, badges, or gamification elements appear anywhere in the wind-down flow

---

## Future Requirements

Acknowledged but deferred beyond v2.0.

### Reflect

- **REFL-01**: User can log energy/mood after a meeting (1-5 scale or emoji)
- **REFL-02**: App surfaces weekly patterns ("Mondays drain you most")
- **REFL-03**: User can see meeting load over time (hours/week in meetings)

### Wellness (Extended)

- **WEL-03**: Meeting-free day celebration (surfaces when you have a clear day ahead)
- **WEL-04**: Meeting density indicator (visual signal when day is overloaded)
- **WEL-05**: Wellness tip rotation (contextual, non-intrusive tips based on schedule)

### Integrations

- **CAL-04**: Microsoft Outlook integration via Microsoft Identity Platform OAuth + Microsoft Graph API
- **CAL-05**: Apple Calendar integration via CalDAV

---

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Creating or editing calendar events | Read-only is intentional — writing to calendars adds anxiety and complexity; read-only is a feature |
| Scheduling links (Calendly-style) | Different product category; dilutes calm identity |
| AI meeting summaries or prep | High complexity, requires third-party AI integration; v3+ |
| Mobile app | Web-first; mobile is a future milestone |
| Gamification or streaks | Explicitly contradicts calm, non-pressuring wellness positioning — anti-feature |
| Analytics dashboards | Too productivity-tool; not wellness |
| Real-time calendar sync (webhooks) | Complexity vs. value; polling on open/manual sync is sufficient |
| Mood tracking dashboards | Deferred to REFL series; v2.0 wind-down reflection is 1-tap only, no dashboard |
| Focus scores or productivity metrics | Anti-feature for this audience — would recreate the anxiety MeeThing replaces |
| Email digest notifications | Lower value than push; deferred |

---

## Traceability

Populated after roadmap creation.

### v1.0 Phases

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1: Security Hardening | Complete |
| SEC-02 | Phase 1: Security Hardening | Complete |
| SEC-03 | Phase 1: Security Hardening | Complete |
| CAL-01 | Phase 2: Google Calendar Reliability | Complete |
| CAL-02 | Phase 2: Google Calendar Reliability | Complete |
| CAL-03 | Phase 2: Google Calendar Reliability | Complete |
| SET-01 | Phase 3: Settings Persistence | Complete |
| SET-02 | Phase 3: Settings Persistence | Complete |
| WEL-01 | Phase 4: Wellness Engine | Complete |
| WEL-02 | Phase 4: Wellness Engine | Complete |
| POL-01 | Phase 4: Wellness Engine | Complete |
| POL-02 | Phase 4: Wellness Engine | Complete |
| AUTH-01 | Phase 5: Auth Hardening | Pending |
| AUTH-02 | Phase 5: Auth Hardening | Complete |
| AUTH-03 | Phase 5: Auth Hardening | Pending |

### v2.0 Phases

| Requirement | Phase | Status |
|-------------|-------|--------|
| COPY-01 | Phase 6: Language Foundation | Complete |
| TODAY-01 | Phase 7: Today-First Layout | Pending |
| TODAY-02 | Phase 7: Today-First Layout | Pending |
| BEAUTY-01 | Phase 8: Ambient Beauty Foundation | Pending |
| BEAUTY-02 | Phase 8: Ambient Beauty Foundation | Pending |
| BEAUTY-03 | Phase 8: Ambient Beauty Foundation | Pending |
| COPY-02 | Phase 9: Companion UI Components | Pending |
| COPY-03 | Phase 9: Companion UI Components | Pending |
| TODAY-03 | Phase 9: Companion UI Components | Pending |
| CARD-01 | Phase 9: Companion UI Components | Pending |
| CARD-02 | Phase 9: Companion UI Components | Pending |
| WIND-01 | Phase 10: Wind-Down Experience | Pending |
| WIND-02 | Phase 10: Wind-Down Experience | Pending |
| PUSH-01 | Phase 11: Push Notification Infrastructure | Pending |
| PUSH-02 | Phase 11: Push Notification Infrastructure | Pending |
| PUSH-03 | Phase 11: Push Notification Infrastructure | Pending |

**v2.0 Coverage:**
- v2.0 requirements: 16 total
- Mapped to phases: 16 ✓
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-04-05 — v2.0 roadmap created; all 16 v2.0 requirements mapped to Phases 6-11*
