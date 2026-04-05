# Project Research Summary

**Project:** MeeThing v2.0 Companion Experience
**Domain:** Wellness calendar companion — elevating an existing React 18 + Vite + Supabase SPA into a lingering daily companion
**Researched:** 2026-04-04
**Confidence:** MEDIUM-HIGH (stack HIGH, architecture HIGH for UI patterns / MEDIUM for push, features MEDIUM, pitfalls MEDIUM-HIGH)

> This summary supersedes the v1 research summary (2026-03-22). The v1 summary covered security, Microsoft OAuth, settings persistence, and the wellness engine. This summary covers the v2.0 Companion Experience milestone: language overhaul, today-first layout, companion UI components, ambient beauty, and Web Push infrastructure.

## Executive Summary

MeeThing v2.0 is an additive milestone on a solid existing foundation. The goal is not to rebuild the calendar but to transform its emotional register — from utility tool to calm companion. Research across four dimensions confirms this is achievable with modest new dependencies (a service worker, a variable serif font, and a Supabase Edge Function), a disciplined component structure that derives views in-memory from the existing 7-day meetings cache, and a creative investment in copy, typography, and palette that dwarfs the engineering effort. The engineering is mostly straightforward. The actual critical path is editorial: language overhaul, greeting templates, notification copy, and typeface pairing are the decisions that will determine whether users feel the product is genuinely calm or just reskinned.

The recommended approach is to ship v2.0 in two sequential tracks. The first track — Foundation and Companion UI — delivers the today-first layout, contextual greeting, Today's Rhythm timeline, time-of-day warmth shift, warm typeface, and ambient breathing background. These features share a common dependency chain: the copy glossary blocks all text-bearing features; the today-first layout blocks the timeline and proportional cards; the design-system warmth palette is a prerequisite for meeting card tints and the ambient background. These can be built without touching new infrastructure. The second track — Web Push — is a self-contained infrastructure workstream that can run in parallel with the UI track but must not block v2.0 core, and has its own demanding acceptance-criteria surface.

The key risks are all well-documented and preventable, but most are irreversible once users encounter them: push permission permanently blocked by premature prompting; notification fatigue contradicting the calm brand promise; FOUT and layout shift from webfont loading degrading the "beautiful first impression"; ambient animation jank and battery drain on mobile (literally making users feel worse); and view-toggle state desync producing "the app feels broken" reports in the first month. All five risks have clear prevention strategies and must be addressed in the phase that introduces the relevant feature, not bolted on post-launch.

## Key Findings

### Recommended Stack

The existing stack requires only three additions for the v2.0 milestone. All are compatible with the existing Vite 5 + React 18 project and require no changes to the core dependency set.

**Core technologies to add:**
- `vite-plugin-pwa@^0.21` + `workbox-window@^7`: Service worker registration with `injectManifest` strategy — required for Web Push; use `devOptions.enabled: true` to test on localhost without a production build
- `@fontsource-variable/fraunces@^5`: Self-hosted variable wellness serif (weight, optical-size, softness, wonk axes in one file); paired with existing Inter; eliminates Google Fonts GDPR exposure and PWA offline failure; single import, controlled via `font-variation-settings`
- `jsr:@negrel/webpush` (Deno Edge Function only, no npm): Deno-native VAPID-signed push dispatch inside the new `send-push` Edge Function; avoids Node crypto shims that slow Deno cold starts

**Conditional:**
- `motion@^12`: Only if interactive transitions (card expand/collapse, timeline scrubbing) enter scope; import from `motion/react`; use `LazyMotion + domAnimation` to cap bundle cost at ~4.6 kB initial render; do not add for the ambient breathing background (CSS keyframes win on every axis for decorative, stateless animation)

**What not to add:**
- `web-push` (Node npm package) inside Supabase Edge Functions — use `jsr:@negrel/webpush` instead; the npm package pulls Node crypto polyfills that bloat and slow the Deno runtime
- Google Fonts via `<link>` in HTML for authenticated pages — self-host via Fontsource to eliminate GDPR friction and PWA offline failure
- `framer-motion` (the legacy package name) — it is in maintenance; the current package is `motion`
- Firebase JS SDK for push — 50 kB+ for functionality the native Web Push API handles for free

