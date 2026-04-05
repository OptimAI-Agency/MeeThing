# Pitfalls Research

**Domain:** Wellness/companion calendar SPA — adding push notifications, typography, ambient animation, reflection prompts, and view toggles to an existing React 18 + Vite + Supabase app
**Researched:** 2026-04-04
**Confidence:** MEDIUM-HIGH (WebSearch-verified against multiple sources for each topic; Context7 not queried per subtopic — flag for validation on Service Worker / vite-plugin-pwa specifics if that route is taken)

> This document replaces the v1 launch pitfalls file. For OAuth/security/Microsoft pitfalls from the prior milestone, see git history of this file.

## Critical Pitfalls

### Pitfall 1: Asking for push permission on page load (or too early in the relationship)

**What goes wrong:**
The app calls `Notification.requestPermission()` on mount, on first login, or immediately after a user opens CalendarHub. Users see a browser-chrome prompt with zero context — "MeeThing wants to send you notifications" — and dismiss or block it. Once denied, **the browser permanently prevents the site from asking again**; the only recovery is a per-browser sequence of site settings clicks that most users will never perform. The single most valuable wellness-loop feature is now permanently locked out for the majority of users.

**Why it happens:**
It is the default "happy path" sample code in every web-push tutorial. Developers treat `requestPermission` as a configuration step rather than a persuasion step. For a wellness app this is doubly damaging because push is the *entire* retention mechanism — there is no "alternative funnel" if users block it.

**How to avoid:**
- **Never call `Notification.requestPermission()` outside a user gesture.** Modern Chromium warns/throws if it is called on load; Safari refuses entirely.
- Implement a **pre-prompt** (in-app modal or banner styled in the wellness design system) that explains the benefit in human language ("We'll remind you to breathe before your next meeting") with an explicit "Enable gentle reminders" button. Only trigger the real browser prompt when the user clicks that button.
- **Gate the pre-prompt behind meaningful engagement** — e.g. after the user has opened the app 2+ days, or after they enable the breathing reminder setting. A first-time visitor has not yet earned the right to be asked.
- Detect `Notification.permission === 'denied'` and show a recovery card with *browser-specific* instructions ("Click the lock icon → Site settings → Notifications → Allow"). Don't leave blocked users with a silent dead end.
- Treat the in-app pre-prompt as the "question"; treat the browser prompt as merely the OS-level confirmation of an already-yes answer.

**Warning signs:**
- Code calls `requestPermission` inside `useEffect` with an empty dep array.
- No feature gate between signup and the push prompt.
- No UI path for `permission === 'denied'`.
- Opt-in conversion rate below 20% after launch.

**Phase to address:**
Phase dedicated to Web Push (Service Worker + Supabase Edge Function). Add a sub-task: "Pre-prompt UX + denied-state recovery UI" as a hard acceptance criterion.

---

### Pitfall 2: Notification fatigue — turning a calm companion into a nagging app

**What goes wrong:**
Because MeeThing is a wellness product, users who enable notifications are opting in to *calm*. If the app sends a push for every meeting (potentially 6+ per day), plus breathing reminders, plus wind-down prompts, plus weekly summaries, the user's phone buzzes constantly. The exact audience MeeThing targets — "people who feel drained by their meetings" — is the audience most allergic to notification spam. They will silently mute the site, then churn. This is brand-lethal: every notification that feels noisy actively contradicts the core value proposition.

**Why it happens:**
Each notification feels justified in isolation ("the breathing reminder is valuable!", "the wind-down prompt is valuable!"), but nobody sums them across a realistic day. The PM/designer does not dogfood at 6 meetings/day.

**How to avoid:**
- **Hard daily cap** enforced server-side in the Edge Function: maximum 3 pushes per user per day, regardless of settings. This is a safety valve, not a user-tunable value.
- **Quiet hours by default** (e.g. 21:00–08:00 local time). Require explicit user action to receive notifications outside this window.
- **Coalesce notifications**: one "Your day has 4 meetings, first at 10am" morning push instead of four per-meeting reminders.
- **Frequency caps per notification type**: breathing reminders max 1/day; wind-down max 1/day; meeting reminders only for meetings with <15 min buffer after a previous meeting (contextually valuable).
- **Granular opt-out per category** in settings, not a single master toggle. Let users keep wind-down and disable meeting pings without losing everything.
- Industry guidance consistently lands at **2–5 notifications per week** as a sustainable baseline for engagement apps. For a wellness brand, err lower.
- **Treat quietness as a feature** in copy: "MeeThing will only nudge you when it matters."

