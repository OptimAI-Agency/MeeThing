# Structure

## Directory Tree

```
MeeThing/
├── src/
│   ├── main.tsx                           # React 18 entry point (createRoot)
│   ├── App.tsx                            # Root: routing, providers, layout
│   ├── index.css                          # Tailwind base + design system tokens
│   ├── vite-env.d.ts                      # Vite environment type declarations
│   │
│   ├── pages/                             # Page-level route components
│   │   ├── Index.tsx                      # Landing page (/)
│   │   ├── Login.tsx                      # Login form (/login)
│   │   ├── Signup.tsx                     # Registration form (/signup)
│   │   ├── Calendar.tsx                   # Calendar hub (/calendar)
│   │   ├── AuthCallback.tsx               # OAuth callback handler (/auth/callback)
│   │   └── NotFound.tsx                   # 404 page
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui design system (50+ files)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── [44+ other Radix-backed components]
│   │   │
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx         # Route guard (redirects unauthenticated users)
│   │   │
│   │   ├── calendar/
│   │   │   ├── CalendarHub.tsx            # Main calendar container with tab navigation
│   │   │   ├── CalendarConnections.tsx    # Provider connection/disconnection UI
│   │   │   ├── MeetingsList.tsx           # Upcoming meetings list
│   │   │   ├── CalendarSettings.tsx       # Settings panel container
│   │   │   └── settings/
│   │   │       ├── SettingsHeader.tsx
│   │   │       ├── BackgroundSettings.tsx
│   │   │       ├── NotificationSettings.tsx
│   │   │       ├── SyncSettings.tsx
│   │   │       └── WellnessSection.tsx
│   │   │
│   │   ├── Header.tsx                     # Navigation header
│   │   ├── Footer.tsx                     # Footer
│   │   ├── Hero.tsx                       # Landing hero section
│   │   ├── MinimalHero.tsx                # Compact hero variant
│   │   ├── MinimalFooter.tsx              # Compact footer variant
│   │   └── Features.tsx                   # Feature showcase section
│   │
│   ├── hooks/
│   │   ├── useCalendarConnections.ts      # TanStack Query: calendar_connections table
│   │   ├── useMeetings.ts                 # TanStack Query: meetings table (next 7 days)
│   │   ├── useBackground.tsx              # Background preference (localStorage)
│   │   ├── use-mobile.tsx                 # Mobile breakpoint detection
│   │   └── use-toast.ts                   # Toast notification imperative API
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx                # Auth state, signIn/signUp/signOut methods
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts                  # Singleton Supabase client
│   │       └── types.ts                   # Auto-generated DB TypeScript types
│   │
│   ├── lib/
│   │   ├── auth-schemas.ts                # Zod schemas for auth forms
│   │   └── utils.ts                       # cn() class merging utility
│   │
│   └── assets/
│       ├── google-calendar-logo.png
│       ├── microsoft-outlook-logo.png
│       └── apple-calendar-logo.png
│
├── supabase/
│   ├── config.toml                        # Local dev config (project ID: kpuyjhwyojeqenuocoyd)
│   ├── migrations/
│   │   ├── 20251124004329_[...].sql       # Initial schema: tables, RLS, triggers
│   │   ├── 20251124010053_[...].sql       # Secondary migration
│   │   └── 20260321000000_meetings_unique_constraint.sql
│   └── functions/
│       ├── google-oauth/
│       │   └── index.ts                   # Deno Edge Function: OAuth code exchange
│       └── google-calendar-sync/
│           └── index.ts                   # Deno Edge Function: calendar event sync
│
├── public/
│   ├── index.html                         # HTML shell
│   └── lovable-uploads/                   # User-uploaded static assets
│
├── .env                                   # Local env vars (gitignored)
├── .env.example                           # Env var template
├── .env.production                        # Production env vars
├── .gitignore
├── .claude/
│   └── settings.local.json               # Claude Code permissions
├── .planning/                             # GSD planning artifacts
│
├── package.json                           # Dependencies and scripts
├── package-lock.json
├── bun.lockb                              # Bun lockfile
│
├── tsconfig.json                          # TypeScript base config
├── tsconfig.app.json                      # App TypeScript config
├── tsconfig.node.json                     # Node/build tool TypeScript config
├── tailwind.config.ts                     # Tailwind theme and plugins
├── postcss.config.js                      # PostCSS (autoprefixer, tailwind)
├── vite.config.ts                         # Vite config (React plugin, @/ alias)
├── eslint.config.js                       # ESLint rules
├── components.json                        # shadcn/ui registry config
│
├── README.md
└── CLAUDE.md                             # Claude Code guidance
```

## Key Locations

| What | Where |
|------|-------|
| App entry | `src/main.tsx` |
| Routing + providers | `src/App.tsx` |
| Auth context | `src/contexts/AuthContext.tsx` |
| Supabase client | `src/integrations/supabase/client.ts` |
| DB types | `src/integrations/supabase/types.ts` |
| Design tokens | `src/index.css` |
| Tailwind config | `tailwind.config.ts` |
| Path alias (@/) | `tsconfig.json` + `vite.config.ts` |
| DB migrations | `supabase/migrations/` |
| Edge functions | `supabase/functions/` |
| UI components | `src/components/ui/` |
| Feature components | `src/components/calendar/` |
| Data hooks | `src/hooks/` |

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| Page components | PascalCase `.tsx` | `Calendar.tsx` |
| Feature components | PascalCase `.tsx` | `CalendarHub.tsx` |
| shadcn/ui components | kebab-case `.tsx` | `button.tsx`, `dialog.tsx` |
| Data hooks | `use[DataType].ts` | `useMeetings.ts` |
| UI hooks | `use-[feature].ts` | `use-toast.ts` |
| Utilities | camelCase or kebab-case `.ts` | `utils.ts`, `auth-schemas.ts` |
| DB migrations | timestamp prefix | `20251124004329_[...].sql` |
| Config files | kebab-case | `tailwind.config.ts` |

### Code

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `CalendarHub`, `ProtectedRoute` |
| Functions | camelCase | `handleConnect`, `refreshAccessToken` |
| State variables | camelCase | `selectedBackground`, `syncing` |
| Types/Interfaces | PascalCase | `AuthContextType`, `BackgroundOption` |
| Constants | UPPER_SNAKE_CASE | `SUPABASE_URL` |
| CSS classes | kebab-case | `.glass-panel`, `.spring-bounce` |
| CSS variables | `--kebab-case` | `--forest-green`, `--ocean-blue` |

### Component Organization

- **By feature** under `src/components/[feature]/`
- Settings sub-components isolated in `src/components/calendar/settings/`
- All shadcn/ui primitives in `src/components/ui/` (never modified directly)

## Environment Variables

### Frontend (`.env`, prefix `VITE_`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_GOOGLE_CLIENT_ID=
```

### Supabase Edge Functions (project secrets)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
```

## Path Alias

`@/` maps to `src/` — configured in both `tsconfig.json` and `vite.config.ts`.

```ts
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
```
