# Phase 4: Wellness Engine - Research

**Researched:** 2026-03-29
**Domain:** React client-side timers, CSS animations, Page Visibility API, UI state management
**Confidence:** HIGH

## Summary

Phase 4 activates the wellness engine -- the core differentiator of MeeThing. The work is entirely client-side: a breathing overlay triggered by a polling timer, inline back-to-back meeting warnings in the meetings list, missed-reminder recovery via the Page Visibility API, and a comprehensive loading/empty state upgrade across all data-fetching screens.

The existing codebase is well-prepared. The `useUserSettings` hook already fetches `breathing_reminder_enabled`, `breathing_reminder_minutes`, and `transition_buffer_enabled` from the database. The `useMeetings` hook returns meetings sorted by `start_time`, making gap detection a pure array calculation. The design system provides `breathe` keyframes, glassmorphism utilities (`.glass-panel`, `.glass-light`), and a `Skeleton` UI component from shadcn. No new npm packages are needed. No new database migrations are needed. No new Supabase Edge Functions are needed.

**Primary recommendation:** Build the breathing overlay as a React Portal component with its own `useBreathingReminder` hook that encapsulates the setInterval polling and Page Visibility API logic. Build the transition buffer warning as a pure presentational component rendered between meeting cards in MeetingsList. Upgrade loading/empty/error states by replacing existing spinner markup with skeleton cards and calm copy.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full-screen modal overlay with dark/blurred backdrop and centered expanding/contracting breathing circle. Uses existing `breathe` CSS keyframe. Overlay uses glassmorphism (`.glass-panel` inner card, `backdrop-blur` background).
- **D-02:** Static calm message as header/footer: "This moment is yours before your next meeting."
- **D-03:** Per-phase affirmations change with each breath phase (Inhale: "Let your thoughts settle", Hold: "You are present", Exhale: "Release what you don't need"). Fade-transition between states.
- **D-04:** One full cycle (4s inhale, 4s hold, 6s exhale = ~14s), then "You're ready" + Dismiss button. No auto-dismiss.
- **D-05:** Always dismissible via ESC or Dismiss button, available from overlay open.
- **D-06:** Meeting context below breathing circle: "[Meeting title] in [N] minutes".
- **D-07:** setInterval polling every 30s. Trigger when remaining time equals `breathing_reminder_minutes`. Only when `breathing_reminder_enabled` is true.
- **D-08:** Only one overlay at a time; show soonest meeting if multiple in window.
- **D-09:** Inline visual connector between consecutive meetings with gap <= 5 min. Amber/orange. "No transition time" (0 min) or "Only [N] min between meetings" (1-5 min).
- **D-10:** Rotating wellness quote below gap label. ~6 curated quotes, rotate by day-of-week or meeting index.
- **D-11:** Connector only when `transition_buffer_enabled` is true.
- **D-12:** Gap detection is pure client-side over sorted meetings array.
- **D-13:** Listen for `document.visibilitychange`. On refocus, check if reminder was missed while hidden AND meeting hasn't ended.
- **D-14:** Missed reminder: gentle non-blocking banner (not full overlay). "You had a breathing moment before [Meeting] -- Take a moment now". Auto-dismiss after 8s or explicit close. Banner slides in from top of calendar panel.
- **D-15:** If meeting started or ended when user returns, skip entirely.
- **D-16:** Calm/encouraging tone for all states.
- **D-17:** Skeleton card placeholders (not spinners) for meetings list loading. Approximate shape of meeting card.
- **D-18:** Meetings list: skeleton loading, error with Try again, empty (connected but no meetings), empty (no calendar connected -> CTA).
- **D-19:** Calendar connections: skeleton loading, warm welcome empty state.
- **D-20:** Full-page loading: replace white flash with nature background + subtle breathe-animated logo mark.
- **D-21:** Settings tab loading/error already done in Phase 3.

### Claude's Discretion
- Exact wellness quote list (6-10 quotes)
- Exact skeleton card markup and animation (Tailwind `animate-pulse` on placeholder divs)
- Breathing interval polling implementation (setInterval vs requestAnimationFrame)
- Whether to use React Portal for breathing overlay (recommended)
- Exact gap threshold copy between "0 min gap" and "Only N min"