**Warning signs:**
- Any code path that emits a push per meeting without a coalescing layer.
- Notification settings page has a single master switch.
- Edge Function has no per-user daily counter / rate limiter.
- No `respect_quiet_hours` field on the `user_settings` table.

**Phase to address:**
Same push phase as Pitfall 1. The Edge Function that fans out notifications MUST include the rate limiter from day one — bolted on later, users have already churned.

---

### Pitfall 3: FOUT / CLS when loading the warm serif typeface

**What goes wrong:**
The app loads the new warm wellness serif from Google Fonts via `<link>` or `@import`. On first paint, text renders in the system fallback; when the webfont arrives 200–800ms later, every piece of text reflows because the serif has different metrics than the sans fallback. Meeting cards jump, the greeting shifts downward, the Today's Rhythm timeline recomputes. For a "calm, beautiful" wellness app, this is a jarring visual pop on every page load — the exact opposite of the brand promise. It also hurts CLS (a Core Web Vital) and SEO.

**Why it happens:**
- Using `font-display: auto` (the historical default) causes FOIT (invisible text), then a swap to FOUT.
- Using `font-display: swap` without `size-adjust` / `ascent-override` metric fallbacks causes layout shift when metrics differ.
- Loading via `@import` in CSS blocks the CSS parse and delays everything downstream.
- Tailwind `font-family` setup is often hand-wired with no preload `<link rel="preload">`.
- Vite dev server does not flag CLS; the issue is invisible locally on fast machines.

**How to avoid:**
- **Self-host the font files** (add .woff2 to `/public` or `src/assets`) instead of hotlinking Google Fonts. Eliminates third-party DNS/TLS roundtrip, improves privacy, and gives you preload control.
- Alternatively use `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` + `<link rel="preload">` on the specific woff2 URL for the serif weights actually used.
- Use `font-display: swap` AND generate **metric-compatible fallbacks** via `@font-face` with `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` (Fontaine / Fontsource / Capsize can compute these). This is the modern answer to CLS.
- Load **only the weights and glyphs actually used** — a serif display font at 4 weights is ~200KB. For wellness moment subset, 1–2 weights is usually enough.
- Add **CLS testing** to the verification step (Lighthouse or DebugBear). Target CLS < 0.1.
- Since Tailwind v3/v4 uses `font-family` utilities, define the serif once in `tailwind.config.ts` (or `@theme` in v4) and never inline it in components — makes the fallback stack consistent.
- Test in **throttled 3G** in DevTools — this reveals FOUT that never appears on localhost.

**Warning signs:**
- Network tab shows font requests from `fonts.gstatic.com` on first paint.
- No `<link rel="preload">` for the serif.
- No `size-adjust` in any `@font-face` declaration.
- CLS > 0.1 in Lighthouse.
- Designers notice "the text jumps" on refresh.

**Phase to address:**
Phase that introduces the typography system (the serif is paired with the ambient background / glassmorphism-as-accent work). Ship the font loading strategy *before* any component uses the serif, not afterward.

---

### Pitfall 4: Ambient breathing animation causing jank, battery drain, and motion sickness

**What goes wrong:**
The "ambient beauty — breathing background" is implemented as an animated `backdrop-filter: blur()` pulse, or an always-on CSS `@keyframes` transform at 0.2Hz across a large element, layered under the already-glassmorphic UI. Symptoms in production:
1. Mobile Safari stutters during scroll — backdrop-filter + animation forces recomposite per frame.
2. Laptop fans spin up; battery drains noticeably on long sessions (wellness apps are *meant* to linger).
3. Users with vestibular disorders feel motion-sick from the constantly moving background; the app is literally making people feel worse.
4. The existing `breathe`, `gentle-float`, `fade-in`, `scale-in` animations compound, creating "everything on screen is moving simultaneously."
5. Running on a background tab at 0.2Hz still triggers paint work unless paused on `visibilitychange`.

