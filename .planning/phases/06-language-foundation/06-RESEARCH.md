# Phase 6: Language Foundation - Research

**Researched:** 2026-04-05
**Domain:** UI copy refactor + TypeScript string constants module + human-readable glossary doc
**Confidence:** HIGH

## Summary

Phase 6 is a pure copy/refactor phase with no new runtime behavior, no new libraries, and no React API surface changes. The entire problem reduces to three mechanical moves: (1) create a single TypeScript source of truth for user-facing strings at `src/copy/glossary.ts`, (2) create a parallel human-readable mapping at `docs/copy-glossary.md`, and (3) sweep every text-bearing component in `src/` and replace hardcoded JSX text and toast literals with imports from the glossary. Because no test framework is wired up (`npm run lint` is the only automated check per CLAUDE.md), verification is lint + manual visual review + optionally a grep-based CI check for forbidden strings.

The CONTEXT.md has already locked every significant wording decision (D-01 through D-12). Research is therefore not about discovering wording — it is about discovering the **mechanical surface area** the planner has to cover and the **right module shape** to prevent string drift in Phases 8–11.

**Primary recommendation:** Structure `src/copy/glossary.ts` as a frozen nested object literal with `as const` so TypeScript infers string literal types, grouped by UI region (nav, calendar, sync, empty, errors, welcome). Perform the sweep as two waves: (Wave 1) create the glossary module + doc and replace all six CONTEXT-locked violation sites; (Wave 2) full-file audit of every remaining `.tsx` under `src/components` and `src/pages` for borderline terms, flagging anything outside the locked glossary for reviewer judgment. No tests, no new libs — lint must stay green and the app must build.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Section & Navigation Labels**
- **D-01:** "Calendar Integration" → **"Your Calendar"** (main section heading and welcome screen title)
- **D-02:** "Calendar Settings" → **"Your Settings"** (settings section heading and tab label)
- **D-03:** "Connections" tab → **"Your Calendars"** (tab/section listing connected providers)
- **D-04:** Welcome screen subheading uses wellness positioning: leads with the calm feeling before the action (e.g. "A calmer view of your week. Connect your calendar to begin.") — not productivity framing

**Sync Action Vocabulary**
- **D-05:** "Sync now" primary button **demoted to icon-only** — small secondary icon button with no label; syncing becomes ambient, not dominant
- **D-06:** Sync success toast → **"All caught up"** or **"Your day is up to date"** — not "Synced"
- **D-07:** Syncing in-progress state → **spinner only, no text label**
- **D-08:** Sync error message → **low-urgency framing**: e.g. "Couldn't reach your calendar — try again in a moment" (not a red error banner, not "failed")

**Empty & Light-Day States**
- **D-09:** No meetings today → **celebratory + specific**: "A spacious day — enjoy the quiet" or "Nothing on the books today. Breathe." Empty calendar is a gift, not a broken state
- **D-10:** No calendar connected → **lead with the calm outcome**: "A calmer view of your week starts here. Connect your calendar to begin."

**Glossary Format & Location**
- **D-11:** Glossary lives in **two places**:
  - `src/copy/glossary.ts` — TypeScript constants that components import (compile-time enforced)
  - `docs/copy-glossary.md` — Human-readable deprecated→replacement mapping for contributors and downstream phases
- **D-12:** Phase 6 performs a **full sweep of all existing UI strings** — every user-facing string across all components is reviewed. Obvious violations replaced; borderline cases flagged.

### Claude's Discretion
- Exact wording for edge-case empty states (loading states, error recovery prompts) — match the calm voice from D-08/D-09
- TS glossary file structure (object shape, export pattern) — standard constants pattern
- Button CTA copy for "Connect Google Calendar" — keep functional but can soften from imperative if natural

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COPY-01 | All UI text conforms to a calm-first copy glossary — no utility/dashboard vocabulary anywhere in the app ("Today" not "Calendar Integration", "Your Calendar" not "Connections", auto-sync replaces the primary "Sync now" button) | Full surface-area inventory of violation sites (see Violation Inventory below); glossary module shape recommendation; sweep strategy in Architecture Patterns. |

## Project Constraints (from CLAUDE.md)