### Deferred Ideas (OUT OF SCOPE)
- Expanded wellness action library (box breathing, 4-7-8, body scans, micro-stretches) -- deferred to Wellness v2
- Ambient sound during breathing -- deferred to v2
- Meeting load heatmap or density indicator (WEL-04)
- Meeting-free day celebration (WEL-03)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WEL-01 | User can enable a breathing exercise reminder that surfaces a guided animation before/between meetings | Breathing overlay component + useBreathingReminder hook; uses existing `breathe` keyframe, useUserSettings for toggle/minutes, useMeetings for next meeting time |
| WEL-02 | App detects back-to-back meetings and surfaces a configurable transition buffer warning | TransitionBufferWarning component rendered between meeting cards; pure calculation over useMeetings sorted array; gated by transition_buffer_enabled setting |
| POL-01 | All data-fetching paths have explicit loading and error states | Skeleton components for meetings list, calendar connections, full-page auth loading; error states with recovery actions |
| POL-02 | Empty states are handled gracefully | Calm empty states for no meetings, no calendar connected, sync error recovery; wellness-toned copy |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack:** React 18, React Router 6, TanStack Query, React Hook Form + Zod, shadcn-ui, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth) -- read-only for this phase (no new migrations or edge functions)
- **Path alias:** `@/` maps to `src/`
- **Quality:** No test framework. `npm run lint` is the only automated check.
- **Design system:** Glassmorphism utilities (`.glass-panel`, `.glass-heavy`, `.glass-light`), custom animations (`breathe`, `gentle-float`, `fade-in`, `scale-in`), wellness/nature color palette, dark mode via class strategy
- **Existing animations in CSS:** `breathe` (4s scale 1 -> 1.05 -> 1), `gentle-float` (6s translateY 0 -> -10px -> 0), toast slide-in/out

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18.3.1 | UI framework | Project standard |
| react-dom | ^18.3.1 | Portal API via `createPortal` | Needed for breathing overlay z-index correctness |
| date-fns | ^3.6.0 | Time calculations (differenceInMinutes, isBefore, isAfter) | Already used throughout codebase |
| @tanstack/react-query | ^5.56.2 | Server state (useMeetings, useUserSettings) | Project standard |
| lucide-react | ^0.462.0 | Icons | Project standard |
| tailwindcss-animate | ^1.0.7 | Animation utilities | Already installed |

### Supporting (already available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Skeleton | (bundled) | `src/components/ui/skeleton.tsx` | Loading state placeholders |
| shadcn Button | (bundled) | Dismiss button, Try Again CTA | All interactive states |
| shadcn Badge | (bundled) | Status indicators | Gap warning badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| setInterval polling | requestAnimationFrame | rAF pauses in background tabs (desired for battery but complicates missed-reminder logic). setInterval continues firing. Decision: **use setInterval** -- simpler, and we need background-aware behavior anyway via visibilitychange |
| Custom portal | Radix Dialog | Radix Dialog would provide accessible overlay scaffolding, but the breathing overlay has non-standard UX (no close-on-backdrop-click, custom animation phases). Custom portal is simpler and avoids fighting Dialog defaults |

**Installation:** None needed. All dependencies are already in package.json.

## Architecture Patterns

### New Files to Create
```
src/
├── components/
│   ├── wellness/
│   │   ├── BreathingOverlay.tsx        # Full-screen breathing modal (Portal)
│   │   ├── BreathingCircle.tsx         # Animated breathing circle with phase text
│   │   ├── TransitionBufferWarning.tsx # Inline gap indicator between meetings
│   │   └── MissedReminderBanner.tsx    # Slide-in banner for missed reminders
│   ├── calendar/
│   │   ├── MeetingCardSkeleton.tsx     # Skeleton placeholder for meeting card
│   │   └── EmptyStates.tsx            # Reusable empty state components
│   └── loading/
│       └── AppLoadingScreen.tsx        # Full-page auth loading replacement
├── hooks/
│   └── useBreathingReminder.ts        # Timer polling + visibility API + state machine
└── lib/
    └── wellness-quotes.ts             # Curated quote list
```

### Files to Modify
```
src/components/calendar/MeetingsList.tsx       # Add skeleton loading, gap indicators, upgraded empty/error states
src/components/calendar/CalendarHub.tsx         # Mount BreathingOverlay portal, mount MissedReminderBanner
src/components/calendar/CalendarConnections.tsx # Upgrade loading/empty states
src/components/auth/ProtectedRoute.tsx          # Replace spinner with AppLoadingScreen
src/index.css                                   # New keyframes for breathing phases (inhale/hold/exhale with different durations)
```