### Expected Features

Research draws a sharp line between what users of a wellness companion expect (table stakes) and what makes MeeThing genuinely distinctive (differentiators). The differentiators borrow vocabulary from meditation apps and apply it to time management — a space none of MeeThing's calendar competitors (Fantastical, Cron, Amie, Motion, Reclaim) occupy. The anti-feature list is equally important: all of them will be requested, all of them look aligned with the product, and all of them break it.

**Must have for v2.0 core:**
- Copy glossary + language pass — blocks every other text-bearing feature; "Dashboard," "Alerts," "Sync Now" must go before any new text is written
- Today-first layout with weekly toggle — structural prerequisite for the rhythm timeline and proportional cards
- Contextual greeting with specific calendar insight — "biggest gap: 2h after 2 PM" (factual, grounding) vs. "Hope you have a great day!" (filler that reads as cold)
- Proportional meeting cards with time-of-day tinting — reframes the day as rhythm, not todo list
- Today's Rhythm horizontal timeline — the signature new UI element; gaps named and celebrated, not just meetings listed
- Time-of-day warmth shift (4 named windows: dawn 5–9, day 9–16, dusk 16–19, night 19–5) — ambient sense of time passing without a visible clock
- Fraunces variable serif on greeting / wind-down / breathing overlay copy — emotional register signal; Inter stays for all UI chrome and data
- Empty and light-day celebratory copy — "A spacious day — enjoy the quiet" is non-negotiable; a wellness app cannot look broken on calm days
- Ambient breathing background — CSS keyframes on `transform + opacity` only; `prefers-reduced-motion` full-stop required

**Should have (v2.1 — add after core is stable):**
- Pre-meeting breathing push notification — high copy stakes; requires complete permissions UX; keep as one notification type at launch
- Wind-down view — depends on stable last-meeting detection; needs weeks of user rhythm to tune the trigger timing
- Weekly tone language ("a full week ahead" / "a lighter week") — add once daily greeting tone is locked

**Defer to v2.2+:**
- Optional 3-choice end-of-day reflection persistence — only if wind-down usage shows demand
- Personalized greeting templates based on past rhythms — needs history and privacy review
- Ambient soundscape toggle

**Anti-features to explicitly reject:**
- Streaks and gamification — creates guilt against the brand promise; missing a day becomes a failure event in a product that exists to reduce failure-feelings
- Notification badges and unread counts — the red dot is the primary anxiety signal this product sells against
- AI-generated meeting summaries — pulls the app into productivity-tool territory owned by Notion, Granola, Reclaim, Fireflies; also privacy-fraught
- Mood tracking dashboard — turns a feeling into a KPI; users optimize for the score and stop using the app when they "fail" a day
- Multiple daily notification types — 2–5 pushes per week is the sustainable baseline for engagement apps; launch with one type only (pre-meeting breathing cue)
- Dark mode as a simple palette inversion — the time-of-day warmth curve is the dark mode; evenings and nights are already dark and warm

### Architecture Approach

The v2.0 architecture is additive on the existing `CalendarHub.tsx` → `useMeetings()` → TanStack Query foundation. The governing principle is: derive all new views from the existing 7-day meetings cache via in-memory `useMemo` selectors — never create a second network call for a subset of data already fetched. A new `useTodayMeetings` hook wraps `useMeetings()`, and all new companion components consume it. The view mode toggle (today/week) belongs in URL state (`useSearchParams`), not component state — this single decision prevents five separate bug classes documented in pitfalls research. The Service Worker lives in `public/sw.js` (not `src/`) to preserve its stable scope URL; it contains only `push` and `notificationclick` handlers — no `fetch` handler, no caching, no Workbox.