1. **Commands available for verification:** `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`. **No test framework is configured** — lint is the only automated quality check. Plan verification steps MUST NOT invent a test runner.
2. **Path alias:** `@/` → `src/`. All glossary imports SHOULD use `@/copy/glossary` (not relative paths).
3. **Stack:** React 18 + Vite + TypeScript + shadcn-ui + Tailwind. Nothing in this phase introduces new deps.
4. **Toast pattern:** `toast({ title, description })` from `@/hooks/use-toast` — all toast literals in `CalendarHub.tsx` are candidates for the glossary.
5. **i18n:** none — strings are inline JSX text nodes or object literals. No extraction layer exists to slot into.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | already installed | Compile-time string literal type checking via `as const` | Native language feature; zero new dep; lets call sites narrow to exact string values and enables "find all references" in editors. |
| (none new) | — | — | This phase adds NO runtime dependencies. Adding i18n libraries (`react-i18next`, `lingui`, `formatjs`) would be over-engineering — MeeThing has no localization requirement, and CONTEXT.md explicitly names a simple TS constants pattern. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ESLint `no-restricted-syntax` (already configured in repo) | existing | Optional future guard against hardcoded deprecated terms | If the planner wants a CI enforcement mechanism beyond the glossary file — a single ESLint rule can reject literal strings matching `/Calendar Integration|Dashboard|Sync now|Connections/` in `.tsx` files. Not required for Phase 6 completion, but worth flagging. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain `as const` object | `react-i18next` + `en.json` | i18n libs are the right answer when multi-language is on the roadmap. Not on MeeThing's v2.0 roadmap. Cost: new dep, loader setup, runtime lookup, hydration complexity — none of which buy anything here. |
| Nested object by region | Flat `UPPER_SNAKE_CASE` constants | Flat is simpler for ≤20 strings but breaks down at glossary scale (CalendarHub alone has ~15 strings). Nested grouping by UI region keeps call sites readable (`COPY.sync.successTitle` reads better than `SYNC_SUCCESS_TITLE`). |
| Single `glossary.ts` file | Split into `src/copy/calendar.ts`, `src/copy/auth.ts`, etc. | Splitting is premature — total string count for v2.0 is measurable in the low hundreds. One file is easier for reviewers to scan the tone at once (which is the whole point of the glossary). |

**Installation:**
```bash
# No installations required. Uses only existing TypeScript + ESLint infra.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── copy/
│   └── glossary.ts        # NEW — single source of truth for user-facing strings
├── components/
│   └── calendar/          # existing — imports from @/copy/glossary
└── pages/                 # existing — imports from @/copy/glossary
docs/
└── copy-glossary.md       # NEW — human-readable deprecated→replacement table
```

### Pattern 1: Frozen Const Object with `as const`

**What:** Export a single nested object literal suffixed with `as const`. TypeScript infers the narrowest possible string literal type for each leaf value, and the object is deeply readonly.

**When to use:** All user-facing strings in Phase 6 and every downstream text-bearing feature in Phases 8–11.

**Example (recommended shape — planner may adapt):**
```typescript
// src/copy/glossary.ts
// Single source of truth for all user-facing copy in MeeThing.
// See docs/copy-glossary.md for the human-readable deprecated→replacement map.

export const COPY = {
  nav: {
    calendar: "Your Calendar",         // D-01 — was "Calendar Integration"
    settings: "Your Settings",         // D-02 — was "Calendar Settings"
    connections: "Your Calendars",     // D-03 — was "Connections"
  },
  welcome: {
    heading: "Your Calendar",                                                    // D-01
    subheading: "A calmer view of your week. Connect your calendar to begin.",   // D-04, D-10
    cta: "Connect your calendar",
  },
  sync: {
    // D-05, D-07: icon-only button; no visible label in-flight
    iconAriaLabel: "Refresh your calendar",
    successTitle: "All caught up",                                               // D-06
    successBody: "Your day is up to date.",                                      // D-06
    errorTitle: "Couldn't reach your calendar",                                  // D-08
    errorBody: "Try again in a moment.",                                         // D-08
    sessionExpiredTitle: "Reconnect to continue",
    sessionExpiredBody: "Your Google Calendar needs to reconnect — just a moment.",
  },
  empty: {
    // D-09 — celebratory, not broken
    noMeetingsTitle: "A spacious day",
    noMeetingsBody: "Nothing on the books today. Enjoy the quiet.",
    // D-10 — lead with the calm outcome
    noConnectionTitle: "A calmer view of your week starts here",
    noConnectionBody: "Connect your calendar to begin.",
  },
  errors: {
    meetingsLoadTitle: "Couldn't refresh your calendar",
    meetingsLoadBody: "Try again in a moment.",
    retry: "Try again",
  },
} as const;

export type Copy = typeof COPY;
```

