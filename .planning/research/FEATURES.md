# Feature Landscape

**Domain:** Wellness-focused calendar companion / meeting management
**Researched:** 2026-03-22
**Confidence:** MEDIUM (based on training data up to May 2025; web search unavailable for verification of latest feature sets)

## Competitive Landscape Summary

The calendar/meeting wellness space sits at the intersection of two mature categories:

1. **Smart calendar apps** (Reclaim.ai, Notion Calendar/Cron, Fantastical, Amie, Morgen) -- focused on scheduling intelligence, multi-calendar unification, and time blocking.
2. **Mindfulness/wellness apps** (Headspace, Calm, Breathwrk) -- focused on guided breathing, meditation, and stress reduction.

No product owns the overlap well. Reclaim.ai comes closest with "smart breaks" and "habits" but wraps them in productivity framing ("defend your focus time") rather than wellness framing ("feel grounded between meetings"). This gap is MeeThing's opportunity.

### What competitors do well

| App | Strength MeeThing should learn from |
|-----|--------------------------------------|
| **Reclaim.ai** | Auto-scheduling buffer time between meetings; habit blocks that defend personal time; meeting-load analytics |
| **Fantastical** | Beautiful, information-dense calendar UI; natural language event creation; seamless multi-provider sync |
| **Notion Calendar (ex-Cron)** | Clean minimalist design; side-by-side view of multiple calendars; deep keyboard navigation |
| **Amie** | Delightful micro-interactions and animations; personality in empty states; scheduling links built in |
| **Headspace** | Timed breathing exercises with visual guides; session length options (1, 3, 5, 10 min); streak/habit tracking |
| **Calm** | "Daily Calm" concept (one curated moment per day); ambient soundscapes; low-friction entry to sessions |

### What MeeThing should NOT try to replicate

The competitors above have 10-50 person teams. MeeThing wins by being narrow and opinionated: a read-only calendar viewer with wellness moments, not a full scheduling platform.

---

## Table Stakes

Features users expect from any calendar companion app. Missing any of these means users won't take the app seriously.

| Feature | Why Expected | Complexity | Status | Notes |
|---------|--------------|------------|--------|-------|
| **Multi-provider calendar sync** (Google + Outlook) | Users have work + personal calendars on different providers; single-provider is a non-starter for knowledge workers | High | Google done, Outlook planned (CAL-01/02) | This is the single most important feature to complete |
| **Manual sync / refresh** | Users need to trust data is current; "sync now" is the escape hatch | Low | Done | Already implemented |
| **Meeting list with time, duration, attendees** | Basic utility -- users need to see what's coming up | Low | Done | Current implementation is solid |
| **Open in original calendar** | Users will still manage events in Google/Outlook; MeeThing is a companion, not a replacement | Low | Done | "Open" button links to htmlLink |
| **Secure token storage** | Users connecting OAuth expect tokens are encrypted; plaintext storage is a dealbreaker if discovered | Medium | Planned (SEC-01) | Critical for trust |
| **Settings that persist** | Toggle a preference, refresh, it's still there. Fake settings (current state) feel broken. | Medium | Planned (SET-01/02) | Settings are currently local state only |
| **Loading, error, and empty states** | Users judge quality by edge cases. Spinner-only or broken states signal amateur quality. | Low | Partially done (POL-01/02) | Meeting list has states; other areas may not |
| **Responsive / mobile-friendly web** | Knowledge workers check calendars on phones. Unusable on mobile = abandoned. | Medium | Partially done | Glassmorphism layout appears responsive but needs testing |
| **Password reset flow** | Mandatory for any app with email/password auth | Low | Planned (AUTH-02) | Standard Supabase Auth feature |

---

## Differentiators

Features that make MeeThing distinct. Not expected by users but create the "why this and not just Google Calendar?" answer.

