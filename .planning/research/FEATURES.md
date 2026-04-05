# Feature Research — v2.0 Companion Experience

**Domain:** Calm calendar companion — wellness app UX patterns for elevating an existing product into a lingering daily companion
**Researched:** 2026-04-04
**Confidence:** MEDIUM (HIGH for Headspace notification patterns and typography pairings — verified via Headspace engineering blog and design sources; MEDIUM for greeting and reflection patterns; LOW-MEDIUM for exact time-of-day color implementations in shipped apps — derived largely from circadian lighting research rather than direct app audits)

## Scope Note

This document **replaces** the earlier v1 feature research. It covers the *net-new v2.0 surface* only: language overhaul, today-first layout, rhythm timeline, meeting card redesign, ambient beauty, push notifications, wind-down view, weekly tone, contextual greeting, and typography pairing.

It deliberately does **not** re-examine already-shipped capabilities (Google Calendar sync, breathing overlay, transition buffers, glassmorphism system, email verification, password reset). Each v2.0 feature is framed through the dual lens of "what makes it calm" vs "what makes it intrusive" — the defining axis for this milestone.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features a "wellness companion" audience assumes exist. Missing these = the app feels like a reskinned utility, not a companion.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Contextual daily greeting with name + day summary | Every companion app (Calm, Headspace, Reflectly, Fitbit, Apple Fitness) opens with "Good morning, [Name]" + one-sentence state-of-day. Its absence reads as cold. | LOW | Pure UI composition over existing meeting data. Tone is the hard part, not logic. Calm opens home with greeting + river/mountain scene; Headspace opens with greeting + "plan for the day." |
| Today-first default view | Knowledge workers open a calendar app to answer "what now?" not "what this week?" Showing 7 days by default creates immediate visual overwhelm — the exact feeling this product exists to remove. | LOW | Data already exists; this is a filter + a toggle. Real work is in empty-state and light-day copy. |
| Proportional meeting cards (time as visual weight) | Fantastical, Cron/Notion Calendar, Amie, Apple Calendar Day view all use time-proportional blocks. Flat equal-height lists read as a todo app, not a calendar. | MEDIUM | Requires rethinking list layout as timeline-adjacent. Risk: very long meetings dominate; very short meetings become unreadable. Needs min/max clamping. |
| Quiet, opt-in notifications (pre-meeting only) | Modern apps must ask before notifying and must not spam. Users expect a single permission prompt with a clear benefit. | MEDIUM | Browser Push API + service worker + VAPID keys. Permission must be tied to a deliberate "Turn on breathing reminders" toggle, never triggered on page load. |
| Empty / light-day states that don't feel broken | When today has 0 or 1 meetings, a utility app looks empty. A companion celebrates it ("a spacious day — enjoy the quiet"). | LOW | Copy problem, not engineering. But non-negotiable: empty states define whether the app feels alive or dead on calm days. |
| Human, non-urgent language throughout | Words like "Dashboard," "Upcoming," "Overdue," "Alerts," "Sync Now" telegraph utility. The entire milestone rests on this vocabulary purge. | LOW (mechanical) / HIGH (creative) | A single leaked "Dashboard" label breaks the spell. Requires a copy glossary + replacement list reviewed as one artifact. |

### Differentiators (Competitive Advantage)