**Major components and responsibilities:**
1. `lib/rhythm.ts` — Pure function `buildRhythmSegments(meetings, dayStart, dayEnd)`: derives meeting and breathing-room segments; free of React concerns; testable in isolation; must be built before any timeline component
2. `useTodayMeetings` / `useWindDownState` / `useContextualGreeting` — Derived hooks; in-memory selectors; zero additional network calls; automatic cache invalidation when the upstream meetings query refreshes
3. `CalendarHub.tsx` (modified) — Adds `viewMode` from `useSearchParams`; renders companion components conditionally; the one existing-file bottleneck — serialize its modification last in a single PR to avoid merge conflicts
4. `ContextualGreeting` / `TodaysRhythmTimeline` / `WindDownPanel` / `WeeklyToneSummary` — New presentational components in all-new files; can be built against mock data on a scratch route before `CalendarHub` integration
5. `public/sw.js` — 20-line push-only service worker; no caching; registered in `main.tsx` via `import.meta.env.BASE_URL` to support subpath deployment
6. `send-push` Edge Function — VAPID-signed push dispatch; reads `push_subscriptions` table; enforces per-user daily cap; mirrors the existing `google-calendar-sync` edge function layout
7. `push_subscriptions` migration — New table for endpoint + p256dh + auth keys per user; RLS-guarded by `user_id = auth.uid()`

**Recommended build order:** `lib/rhythm.ts` + `lib/greetings.ts` (pure functions, no conflicts) → derived hooks (additive files) → new presentational components (all new files) → `CalendarHub` integration (one PR, last) → ambient CSS and typeface (fully parallel, any time) → push track (parallel stream, separate review scope)

### Critical Pitfalls

1. **Push permission on page load** — once denied, the browser permanently prevents re-asking; recovery requires per-browser manual settings navigation most users will never complete. Gate `Notification.requestPermission()` behind an in-app pre-prompt modal with explicit benefit language ("We'll remind you to breathe before your next meeting"), triggered only from a user gesture after meaningful engagement. Detect `permission === 'denied'` and show a browser-specific recovery card.

2. **Notification fatigue** — multiple daily pushes from a "calm" app produce churn faster than any other mistake and contradict the core brand promise. Enforce a hard daily cap of 3 pushes per user in the Edge Function from day one (not a user-tunable value — a safety valve). Default quiet hours 21:00–08:00. One notification type at launch. Granular per-category opt-out from day one — no single master switch.

3. **Service Worker stale-cache trap** — adding a SW for push silently turns the app into a cached app; post-deploy users see the old UI, missing new features or hitting white screens if hashed chunks were purged. Prevent by writing a push-only SW (no `fetch` handler, no `caches.open`); implement an "Update available — refresh" toast from day one; make "no `caches.open` calls" an explicit code-review gate.

4. **FOUT and CLS from webfont loading** — text reflow on every load undermines the "calm, beautiful" first impression and hurts Core Web Vitals. Self-host via `@fontsource-variable/fraunces` to eliminate the Google Fonts roundtrip; add `size-adjust`/`ascent-override` fallback `@font-face` rules; target CLS < 0.1 on throttled 3G. Ship the font loading strategy before any component uses the serif, not after.

5. **Ambient animation jank and battery drain** — animating `backdrop-filter` forces recomposite every frame and causes jank on mobile Safari; compound simultaneous animations (ambient background + card floats) cause motion sickness for vestibular users; unpaused animations on hidden tabs drain battery on a product meant to linger. Animate only `transform` and `opacity` on a pre-blurred layer; never animate `backdrop-filter`. One motion hierarchy: ambient background breathes, everything else is static. `@media (prefers-reduced-motion: reduce)` must produce a full animation stop. Pause via `animation-play-state: paused` on `visibilitychange`. Profile on a mid-tier iPhone before shipping.

6. **Today/week toggle state desync** — `useState` without URL persistence produces: refresh resets view, back button does nothing, greeting shows wrong meeting count when week view is active, scroll position lost on every toggle. Use `useSearchParams` as source of truth; keep `useTodayMeetings` derived from a memo always filtered to today regardless of the view toggle. This is approximately 20 extra minutes of work that prevents the most common first-month support reports.