### Pattern 1: Breathing State Machine
**What:** The breathing overlay has distinct phases: `idle` -> `inhale` (4s) -> `hold` (4s) -> `exhale` (6s) -> `complete`. A `useEffect` with sequential `setTimeout` chains drives transitions.
**When to use:** When UI needs to progress through timed visual phases.
**Example:**
```typescript
type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'complete';

const PHASE_DURATIONS: Record<Exclude<BreathPhase, 'complete'>, number> = {
  inhale: 4000,
  hold: 4000,
  exhale: 6000,
};

// In the overlay component:
const [phase, setPhase] = useState<BreathPhase>('inhale');

useEffect(() => {
  if (phase === 'complete') return;

  const duration = PHASE_DURATIONS[phase];
  const timer = setTimeout(() => {
    if (phase === 'inhale') setPhase('hold');
    else if (phase === 'hold') setPhase('exhale');
    else if (phase === 'exhale') setPhase('complete');
  }, duration);

  return () => clearTimeout(timer);
}, [phase]);
```

### Pattern 2: useBreathingReminder Hook
**What:** Encapsulates the 30s polling interval, next-meeting calculation, visibility change listener, and overlay/banner state.
**When to use:** Mounted once in CalendarHub.
**Example:**
```typescript
interface BreathingReminderState {
  showOverlay: boolean;
  showBanner: boolean;
  meetingTitle: string;
  meetingMinutesAway: number;
  dismissOverlay: () => void;
  dismissBanner: () => void;
  openOverlayFromBanner: () => void;
}

function useBreathingReminder(
  meetings: Meeting[],
  settings: { breathing_reminder_enabled: boolean; breathing_reminder_minutes: number } | undefined
): BreathingReminderState {
  // 1. setInterval every 30s: find next meeting, check if within reminder window
  // 2. Track "already shown" set (by meeting ID) to avoid re-triggering
  // 3. Listen for visibilitychange: on refocus, check if missed
  // 4. Return overlay/banner visibility + dismiss callbacks
}
```

### Pattern 3: Gap Detection (Pure Function)
**What:** Given a sorted meetings array, find consecutive pairs with gaps <= 5 minutes.
**When to use:** In MeetingsList render loop.
**Example:**
```typescript
import { differenceInMinutes } from 'date-fns';

function getGapMinutes(meetingA: Meeting, meetingB: Meeting): number {
  const endA = new Date(meetingA.end_time);
  const startB = new Date(meetingB.start_time);
  return differenceInMinutes(startB, endA);
}

// In render:
{meetings.map((meeting, index) => (
  <Fragment key={meeting.id}>
    <MeetingCard meeting={meeting} />
    {index < meetings.length - 1 && (() => {
      const gap = getGapMinutes(meeting, meetings[index + 1]);
      return gap <= 5 && transitionBufferEnabled ? (
        <TransitionBufferWarning gapMinutes={gap} meetingIndex={index} />
      ) : null;
    })()}
  </Fragment>
))}
```

### Pattern 4: React Portal for Overlay
**What:** Use `createPortal` to render the breathing overlay at `document.body` level.
**When to use:** Ensures z-index correctness regardless of CalendarHub's tab state.
**Example:**
```typescript
import { createPortal } from 'react-dom';

function BreathingOverlay({ onDismiss, meetingTitle, minutesAway }: Props) {
  // ESC key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDismiss]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl p-10 max-w-md text-center space-y-8">
        <BreathingCircle />
        {/* ... */}
      </div>
    </div>,
    document.body
  );
}
```

### Anti-Patterns to Avoid
- **requestAnimationFrame for the timer:** rAF is throttled/paused in background tabs. The 30s polling must continue in the background so missed-reminder detection works on refocus. Use setInterval.
- **Multiple overlays:** D-08 says show only the soonest meeting. The hook must filter to one.
- **Auto-dismiss after cycle:** D-04 explicitly says overlay does NOT auto-dismiss. The user must click Dismiss or press ESC.
- **Spinner for meetings loading:** D-17 says skeleton cards, not spinners. The current MeetingsList spinner must be replaced.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time difference calculations | Manual Date math | `date-fns` `differenceInMinutes`, `isBefore`, `isAfter`, `addMinutes` | Already in project; handles edge cases (DST, etc.) |
| Loading skeletons | Custom shimmer divs | shadcn `Skeleton` component (`src/components/ui/skeleton.tsx`) | Already available, uses `animate-pulse` |
| Portal rendering | Manual DOM manipulation | `createPortal` from `react-dom` | Standard React API, already in bundle |
| Keyboard event handling for ESC | Window listeners without cleanup | `useEffect` with cleanup return | Standard React pattern, prevents memory leaks |