These features make MeeThing a *lingering* companion, not a prettier calendar. None of MeeThing's direct calendar competitors (Fantastical, Cron, Amie, Motion, Reclaim) do these — they compete on productivity. These features borrow from meditation apps and apply their vocabulary to time management.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Today's Rhythm horizontal timeline | A single glanceable "shape of the day" — meetings as weighted marks, gaps as breathing room. Reframes the day as rhythm, not queue. No calendar competitor does this; meditation apps don't need to. | MEDIUM | SVG or CSS bar; compute gaps from sorted meetings; label the largest gap. Risk: on very busy days it becomes a wall of marks — needs a "tightly packed, here are the two small gaps" fallback. |
| Contextual greeting with *specific* calendar insight | "Good morning, Jonas. You have 3 meetings today. Biggest gap: 2h after 2 PM." — specific, factual, calming because it names breathing room, not deadlines. Headspace does philosophical prompts; no one does calendar-specific contextual calm. | LOW | All data is on the client. The craft is in 6–8 sentence templates covering: light day, heavy day, back-to-back day, zero meetings, single long meeting, afternoon-heavy, morning-heavy, first-meeting-imminent. |
| Time-of-day color warmth shift | Background and accents drift from cool-dawn → bright-midday → warm-dusk → deep-evening. Mirrors circadian lighting research (6500K morning → <2700K evening) — the same logic Philips Hue and Aqara wellness lighting apply. Creates ambient sense of time passing without a visible clock. | MEDIUM | CSS custom properties driven by local time; 4 named windows (dawn 5–9, day 9–16, dusk 16–19, night 19–5). Risk: contrast/accessibility in the warm-dusk state — must WCAG-check every palette. |
| Wind-down view after last meeting | Appears only once the final meeting of the day ends. One sentence + optional one-tap reflection ("How did today feel? — light / heavy / skip"). Natural because it's *triggered by completion*, not a fixed clock. Mirrors how meditation apps surface "evening insight" post-activity, not at 9pm sharp. | MEDIUM | Detection logic: last meeting's end + small buffer. Persists a lightweight `day_reflection` row if answered. Must be **skippable silently** — no streaks, no "you missed yesterday." |
| "Mindful Moment" notifications where the ritual happens in the banner | Headspace's breakthrough: notifications that *are* the moment, not a CTA to start one. "Two minutes until your meeting — breathe in for four, hold for four, out for six." The ritual lives in the notification itself. | MEDIUM | Service worker + push payload with rhythm text. Opening the app is optional — the notification *is* the product at that instant. Single most differentiating copy decision in the milestone. |
| Weekly tone language ("a full week ahead" / "a lighter week") | Classifies the week by meeting density and names it in human terms. Turns "7 meetings Mon, 4 Tue…" into an emotional read. Productivity tools never attempt this; it would undermine their urgency framing. | LOW | Density thresholds + sentence templates. Honest challenge: avoid toxic positivity on heavy weeks — "a full week ahead, pace yourself" beats "a challenging week." |
| Second warm typeface for wellness moments | Primary UI sans stays cool/neutral for data; a warmer secondary (serif or humanist) appears only on greeting, wind-down, and breathing overlay copy. The font itself signals "this moment is for you, not for your calendar." Proven wellness pairings: Merriweather/Montserrat, DM Serif Text/Open Sans, Poppins/Karla. | LOW (engineering) / MEDIUM (taste) | Single extra font file (subset + preload). The pairing decision is irreversible once shipped — needs review before merge. |
| Slowly breathing ambient background | Background gradient or nature scene animates on a 10–15s cycle (scale + opacity drift) synced to nothing in particular. Creates a sense that the app is *alive* and *patient*. Calm does this with its river/mountain home scene. | LOW | CSS `@keyframes` with `prefers-reduced-motion` fallback — non-negotiable. |

### Anti-Features (Commonly Requested, Often Problematic)