**Why `as const`:** Without it, TypeScript widens string values to `string` — you lose the ability to enforce exact-literal props downstream (e.g. a `variant: 'calm' | 'urgent'` union). With `as const`, every leaf is its narrow literal type, and the object is `readonly` all the way down — accidental mutation at runtime is a type error.

### Pattern 2: Human-Readable Mirror Doc (`docs/copy-glossary.md`)

**What:** A markdown table that mirrors the TS file but organized as deprecated→replacement, with rationale. Non-engineering contributors (designers, copywriters) can read and edit it without touching code.

**When to use:** Every decision that lands in `glossary.ts` also lands here. The doc is the single reference for Phases 8–11 when they propose new copy.

**Recommended structure:**
```markdown
# MeeThing Copy Glossary

**Source of truth for all user-facing language.**
Implementation: `src/copy/glossary.ts`

## Voice principles
- Calm before action
- Celebratory, not broken, when nothing to show
- Ambient, not urgent
- Human, not utility

## Deprecated → Replacement

| Deprecated | Replacement | Reason | Phase |
|------------|-------------|--------|-------|
| Calendar Integration | Your Calendar | Utility vocabulary replaced with possessive calm | 6 / D-01 |
| Calendar Settings | Your Settings | Same | 6 / D-02 |
| Connections | Your Calendars | Human framing over system framing | 6 / D-03 |
| Sync now (button label) | (icon-only; aria "Refresh your calendar") | Demoted; syncing is ambient | 6 / D-05 |
| Synced / Sync failed | All caught up / Couldn't reach your calendar | Soft confirmation + low-urgency error | 6 / D-06, D-08 |
| Your schedule is clear / Enjoy the space | A spacious day — Nothing on the books today. Enjoy the quiet. | Celebratory framing | 6 / D-09 |
| Let's get you connected | A calmer view of your week starts here | Lead with the outcome | 6 / D-10 |

## Flagged for reviewer judgment
(Populated during Wave 2 full sweep — terms that are borderline but not explicitly in CONTEXT.md)
```

### Pattern 3: Two-Wave Sweep Strategy

**Wave 1 — Foundational + Locked Violations (high confidence, mechanical):**
1. Create `src/copy/glossary.ts` with the shape above
2. Create `docs/` directory and `docs/copy-glossary.md`
3. Replace all six CONTEXT-locked violation sites:
   - `CalendarHub.tsx` lines 101, 159, 104–106, 160–162 (welcome heading + subheading)
   - `CalendarHub.tsx` line 183 (Sync now button → icon-only per D-05/D-07)
   - `CalendarHub.tsx` lines 48–87 (toast success/error bodies per D-06/D-08)
   - `SettingsHeader.tsx` line 10 (Calendar Settings → Your Settings)
   - `CalendarConnections.tsx` line 157 (Calendar Connections → Your Calendars), line 166 (welcome line per D-10)
   - `EmptyStates.tsx` lines 9–12 (no-meetings celebratory rewrite), lines 27–30, 53–55 (no-connection calm outcome)
   - `CalendarHub.tsx` line 127 (capitalize tab label — currently uses `{tab.charAt(0).toUpperCase() + tab.slice(1)}` which renders "Overview / Connections / Settings"; must be replaced with glossary-driven labels per D-01, D-02, D-03)

**Wave 2 — Full Sweep (judgment calls):**
Every remaining `.tsx` under `src/components/**` and `src/pages/**` (excluding `src/components/ui/*` shadcn primitives, which are generic and have no product copy). For each file:
- List all visible strings (JSX text nodes, `title=`/`description=` on toasts, `aria-label` props, `placeholder=`, `Label` children)
- Compare against the voice principles in `docs/copy-glossary.md`
- **Obvious violations** (e.g. "Configure how often your calendars update" in `SyncSettings.tsx`) → replace and add to glossary
- **Borderline** (e.g. "Wellness Integration" in `WellnessSection.tsx` — contains "Integration" but is wellness-framed) → add to the "Flagged" section of the doc for designer review, leave code unchanged
- **Out of scope** — marketing landing (`Hero.tsx`, `Features.tsx`) is currently orphaned (the live landing uses `MinimalHero.tsx` per `Index.tsx:1`). Planner should confirm whether the legacy landing components are dead code and either delete or leave untouched (not within Phase 6 language scope).