7. **Wind-down feature nobody sees** — a wall-clock trigger (5pm) or nav-link entry point produces near-zero discovery; the most emotionally valuable feature gets a near-zero usage rate. Surface the wind-down card inline in the main view when the last meeting ends (not behind a route); use a contextual trigger (last meeting ended ≥10 min ago, after 16:00, tab visible); keep interaction to ≤3 taps; no streaks; instrument impression-to-interaction ratio from day one.

## Implications for Roadmap

Based on research, the dependency graph and pitfall clustering suggest four phases. The copy glossary is a hard prerequisite that should be a discrete deliverable at the start of Phase 1 — not a background concern addressed during engineering.

### Phase 1: Language and Visual Foundation
**Rationale:** The copy glossary blocks every text-bearing feature — greeting, wind-down, weekly tone, notification copy, empty states. The today-first layout is the structural prerequisite for the rhythm timeline and proportional cards. The time-of-day palette and Fraunces typeface are design-system-level changes that every subsequent component picks up from CSS custom properties; they must land before any component that uses them. These are the lowest-risk, lowest-infrastructure items and unblock the most downstream work.
**Delivers:** Copy glossary artifact (term replacements reviewed as a single artifact before merge), today-first layout with weekly toggle (URL `?view=today|week` state), time-of-day warmth palette (4 named windows as CSS custom properties), Fraunces variable font (self-hosted via Fontsource, `size-adjust` fallback, CLS < 0.1 verified), ambient breathing background (CSS keyframes on `transform + opacity` only, `prefers-reduced-motion` full stop, `visibilitychange` pause), empty and light-day copy states, language pass across all existing UI strings
**Addresses:** Language overhaul, today-first layout, warm typeface, ambient beauty, empty states (FEATURES.md v2.0 core)
**Avoids:** Pitfall #3 (font strategy ships before any component uses the serif), Pitfall #4 (motion hierarchy and `prefers-reduced-motion` pattern established before any Phase 2 or 3 animation), Pitfall #5 (URL param toggle architecture baked in from the start)
**Research flag:** Skip — standard patterns. CSS variable theming, self-hosted variable fonts, and `useSearchParams` toggle are well-documented. The palette color values and typeface pairing are design decisions, not research questions. WCAG AA contrast must be checked against every palette variant before merge.

### Phase 2: Companion UI Components
**Rationale:** With the copy glossary and design system foundation in place, the new companion components can be built as all-new files with no existing-file conflicts until the `CalendarHub` integration step. The build order is: pure functions → derived hooks → presentational components → `CalendarHub` integration (last, one PR). This minimizes merge conflict risk on the one bottleneck file.
**Delivers:** `lib/rhythm.ts` (pure `buildRhythmSegments` function), `lib/greetings.ts` (time-of-day copy templates), derived hooks (`useTodayMeetings`, `useWindDownState`, `useContextualGreeting`), `ContextualGreeting` (6–8 sentence templates covering light day, heavy day, back-to-back, zero meetings, single long meeting, afternoon-heavy, morning-heavy, first-meeting-imminent), `TodaysRhythmTimeline` (CSS Grid rendering, gaps named and labeled), proportional meeting cards with time-of-day accent tinting, `WeeklyToneSummary`, `WindDownPanel` (inline in today view, contextual trigger, micro-action, no streaks), `CalendarHub.tsx` integration PR
**Addresses:** Contextual greeting, proportional meeting cards, Today's Rhythm timeline, wind-down view, weekly tone language (FEATURES.md)
**Avoids:** Pitfall #5 (todayMeetings memo is always filtered to today, never to the current view selection), Pitfall #6 (WindDownPanel renders inline in the main view, contextual trigger only), Architecture anti-pattern #1 (no second network call — all views derived from useMeetings cache)
**Research flag:** Skip for component patterns. The wind-down trigger edge cases (all-day events, meetings ending after midnight, timezone handling) need an explicit written spec before `useWindDownState` is coded — this is an internal design decision, not an external research question. Greeting copy templates need creative review as a separate pre-engineering artifact.