These will be asked for. They all seem aligned with the product. All of them break it.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Streaks / reflection-logging gamification | "Help users build the habit." Proven lever in Duolingo, Headspace. | Streaks create guilt and loss-aversion — the exact emotion this product sells against. Missing a day becomes a failure event in a product that exists to reduce failure-feelings. | Soft reinforcement: "you've reflected 4 times this week" as observation, never score. No numbers visible by default. |
| Notification badges / unread counts | Standard pattern; users "expect" the red dot. | Red dot = anxiety signal, the primary emotion to eliminate. Incompatible with the entire brand thesis. | No badges. Ever. OS notifications display and vanish; the app icon stays quiet. |
| AI-generated meeting summaries / prep briefs | LLM-era table stakes; every productivity tool is adding them. | Pulls the app back into productivity-tool territory (Notion, Granola, Reclaim, Fireflies already own this). Also deeply privacy-fraught (reading meeting contents). | Stay in the emotional-space lane. Let other tools summarize; MeeThing holds the space *between* meetings, not *inside* them. |
| Mood tracking with an analytics dashboard | "Wellness apps track things." Reflectly, Daylio, Apple Health all do it. | Turning mood into a chart turns a feeling into a KPI — the Reflectly critique is that mood-as-data makes users perform wellness rather than feel it. | The wind-down view's optional 3-choice reflection is enough. No dashboard, no graphs, no "mood trend." |
| Multiple daily notifications (morning briefing + lunch + pre-meeting + wind-down) | "Keep users engaged throughout the day." | Four notifications a day from a calendar app is harassment regardless of copy. Breaks the "calm" promise on day one. | Exactly one notification type at launch: pre-meeting breathing cue. Everything else is pull, not push. |
| "Focus score" or "calm score" for the day | Gamifies the promise; feels objective. | Scoring calmness is a paradox — being scored is not calm. Users will optimize for the score and stop using the app when they "fail" a day. | Qualitative sentences only. "Today had two deep gaps" beats "Calm score: 72." |
| Dark mode that simply inverts the palette | Users ask for dark mode on everything. | A literal inversion of the wellness palette loses the time-of-day warmth logic. Dark mode fights with the dusk/night color shift feature. | The time-of-day palette *is* the dark mode — evenings and nights are already dark and warm. Any manual override must respect the warmth curve, not flatten it. |
| Haptic feedback / sound effects on every interaction | Modern app polish. | Sounds and buzzes are interruptions. The brand voice is "quiet." | Silence by default. Optional chime only on breathing overlay start/end. |

---

## Feature Dependencies

```
Language overhaul (copy glossary)
    |-- blocks --> Contextual greeting
    |-- blocks --> Wind-down view
    |-- blocks --> Weekly tone
    |-- blocks --> Notification copy
    |-- blocks --> Empty states

Today-first layout
    |-- enables --> Today's Rhythm timeline (a today-view component)
    |-- enables --> Proportional meeting cards (sized against a 1-day axis)

Proportional meeting cards
    |-- enhances --> Time-of-day color coding (card tint maps to start hour)

Time-of-day warmth shift (global palette)
    |-- enhances --> Ambient breathing background (share the palette)
    |-- enhances --> Meeting card color coding (same palette source)

Browser push infrastructure
    |-- enables --> Pre-meeting breathing cue (the only notification shipping)

Last-meeting detection
    |-- enables --> Wind-down view

Second warm typeface (font loading)
    |-- enhances --> Greeting
    |-- enhances --> Wind-down view
    |-- enhances --> Breathing overlay (existing)
```

### Dependency Notes

- **Language overhaul blocks everything emotional:** every new text-bearing feature depends on the copy glossary being decided first. Shipping a greeting before the glossary means rewriting it. Do the glossary as its own small work item at the start.
- **Today-first layout is architectural, not cosmetic:** the Rhythm timeline and proportional cards are both scoped to a 1-day axis. Building them against the current 7-day view creates throwaway work.
- **Time-of-day warmth is a design-system-level change:** every new feature picks up from CSS custom properties. Land the palette variables before building greeting / cards / timeline.
- **Notifications have a hard prerequisite chain:** service worker registration → VAPID keys → user subscription → permission UX → payload shape → copy. Each step has failure modes. Plan one full phase around notifications alone.
- **Wind-down depends on "last meeting of the day" detection**, which is deceptively subtle — what about after-hours meetings, all-day events, meetings that end after midnight? Needs an explicit spec.

---

## MVP Definition

### Launch With (v2.0 core)

These features together deliver "lingering companion." Shipping a subset feels incomplete.