### Anti-Patterns to Avoid
- **String interpolation in the glossary.** Keep the glossary pure strings. If a line needs dynamic values (name, count, gap), export a function (e.g. `greeting(name: string, count: number)`) — but defer this to Phase 9 (COPY-02). Phase 6 is static strings only.
- **Partial replacement without the glossary.** Do NOT hand-edit the six violation sites and skip creating `src/copy/glossary.ts`. The module is the deliverable; the replacements are downstream of it.
- **Adding i18n scaffolding.** No translation files, no `t()` functions, no locale detection. Not in scope, not on the roadmap.
- **Touching `src/components/ui/*`.** These are shadcn primitives — they carry no product copy (aria labels like "Close" are generic). Sweep only product components.
- **Forgetting the tab label capitalize trick.** `CalendarHub.tsx:127` dynamically capitalizes the tab key — this must be replaced with an explicit label lookup, or the glossary constants will not show up in the UI.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| String type safety | Custom runtime validator | `as const` + TypeScript structural types | Compile-time check is free; runtime validation for static strings is cargo-culting. |
| Translation pipeline | i18n layer "just in case" | Nothing — single English source | YAGNI. MeeThing v2.0 has no l10n requirement. Adding it now triples phase effort and adds hydration/loader complexity for zero user benefit. |
| Copy drift prevention | A doc generator that keeps TS and MD in sync | Manual discipline + PR review | For ~30–50 strings, automation costs more than it saves. Reviewers catch drift in PRs. |
| "Forbidden term" lint | Custom AST walker | Existing `no-restricted-syntax` rule (optional stretch) | If enforcement is desired, ESLint already has the hook — no tooling to build. |

**Key insight:** The entire phase is a discipline/convention problem, not an engineering problem. The glossary module is three dozen lines of TypeScript; every library you'd add is more complicated than the problem.

## Violation Inventory (concrete surface area)

Grep and file-level review identified these exact replacement sites. Planner should use this as the wave task list.

### Locked by CONTEXT.md (Wave 1)

| File | Line(s) | Current | Replacement | Decision |
|------|---------|---------|-------------|----------|
| `src/components/calendar/CalendarHub.tsx` | 101 | `Calendar Integration` (gradient h1) | `COPY.welcome.heading` ("Your Calendar") | D-01 |
| `src/components/calendar/CalendarHub.tsx` | 104–106 | "Connect your calendars and streamline your meeting management" | `COPY.welcome.subheading` | D-04 |
| `src/components/calendar/CalendarHub.tsx` | 113–129 | Tabs hardcoded array + `charAt().toUpperCase()` dynamic label | Explicit `{ key, label, Icon }` map where `label` comes from `COPY.nav.*` | D-01, D-02, D-03 |
| `src/components/calendar/CalendarHub.tsx` | 159 | `Welcome to Calendar Integration` | `COPY.welcome.heading` | D-01 |
| `src/components/calendar/CalendarHub.tsx` | 160–162 | "Connect your calendars to get started with seamless meeting management" | `COPY.welcome.subheading` | D-04 |
| `src/components/calendar/CalendarHub.tsx` | 169 | `Connect Your First Calendar` | `COPY.welcome.cta` (softened) | Discretion |
| `src/components/calendar/CalendarHub.tsx` | 174–185 | "Sync now" labeled outline button | Icon-only secondary button (`RefreshCw` only); add `aria-label={COPY.sync.iconAriaLabel}`; no text child | D-05, D-07 |
| `src/components/calendar/CalendarHub.tsx` | 48–53, 69–74, 82–87 | "Sync failed" / "Google Calendar sync failed — try again." | `COPY.sync.errorTitle` + `COPY.sync.errorBody` | D-08 |
| `src/components/calendar/CalendarHub.tsx` | 58–67 | "Session expired" / "Your Google Calendar session expired — please reconnect." | `COPY.sync.sessionExpiredTitle` + `COPY.sync.sessionExpiredBody` | D-08 (softened) |
| `src/components/calendar/CalendarHub.tsx` | 81 | `toast({ title: "Synced", description: "Your calendar events have been refreshed." })` | `COPY.sync.successTitle` + `COPY.sync.successBody` | D-06 |
| `src/components/calendar/settings/SettingsHeader.tsx` | 10 | `Calendar Settings` | `COPY.nav.settings` ("Your Settings") | D-02 |
| `src/components/calendar/settings/SettingsHeader.tsx` | 12–13 | "Customize your calendar experience and wellness preferences" | Wave 2 — softened subheading | Discretion |
| `src/components/calendar/CalendarConnections.tsx` | 157 | `Calendar Connections` | `COPY.nav.connections` ("Your Calendars") | D-03 |
| `src/components/calendar/CalendarConnections.tsx` | 158–160 | "Connect your calendar providers to sync meetings and events seamlessly" | Softened line from glossary | D-04 tone |
| `src/components/calendar/CalendarConnections.tsx` | 166 | "Welcome! Let's get you connected" | `COPY.empty.noConnectionTitle` | D-10 |
| `src/components/calendar/CalendarConnections.tsx` | 167–169 | "Connect a calendar below to start seeing your meetings in a calmer way" | `COPY.empty.noConnectionBody` | D-10 |
| `src/components/calendar/EmptyStates.tsx` | 9 | `Your schedule is clear` | `COPY.empty.noMeetingsTitle` ("A spacious day") | D-09 |
| `src/components/calendar/EmptyStates.tsx` | 10–12 | "Enjoy the space — events from your connected calendars will appear here" | `COPY.empty.noMeetingsBody` | D-09 |
| `src/components/calendar/EmptyStates.tsx` | 27, 53 | `Let's get you connected` | `COPY.empty.noConnectionTitle` | D-10 |
| `src/components/calendar/EmptyStates.tsx` | 28–30, 54–56 | "Connect your Google Calendar to see your upcoming meetings" | `COPY.empty.noConnectionBody` | D-10 |
| `src/components/calendar/EmptyStates.tsx` | 79–81 | "Couldn't refresh your calendar" / "Something went wrong while loading your meetings." | `COPY.errors.meetingsLoadTitle` + `COPY.errors.meetingsLoadBody` | D-08 tone |

