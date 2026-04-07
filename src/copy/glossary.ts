// src/copy/glossary.ts
// Single source of truth for all user-facing copy in MeeThing.
// See docs/copy-glossary.md for the human-readable deprecated→replacement map.
// Phase 6 — Language Foundation (COPY-01)

export const COPY = {
  nav: {
    calendar: "Your Calendar",         // D-01 — was "Calendar Integration"
    settings: "Your Settings",         // D-02 — was "Calendar Settings"
    connections: "Your Calendars",     // D-03 — was "Connections"
  },
  welcome: {
    heading: "Your Calendar",                                                  // D-01
    subheading: "A calmer view of your week. Connect your calendar to begin.", // D-04, D-10
    cta: "Connect your calendar",                                              // discretion
  },
  sync: {
    // D-05, D-07: icon-only button; no visible label in-flight
    iconAriaLabel: "Refresh your calendar",
    successTitle: "All caught up",                                             // D-06
    successBody: "Your day is up to date.",                                    // D-06
    errorTitle: "Couldn't reach your calendar",                                // D-08
    errorBody: "Try again in a moment.",                                       // D-08
    sessionExpiredTitle: "Reconnect to continue",                              // D-08 tone
    sessionExpiredBody: "Your Google Calendar needs to reconnect — just a moment.",
    sessionExpiredAction: "Reconnect",
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
    meetingsLoadTitle: "Couldn't refresh your calendar",                        // D-08 tone
    meetingsLoadBody: "Try again in a moment.",
    retry: "Try again",
  },
  settings: {
    heading: "Your Settings",                                                   // D-02
    subheading: "Shape your calendar around the way you want to feel.",         // discretion, calm voice
  },
  disconnect: {
    confirmTitle: "Disconnect your calendar?",
    confirmBody: "This removes synced meetings from MeeThing. You can reconnect anytime.",
    confirmCta: "Disconnect",
    cancel: "Cancel",
    successTitle: "Your calendar is disconnected",
    successBody: "Synced meetings have been cleared.",
    errorTitle: "Couldn't disconnect",
    errorBody: "Try again in a moment.",
  },
} as const;

export type Copy = typeof COPY;