### Phase 3: Web Push Infrastructure
**Rationale:** Push is infrastructure-heavy with a distinct failure-mode surface best isolated from UI work. It requires VAPID key generation, a new DB table, a service worker, two Edge Functions, a permissions UX, and a rate-limiting layer — all of which must be correct before any user is exposed. Running this as a dedicated phase (or parallel track) prevents push bugs from blocking the companion UI and allows focused code review.
**Delivers:** `push_subscriptions` migration, `public/sw.js` (push-only, no fetch caching, `notificationclick` deep-link to `/calendar`), SW registration in `main.tsx`, `usePushNotifications` hook, Settings UI opt-in (pre-prompt with benefit language, engagement threshold gate, denied-state recovery card with browser-specific instructions), `send-push` Edge Function (VAPID-signed, daily cap of 3 per user enforced, quiet hours 21:00–08:00), `schedule-push` Edge Function (cron-triggered, queries due subscriptions, coalesces multiple meeting notifications per user), VAPID keys stored as Supabase secrets
**Addresses:** Pre-meeting breathing push notification (FEATURES.md P2)
**Avoids:** Pitfall #1 (pre-prompt gates the browser prompt; never called on page load or in useEffect with empty deps), Pitfall #2 (daily cap and quiet hours in the Edge Function from day one; one notification type at launch; per-category toggles in settings UI), Pitfall #7 (SW has no fetch handler; update toast implemented; "no caches.open" is a code-review gate)
**Research flag:** NEEDS phase research. Verify `jsr:@negrel/webpush` API surface and Supabase Edge Runtime (Deno ≥ 1.45) compatibility at implementation start — the Deno/JSR Web Push ecosystem has been evolving. Confirm iOS Safari PWA push behavior (requires "Add to Home Screen," iOS 16.4+) and document the limitation in the permissions UX. Verify whether Supabase Function secrets can be rotated without redeploying (affects the VAPID key rotation plan and re-subscription flow).

### Phase 4: Polish, Accessibility, and Validation
**Rationale:** After companion UI and push are stable, a dedicated polish phase hardens accessibility, validates performance on real devices, and adds the v2.1 features whose optimal implementation depends on usage data from v2.0 (weekly tone language tuning, wind-down trigger timing calibration).
**Delivers:** WCAG AA contrast sign-off on all four time-of-day palette variants against real meeting text, Lighthouse CLS < 0.1 re-verification on throttled 3G, mid-tier iPhone 60fps animation profile sign-off, push Edge Function smoke test (simulate 10-meeting day, assert ≤3 pushes sent), Today's Rhythm timeline accessibility (keyboard navigation, screen-reader text alternative, color-independent gap visualization), weekly tone language (after greeting tone is locked for several weeks), wind-down trigger timing calibration based on real usage patterns, "Looks Done But Isn't" checklist verification across all v2.0 features
**Addresses:** Performance gates, accessibility requirements, weekly tone language (FEATURES.md P2), final v2.0 quality validation
**Avoids:** Accessibility and performance regressions shipping undetected; warm-dusk palette contrast failures; mid-tier device animation jank reaching production
**Research flag:** Skip — standard tooling (Lighthouse, WCAG contrast checkers, Chrome DevTools remote debug). The only open question that needs assessment (not research) is whether push Edge Function cold-start timing reveals a batching need — that determination comes from Phase 3 implementation data.

### Phase Ordering Rationale