### Full-Sweep candidates (Wave 2, judgment)

| File | Area | Notes |
|------|------|-------|
| `src/components/calendar/MeetingsList.tsx` | "Upcoming Meetings" heading, "Wellness Tip" section | "Upcoming" is neutral; likely keep. "Wellness Tip" fine. Review for calm tone. |
| `src/components/calendar/settings/SyncSettings.tsx` | "Sync Preferences", "Configure how often…", "Sync Frequency" | "Sync" language OK as technical setting, but "Configure" is utility voice — soften. |
| `src/components/calendar/settings/NotificationSettings.tsx` | "Notifications", "Meeting Notifications", "Wellness Tips", "Auto Wellness Breaks", "Reminder Time" | Neutral-to-utility; flag for reviewer. |
| `src/components/calendar/settings/WellnessSection.tsx` | "Wellness Integration", "MeeThing's unique approach…" | "Integration" triggers — flag. |
| `src/components/calendar/settings/BackgroundSettings.tsx` | "Background Scene", "Choose your preferred nature scene" | Already gentle; likely pass. |
| `src/pages/Login.tsx`, `Signup.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `VerifyEmail.tsx`, `AuthCallback.tsx`, `NotFound.tsx` | Auth flow copy | Full sweep required — auth copy frequently carries utility voice ("Invalid credentials", "Submit", "Enter your email"). Planner should enumerate. |
| `src/components/MinimalHero.tsx` | "Redefine digital meetings.", "Make it your MeeThing", "Let's go for a walk" | Already calm/branded — pass through; flag if reviewer disagrees. |
| `src/components/Hero.tsx`, `Features.tsx`, `Footer.tsx`, `Header.tsx` | Legacy landing components | **Likely dead code** — `Index.tsx` imports only `MinimalHero`. Planner should verify and either delete or skip from sweep. |
| `src/components/wellness/*` (BreathingOverlay, BreathingCircle, TransitionBufferWarning, MissedReminderBanner) | Wellness overlay strings | Review required — these are high-emotion surfaces where calm tone matters most. |

**Exclusions:**
- `src/components/ui/*` (shadcn primitives — no product copy)
- `src/hooks/*`, `src/integrations/*`, `src/contexts/*`, `src/lib/*` (no user-facing strings)
- `supabase/functions/*` (server-side; any user-visible error strings there should still ideally route through the glossary, but that can be Phase 6 stretch or deferred — CONTEXT.md names only client-side)

## Runtime State Inventory

> Rename/refactor phase — all categories investigated.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** No user-facing strings from Phase 6 scope are persisted in Supabase tables, localStorage, or any cache. Searched `supabase/migrations/`, `src/hooks/use*`, and `calendar_connections`/`meetings`/`user_settings` schemas — all rows store IDs, timestamps, encrypted tokens, and user preferences as structured data, never hardcoded UI labels. | None. |
| Live service config | **None.** No external service (n8n, Datadog, etc.) carries MeeThing-specific user copy. Supabase Edge Functions return error *codes* (`auth_expired`) not user strings; the client maps codes to copy. | None. |
| OS-registered state | **None.** No Task Scheduler / launchd / systemd entries — web-only app. | None. |
| Secrets/env vars | **None affected.** `VITE_GOOGLE_CLIENT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` are all technical config, never displayed. | None. |
| Build artifacts | **Low risk.** Vite bundles the imported `COPY` object into the production JS — after replacement, a `npm run build` will produce a new bundle hash. No stale `dist/` content will survive a rebuild. `node_modules` is unaffected. | Rebuild is automatic — no manual cleanup. |

**The canonical question:** *After every file in the repo is updated, what runtime systems still have the old string cached?*
**Answer:** None. This is a purely client-side, statically-bundled rename. Users will see the new copy on next page load after deploy.

## Common Pitfalls

### Pitfall 1: The `{tab}` capitalize trick silently bypassing the glossary
**What goes wrong:** `CalendarHub.tsx:127` renders tab labels via `{tab.charAt(0).toUpperCase() + tab.slice(1)}` on the raw state-machine key. Even after you add glossary constants, if this line isn't replaced, the UI still renders "Connections" (from the state key) not "Your Calendars" (from the glossary).
**Why it happens:** The label is derived from the state identifier, not from a label map. An author focused on string-replacement greps won't find "Connections" as a literal anywhere.
**How to avoid:** Replace the tab array with `[{ key: 'overview', label: COPY.nav.calendar, Icon: Calendar }, { key: 'connections', label: COPY.nav.connections, Icon: Plus }, { key: 'settings', label: COPY.nav.settings, Icon: Settings }]` and render `{tab.label}` instead of the derived expression.
**Warning signs:** After Phase 6 merges, visually verify every tab label against the glossary — not just grep results.

### Pitfall 2: Toast `title` and `description` split asymmetrically from glossary
**What goes wrong:** A developer replaces `title: "Sync failed"` but forgets the `description: "Sync failed — check your connection and try again."` three lines below, resulting in a half-updated toast.
**Why it happens:** Toast calls have two string props that are semantically coupled but syntactically independent.
**How to avoid:** Group toast strings in the glossary as `{ title, body }` pairs and always import both: `toast({ title: COPY.sync.errorTitle, description: COPY.sync.errorBody })`. Grep the final codebase for any remaining hardcoded `description:` property values in `.tsx` files.
**Warning signs:** Toast preview shows new title with old description.

### Pitfall 3: Aria-label regression after icon-only demotion (D-05)
**What goes wrong:** Removing the "Sync now" text label without adding an `aria-label` breaks screen reader accessibility — the button becomes an unlabeled icon.
**Why it happens:** The visible text *was* the accessible name. Removing it without substituting an aria attribute yields a WCAG 4.1.2 violation.
**How to avoid:** Always add `aria-label={COPY.sync.iconAriaLabel}` to the icon-only button. Include this in Wave 1 task acceptance criteria.
**Warning signs:** Accessibility tree in DevTools shows the button as unnamed; axe DevTools scan flags it.

### Pitfall 4: Glossary drift via "small" inline edits
**What goes wrong:** A Phase 8 developer needs "just one quick empty state string" and inlines it instead of adding to the glossary. Within two phases the glossary is a fiction.
**Why it happens:** No enforcement. CONTEXT.md creates the glossary as convention, not constraint.
**How to avoid:** Either (a) add an ESLint `no-restricted-syntax` rule matching JSX text nodes longer than N characters in product components (stretch goal for Phase 6) or (b) add a top-of-file comment + CONTRIBUTING.md note documenting the rule, and rely on PR review. Option (b) is Phase 6 minimum; option (a) is discretionary stretch.
**Warning signs:** Grep for `>[A-Z][a-z]+ [a-z]` in product `.tsx` files after Phase 8 — any hits are candidates for glossary migration.

### Pitfall 5: Full sweep scope creep
**What goes wrong:** Wave 2 grows from "review every string" to "rewrite every string in calm voice." Phase ships in weeks, not days.
**Why it happens:** Voice review is subjective and addictive.
**How to avoid:** Wave 2 rule — only replace strings that are CLEARLY violations (contain deprecated terms, technical jargon, imperative commands). Everything else goes in the "Flagged for reviewer judgment" section of `docs/copy-glossary.md`. Phase 6 exit criterion is *"glossary exists, six named violations fixed, flagged items documented"* — NOT *"all copy is perfect."*
**Warning signs:** Wave 2 task list is growing rather than shrinking as the sweep progresses.

## Code Examples

### Example 1: Importing and using the glossary
```typescript
// src/components/calendar/CalendarHub.tsx (excerpt after refactor)
import { COPY } from "@/copy/glossary";

// ...
<h1 className="...">{COPY.welcome.heading}</h1>
<p className="...">{COPY.welcome.subheading}</p>

// Toast with title/body pair:
toast({
  title: COPY.sync.successTitle,
  description: COPY.sync.successBody,
});
```

### Example 2: Icon-only sync button per D-05/D-07
```typescript
// Before:
<Button onClick={handleSync} disabled={syncing}>
  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
  {syncing ? "Syncing…" : "Sync now"}
</Button>

// After:
<Button
  variant="ghost"
  size="icon"
  onClick={handleSync}
  disabled={syncing}
  aria-label={COPY.sync.iconAriaLabel}
  className="rounded-xl"
>
  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
</Button>
```

### Example 3: Tab map with explicit labels
```typescript
// src/components/calendar/CalendarHub.tsx (excerpt)
const tabs = [
  { key: "overview" as const,    label: COPY.nav.calendar,    Icon: Calendar },
  { key: "connections" as const, label: COPY.nav.connections, Icon: Plus },
  { key: "settings" as const,    label: COPY.nav.settings,    Icon: Settings },
];

// render:
{tabs.map(({ key, label, Icon }) => (
  <Button key={key} onClick={() => setActiveTab(key)} /* ... */>
    <Icon className="w-5 h-5 mr-2" />
    {label}
  </Button>
))}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline JSX string literals across 15+ components | Single `src/copy/glossary.ts` module imported everywhere | This phase | One place to edit copy, one place to review tone, type-safe references, no duplication |
| "Sync failed" destructive toast | Low-urgency "Couldn't reach your calendar" | This phase | Voice alignment with wellness positioning |
| Primary "Sync now" button | Icon-only ambient refresh | This phase | Sync demoted from user action to background behavior (the app syncs itself; the icon is an escape hatch) |

