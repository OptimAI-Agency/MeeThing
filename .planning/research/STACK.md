# Stack Research — MeeThing v2.0 Companion Experience

**Domain:** Additive libraries for an existing React 18 + Vite + Supabase SPA (wellness/calendar companion)
**Researched:** 2026-04-04
**Confidence:** HIGH (all three recommendations verified against current official sources and release notes)

> This file supersedes the v1 stack research for the purpose of the v2.0 Companion milestone. It covers **only the new capabilities** introduced by this milestone: browser push notifications, a wellness typeface, and ambient animation. The existing stack (React 18, Vite 5, TypeScript, React Router v6, TanStack Query, Supabase Auth/Postgres/Edge Functions, shadcn/ui + Tailwind, Inter, lucide-react, date-fns) is validated and out of scope.

## Scope — three questions

1. **Browser push notifications** — how to deliver pre-meeting breathing reminders with only a Vite SPA and Supabase Edge Functions (no custom server)?
2. **Wellness typeface** — which Google Font pairs with Inter for warm "wellness moments" without derailing the existing design system?
3. **Ambient animations** — does the breathing background justify Framer Motion / Motion, or can Tailwind + CSS keyframes handle it?

---

## Recommended Additions

### Core (Required for Milestone)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vite-plugin-pwa` | `^0.21.x` (requires Vite 5+; current project is on Vite 5) | Register a service worker at build time so the app can receive Push events and display notifications | Framework-agnostic, first-class Vite integration. The `injectManifest` strategy lets us ship a hand-written service worker that owns `push` and `notificationclick` handlers while still getting Workbox-powered precaching for free. Zero-config alternatives don't expose the SW lifecycle we need for Web Push. |
| `@negrel/webpush` (JSR — `jsr:@negrel/webpush`) | Latest JSR tag (Deno-native, no npm install) | VAPID-signed Web Push dispatch from inside a Supabase Edge Function | Pure-Deno, zero-polyfill library. Works natively in the Supabase Edge runtime. The Node `web-push` package pulls in Node crypto shims that are painful to host in Deno. Supabase explicitly documents JSR modules as supported in Edge Functions. |
| Fraunces (variable Google Font) | `@fontsource-variable/fraunces@^5.x` (self-hosted via Fontsource) | Warm "wellness moment" typeface paired with Inter | One variable font with **weight, optical-size, softness, and wonk** axes — a single file covers captions (14px) through hero text (72px). "Soft" serif feel matches the glass/nature brand without turning traditional/editorial. Pairs cleanly with Inter: Inter for UI chrome, Fraunces for ritual copy (greetings, breathing prompts, wind-down). |

### Supporting Libraries (Conditional)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `motion` (renamed `framer-motion`) | `^12.x` (12.35.2 released 2026-03-09) | React animation primitives with layout, shared-element, and gesture support | **Only if** the milestone adds interactive transitions beyond the ambient background — e.g. meeting-card expand/collapse, Today's Rhythm timeline scrubbing, page transitions between Today and Wind-Down. Import from `motion/react` (not `framer-motion`). Use `LazyMotion` + `domAnimation` + the `m` component to cap bundle cost at ~4.6 kB for initial render. If the interactive transitions don't materialise, don't add this. |
| `workbox-window` | `^7.x` (peer of `vite-plugin-pwa`) | Client-side SW registration + update prompts | Needed once `vite-plugin-pwa` is adopted so "new version available" cues can be rendered in the calm tone the wellness brand requires. |

### Ambient Breathing Background — no new library

The brief describes a slow-scale / slow-opacity loop (4–6s period, `ease-in-out`). This is the textbook case for **CSS keyframes on `transform: scale()` + `opacity`**: hardware-accelerated, zero JS, honours `prefers-reduced-motion` with a one-line media query. The existing Tailwind config already declares `breathe` and `gentle-float` keyframes (see `CLAUDE.md` → Design System). **Extend those. Do not reach for Motion for this feature.** Reserve Motion for stateful, interactive transitions.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `vite-plugin-pwa` dev-server mode | Let the service worker register during `npm run dev` | Enable `devOptions.enabled: true` in `VitePWA({...})` so Push can be tested without a production build. Chrome allows SW on `localhost`, so `localhost:8080` (current dev port) is fine. |
| `deno run .../generate-vapid-keys.ts` (one-time) | Generate the VAPID key pair for the application server | Store the public key as `VITE_VAPID_PUBLIC_KEY` (client); store the private key and subject email as Supabase Edge Function secrets. Never ship the private key to the browser. |

---

## Installation

```bash
# PWA / service worker (Vite-side)
npm install -D vite-plugin-pwa workbox-window

# Wellness typeface — self-hosted via Fontsource (privacy, offline, PWA-safe)
npm install @fontsource-variable/fraunces

# Optional — only if interactive animation becomes a scope item
npm install motion
```

Edge Function side (no npm — Deno imports directly in the function file):