- [ ] **Copy glossary + language pass** — everything else rests on this
- [ ] **Today-first layout with weekly toggle** — the structural reframe
- [ ] **Contextual greeting (6–8 sentence templates)** — first touch every session
- [ ] **Proportional meeting cards with time-of-day tinting** — the re-seen daily view
- [ ] **Today's Rhythm timeline** — the signature new UI element
- [ ] **Time-of-day warmth shift (global background + palette)** — ambient presence
- [ ] **Second warm typeface on greeting / wind-down / breathing** — emotional register
- [ ] **Empty + light-day states with celebratory copy** — non-negotiable
- [ ] **Ambient breathing background** — low cost, high ambient impact

### Add After Validation (v2.1)

- [ ] **Pre-meeting breathing push notification** — requires permissions UX and copy testing; high stakes if copy misses
- [ ] **Wind-down view** — depends on stable last-meeting detection and a few weeks of user rhythm to tune trigger timing
- [ ] **Weekly tone language** — add once daily greeting tone is locked

### Future Consideration (v2.2+)

- [ ] **Optional 3-choice end-of-day reflection persistence** — only if wind-down usage shows demand; otherwise keep it ephemeral
- [ ] **Personalized greeting templates based on past rhythms** — needs history and privacy review
- [ ] **Ambient soundscape toggle** — low priority; visual breathing may already be enough

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Copy glossary + language pass | HIGH | LOW (engineering) / HIGH (creative) | P1 |
| Today-first layout | HIGH | LOW | P1 |
| Contextual greeting | HIGH | LOW | P1 |
| Proportional meeting cards | HIGH | MEDIUM | P1 |
| Time-of-day warmth shift | HIGH | MEDIUM | P1 |
| Today's Rhythm timeline | HIGH | MEDIUM | P1 |
| Warm second typeface | MEDIUM | LOW | P1 |
| Ambient breathing background | MEDIUM | LOW | P1 |
| Pre-meeting push notification | HIGH | MEDIUM-HIGH | P2 |
| Wind-down view | MEDIUM | MEDIUM | P2 |
| Weekly tone language | MEDIUM | LOW | P2 |
| Reflection persistence | LOW | MEDIUM | P3 |

**Priority key:** P1 = must have for milestone. P2 = should have, add when core is stable. P3 = nice to have.

---

## Competitor Feature Analysis