**Why it happens:**
- Animating `backdrop-filter` (or any property other than `transform`/`opacity`) triggers layout/paint/composite every frame.
- `will-change` is sprinkled liberally, promoting every blurred element to its own GPU layer and exhausting memory on mobile.
- `prefers-reduced-motion` is not respected at all, or is respected only for "big" animations like page transitions.
- The existing `useBreathingReminder` hook uses Page Visibility API for logic, but the *decorative* background animation keeps running regardless.
- Designers don't test on an iPhone SE / mid-range Android.

**How to avoid:**
- **Animate only `transform` and `opacity`.** For a breathing background, use a `transform: scale(1) → scale(1.03)` on a pre-blurred element, not an animated `backdrop-filter`.
- **Do NOT animate `backdrop-filter`, `filter`, `box-shadow`, or `width/height`** on anything, ever.
- **Cap layered blurred elements at 2–3 per viewport** and keep blur radii ≤ 8–12px on mobile.
- **Wrap the ambient animation in `@media (prefers-reduced-motion: reduce) { animation: none; }`** — not a subtle reduction, a full stop. For wellness users this is table stakes accessibility.
- **Pause the animation on `document.visibilitychange === 'hidden'`** (reuse the pattern from `useBreathingReminder`). Apply `animation-play-state: paused` via a `data-hidden` attribute on `<html>`.
- **Audit compound motion**: if the ambient background is breathing, the meeting cards should NOT also float/scale simultaneously. Pick a motion hierarchy — one primary motion, everything else static.
- **Use `will-change` sparingly** and remove it after the animation completes (`will-change` is not free — it allocates a compositor layer until removed).
- **Profile on a real mid-tier phone** using Chrome DevTools remote debug → Performance tab. Target a stable 60fps (or 120fps on ProMotion) during scroll with the background animating.
- Consider a **"reduce ambient motion" toggle** inside the app itself, independent of OS-level setting, for users who want the app but not the movement.

**Warning signs:**
- Chrome DevTools Performance tab shows long purple "Recalculate Style" / green "Paint" bars during the idle animation.
- iOS Safari drops below 30fps during scroll on the CalendarHub.
- No `@media (prefers-reduced-motion)` rules in `src/index.css` for the new background.
- The word "backdrop-filter" appears inside a `@keyframes` rule.
- Device battery usage in Settings shows MeeThing consuming foreground battery at 2–3× other tabs.

**Phase to address:**
Phase that introduces the ambient breathing background. Make "reduced-motion + mobile Safari profile" a hard acceptance criterion — not a post-launch polish item.

---

### Pitfall 5: Today/Week toggle state desync, scroll jump, and lost context

**What goes wrong:**
The today/week view toggle is implemented as a single `useState<'today' | 'week'>('today')` inside CalendarHub. Consequences:
1. **Refresh loses the state** — user switched to week view, refreshes, lands back on today. Feels broken to power users.
2. **Deep links don't work** — user can't share or bookmark "my week view". Support can't say "open this URL."
3. **Scroll position is lost** on every toggle — switching from week → today scrolls to top, losing the meeting the user was looking at.
4. **Multi-tab conflict** — user has the app open in two tabs, sets view in tab A via `localStorage`, tab B doesn't know and shows stale view until refresh.
5. **The "today" derived data** (meeting count for greeting, rhythm timeline, wind-down trigger) is computed from the toggled view instead of always being "real today" — so when the user switches to week view, the morning greeting says "you have 23 meetings today" because it's counting the week.
6. **Hydration flash** — default is `'today'`, then `useEffect` reads `localStorage` and flips to `'week'`, causing a visible re-render.
7. On browser back after toggling, the view doesn't restore because toggle wasn't pushed to history.

**Why it happens:**
- View preferences and view selections are conflated. "My default view" (preference, goes in `user_settings` or localStorage) is different from "what I'm currently looking at" (session state, belongs in URL).
- React state is the easy answer; everything else feels like overkill until the bug reports arrive.