**Key insight:** This phase is 100% client-side UI work. Every tool needed is already installed. The complexity is in state coordination (timer + visibility + settings + meetings data), not in external dependencies.

## Common Pitfalls

### Pitfall 1: Stale Closure in setInterval
**What goes wrong:** The interval callback captures stale meeting data or settings because React state is captured at setInterval creation time.
**Why it happens:** setInterval creates a closure over the initial values of state variables.
**How to avoid:** Use a `useRef` to hold the latest meetings and settings, update the ref in a useEffect, and read from the ref inside the interval callback.
**Warning signs:** Overlay triggers for wrong meeting or fails to trigger after data refresh.

### Pitfall 2: Multiple Intervals on Re-render
**What goes wrong:** Each re-render creates a new setInterval without clearing the previous one, leading to exponential timer callbacks.
**Why it happens:** Missing cleanup in useEffect, or missing dependency array.
**How to avoid:** Return a cleanup function from useEffect that calls `clearInterval`.
**Warning signs:** Console logs show callback firing multiple times per 30s tick.

### Pitfall 3: Visibility Change Firing on Initial Mount
**What goes wrong:** The visibilitychange handler runs immediately if the tab was already hidden/shown during component mount, potentially showing a false "missed reminder" banner.
**Why it happens:** Some browsers fire visibilitychange on initial mount.
**How to avoid:** Track a `hasBeenVisible` ref that starts false and flips to true after the first "visible" event. Only process missed reminders after this flag is true.
**Warning signs:** Banner appears immediately on page load.

### Pitfall 4: Breathing Animation CSS Timing Mismatch
**What goes wrong:** The CSS animation duration doesn't match the JS state machine timing, causing visual phase transitions to be out of sync with the text.
**Why it happens:** The existing `breathe` keyframe is 4s with equal in/out. The new breathing cycle is asymmetric (4s/4s/6s = 14s total).
**How to avoid:** Create a new dedicated CSS animation (or use inline `style` with `animation-duration`) rather than reusing the existing `breathe` keyframe directly. The existing keyframe can inspire the visual (scale pulse) but the timing must match the JS phases.
**Warning signs:** Circle expands while text says "Exhale".

### Pitfall 5: Memory Leak from Missed Cleanup
**What goes wrong:** Intervals or event listeners persist after component unmount.
**Why it happens:** Not cleaning up setInterval, visibilitychange listener, or setTimeout chains in useEffect.
**How to avoid:** Every useEffect that creates a timer or listener MUST return a cleanup. Store interval/timeout IDs in refs for cleanup.
**Warning signs:** Console warnings about state updates on unmounted components.

### Pitfall 6: Already-Shown Reminder Re-triggering
**What goes wrong:** The same meeting's reminder triggers every 30s within the window, showing the overlay repeatedly.
**Why it happens:** The polling interval checks "is now within reminder window?" without tracking whether the overlay was already shown.
**How to avoid:** Maintain a `Set<string>` of meeting IDs for which reminders have been shown. Persist it in a ref (not state -- avoids re-renders). Reset when meetings data changes (new sync).
**Warning signs:** Overlay keeps appearing for the same meeting after dismissal.

## Code Examples

### Breathing Circle Animation (CSS)
```css
/* New keyframes for the asymmetric breathing cycle */
@keyframes breathing-inhale {
  from { transform: scale(0.6); opacity: 0.7; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes breathing-hold {
  from { transform: scale(1); }
  to { transform: scale(1); }
}

@keyframes breathing-exhale {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.6); opacity: 0.7; }
}

.breathing-inhale {
  animation: breathing-inhale 4s ease-in-out forwards;
}
.breathing-hold {
  animation: breathing-hold 4s ease-in-out forwards;
}
.breathing-exhale {
  animation: breathing-exhale 6s ease-in-out forwards;
}
```

### Skeleton Meeting Card
```typescript
import { Skeleton } from "@/components/ui/skeleton";

const MeetingCardSkeleton = () => (
  <div className="glass-light rounded-2xl p-4 sm:p-6">
    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
      <Skeleton className="w-1 h-16 sm:h-20 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-3/5" />   {/* title */}
        <Skeleton className="h-4 w-4/5" />   {/* time + duration */}
        <Skeleton className="h-3 w-1/4" />   {/* provider */}
      </div>
    </div>
  </div>
);
```