| Pattern | Headspace | Calm | Reflectly | Things 3 | MeeThing v2.0 Approach |
|---------|-----------|------|-----------|----------|------------------------|
| Daily greeting | Greeting + today's meditation plan | Greeting + river/mountain ambient scene | "Good morning, how are you?" + mood-first prompt | "Today" list header, minimal greeting | Greeting + **specific calendar insight** (biggest gap, meeting count) — calendar-specific calm no one else does |
| Home information density | One card (today's session) | Hero scene + 3–4 curated items | One question | Flat list | Greeting + Rhythm strip + today's meetings (3 zones, nothing else) |
| Push notification copy | "Be kind to your mind today" / philosophical prompts / no direct CTA | Daily reminder + sleep story suggestions | Gentle "Ready to reflect?" | Task due reminders (utility) | "2 minutes until your meeting. Breathe in for 4, hold for 4, out for 6." — ritual in the notification, no CTA |
| Time-of-day UI shift | Subtle; dark mode only | Scene art varies with time (day/night home variants) | Minimal | None | Continuous warmth curve driven by local time (cool dawn → warm dusk) |
| Reflection prompts | Post-session self-check (optional) | Mood check-in (optional, skippable) | Daily, mandatory on day 1, softer after | None | Triggered by *last meeting end*, not a fixed time; one tap, skippable, no streak |
| Typography | Apercu (custom) — single humanist sans across all states | Poppins + Founders Grotesk — geometric throughout | Cera Pro + handwritten accents | SF Pro (native) | **Two-register pairing**: existing UI sans + warm secondary (serif or humanist) reserved for wellness moments only |
| Empty-state handling | Celebrates rest days ("take a break — you've earned it") | Offers a free-form session | Light prompt | Empty | "A spacious day — enjoy the quiet." Never "No meetings." |
| Streaks / gamification | Yes (Runstreak) — known pain point in reviews | Minimal | Yes (initial hook, later softened) | No | **Explicitly rejected** |

---

## What Makes Each Feature Feel Calm vs Intrusive

The same feature can read either way. The difference is always specificity, timing, and restraint.

| Feature | Calm when… | Intrusive when… |
|---------|------------|-----------------|
| Greeting | Names one specific fact ("biggest gap: 2h after 2 PM"). Grounded in data. | Generic ("Hope you have a great day!"). Reads as filler. |
| Today-first layout | Default is one day; weekly is one tap away. | Weekly toggle is buried, or today view hides critical context. |
| Meeting cards | Proportional, quiet typography, time is the visual weight. | Every card identical size, urgency colors (red, orange). |
| Rhythm timeline | Gaps are named and celebrated. Labels are sparing. | Every minute annotated; timeline becomes noise. |
| Warmth shift | Gradual, imperceptible within a session, noticeable across a day. | Sudden palette changes at hour boundaries. |
| Warm secondary font | Reserved for ~5 emotional moments. Feels like a whisper. | Used for body copy or data. Becomes visual shouting. |
| Ambient breathing bg | 10–15s cycle, `prefers-reduced-motion` respected, low amplitude. | Fast pulse, high contrast shift, motion prefs ignored. |
| Push notifications | One type, pre-meeting only, copy is the ritual itself. | Multiple types, generic reminders, CTA-driven. |
| Wind-down | Triggered by *last meeting ending*, one tap, skippable silently. | Fixed 9pm clock trigger, modal, required answer, streak-tracked. |
| Weekly tone | Honest on heavy weeks ("a full week — pace yourself"). | Toxic-positive ("You got this!"). Users see through it immediately. |

---

## Emotional Risk Register

| Feature | Emotional Risk | Mitigation |
|---------|----------------|------------|
| Contextual greeting | Sounding AI-generated / generic / Clippy-like | Ship only 6–8 hand-written templates with a clear voice; review as poetry, not microcopy |
| Push notifications | Feeling watched or nagged | Single type; explicit per-feature opt-in; easy off switch visible in settings |
| Wind-down view | Guilt when skipped; performative when engaged | No persistence by default; no streaks; silent dismissal |
| Weekly tone | Toxic positivity on heavy weeks | Lexicon review — avoid "amazing," "crush," "smash," "productive" |
| Time-of-day palette | Accessibility failure in warm-dusk state | WCAG AA contrast check on every palette variant against real meeting text |
| Warm secondary font | Gimmicky if overused | Hard rule: ≤5 surfaces; never body copy; never data; never buttons |
| Ambient breathing bg | Motion sickness; battery drain on low-end devices | `prefers-reduced-motion` fallback to static gradient; GPU-accelerated transforms only |

---

## Complexity Summary

| Feature | Engineering | Design/Copy | Coupling |
|---------|-------------|-------------|----------|
| Copy glossary | LOW | HIGH | Blocks everything textual |
| Today-first layout | LOW | LOW | Blocks timeline + cards |
| Contextual greeting | LOW | HIGH | Depends on glossary |
| Proportional cards | MEDIUM | MEDIUM | Depends on today-first |
| Rhythm timeline | MEDIUM | MEDIUM | Depends on today-first |
| Warmth shift | MEDIUM | MEDIUM | Touches design system |
| Warm typeface | LOW | HIGH (pairing choice) | Enhances 3–5 surfaces |
| Breathing background | LOW | LOW | Standalone |
| Push notifications | MEDIUM-HIGH | HIGH (copy) | New infrastructure |
| Wind-down | MEDIUM | HIGH | Depends on last-meeting detection |
| Weekly tone | LOW | HIGH | Depends on glossary |

**HIGH creative-cost items (language, greeting templates, notification copy, typeface pairing, weekly tone) are the actual critical path** — the engineering is mostly straightforward. Staffing and review cadence for this milestone should reflect that it is unusually editorial, not unusually heavy engineering.

---

## Sources

- [6 Mindfulness App Design Trends in 2026 — Big Human](https://www.bighuman.com/blog/trends-in-mindfulness-app-design) — trend overview, greeting patterns (MEDIUM)
- [How to Create a Meditation App Based on Calm and Headspace — Globaldev](https://globaldevgroup.medium.com/how-to-create-a-meditation-app-based-on-the-examples-of-calm-and-headspace-25af32b87579) — home screen composition of Calm vs Headspace (MEDIUM)
- [8 Push Notifications from Headspace — ngrow.ai](https://www.ngrow.ai/blog/8-push-notifications-from-headspace-that-will-help-you-cultivate-mindfulness) — "Mindful Moment" notification pattern (MEDIUM-HIGH)
- [Explainable and Accessible AI: Push Notifications at Headspace — Headspace Engineering on Medium](https://medium.com/headspace-engineering/explainable-and-accessible-ai-using-push-notifications-to-broaden-the-reach-of-ml-at-headspace-a03c7c2bbf06) — first-party engineering perspective on ritual notifications (HIGH)
- [How Headspace Increased Engagement 32% with Strategic Push — ngrow.ai](https://www.ngrow.ai/blog/how-headspace-increased-engagement-by-32-with-strategic-push-notifications) — notification strategy results (MEDIUM)
- [Headspace sends push notifications with mindful prompts — Taplytics](https://taplytics.com/blog/headspace-sends-push-notifications-with-prompts-to-help-users-become-more-mindful/) — notification copy examples (MEDIUM)
- [Reflectly's easygoing daily journaling — GoodUX / Appcues](https://goodux.appcues.com/blog/reflectlys-easygoing-daily-journaling) — friendly microcopy and encouragement (MEDIUM)
- [Reflectly — App Store listing](https://apps.apple.com/us/app/reflectly-journal-ai-diary/id1241229134) — morning/evening prompt schedule (MEDIUM)
- [The Best Font Pairings for Therapist Websites — Hey It's Lola](https://www.heyitslola.com/post/the-best-font-pairings-for-therapist-websites) — Merriweather/Montserrat, Poppins/Karla, DM Serif Text/Open Sans pairings (MEDIUM)
- [10 Fonts to Consider for Your Wellness Brand — Inside Out Brands](https://www.insideoutbrands.com/blog/10-wellness-fonts) — wellness typography principles (MEDIUM)
- [8 Free Fonts for Wellness Brands — The Denizen Co.](https://www.thedenizenco.com/journal/8-free-fonts-for-the-wellness-brand) — curated wellness font list (MEDIUM)
- [Circadian Lighting in Smart Homes — Elite Smart Home](https://elitesmarthome.com/circadian-lighting-in-smart-homes-tuning-color-temperature-throughout-the-day/) — 6500K → 2700K curve, morning-to-evening warmth (MEDIUM)
- [Circadian Rhythm Lighting 101 — Aqara 2026](https://us.aqara.com/blogs/news/reset-circadian-rhythm-adaptive-lighting) — adaptive lighting time windows (MEDIUM)
- [Lighting the Way to Wellness — Illuminating Engineering Society](https://ies.org/lda/lighting-the-way-to-wellness-how-circadian-rhythms-and-rgbtw-lighting-are-revolutionizing-design/) — circadian + color temperature science (MEDIUM)
- [Building a Wellness App in 2025 — Jhavtech](https://www.jhavtech.com.au/building-wellness-app-2025-features-trends/) — gentle prompt patterns, "non-intrusive" framing (LOW-MEDIUM)
- [7 Mental Wellness Apps to Watch in 2025 — Soulbot Therapy](https://www.soulbottherapy.com/blog/mental-health/7-mental-wellness-apps-to-watch-in-2025/) — reflection prompt approaches (LOW-MEDIUM)

---
*Feature research for: calm calendar companion v2.0 — language, layout, rhythm timeline, notifications, wind-down, typography*
*Researched: 2026-04-04*