**How to avoid:**
- **Use the URL as the source of truth for the current view.** `useSearchParams` with `?view=today|week`. This solves: refresh persistence, deep linking, browser back/forward, shareable support links.
- **Store the default view preference separately** in `user_settings.default_view` (DB) or localStorage as a *fallback only* — applied only when the URL has no `view` param, and only on the initial landing.
- **Never read the preference inside a `useEffect` that then `setState`s** — this causes the hydration flash. Instead, initialize state via a lazy initializer function that reads storage *once* during the first render: `useState(() => readPreference())`.
- **Keep "today's data" (greeting copy, rhythm timeline, wind-down) derived from a separate `todayMeetings` memo** that is *always* filtered to `date === today`, regardless of the view toggle. Toggling the view must NOT change the morning greeting text.
- **Preserve scroll position** with `<ScrollRestoration>` (React Router) or a manual save/restore per view in sessionStorage keyed by `view` param.
- **Sync tabs** with a `storage` event listener if you absolutely must use localStorage, OR rely on the URL (tabs have independent URLs, so the conflict disappears).
- **Avoid flicker**: render nothing or a skeleton until the preference is resolved, or serve the preference via a cookie readable synchronously.

**Warning signs:**
- `useState<'today' | 'week'>('today')` with no persistence or URL sync.
- The greeting component accepts `meetings` instead of `todayMeetings` as a prop.
- Toggling the view causes the page to scroll to top.
- Browser back button after toggling does nothing.
- QA finds "greeting says wrong meeting count in week view."

**Phase to address:**
Phase that introduces the today-first layout and week toggle. Design the state model in writing before touching code: "today's derived data lives here, current view lives in URL, default view lives here."

---

### Pitfall 6: Wind-down / end-of-day prompt that nobody ever sees

**What goes wrong:**
The wind-down reflection view is built beautifully, placed behind a route, and surfaced via:
- A nav link that reads "Wind down" — nobody clicks random nav items.
- A push notification at 5pm — half of users never enabled push (Pitfall 1); the other half are still in meetings at 5pm and dismiss it.
- An in-app modal that appears "when appropriate" — the logic for "appropriate" is under-specified, so it either never fires or fires during a meeting.

Result: the feature with the deepest wellness value has a near-zero usage rate, the habit loop never forms, and the team concludes "users don't want reflection" when really they never encountered the prompt.

**Why it happens:**
- Wind-down is the last feature built, so it gets the least discoverability thought.
- Designers assume "a beautiful view is enough" — it isn't. Real users ignore, bypass, or abandon beautifully crafted habit loops because the product didn't meet them where they were.
- Habit loops fail when the **cue** is absent or unreliable. Push notifications as the primary cue fail the ~50–70% of users who blocked push.
- The trigger is static ("5pm") rather than contextual ("after your last meeting ended, when you return to the tab").

**How to avoid:**
- **Surface it inside the main view, not behind a route.** When the user's last meeting of the day is over, the CalendarHub's primary content area transitions into a gentle wind-down card where the next meeting would be. No click required — the cue IS the UI.
- **Use a contextual trigger**, not a wall-clock trigger. Fire when (a) last meeting ended ≥10 min ago, (b) it's after 16:00 local, (c) user has the tab visible (Page Visibility API — already in use). This is ~10× more likely to catch the user in an end-of-day moment.
- **Make it a micro-action, not a full reflection.** "How did today feel?" with three emoji buttons beats "Write about your day." Micro-actions remove shame, overwhelm, and resistance. The *form* of the prompt matters more than the copy.
- **No streaks, no guilt.** Missing a day resets nothing. Compassionate copy: "Whenever you're ready." Streak counters activate shame and destroy the habit.
- **Multiple gentle cues, never one firehose.** In-app card (primary) + optional push (secondary, only if enabled and within daily cap) + a subtle Today's Rhythm timeline visual ("your day is nearly complete") as a tertiary ambient cue.
- **Instrument discoverability** from day one — log how many users *saw* the prompt vs how many *interacted*. If "saw" is low, the cue is broken, not the feature.
- **Don't require auth-gated reflection state** on the critical path — if loading the reflection view requires a fresh Supabase round-trip, users will time out emotionally before the card renders.

**Warning signs:**
- The wind-down feature's only entry point is a nav link or a push notification.
- The trigger condition is "time === 17:00" with no context check.
- No analytics distinguishing "prompt impression" from "prompt interaction."
- The prompt asks for more than 1–2 taps of input.
- Copy contains "streak", "don't break the chain", or "you missed yesterday."

**Phase to address:**
Phase that introduces the wind-down / end-of-day view and the contextual greeting. Tie it to the same phase as the Today's Rhythm timeline — the timeline is the ambient cue that leads the eye into wind-down.

---

