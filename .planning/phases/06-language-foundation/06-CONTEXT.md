# Phase 6: Language Foundation - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Every user-facing string in MeeThing reflects a calm, human-first voice — utility/dashboard vocabulary is gone and a reusable copy glossary governs all future text. This phase creates the glossary artifact and performs a full sweep of all existing UI strings. Companion features (greeting, weekly tone) are Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Section & Navigation Labels

- **D-01:** "Calendar Integration" → **"Your Calendar"** (main section heading and welcome screen title)
- **D-02:** "Calendar Settings" → **"Your Settings"** (settings section heading and tab label)
- **D-03:** "Connections" tab → **"Your Calendars"** (the tab/section listing connected providers)
- **D-04:** Welcome screen subheading uses wellness positioning: leads with the calm feeling before the action (e.g. "A calmer view of your week. Connect your calendar to begin.") — not productivity framing

### Sync Action Vocabulary

- **D-05:** "Sync now" primary button is **demoted to icon-only** — a small secondary icon button with no label; syncing becomes ambient, not dominant
- **D-06:** Sync success toast → soft confirmation language: **"All caught up"** or **"Your day is up to date"** — not the technical word "Synced"
- **D-07:** Syncing in-progress state → **spinner only, no text label** (consistent with icon-only demotion)
- **D-08:** Sync error message → **low-urgency framing**: e.g. "Couldn't reach your calendar — try again in a moment" (not a red error banner, not a generic "failed" message)

### Empty & Light-Day States

- **D-09:** No meetings today → **celebratory + specific tone**: names what the user gained — e.g. "A spacious day — enjoy the quiet" or "Nothing on the books today. Breathe." Treats the empty calendar as a gift, not a broken state
- **D-10:** No calendar connected (onboarding) → **lead with the calm outcome**: e.g. "A calmer view of your week starts here. Connect your calendar to begin." Sells the feeling before the action

### Glossary Format & Location

- **D-11:** Glossary lives in **two places**:
  - `src/copy/glossary.ts` — TypeScript constants that components import (enforced at compile time, eliminates hardcoded strings)
  - `docs/copy-glossary.md` — Human-readable mapping of deprecated → replacement terms for contributors and downstream phases
- **D-12:** Phase 6 performs a **full sweep of all existing UI strings** — every user-facing string across all components is reviewed against the glossary. Not just the named deprecated terms. Obvious violations get replaced; borderline cases get flagged.

### Claude's Discretion

- Exact wording for edge-case empty states (loading states, error recovery prompts) — match the established calm voice from D-08/D-09
- TS glossary file structure (object shape, export pattern) — standard constants pattern
- Button CTA copy for "Connect Google Calendar" — keep functional but can soften from imperative if natural

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §COPY-01 — The specific deprecated terms (Dashboard, Calendar Integration, Connections, Alerts, Sync now) and the requirement for a documented glossary artifact
- `.planning/PROJECT.md` §Core Value — "calm, beautiful alternative" — the copy voice must embody this at every touchpoint

### Existing Strings to Replace
- `src/components/calendar/CalendarHub.tsx` — "Calendar Integration" heading (line ~101, ~159), "Sync now" button (line ~183), welcome subheading (line ~105, ~161)
- `src/components/calendar/EmptyStates.tsx` — "Let's get you connected", "Enjoy the space" copy
- `src/components/calendar/settings/SettingsHeader.tsx` — "Calendar Settings" heading
- `src/components/calendar/CalendarConnections.tsx` — "Connections" references

No external specs — requirements fully captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/calendar/EmptyStates.tsx` — Two empty state components already exist (`NoMeetingsEmpty`, `NoConnectionsEmpty`); copy swap is in-place, no new components needed
- `src/components/calendar/settings/SettingsHeader.tsx` — Standalone header component, single text string to update
- Toast calls in `CalendarHub.tsx` — `toast({ title, description })` pattern; easy to update wording

### Established Patterns
- String constants: none yet — this phase creates the first `src/copy/` module
- Tailwind class-only components: most strings are JSX text nodes or object literals passed to `toast()` — no i18n layer, no string extraction needed
- Tab labels: currently string literals in the tabs array in `CalendarHub.tsx` — will be replaced with glossary constants

### Integration Points
- `src/copy/glossary.ts` will be the new dependency for all text-bearing components; planner should identify every import site
- `docs/copy-glossary.md` must exist in the repo and be referenced from `docs/` or root-level docs if that directory doesn't exist yet

</code_context>

<specifics>
## Specific Ideas

- Wellness positioning on welcome: "A calmer view of your week. Connect your calendar to begin." — this line should appear verbatim or very close in the glossary as the canonical welcome state
- No-meetings today: "A spacious day — enjoy the quiet" or "Nothing on the books today. Breathe." — both are good candidates; planner can pick one or offer as the documented default

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-language-foundation*
*Context gathered: 2026-04-05*