### Page Visibility API Usage
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Record timestamp when tab was hidden
      hiddenAtRef.current = Date.now();
    } else {
      // Tab refocused -- check for missed reminders
      if (hiddenAtRef.current && settings?.breathing_reminder_enabled) {
        const missedMeeting = findMissedReminder(
          meetings,
          hiddenAtRef.current,
          settings.breathing_reminder_minutes,
          shownIdsRef.current
        );
        if (missedMeeting) {
          setBannerMeeting(missedMeeting);
        }
      }
      hiddenAtRef.current = null;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [meetings, settings]);
```

### Wellness Quotes (curated list)
```typescript
export const WELLNESS_QUOTES = [
  "You can do anything, but not everything.",
  "Take care of your own time first.",
  "Rest is not idleness.",
  "Between stimulus and response there is a space.",
  "The present moment is filled with joy and happiness.",
  "Almost everything will work again if you unplug it for a few minutes.",
  "Slow down. Calm down. Don't worry. Don't hurry. Trust the process.",
  "Breathing in, I calm my body. Breathing out, I smile.",
] as const;

export function getQuoteForGap(meetingIndex: number, dayOfWeek: number): string {
  const index = (meetingIndex + dayOfWeek) % WELLNESS_QUOTES.length;
  return WELLNESS_QUOTES[index];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.webkitHidden` | `document.hidden` + `document.visibilitychange` | Standardized ~2015 | Use standard API, no prefix needed. All modern browsers support it. |
| Manual DOM portals | `createPortal` (React) | React 16+ | Standard way to render outside component tree |
| CSS animation via JS style manipulation | CSS class toggling with keyframes | Evergreen | More performant; browser compositor handles animation. Use class names per phase. |

**Deprecated/outdated:**
- `document.webkitHidden` / `webkitvisibilitychange` -- fully replaced by unprefixed API
- Inline `style={{ animation: ... }}` for complex multi-phase animations -- prefer CSS classes for GPU compositing

## Open Questions

1. **Breathing circle visual design**
   - What we know: D-01 says expanding/contracting circle based on `breathe` keyframe. D-03 says phase text fades between states.
   - What's unclear: Exact circle size, gradient colors, border treatment. The existing `breathe` animation only scales 1->1.05 (very subtle).
   - Recommendation: Create a more dramatic scale range (0.6->1.0) for the breathing circle specifically. Use the forest-green/ocean-blue gradient from the design system. The existing `breathe` keyframe remains for other UI elements; the overlay gets dedicated animations.

2. **Banner positioning for missed reminders**
   - What we know: D-14 says "slide in from the top of the calendar panel, not the window edge."
   - What's unclear: The calendar panel is inside a `glass-panel rounded-3xl` container. Should the banner be inside or outside this container?
   - Recommendation: Inside the container, absolutely positioned at the top. This keeps it contextual as the user decision specifies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (per CLAUDE.md) |
| Config file | none |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WEL-01 | Breathing overlay appears at configured time before meeting | manual-only | Manual: enable breathing reminders, set to 5 min, create meeting 5 min from now, wait for overlay | N/A |
| WEL-02 | Back-to-back meeting warning shows between gapless meetings | manual-only | Manual: have 2+ meetings with 0-5 min gap, verify amber connector | N/A |
| POL-01 | Loading/error states present on all data-fetching paths | manual-only | `npm run build` (type-checks all paths) | N/A |
| POL-02 | Empty states display correctly | manual-only | Manual: disconnect calendar, verify empty states | N/A |

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** `npm run build` succeeds + manual visual verification of all states

### Wave 0 Gaps
None -- no test infrastructure to set up (project has no test framework per CLAUDE.md).

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- direct reading of all referenced source files (MeetingsList.tsx, CalendarHub.tsx, useUserSettings.ts, useMeetings.ts, CalendarConnections.tsx, CalendarSettings.tsx, ProtectedRoute.tsx, AuthContext.tsx, index.css, tailwind.config.ts, package.json, types.ts)
- **React docs** -- createPortal, useEffect cleanup patterns (standard React 18 knowledge)
- **MDN** -- Page Visibility API (`document.hidden`, `visibilitychange` event) is a stable W3C Recommendation

### Secondary (MEDIUM confidence)
- **date-fns v3** -- `differenceInMinutes`, `isBefore`, `isAfter`, `addMinutes` (verified available in package.json ^3.6.0)

### Tertiary (LOW confidence)
- None. All research is based on direct codebase inspection and stable web platform APIs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything verified in package.json and codebase
- Architecture: HIGH -- patterns are standard React (hooks, portals, CSS animations)
- Pitfalls: HIGH -- well-known JavaScript timer and React cleanup issues with documented solutions

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stable domain, no rapidly changing dependencies)
