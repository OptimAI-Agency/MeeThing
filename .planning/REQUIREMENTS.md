# Requirements: MeeThing

**Defined:** 2026-03-22
**Core Value:** A calm, beautiful alternative to your calendar app that makes meetings feel manageable, not draining.

## v1 Requirements

Requirements for public launch. Each maps to a roadmap phase.

### Security

- [ ] **SEC-01**: OAuth access and refresh tokens are encrypted at rest using AES-256-GCM before being stored in `calendar_connections`
- [ ] **SEC-02**: OAuth authorization requests use a cryptographically random `state` parameter to prevent CSRF attacks (currently static string `"google"`)
- [ ] **SEC-03**: Supabase Edge Functions restrict CORS to the app's own origin (currently `Access-Control-Allow-Origin: *`)

### Authentication

- [ ] **AUTH-01**: New users must verify their email address before accessing the app (currently bypassed — redirects to `/calendar` immediately after signup)
- [ ] **AUTH-02**: User can request a password reset email and set a new password via the link
- [ ] **AUTH-03**: When a user disconnects a calendar provider, the OAuth token is revoked with the provider (not just deleted locally)

### Calendar Integration

- [ ] **CAL-01**: Google Calendar sync fetches all events in the 7-day window with pagination (currently hard-capped at 50 events, silently missing overflow)
- [ ] **CAL-02**: Manual "Sync now" is reliable — handles token refresh, errors surfaced to user rather than failing silently
- [ ] **CAL-03**: Disconnecting Google Calendar revokes the OAuth token with Google and clears all synced meetings

### Settings

- [ ] **SET-01**: Sync frequency preference reads from and writes to the `user_settings` table (currently disconnected)
- [ ] **SET-02**: Notification preferences read from and write to the `user_settings` table (currently disconnected)

### Wellness

- [ ] **WEL-01**: User can enable a breathing exercise reminder that surfaces a guided animation (inhale/hold/exhale) before or between meetings
- [ ] **WEL-02**: App detects back-to-back meetings and surfaces a configurable transition buffer warning ("You have 3 meetings with no gaps")

### Polish

- [ ] **POL-01**: All data-fetching paths have explicit loading and error states (no silent failures, no infinite spinners)
- [ ] **POL-02**: Empty states are handled gracefully: no calendars connected, no meetings today, sync error recovery

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

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

### Notifications

- **NOTF-01**: Browser push notifications for meeting reminders (requires service worker)
- **NOTF-02**: Email digest of upcoming meetings

## Out of Scope

| Feature | Reason |
|---------|--------|
| Creating or editing calendar events | Read-only is intentional -- writing to calendars adds anxiety and complexity, read-only is a feature |
| Scheduling links (Calendly-style) | Different product category; dilutes calm identity |
| AI meeting summaries or prep | High complexity, requires third-party AI integration; v2+ |
| Mobile app | Web-first; mobile is a future milestone |
| Gamification or streaks | Contradicts the calm, non-pressuring wellness positioning |
| Analytics dashboards | Not the product -- too productivity-tool, not wellness |
| Real-time calendar sync (webhooks) | Complexity vs. value; polling on manual sync is sufficient for v1 |

## Traceability

Which phases cover which requirements. Populated after roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1: Security Hardening | Pending |
| SEC-02 | Phase 1: Security Hardening | Pending |
| SEC-03 | Phase 1: Security Hardening | Pending |
| CAL-01 | Phase 2: Google Calendar Reliability | Pending |
| CAL-02 | Phase 2: Google Calendar Reliability | Pending |
| CAL-03 | Phase 2: Google Calendar Reliability | Pending |
| SET-01 | Phase 3: Settings Persistence | Pending |
| SET-02 | Phase 3: Settings Persistence | Pending |
| WEL-01 | Phase 4: Wellness Engine | Pending |
| WEL-02 | Phase 4: Wellness Engine | Pending |
| POL-01 | Phase 4: Wellness Engine | Pending |
| POL-02 | Phase 4: Wellness Engine | Pending |
| AUTH-01 | Phase 5: Auth Hardening | Pending |
| AUTH-02 | Phase 5: Auth Hardening | Pending |
| AUTH-03 | Phase 5: Auth Hardening | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

**Note:** CAL-03 and AUTH-03 overlap (both cover token revocation on disconnect). CAL-03 delivers the Google-specific implementation in Phase 2. AUTH-03 in Phase 5 ensures the pattern is enforced at the auth layer and covers any provider-general concerns.

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 -- Roadmap created, Google Calendar only for v1*
