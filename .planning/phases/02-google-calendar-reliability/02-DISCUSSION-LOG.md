# Phase 2: Google Calendar Reliability — Discussion Log

**Session:** 2026-03-26
**Workflow:** gsd:discuss-phase 02

---

## Areas Discussed

All four gray areas selected by user.

---

## Disconnect Flow

**Q: How should the disconnect action work architecturally?**
Options: New edge function / Extend sync function / Client-side revocation
→ **Selected:** New edge function (`google-calendar-disconnect`)

**Q: Should disconnecting require a confirmation dialog?**
Options: Yes — confirm before disconnecting / No — disconnect immediately
→ **Selected:** Yes — confirm before disconnecting

**Q: What happens to synced meetings when a calendar is disconnected?**
Options: Hard delete from DB / Soft delete / hide
→ **Selected:** Hard delete from DB

---

## Re-connect Prompt UX

**Q: When token refresh fails during sync, what should the user see?**
Options: Toast + navigate to Connections tab / Inline error on provider card / Toast only — no action
→ **Selected:** Toast + navigate to Connections tab

**Q: Should the error message distinguish between auth failure vs. API/network error?**
Options: Yes — specific messages / No — generic message
→ **Selected:** Yes — specific messages

---

## Last-synced Display

**Q: Should the UI show when a calendar was last synced?**
Options: Yes — on the provider card / Yes — near the Sync button / No — just toast feedback
→ **Selected:** Yes — on the provider card (in Connections tab)

---

## Calendar Scope

**Q: Which Google calendars should be synced?**
Options: Primary calendar only / All user calendars
→ **Selected:** Primary calendar only

---

*Discussion log for human reference only. Not consumed by downstream agents.*