### Pitfall 7: Service Worker stale-cache trap on update

**What goes wrong:**
Adding a Service Worker to enable Web Push also silently turns MeeThing into a cached app. On the next deployment, returning users get the *old* `index.html` from the SW cache, which references old hashed JS chunks that may or may not still exist on the server. Users see: (a) a stale UI with missing features, (b) white screens if the chunks were purged, or (c) a broken push subscription because the SW script version drifted from the push logic in the app. The existing auth flow may also break because Supabase tokens rotate and the cached client expects old response shapes.

**Why it happens:**
- Web Push requires a Service Worker, but a Service Worker *also* caches by default if you follow most tutorials.
- Developers copy a full PWA/Workbox recipe when they only needed the push handler.
- `index.html` caching is the #1 stale-cache pitfall — even with hashed JS, the HTML pointing to those hashes is cached.
- No `skipWaiting` / `clientsClaim` update flow, so the new SW sits in "waiting" state until every tab is fully closed (which for a productivity app may be *days*).

**How to avoid:**
- **Scope the Service Worker to push only.** No `fetch` event handler, no caching, no Workbox. The file is 20 lines: `self.addEventListener('push', ...)` and `self.addEventListener('notificationclick', ...)`. That's it.
- If caching is ever added later, use a **network-first** strategy for `index.html` and cache-first only for hashed static assets.
- Implement an **update flow from day one**: register the SW, listen for `updatefound`, and when a new worker is waiting, show a small "Update available — refresh" toast. Call `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` on user confirm.
- **Version the SW file** with a constant (`const SW_VERSION = '2026-04-04-1'`) so you can force updates by changing the constant.
- **Test the upgrade path** explicitly: deploy v1, visit site, deploy v2, revisit — does the update flow fire? Do this in CI or manually before every release for the first few months.
- **Never put `vite-plugin-pwa` in "autoUpdate" mode without reading what it does** — its default caching behavior will bite.

**Warning signs:**
- The SW file contains any `caches.open(...)` calls.
- No update-available UI in the app shell.
- Users report "I don't see the new feature" after a deploy.
- `navigator.serviceWorker.controller` is non-null on a first visit (indicates a stray SW from an experiment).