| Feature | Value Proposition | Complexity | Priority | Notes |
|---------|-------------------|------------|----------|-------|
| **Breathing exercise before/between meetings** | The flagship wellness feature. A 60-90 second guided breathing animation (inhale 4s, hold 4s, exhale 4s) triggered manually or by schedule. Users feel calmer walking into meetings. | Medium | v1 (WEL-01) | Visual breathing circle is the single most memorable UI element. Learn from Headspace's visual breathing guide: animated expanding/contracting circle with gentle haptic-like visual cues. Keep it to one exercise type for v1. |
| **Transition buffer awareness** | Detect back-to-back meetings and surface a gentle nudge: "You have 3 meetings in a row. Consider a 5-minute buffer." Not auto-scheduling (that's Reclaim territory), just awareness. | Medium | v1 (WEL-02) | Configurable buffer threshold (default: 5 min). Show inline in meeting list, not as a modal/popup. Calm, not alarming. |
| **Meeting density indicator** | A visual "busyness" gauge for the day: calm (0-2 meetings), moderate (3-4), intense (5+). Color-coded to the nature palette (green/amber/warm). Helps users mentally prepare for their day shape. | Low | v1 | Simple to build, high visual impact. Appears at top of meetings list. |
| **Wellness-first aesthetic** | The glassmorphism + nature design system IS the product differentiator. Every interaction should feel like opening a meditation app, not a productivity tool. Animations breathe. Colors are natural. | Low (exists) | v1 | Already established. Protect it. Never let "feature creep" introduce harsh, productivity-tool aesthetics. |
| **Daily wellness tip rotation** | Rotate through curated tips about meeting hygiene (currently hardcoded single tip). Tips like: "Meetings without agendas take 30% longer", "Standing during calls reduces fatigue", "Mute notifications 5 min before focus blocks". | Low | v1 | Currently a static tip. Make it a small rotating set (10-15 tips). No backend needed -- client-side rotation by date. |
| **"Quiet hours" indicator** | Show when the user's day has free blocks. Frame them positively: "You have a 2-hour quiet window from 2-4pm" rather than showing empty slots. Celebrates unscheduled time. | Medium | v1.5 | Requires analyzing meeting gaps. Valuable but can follow initial wellness features. |
| **Energy/mood check-in after meetings** | Quick post-meeting prompt: "How did that feel?" with 3-5 emoji/icon options. Over time, reveals patterns (e.g., "Monday standups consistently drain you"). | High | v2 (deferred) | Already marked out of scope for v1. Correct decision -- needs reflection UI, data storage, and pattern analysis. |
| **Meeting-free day celebration** | When a day has zero meetings, celebrate it with a special visual (nature scene, confetti, calm message). Small delight that reinforces the "meetings aren't the goal" philosophy. | Low | v1 | Low effort, high charm. Shows personality. |
| **Focus time summary** | Weekly summary: "You spent 12 hours in meetings this week. That's 2 fewer than last week." Trend awareness without judgment. | Medium | v2 | Needs historical data accumulation. Better as a v2 feature after meetings have been syncing for weeks. |

---

## Anti-Features

Features to explicitly NOT build. These are tempting but would dilute MeeThing's identity or create unsustainable complexity.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Event creation / editing** | MeeThing is a read-only companion. Adding write access to calendars massively increases API scope requirements, error surfaces, and competition with Google/Outlook directly. | Always link to the original calendar for editing. "Open in Google Calendar" is the escape hatch. |
| **Scheduling / booking links** | Reclaim, Calendly, Cal.com own this space with years of edge-case handling. Building even a basic version creates maintenance burden with no competitive advantage. | Link out to user's existing scheduling tool if needed. |
| **AI meeting summaries / transcription** | Otter.ai, Fireflies.ai, and built-in Zoom/Teams/Meet features handle this. High infra cost (audio processing, LLM calls), privacy concerns. | Out of scope entirely. Not even v2. |
| **Push notifications (native)** | Requires service workers, notification permissions, platform-specific handling. High complexity for a web SPA. Google/Outlook already send meeting notifications. | Use in-app visual cues only. Browser tab title changes ("(3) meetings today") are acceptable low-effort alternatives. |
| **Full calendar grid view** | Fantastical and Notion Calendar have spent years perfecting week/month grid views. Competing on calendar layout is a losing battle. | Keep the meeting list format. It's intentionally simpler and less overwhelming than a grid. The list IS the design statement. |
| **Team/shared calendar features** | Adds social complexity, permissions, shared state. Enterprise feature that doesn't serve the solo knowledge worker use case. | MeeThing is personal. One user, their calendars, their wellness. |
| **Gamification / streaks** | Streaks create anxiety ("don't break the streak"), which directly contradicts the wellness mission. Headspace has streaks; MeeThing should not. | Gentle, non-judgmental reflections. "You've used breathing exercises 4 times this week" is fine. "Day 12 streak!" is not. |
| **Complex analytics dashboards** | Charts and graphs about meeting time feel like a productivity tool, not a wellness tool. Over-measurement creates anxiety. | Keep metrics simple and framed positively. One or two numbers max, presented gently. |
| **Auto-scheduling / calendar manipulation** | Writing to calendars (blocking buffer time, moving meetings) requires elevated permissions and risks breaking user's real calendar. Reclaim.ai's core feature -- don't compete. | Surface awareness ("you have back-to-back meetings") and let the user decide what to do about it. |

---

## Feature Dependencies

```
Multi-provider sync (Google + Outlook)
  |
  +---> Meeting list display (done)
  |       |
  |       +---> Meeting density indicator (reads meeting count per day)
  |       |
  |       +---> Transition buffer awareness (reads meeting times, detects gaps < threshold)
  |       |
  |       +---> Quiet hours indicator (reads meeting times, finds free blocks)
  |       |
  |       +---> Meeting-free day celebration (reads meeting count = 0)
  |
  +---> Breathing exercise (standalone, but contextually triggered by meeting proximity)

Settings persistence (SET-01/02)
  |
  +---> Wellness preferences stored (breathing enabled, buffer threshold, quiet hours)
  |
  +---> Sync frequency stored
  |
  +---> Notification preferences stored

Security fixes (SEC-01/02/03)
  |
  +---> Required BEFORE Outlook OAuth (don't ship a second insecure provider)

Auth improvements (AUTH-01/02/03)
  |
  +---> Required BEFORE public launch (but not before Outlook integration)

Energy/mood tracking (v2)
  |
  +---> Requires: meeting list, post-meeting time detection, new DB table
  |
  +---> Enables: focus time summary, pattern detection
```

---

## MVP Recommendation

For the current milestone (v1 public launch), prioritize in this order:

### Must ship (table stakes + core differentiator)

1. **Security fixes** (SEC-01/02/03) -- prerequisite for everything; never ship insecure OAuth to more users
2. **Microsoft Outlook integration** (CAL-01/02/03) -- table stakes for target audience
3. **Settings persistence** (SET-01/02) -- fake settings erode trust
4. **Auth improvements** (AUTH-01/02) -- email verification and password reset are baseline
5. **Breathing exercise** (WEL-01) -- the flagship differentiator, the thing that makes someone say "oh, this is different"
6. **Transition buffer awareness** (WEL-02) -- pairs with breathing; together they define the wellness value

### Should ship (high impact, low effort)

7. **Meeting density indicator** -- low complexity, visible wellness framing
8. **Meeting-free day celebration** -- low complexity, delightful personality
9. **Daily wellness tip rotation** -- low complexity, replaces hardcoded tip
10. **Loading/error/empty state polish** (POL-01/02) -- quality signal

### Defer to v1.5 or v2

- Quiet hours indicator (medium complexity, needs gap analysis logic)
- Energy/mood tracking (high complexity, v2 per PROJECT.md)
- Focus time summary (needs data accumulation over weeks)
- Apple Calendar (deferred per PROJECT.md)

---

## Lessons from Competitors

### From Reclaim.ai: Awareness without automation
Reclaim auto-schedules buffer time and habits. MeeThing should provide the awareness ("you have back-to-back meetings") without the automation. Automation requires write access to calendars and creates anxiety when things move unexpectedly. Awareness empowers the user to act.

### From Fantastical: Information density done beautifully
Fantastical packs a lot of information into a small space but it never feels cluttered because of excellent typography, spacing, and color hierarchy. MeeThing's meeting list should learn this: show more useful info (meeting density, transition buffers) without adding visual noise.

### From Headspace: The breathing circle
Headspace's breathing exercise is a single expanding/contracting circle. No text instructions needed after the first time. The visual IS the instruction. MeeThing's breathing exercise should be equally simple: one animated circle, timed breathing phases, gentle color transitions using the existing nature palette.

### From Calm: The "Daily Calm" concept
Calm surfaces one curated moment per day. MeeThing's wellness tip rotation serves a similar purpose: a small, daily nudge toward better meeting habits. Keep it to one tip per day (not a feed of tips), and make it contextually relevant when possible.

### From Amie: Personality in empty states
When Amie has nothing to show, it doesn't say "No events." It says something charming. MeeThing should do the same -- the empty state for a meeting-free day should feel like a reward, not a bug.

---

## Sources

- Training data knowledge of Reclaim.ai, Fantastical, Notion Calendar (Cron), Amie, Morgen, Headspace, Calm, Breathwrk feature sets (up to May 2025). MEDIUM confidence -- feature sets may have evolved.
- Direct codebase analysis of existing MeeThing implementation (HIGH confidence).
- PROJECT.md requirements and constraints (HIGH confidence).

**Note:** Web search was unavailable during this research. Specific feature comparisons are based on training data and may not reflect the very latest versions of competitor apps. The structural analysis and recommendations are sound regardless of minor feature changes in competitors.