**Deprecated/outdated:**
- "Calendar Integration" / "Calendar Settings" / "Connections" tab labels — replaced by `COPY.nav.*`
- "Synced" success toast — replaced by `COPY.sync.successTitle` ("All caught up")
- Utility-voice empty states — replaced by celebratory variants

## Open Questions

1. **Are legacy landing components (`Hero.tsx`, `Features.tsx`) dead code?**
   - What we know: `src/pages/Index.tsx` imports `MinimalHero` and nothing else from the legacy components. Grep confirms no other import sites.
   - What's unclear: Whether they are deliberately retained for a future route or genuinely orphaned.
   - Recommendation: Planner asks user in a Wave 2 task or defers deletion as a separate cleanup. Phase 6 should NOT delete them — only flag. If retained, their "Calendar Integration" string (Hero.tsx:37, Features.tsx:10) needs glossary migration or the file needs an `@deprecated` header.

2. **Should Supabase Edge Function user-facing error strings route through the glossary?**
   - What we know: Edge functions return structured errors (`error_type: "auth_expired"`), and the client maps codes to copy. User never sees server-side English directly.
   - What's unclear: Some fallback branches in edge functions may serialize raw error messages.
   - Recommendation: Confirm client always wraps; if so, no server-side changes needed. If not, plan a follow-up Phase 6 task to add error-code-only responses.