**Phase to address:**
Phase that introduces Web Push. Make "SW contains push handlers only, no fetch caching" an explicit acceptance criterion and code-review gate.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hotlink Google Fonts via `<link>` | One line, zero config | FOUT, CLS, third-party dependency, privacy liability | Prototype/dev only — never for v2.0 production |
| Single master "Notifications on/off" toggle | Simple settings UI | Users opt out of everything to escape one noisy category; can't rebuild granular trust later | Never — granular categories from day one |
| `useState` for today/week toggle with no persistence | Ships in 10 minutes | Every bug report in the first month: "it forgot my view" | Never — URL param is ~20 extra minutes |
| Copy-paste a full Workbox/vite-plugin-pwa setup for push | "PWA-ready" for free | Silent caching disasters on deploy; hard to reason about | Never — handwrite a minimal push-only SW |
| Animate `backdrop-filter` for the breathing background | Looks cool in a Figma export | Jank on every mobile device, battery drain, motion sickness | Never — use transform/opacity on a pre-blurred layer |
| Store view preference only in localStorage | Survives refresh | Multi-tab conflict, hydration flash, not synced across devices | Acceptable as a secondary fallback under `user_settings.default_view` |
| Fire wind-down at fixed 17:00 | Simple cron-like logic | Catches no one — people are in meetings or away | Never — use contextual trigger (post-last-meeting + tab visible) |
| Call `requestPermission` on first app load | Maximizes theoretical opt-in surface | Guarantees minimum actual opt-in; permanent block for most users | Never — always behind a pre-prompt with user gesture |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Service Worker (new) | Registering via `vite-plugin-pwa` defaults (caches everything) | Hand-roll a minimal `/sw.js`, register manually in `main.tsx`, no fetch handler |
| Push API | Subscribing immediately after `requestPermission` with no server reachability check | Subscribe, POST subscription to Supabase Edge Function, verify 200 before showing "you're set" UI |
| Supabase Edge Function (push sender) | Using `web-push` with VAPID keys committed to the repo | Store VAPID private key in Supabase secrets; public key as `VITE_` env var is fine |
| Supabase Realtime (if used for greetings/meetings) | Subscribing in a component that re-mounts on view toggle | Subscribe at the `AuthContext` / app-root level, not inside CalendarHub |
| Google Fonts | `@import` inside a CSS file that is imported by a component | Self-host woff2 in `/public` + `<link rel="preload">` in `index.html` |
| Tailwind custom font family | Adding `fontFamily.serif` in `tailwind.config.ts` but not generating size-adjust fallback | Pair every custom `fontFamily` with an `@font-face` fallback using `size-adjust`/`ascent-override` |
| Page Visibility API | Using it only for the breathing reminder, not for the ambient background animation | Create a single `useIsTabVisible` hook and consume it everywhere (breathing, ambient, wind-down) |
| React Router + URL state | Reading `useSearchParams` without a default, then writing back and causing a navigation loop | Use `setSearchParams(prev => ...)` and memo-compare before setting |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Animating backdrop-filter | Jank during scroll, fan spin, battery drain | Animate only `transform`/`opacity` on a pre-blurred layer | Mobile Safari, always; desktop on low-end GPUs |
| Compound simultaneous animations (ambient + cards + floats) | "Everything is moving", motion sickness reports | Establish a motion hierarchy: one primary motion, others static | Immediately on any device with reduced-motion users |
| `will-change` left on forever | Memory pressure, tab crashes on mobile | Apply `will-change` only while animation is active; remove after | iOS Safari with >2GB RAM pressure |
| Unpaused animation on hidden tab | Background CPU usage, battery drain | Pause via `animation-play-state: paused` on `visibilitychange` | Long sessions (wellness app = lingering tab) |
| Webfont CLS | Visible text reflow on every load | `size-adjust`/`ascent-override` fallback + preload | Throttled 3G, first visit, every visit until cached |
| Meeting list re-renders on every toggle | Slow view switch, perceived sluggishness | Memoize `todayMeetings` / `weekMeetings` separately, not a single derived list | When meeting count > 30/week |
| Push Edge Function fan-out without rate limit | User receives N notifications for N meetings | Per-user daily counter in the DB; coalesce in the function | First day any user has 4+ meetings |
| Service Worker caching `index.html` | Users see old UI after deploy | No fetch handler, or network-first for HTML | Every deployment |

## Security Mistakes

Domain-specific security issues beyond general web security (the OWASP/OAuth basics are covered in PROJECT.md SEC-01…SEC-03).

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing VAPID private key to the repo | Anyone can send push notifications to all your users | Store in Supabase secrets; only public key is in client bundle |
| Push subscription endpoint stored unencrypted | Endpoint + auth/p256dh keys can be used by an attacker with DB access to spam users | Treat `push_subscriptions` rows like OAuth tokens — same row-level security, same encryption discipline |
| Push payload contains meeting title / attendees | Push payloads are end-to-end encrypted by the browser, but logs/telemetry may leak | Keep payloads generic ("Your next meeting starts in 10 min"); fetch detail client-side after click |
| Service Worker scope set to `/` then adding a `fetch` handler later | A future dev can accidentally proxy auth requests through the SW, caching Supabase tokens | Keep SW scope narrow; never add a fetch handler without code review |
| Notification click handler that blindly opens URL from payload | Phishing vector if backend is compromised | Whitelist URLs in the SW; open only known app routes |
| `prefers-reduced-motion` check bypassed by in-app toggle | Minor accessibility risk | In-app "reduce motion" toggle can only *add* reduction, never override OS pref |
| Logging Supabase user IDs in push payloads for debugging | PII leak to push infrastructure (FCM/APNs) | Use opaque subscription IDs, never user UUIDs, in payloads |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Asking for push permission before the user trusts the app | Permanent denial, feature dead for that user | Pre-prompt gated on engagement + user gesture |
| Single "Notifications" master toggle | User disables everything to escape one noisy category | Per-category toggles: breathing / wind-down / meeting buffers |
| Streak counters on reflection habit | Shame on miss → churn | No streaks. "Whenever you're ready." |
| Reflection prompt requires >30 seconds of input | Ignored in practice | 1–3 tap micro-action (emoji, single word) |
| Wind-down surfaced only via nav link | Near-zero discovery | Embed inline in main view when last meeting ends |
| Week view shows "today's" greeting derived from week data | Greeting says "23 meetings today" | Separate `todayMeetings` memo, never tied to view toggle |
| Toggle scrolls to top on every switch | User loses the meeting they were looking at | Save/restore scroll per view |
| Refresh forgets view choice | "App feels broken" | URL param as source of truth |
| Ambient motion with no reduce-motion support | Motion-sick users abandon | Full stop under `prefers-reduced-motion: reduce` |
| Greeting uses first name harvested from Google profile with no fallback | "Hello, undefined" | Fallback chain: profile display_name → email local-part → "Hello" (no name) |
| Meeting color by time-of-day applied with no contrast audit | Low-contrast meeting titles at "evening" slots | Audit every color pairing against WCAG AA for normal text |
| Time-of-day colors that fight the ambient breathing background | Visual noise | Time-of-day tint is a *border* or *accent stripe*, not a card fill |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces — use this during phase verification.