```ts
// supabase/functions/send-push/index.ts
import * as webpush from "jsr:@negrel/webpush";
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `vite-plugin-pwa` (`injectManifest`) | Hand-written `public/sw.js` + manual `navigator.serviceWorker.register()` | Only if we want to avoid any Workbox footprint. Cost: no precache manifest, no dev-time SW reload, we own the whole build pipeline. Not worth it for a small team. |
| `@negrel/webpush` (Deno/JSR) | `web-push` (Node, via `npm:` specifier in Deno) | Works, but pulls Node polyfills and cold-starts slower in the edge runtime. Acceptable only if JSR access is ever blocked. |
| `@negrel/webpush` | Firebase Cloud Messaging (FCM) SDK | Only if we also need native iOS Safari push via APNs with Google infra wrapping. For a pure web experience, FCM is unnecessary coupling. |
| Fraunces | **Lora** (Google Fonts) | Pick Lora for a calmer, more traditional book-serif feel with less personality — good for long reflection copy but less distinctive as a brand anchor. Safe fallback if Fraunces feels "too much" in review. |
| Fraunces | **DM Serif Display** | Pick DM Serif Display only for hero/display headlines. It lacks a text-sized optical cut, so it can't carry a "warm body copy" role. |
| Fraunces | **Cormorant Garamond** | Pick Cormorant for a more editorial/elegant register. Reads colder and more formal than the target "lingering companion" voice. |
| CSS keyframes (ambient) | `motion` / Framer Motion | Upgrade to Motion only if the background needs to respond to app state (slow down when a meeting is imminent, speed up during reflection). Purely decorative breathing → CSS wins on every axis. |
| `motion` | `react-spring` | Excellent physics-driven option, smaller 2026 community, second mental model for the team. Only if we specifically want spring physics. |
| `motion` (list reorders) | `@formkit/auto-animate` | Complementary, not a replacement. Near-zero API for list resort animations in the Today's Rhythm view. Can ship alongside. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `web-push` (npm, Node) **inside Supabase Edge Functions** | Depends on Node `crypto` shims; runs but cold-starts slower and bloats the function in Deno | `jsr:@negrel/webpush` |
| `framer-motion` (the legacy package name) | Renamed to `motion` in 2025. The `framer-motion` npm package is in maintenance. | `npm install motion` and `import { motion } from "motion/react"` |
| Google Fonts via `<link>` in `index.html` on authenticated pages | Leaks user IP to Google on every load (GDPR friction) and **fails when the app is installed as a PWA offline** | Self-host via `@fontsource-variable/fraunces` |
| Loading multiple fixed-weight Fraunces files separately | Defeats the point of a variable font and bloats first paint | Single `@fontsource-variable/fraunces` import + CSS `font-variation-settings` for weight/opsz/softness/wonk control |
| A second animation library alongside `motion` (e.g. GSAP) | Bundle bloat for overlapping functionality; no wellness-product justification | One animation story: CSS for ambient, `motion` for interactive |
| Firebase JS SDK in the browser just for push | ~50 kB+ of bundle to receive push events the Web Push API handles natively | Raw Web Push API via a service worker registered by `vite-plugin-pwa` |
| Scheduling reminders from the foreground tab with `setTimeout` | Throttled in background tabs, dies when the tab closes — breaks the "wake-from-closed" promise of WEL-01 | Server-driven push from a Supabase Edge Function triggered by `pg_cron` |

---

## Stack Patterns by Variant

**If push notifications stay client-only (foreground reminders only):**
- Skip the Edge Function path entirely.
- Use `setTimeout` → `registration.showNotification()` from inside the already-registered service worker.
- Trade-off: reminders only fire when the tab or installed PWA is open. Acceptable for a foreground-companion posture, but does **not** satisfy "reminder wakes the user from a closed app".

**If push notifications must fire while the tab is closed (true reminders — WEL-01 target):**
- Must go through Web Push protocol → Supabase Edge Function → browser push service (FCM / Mozilla autopush / Apple).
- Requires: VAPID key pair, a `push_subscriptions` table keyed by user, and a scheduled dispatcher (`pg_cron` → Edge Function).

**If the wellness typeface is only for a handful of words (greeting, breathing prompts):**
- Load the variable font once, use `font-variation-settings` per component. Do not split into per-weight packages.

**If Fraunces reads as "too much" in design review:**
- Drop to Lora as a conservative fallback. Same pairing logic with Inter, smaller personality footprint. Only change is the `@fontsource-variable/*` package name and a CSS variable.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vite-plugin-pwa@^0.21` | `vite@^5` (existing) | `vite-plugin-pwa` v0.17+ requires Vite 5. Current project is on Vite 5, so no upgrade needed. |
| `vite-plugin-pwa` `injectManifest` | `workbox-*@^7` (dev deps) | When using `injectManifest`, include `workbox-precaching`, `workbox-routing`, `workbox-strategies` as dev deps so the custom SW compiles. |
| `motion@^12` | `react@18` and `react@19` | No breaking API changes from `framer-motion@11` → `motion@12` — only the package name and import path (`motion/react`). |
| `@fontsource-variable/fraunces@^5` | Any bundler with CSS imports | Pure CSS + woff2; no JS runtime, no peer deps. |
| `jsr:@negrel/webpush` | Supabase Edge Runtime (Deno ≥ 1.45) | JSR specifier support in Supabase Edge Functions is stable; use the `jsr:` prefix with no version pin in examples, add a pin for prod. |
| Service worker ↔ Supabase Auth | Works, with a caveat | The SW does **not** share `localStorage` with the page context. Do not try to read the Supabase session from inside `sw.ts`; instead, pass the user ID at subscription time and look it up on the Edge Function side. |
| `prefers-reduced-motion` | Honour in every animation | Required for a wellness brand. Both CSS keyframes and Motion respect it, but we have to opt-in — add a `@media (prefers-reduced-motion: reduce)` override that stops the breathing loop. |

---

## Integration Points with Existing Code

- **`src/integrations/supabase/client.ts`** — no changes. The push subscription round-trip goes through a new Edge Function, not the JS SDK.
- **`supabase/migrations/`** — add a `push_subscriptions` table (`user_id`, `endpoint`, `p256dh`, `auth`, `created_at`). New schema, not a modification of existing tables.
- **`src/index.css` / `tailwind.config.ts`** — extend the existing `breathe` keyframe; add a `font-ritual` (or similar) utility bound to Fraunces. Do **not** replace Inter; Inter remains the UI/body face.
- **`vite.config.ts`** — add `VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts', devOptions: { enabled: true } })`. Note this file already has an uncommitted modification in the current working tree (see git status) — coordinate carefully.
- **`src/contexts/AuthContext.tsx`** — untouched. Push permission prompts must live behind an explicit user action (button press in Settings), not app load, per both browser policy and the wellness-tone brief.
- **New Edge Function: `supabase/functions/send-push/`** — mirrors the existing `google-oauth` / `google-calendar-sync` layout. Reads VAPID secrets from env, fetches due subscriptions, calls `webpush.ApplicationServer.send()`.
- **New Edge Function secrets:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:hello@meething.app`).

---

## Sources

- [Supabase docs — Sending Push Notifications](https://supabase.com/docs/guides/functions/examples/push-notifications) — confirms Edge Functions + Web Push as the supported path (HIGH)
- [@negrel/webpush on JSR](https://jsr.io/@negrel/webpush) and [negrel.dev — Send Web Push messages with Deno](https://www.negrel.dev/blog/deno-web-push-notifications/) — Deno-native Web Push library, VAPID setup, `ApplicationServer` API (HIGH)
- [Supabase discussion — JSR modules supported in Edge Functions](https://github.com/orgs/supabase/discussions/25842) — confirms `jsr:` specifiers run in the Supabase Edge Runtime (HIGH)
- [vite-plugin-pwa — injectManifest guide](https://vite-pwa-org.netlify.app/guide/inject-manifest) and [npm — vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa) — `injectManifest` strategy, Vite 5 requirement from v0.17+ (HIGH)
- [GitHub — vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) — framework support, current releases (HIGH)
- [Motion upgrade guide — Framer Motion → Motion](https://motion.dev/docs/react-upgrade-guide) and [motiondivision/motion CHANGELOG](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md) — confirms `motion@12.35.2` (2026-03-09), rename, `motion/react` import path, no breaking changes from v11 (HIGH)
- [Motion — Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size) — `LazyMotion` + `m` + `domAnimation` → ~4.6 kB initial render; base `motion` component ~34 kB (HIGH)
- [LogRocket — Best React animation libraries 2026](https://blog.logrocket.com/best-react-animation-libraries/) — confirms CSS-first is competitive for ambient/decorative motion; Motion wins for interactive/stateful (MEDIUM — editorial)
- [Google Fonts — Fraunces](https://fonts.google.com/specimen/Fraunces) and [Google Design — Fraunces introduction](https://design.google/library/a-new-take-on-old-style-typeface) — four variable axes (weight, opsz, softness, wonk), soft-serif positioning (HIGH)
- [Typewolf — 40 Best Google Fonts 2026](https://www.typewolf.com/google-fonts) — Fraunces + Inter recommended pairing for distinctive brand work (MEDIUM — curated editorial, consistent with other sources)
- [Typewolf — Fraunces combinations](https://www.typewolf.com/fraunces) — real-world pairings (MEDIUM)
- [FontFYI — Best Serif Fonts on Google Fonts 2026](https://fontfyi.com/blog/best-serif-fonts-2026/) — corroborates Fraunces, Lora, Fraunces variability (MEDIUM)
- [pixelambacht — Optical size, the hidden superpower of variable fonts](https://pixelambacht.nl/2021/optical-size-hidden-superpower/) — why a single `opsz` variable font beats loading multiple cuts (HIGH — evergreen)
- [MDN — Re-engageable Notifications & Push](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Re-engageable_Notifications_Push) — reference for the Web Push + Service Worker flow (HIGH)

---
*Stack research for: MeeThing v2.0 Companion Experience (additive scope — Web Push, wellness typeface, ambient animation)*
*Researched: 2026-04-04*