3. **Does the planner want ESLint enforcement of the glossary as a stretch goal?**
   - What we know: `eslint.config.js` exists; `no-restricted-syntax` is a standard rule.
   - What's unclear: Whether CONTEXT.md author considered this or deliberately left it out.
   - Recommendation: Offer as optional stretch task in plan; mark exit-criteria-optional.

4. **Wind-down and greeting copy (Phases 9–10) — should placeholder keys be reserved in the glossary now?**
   - What we know: CONTEXT.md says glossary is "single source of truth for all new text" and downstream phases reference it.
   - What's unclear: Whether Phase 6 should stub empty sections (`COPY.greeting = {}`, `COPY.windDown = {}`) or let downstream phases extend.
   - Recommendation: Do NOT stub — let downstream phases extend when they have concrete strings. Empty placeholders rot. Glossary growth via PR is fine.

## Environment Availability

> Phase is code/config only — no external tool dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript | `as const` inference | ✓ (already installed) | per `package.json` | — |
| ESLint | `npm run lint` verification | ✓ (already installed) | per `package.json` | — |
| Vite | `npm run build` verification | ✓ (already installed) | per `package.json` | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **None configured** — CLAUDE.md: "No test framework is configured — linting is the only automated quality check." |
| Config file | none |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COPY-01 | `src/copy/glossary.ts` exists and exports a `COPY` const object | static/type | `npm run build` (fails if file missing but imported) | ❌ Wave 1 creates it |
| COPY-01 | `docs/copy-glossary.md` exists | static | `test -f docs/copy-glossary.md` | ❌ Wave 1 creates it |
| COPY-01 | No file under `src/**/*.tsx` contains "Calendar Integration" | grep | `! grep -rn "Calendar Integration" src/**/*.tsx` | ❌ needs verification grep |
| COPY-01 | No file under `src/**/*.tsx` contains "Sync now" | grep | `! grep -rn "Sync now" src/**/*.tsx` | ❌ needs verification grep |
| COPY-01 | No file contains deprecated "Calendar Settings", "Connections" tab, "Dashboard", "Alerts" strings | grep | `! grep -rnE "(Calendar Settings\|Dashboard\|^.*>Connections<\|Alerts)" src/**/*.tsx` | ❌ needs verification grep |
| COPY-01 | Build passes with glossary imports | integration | `npm run build` | ✓ exists |
| COPY-01 | Lint passes after refactor | static | `npm run lint` | ✓ exists |
| COPY-01 | All six locked violation sites visually show new copy | manual | `npm run dev` + manual walkthrough | manual-only |
| COPY-01 | Icon-only sync button has accessible name | manual | DevTools accessibility tree inspection | manual-only |

