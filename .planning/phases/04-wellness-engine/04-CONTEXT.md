# Phase 4: Wellness Engine - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Activate the wellness engine: trigger a guided breathing animation before upcoming meetings, surface inline back-to-back meeting warnings with wellness quotes, handle missed reminders gracefully via the Page Visibility API, and polish loading/empty states across the app.

Four requirements in scope:
1. **WEL-01** — Breathing reminder overlay (guided animation, inhale/hold/exhale, triggered by user's configured lead time)
2. **WEL-02** — Back-to-back meeting detection with inline transition buffer warning
3. **POL-01** — All data-fetching paths have explicit loading and error states
4. **POL-02** — Empty states are informative and wellness-toned

The wellness settings controls (toggles, reminder minutes) already exist in the UI and are persisted to the database from Phase 3. Phase 4 reads those settings and acts on them. No new settings UI is added in this phase.

</domain>

<decisions>
## Implementation Decisions

### Breathing overlay

- **D-01:** Full-screen modal overlay with a dark/blurred backdrop and a centered expanding/contracting breathing circle. The existing `breathe` CSS keyframe animation (`src/index.css`) is used as the base for the circle. Overlay conforms to glassmorphism (`.glass-panel` for the inner content card, `backdrop-blur` for the background).
- **D-02:** Static calm message as a subtle header/footer throughout the overlay: e.g., *"This moment is yours before your next meeting."* Soft, non-directive.
- **D-03:** Per-phase affirmations change with each breath phase as the primary message:
  - Inhale: *"Let your thoughts settle"*
  - Hold: *"You are present"*
  - Exhale: *"Release what you don't need"*
- **D-04:** One full breathing cycle (4s inhale → 4s hold → 6s exhale = ~14s), then *"You're ready"* text appears alongside a **Dismiss** button. The overlay does NOT auto-dismiss without user action.
- **D-05:** Always dismissible — ESC key or the explicit Dismiss button. Both are available from the moment the overlay opens (the user can leave early if they choose).
- **D-06:** Below the breathing circle, show context: *"[Meeting title] in [N] minutes"*. Grounds the reminder without creating urgency.
- **D-07:** Overlay trigger: a `setInterval` (polling every 30s) compares the current time against the start time of the next meeting. When the remaining time equals `breathing_reminder_minutes` (from `useUserSettings`), the overlay opens — but only if `breathing_reminder_enabled` is true.
- **D-08:** Only one overlay shows at a time. If multiple meetings are within the reminder window, show the soonest one.

### Transition buffer warning

- **D-09:** Inline visual connector rendered between consecutive meetings in `MeetingsList` when the gap between them is ≤ 5 minutes. Amber/orange tone. Label: *"⚠ No transition time"* (0 min gap) or *"⚠ Only [N] min between meetings"* (1–5 min gap).
- **D-10:** Below the gap label, show a rotating wellness quote. Use a curated list of ~6 quotes (Claude selects — e.g., *"You can do anything, but not everything."*, *"Take care of your own time first."*, *"Rest is not idleness."*). Rotate by day-of-week or meeting index so repeat visits feel fresh.
- **D-11:** The inline connector only renders when `transition_buffer_enabled` is true in the user's settings (from `useUserSettings`). If the setting is off, no connector is shown.
- **D-12:** `MeetingsList` already fetches all meetings via `useMeetings`. The gap detection is a pure client-side calculation over the sorted meetings array — no new API calls needed.

### Missed reminder behavior (Page Visibility API)

- **D-13:** Listen for `document.visibilitychange` events. On tab refocus, check if a breathing reminder was "missed" while the tab was hidden: a reminder is considered missed if the trigger time passed while `document.hidden` was true AND the meeting hasn't ended yet.
- **D-14:** On a missed reminder: show a gentle non-blocking banner (not the full overlay): *"You had a breathing moment before [Meeting] — [Take a moment now]"*. The *Take a moment now* link opens the full overlay. The banner auto-dismisses after 8 seconds or on explicit close.
- **D-15:** If the meeting has already started or ended when the user returns, skip the missed reminder entirely — no banner, no overlay.

### Loading & empty states (POL-01, POL-02)

- **D-16:** Tone is calm and encouraging — not clinical. Examples:
  - No meetings: *"Your schedule is clear — enjoy the space"*
  - No calendar connected: *"Let's get you connected"* + CTA button
  - Sync error: *"Couldn't refresh your calendar — [Try again]"*
- **D-17:** Use skeleton card placeholders (not spinners) for the meetings list loading state. The skeleton should approximate the shape of a meeting card (title line + time line + provider bar).
- **D-18:** Meetings list states to handle:
  - Loading: skeleton cards (2–3 placeholder cards)
  - Error: inline error with *"Try again"* button that triggers a manual sync
  - Empty (calendar connected but no meetings in 7-day window): calm empty state
  - Empty (no calendar connected): redirects attention to Connections tab with a CTA
- **D-19:** Calendar connections tab states to handle:
  - Loading: skeleton for the connection card area
  - Empty (no connections): warm welcome empty state — *"Let's get you connected"* + Google Calendar connect button
- **D-20:** Full-page loading (initial app load before auth resolves): replace the bare white flash with a brief centered loading screen using the nature background and a subtle spinner or `breathe`-animated logo mark. Matches the glassmorphism aesthetic from the landing page.
- **D-21:** Settings tab loading and error states were implemented in Phase 3 — no changes needed here.

### Claude's Discretion

- Exact wellness quote list (6–10 quotes, curated by Claude to match the calm/intentional brand)
- Exact skeleton card markup and animation (use Tailwind `animate-pulse` on placeholder divs)
- The breathing interval polling implementation (setInterval vs requestAnimationFrame — Claude decides based on battery/performance tradeoffs)
- Whether to use a React Portal for the breathing overlay (recommended for z-index correctness)
- Exact gap threshold between "0 min gap" and "Only N min" label copy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Wellness — WEL-01, WEL-02 define acceptance criteria
- `.planning/REQUIREMENTS.md` §Polish — POL-01, POL-02 define loading/empty state requirements
- `.planning/ROADMAP.md` §Phase 4 — Success criteria 1–5 define what must be TRUE after this phase

### Existing components to extend
- `src/components/calendar/MeetingsList.tsx` — Meeting list to extend with inline gap indicator between back-to-back meetings; existing loading/empty states to upgrade
- `src/components/calendar/CalendarHub.tsx` — Tab structure; breathing overlay should be mounted here (Portal) so it can appear regardless of active tab
- `src/components/calendar/CalendarConnections.tsx` — Empty and loading states to upgrade

### Existing hooks (data sources)
- `src/hooks/useMeetings.ts` — Provides meetings array sorted by start time; back-to-back detection is a pure calculation over this data
- `src/hooks/useUserSettings.ts` — Provides `breathing_reminder_enabled`, `breathing_reminder_minutes`, `transition_buffer_enabled`; breathing overlay reads these

### Design system
- `src/index.css` — Contains `breathe` keyframe animation (scale pulse); use as base for breathing circle
- `tailwind.config.ts` — Glassmorphism utilities (`.glass-panel`, `.glass-light`, `.glass-heavy`), custom animations, wellness/nature color palette

### Database (read-only for this phase)
- `src/integrations/supabase/types.ts` — `user_settings` Row type including wellness columns added in Phase 3

</canonical_refs>

<specifics>
## Specific Ideas

- The breathing overlay uses a React Portal mounted at the document body level — this ensures it renders above all other content regardless of which tab is active in CalendarHub.
- The per-phase affirmations (D-03) should fade-transition between states, not snap — matches the calm aesthetic.
- The wellness quote in the gap indicator (D-10) should be small (text-xs or text-sm), italic, and soft-colored (e.g., `text-amber-700/70`) — a whisper, not a shout.
- The missed reminder banner (D-14) should slide in from the top of the calendar panel, not the window edge — keeps it contextually relevant to the calendar content.
- Skeleton cards (D-17) should use the same `rounded-2xl` + `glass-light` shape as the real meeting cards — skeleton is a preview of the real thing, not a generic gray block.

</specifics>

<deferred>
## Deferred Ideas

- **Expanded wellness action library** — Research into additional breathing techniques (box breathing, 4-7-8, etc.), body scan prompts, or micro-stretch reminders. Flagged by user as a future priority. Deferred to Wellness v2 — Phase 4 ships the infrastructure (overlay system + trigger timing) that Wellness v2 can extend with additional exercise types.
- **Ambient sound during breathing** — Nature sounds or binaural tones during the overlay. Requires audio permission UX and adds complexity; defer to v2.
- **Meeting load heatmap or density indicator** — Visual signal when the day is overloaded (WEL-04 in v2 requirements).
- **Meeting-free day celebration** — Surface when you have a clear day ahead (WEL-03 in v2 requirements).

</deferred>

---

*Phase: 04-wellness-engine*
*Context gathered: 2026-03-30*