- Language and palette land first because they block the most downstream work. Writing a greeting before the glossary is confirmed means rewriting it; building meeting card tints before the palette variables exist means rebuilding tints. Do these once, correctly.
- Companion UI before push because the UI components require no new infrastructure and benefit from being designed and iterated quickly. Locking the companion voice and visual language before wiring push ensures that notification copy is informed by the established tone, not drafted in isolation.
- Push as a separate stream (Phase 3) because its acceptance criteria — pre-prompt UX, daily cap, quiet hours, stale-cache prevention, iOS Safari limitations — are orthogonal to UI quality and benefit from dedicated review focus. Push bugs and UI bugs should not share a release.
- Polish last because accessibility and performance audits are most valuable when the surface is complete and stable; running them on incomplete features produces false findings.

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 3 (Web Push):** Deno/JSR Web Push library API and Edge Runtime compatibility; iOS Safari PWA push limitations; VAPID key rotation mechanics in Supabase secrets. All three need confirmation before implementation starts.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** CSS variable theming, self-hosted variable fonts, URL state via `useSearchParams` — all well-documented. Design decisions (palette color values, Fraunces vs. alternative typefaces) are judgment calls for design review, not research questions.
- **Phase 2 (Companion UI):** Derived hooks from TanStack Query cache, `useMemo` selectors, presentational component composition — established patterns. Wind-down trigger edge cases need an internal spec document, not external research.
- **Phase 4 (Polish):** Lighthouse, WCAG contrast, Chrome DevTools performance, Supabase Edge Function logs — standard tooling with no open research questions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All three additions verified against current official sources and release notes; version compatibility confirmed against existing Vite 5 project; `motion@12.35.2` confirmed released 2026-03-09 |
| Features | MEDIUM | HIGH for Headspace notification patterns and typography pairings (primary engineering blog sources); MEDIUM for greeting/reflection patterns; LOW-MEDIUM for exact time-of-day color implementations in shipped apps (derived from circadian lighting research, not direct app audits) |
| Architecture | HIGH (UI) / MEDIUM (Push) | UI integration points derived directly from codebase read; SW placement in `public/`, derived hooks, URL state patterns are standard and well-documented; Deno/JSR Web Push library specifics are MEDIUM and need verification at Phase 3 start |
| Pitfalls | MEDIUM-HIGH | Seven primary pitfalls each verified against 3+ independent sources; WebSearch-confirmed; security and browser API pitfalls are HIGH; push permission and notification fatigue patterns are MEDIUM-HIGH |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Deno Web Push library verification:** `jsr:@negrel/webpush` is the current recommendation; verify API surface and Supabase Edge Runtime compatibility before Phase 3 starts. Research a fallback (Node `web-push` via `npm:` specifier in Deno) in case JSR access is restricted.
- **iOS Safari PWA push limitations:** Web Push on iOS requires "Add to Home Screen" (iOS 16.4+). The push permissions UX must communicate this clearly. Document the expected user experience for iOS users who encounter the limitation before installing the PWA.
- **VAPID key rotation in Supabase secrets:** Confirm whether Function secrets can be rotated without redeploying the Edge Function. If rotation requires redeployment, document the full re-subscription flow (existing subscriptions are invalidated → users must be re-prompted → pre-prompt must survive the rotation event).
- **Wind-down trigger edge cases:** All-day events, meetings ending after midnight, recurring events with unusual end times, and timezone boundary cases need an explicit one-page spec before `useWindDownState` is coded. Not an external research gap — an internal design decision that must be made before engineering starts.
- **Time-of-day palette contrast audit:** The warm-dusk state (16:00–19:00) and the night state (19:00–05:00) are the highest accessibility risk. Choosing palette colors with contrast-first design (select colors that pass WCAG AA for normal text, then assess warmth) is more reliable than auditing after the fact. Flag for early design review in Phase 1 before any component uses the palette.
- **Greeting copy voice:** The 6–8 greeting sentence templates are the single highest-creative-risk deliverable in the milestone. They must be drafted and reviewed as standalone creative writing — not as microcopy incidental to engineering — before Phase 2 component work begins. Schedule a dedicated creative review session.

## Sources