- [ ] **Web Push:** Opt-in works on a fresh profile. Also verify: (a) denied-state recovery UI exists, (b) daily cap enforced in Edge Function, (c) quiet hours respected, (d) subscription survives a SW update, (e) notification click deep-links to the right route.
- [ ] **Serif typeface:** Looks right in dev. Also verify: (a) CLS < 0.1 on throttled 3G, (b) font files self-hosted, (c) `size-adjust` fallback defined, (d) only used weights are loaded, (e) rendered correctly in dark mode.
- [ ] **Ambient breathing background:** Looks nice on a MacBook. Also verify: (a) 60fps during scroll on mid-tier iPhone, (b) `prefers-reduced-motion` halts it entirely, (c) paused on hidden tab, (d) no `backdrop-filter` inside `@keyframes`, (e) in-app reduce-motion toggle works.
- [ ] **Today/Week toggle:** Switches views correctly. Also verify: (a) URL reflects the view, (b) refresh preserves view, (c) back button works, (d) scroll position preserved, (e) greeting always shows today's count, (f) no hydration flash on load.
- [ ] **Wind-down prompt:** Fires at the right time. Also verify: (a) inline in main view (not behind a route), (b) contextual trigger (not wall clock), (c) micro-action (≤3 taps), (d) no streaks or shame copy, (e) analytics distinguish impression vs interaction.
- [ ] **Contextual greeting:** Shows name + meeting count. Also verify: (a) fallback chain when name is missing, (b) count is "today" not "current view", (c) copy variants by time-of-day render, (d) no "undefined" possible, (e) updates live if meetings sync while open.
- [ ] **Today's Rhythm timeline:** Renders correctly. Also verify: (a) accessible via keyboard, (b) screen-reader-friendly text alternative, (c) responsive (mobile vs desktop layouts), (d) gracefully empty when no meetings, (e) "buffer" regions visually distinguished without relying on color alone.
- [ ] **Service Worker:** Registered successfully. Also verify: (a) no fetch handler, (b) update flow shows toast, (c) unregisters cleanly in dev, (d) scope is narrow, (e) VAPID key is from env.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Users permanently denied push | HIGH | Cannot reprompt. Ship denied-state recovery UI with browser-specific unblock instructions; email campaign to re-ask on next major version |
| Notification fatigue driving churn | HIGH | Retrofit daily cap + quiet hours immediately; send one apology push announcing the change; add granular categories |
| CLS from webfont already live | MEDIUM | Self-host + add `size-adjust` fallback; deploy, monitor Core Web Vitals for 1 week |
| Ambient animation jank reported | MEDIUM | Add `prefers-reduced-motion` rule as hotfix; replace `backdrop-filter` animation with `transform` on pre-blurred layer in next release |
| Toggle state lost bug reports | LOW | Add URL param + lazy initializer; ships in a patch release |
| Wind-down feature ignored | MEDIUM | Move entry point inline into main view; change trigger to contextual; re-measure after 2 weeks |
| SW caching stale `index.html` | HIGH | Ship a version-bumped SW that unregisters itself and clears caches; notify users to refresh via banner |
| VAPID key committed to repo | CRITICAL | Rotate keys immediately, invalidate all existing subscriptions, re-prompt users to re-subscribe (with a good pre-prompt) |

## Pitfall-to-Phase Mapping

The exact phase names will be decided by the roadmap author, but the mapping below shows which concerns cluster together.