**Rationale for manual-only items:** MeeThing has no test runner, no testing-library, no Playwright. Adding one for copy verification is out of scope for Phase 6. Grep-based verification gives high-confidence coverage of the deprecated-term class; visual/a11y checks cover the aesthetic and accessibility dimensions.

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run lint && npm run build && <grep checks listed above>`
- **Phase gate:** Full suite green + manual walkthrough of Calendar page (overview / connections / settings tabs + empty states + sync success + sync error) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] None — existing lint/build infra covers all automated checks. Grep-based verification runs as shell one-liners in the task verification steps; no new files needed.

*(Confirmed: the project has no test framework and CLAUDE.md explicitly forbids inventing one. Phase 6 must not add Vitest/Jest.)*

## Sources

### Primary (HIGH confidence)
- `/Users/jdm/.../MeeThing/.planning/phases/06-language-foundation/06-CONTEXT.md` — all locked decisions D-01 through D-12, canonical violation file list
- `/Users/jdm/.../MeeThing/.planning/REQUIREMENTS.md` §COPY-01 — deprecated term list, exit criteria
- `/Users/jdm/.../MeeThing/CLAUDE.md` — no-test-framework constraint, `npm run lint` as sole quality check, path alias `@/`
- `/Users/jdm/.../MeeThing/src/components/calendar/CalendarHub.tsx` — direct inspection of every violation site
- `/Users/jdm/.../MeeThing/src/components/calendar/EmptyStates.tsx` — direct inspection
- `/Users/jdm/.../MeeThing/src/components/calendar/settings/SettingsHeader.tsx` — direct inspection
- `/Users/jdm/.../MeeThing/src/components/calendar/CalendarConnections.tsx` — direct inspection
- `/Users/jdm/.../MeeThing/src/pages/Index.tsx` + `src/components/MinimalHero.tsx` — confirmation that legacy `Hero.tsx`/`Features.tsx` are orphaned

### Secondary (MEDIUM confidence)
- TypeScript `as const` pattern: official TS handbook (well-known language feature, not researched further — part of standard TS knowledge)
- shadcn-ui Button icon variant: standard pattern (`variant="ghost"` + `size="icon"` + `aria-label`) per the shadcn convention already used elsewhere in this repo

### Tertiary (LOW confidence)
- None — no WebSearch needed. This phase is entirely in-repo and constrained by CONTEXT.md.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — no new libraries; language feature + existing infra
- Architecture: **HIGH** — CONTEXT.md locks the shape; glossary module pattern is trivial and canonical
- Pitfalls: **HIGH** — pitfalls derived from direct inspection of real violation sites, not speculation
- Violation inventory: **HIGH** — each row verified by file read at stated line numbers
- Wave 2 judgment calls: **MEDIUM** — depends on reviewer taste; research flags candidates but planner must scope

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days — stable phase, no external moving parts)