### Primary (HIGH confidence)
- Existing MeeThing codebase (`src/App.tsx`, `CalendarHub.tsx`, `useMeetings.ts`, `useBackground.tsx`, `supabase/functions/`) — architecture integration points derived from direct read
- [Supabase docs — Sending Push Notifications](https://supabase.com/docs/guides/functions/examples/push-notifications) — Edge Functions + Web Push as supported path
- [@negrel/webpush on JSR](https://jsr.io/@negrel/webpush) + [negrel.dev blog](https://www.negrel.dev/blog/deno-web-push-notifications/) — Deno-native VAPID library API
- [vite-plugin-pwa injectManifest guide](https://vite-pwa-org.netlify.app/guide/inject-manifest) — Vite 5 requirement from v0.17+, strategy options
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide) + [CHANGELOG](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md) — motion@12, motion/react import path, no breaking changes from v11
- [Google Fonts — Fraunces](https://fonts.google.com/specimen/Fraunces) — four variable axes (weight, opsz, softness, wonk), soft-serif positioning
- [Headspace Engineering — push notifications](https://medium.com/headspace-engineering/explainable-and-accessible-ai-using-push-notifications-to-broaden-the-reach-of-ml-at-headspace-a03c7c2bbf06) — "Mindful Moment" ritual notification pattern (first-party)
- [Web permissions best practices — web.dev](https://web.dev/articles/permissions-best-practices) — pre-prompt pattern, engagement gating
- [prefers-reduced-motion — web.dev](https://web.dev/articles/prefers-reduced-motion) — full-stop accessibility requirement
- [The Web Animation Performance Tier List — Motion Magazine](https://motion.dev/magazine/web-animation-performance-tier-list) — transform/opacity vs backdrop-filter performance hierarchy
- [Fixing Layout Shifts Caused by Web Fonts — DebugBear](https://www.debugbear.com/blog/web-font-layout-shift) — `size-adjust`/`ascent-override` technique
- [Rich Harris — Stuff I wish I'd known sooner about service workers](https://gist.github.com/Rich-Harris/fd6c3c73e6e707e312d7c5d7d0f3b2f9) — SW stale-cache trap
- [Supabase — JSR modules in Edge Functions](https://github.com/orgs/supabase/discussions/25842) — `jsr:` specifier support confirmed

### Secondary (MEDIUM confidence)
- [Typewolf — Fraunces](https://www.typewolf.com/fraunces) — real-world Inter + Fraunces pairings
- [LogRocket — Best React animation libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/) — CSS-first vs Motion trade-off assessment
- [Headspace push notification strategy — ngrow.ai](https://www.ngrow.ai/blog/how-headspace-increased-engagement-by-32-with-strategic-push-notifications) — 32% engagement increase with strategic push; notification copy examples
- [Push notification best practices — MoEngage / Braze / Gravitec](https://www.moengage.com/learn/push-notification-best-practices/) — 2–5 pushes/week sustainable baseline for engagement apps
- [Advanced React state management using URL parameters — LogRocket](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/) — `useSearchParams` pattern for view toggles
- [Circadian Lighting in Smart Homes — Aqara 2026](https://us.aqara.com/blogs/news/reset-circadian-rhythm-adaptive-lighting) — time-of-day warmth curve (6500K → 2700K) scientific rationale
- [How to create a meditation app — Globaldev](https://globaldevgroup.medium.com/how-to-create-a-meditation-app-based-on-the-examples-of-calm-and-headspace-25af32b87579) — Calm / Headspace home screen composition analysis
- [Reflectly easygoing daily journaling — GoodUX](https://goodux.appcues.com/blog/reflectlys-easygoing-daily-journaling) — micro-action reflection prompt pattern
- [Pushpad — Reset the denied push permission](https://pushpad.xyz/blog/reset-the-denied-permission-for-notifications) — denied-state recovery UI guidance

### Tertiary (LOW-MEDIUM confidence)
- [6 Mindfulness App Design Trends 2026 — Big Human](https://www.bighuman.com/blog/trends-in-mindfulness-app-design) — greeting and ambient UI pattern overview
- [What Designers Get Wrong About Habit Loops — Bootcamp](https://medium.com/design-bootcamp/what-designers-get-wrong-about-habit-loops-and-how-to-fix-it-6fd47be714d2) — wind-down discoverability failure modes
- [10 Fonts to Consider for Your Wellness Brand — Inside Out Brands](https://www.insideoutbrands.com/blog/10-wellness-fonts) — wellness typography pairing principles

---
*Research completed: 2026-04-04*
*Ready for roadmap: yes*