| Pitfall | Prevention Phase (topic) | Verification |
|---------|-------------------------|--------------|
| #1 Push permission too early | Web Push phase | Manual test on fresh browser profile; `requestPermission` only from a click handler |
| #2 Notification fatigue | Web Push phase (Edge Function) | Load test: simulate 10-meeting day, assert ≤3 pushes sent |
| #3 Webfont FOUT/CLS | Typography phase (serif introduction) | Lighthouse CLS < 0.1 on throttled 3G |
| #4 Ambient animation jank | Ambient beauty phase (background + motion) | Chrome DevTools Performance profile on iPhone: 60fps during scroll |
| #5 View toggle state | Today-first layout phase | URL param present, refresh preserves, back button works, no hydration flash |
| #6 Wind-down discoverability | Wind-down / end-of-day phase | Analytics dashboard shows impression-to-interaction ratio in week 1 |
| #7 SW stale cache | Web Push phase | SW file grep for `caches.open` returns zero matches; update toast tested in staging |

Cross-cutting: **motion hierarchy, reduced-motion support, and in-app motion toggle** should be decided in whichever phase introduces the first new animation, then reused by all subsequent phases.

## Sources

- [Web permissions best practices | web.dev](https://web.dev/articles/permissions-best-practices)
- [Notification.requestPermission() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static)
- [Reset the denied permission for notifications - Pushpad](https://pushpad.xyz/blog/reset-the-denied-permission-for-notifications)
- [Request permission for web push notifications - Pushpad](https://pushpad.xyz/blog/request-permission-for-web-push-notifications)
- [Push Notification Best Practices - MoEngage](https://www.moengage.com/learn/push-notification-best-practices/)
- [Push Notification Best Practices - Braze](https://www.braze.com/resources/articles/push-notifications-best-practices)
- [Web Push Notification Best Practices - Gravitec](https://gravitec.net/blog/web-push-notification-best-practices/)
- [Flash of Unstyled Text (Google Fonts) - Tailwind Discussion #12538](https://github.com/tailwindlabs/tailwindcss/discussions/12538)
- [Fixing Layout Shifts Caused by Web Fonts - DebugBear](https://www.debugbear.com/blog/web-font-layout-shift)
- [Self-host Google Fonts with Tailwind starter](https://github.com/dtro-devuk/nextjs-tailwind-googlefonts-selfhost-starter)
- [prefers-reduced-motion - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [prefers-reduced-motion: Sometimes less movement is more - web.dev](https://web.dev/articles/prefers-reduced-motion)
- [Design accessible animation and movement - Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [The Web Animation Performance Tier List - Motion Magazine](https://motion.dev/magazine/web-animation-performance-tier-list)
- [CSS Backdrop-Filter: Complete Guide - CodeLucky](https://codelucky.com/css-backdrop-filter/)
- [Glassmorphism UI Features and Best Practices - UXPilot](https://uxpilot.ai/blogs/glassmorphism-ui)
- [How to control PWA updates with React and Vite - Medium](https://medium.com/@leybov.anton/how-to-control-and-handle-last-app-updates-in-pwa-with-react-and-vite-cfb98499b500)
- [Stuff I wish I'd known sooner about service workers - Rich Harris](https://gist.github.com/Rich-Harris/fd6c3c73e6e707e312d7c5d7d0f3b2f9)
- [Bust cache after release - vite-plugin-pwa Issue #33](https://github.com/vite-pwa/vite-plugin-pwa/issues/33)
- [Advanced React state management using URL parameters - LogRocket](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/)
- [Why URL state matters: useSearchParams - LogRocket](https://blog.logrocket.com/url-state-usesearchparams/)
- [Persisting React State in localStorage - Josh W. Comeau](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/)
- [Improving Well-Being Apps - The Decision Lab](https://thedecisionlab.com/big-problems/improving-well-being-apps)
- [What Designers Get Wrong About Habit Loops - Bootcamp](https://medium.com/design-bootcamp/what-designers-get-wrong-about-habit-loops-and-how-to-fix-it-6fd47be714d2)
- [Understanding habit loops - Evidation](https://evidation.com/blog/understanding-habit-loops-how-to-build-healthy-habits)

---
*Pitfalls research for: MeeThing v2.0 Companion Experience — push, typography, ambient motion, wind-down, view toggles*
*Researched: 2026-04-04*
