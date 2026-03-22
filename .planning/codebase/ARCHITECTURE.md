# Architecture

## Overview

MeeThing is a React 18 SPA (Single Page Application) built with Vite and TypeScript. It provides calendar integration and meeting management across multiple providers (Google Calendar, Microsoft Outlook, Apple Calendar), with Supabase serving as the backend for authentication, data storage, and OAuth token management.

## Architectural Pattern

**Client-side SPA + Backend-as-a-Service (BaaS)**

- React SPA handles all UI rendering and client-side routing
- Supabase provides PostgreSQL, Auth, and Edge Functions
- No custom API server — all backend logic in Supabase Edge Functions (Deno)

## Entry Points

**`src/main.tsx`** — Minimal React 18 `createRoot` entry

**`src/App.tsx`** — Root component establishing:
- TanStack Query client (server state management)
- React Router v6 (BrowserRouter)
- AuthProvider (React Context wrapping all routes)
- TooltipProvider (Radix UI)
- Toast systems (Sonner + shadcn Toaster)

### Route Map

| Route | Component | Auth |
|-------|-----------|------|
| `/` | Index (landing) | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/calendar` | Calendar | Protected |
| `/auth/callback` | AuthCallback | Protected |
| `*` | NotFound | — |

## Layers

### 1. Authentication Layer

**`src/contexts/AuthContext.tsx`** — Supabase auth state management
- State: `user`, `session`, `loading`
- Methods: `signIn()`, `signUp()`, `signOut()`
- Real-time auth state listener
- Session persistence via localStorage

**`src/components/auth/ProtectedRoute.tsx`** — Route guard
- Redirects to `/login` if unauthenticated
- Shows spinner during auth state check

### 2. Backend Integration Layer

**`src/integrations/supabase/client.ts`** — Singleton Supabase client
- Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Auto token refresh, localStorage persistence

**`src/integrations/supabase/types.ts`** — Auto-generated DB TypeScript types

### 3. Data Querying Layer (TanStack Query)

**`src/hooks/useCalendarConnections.ts`**
- Query key: `["calendar-connections", user?.id]`
- Source: `calendar_connections` table
- Enabled only when authenticated

**`src/hooks/useMeetings.ts`**
- Query key: `["meetings", user?.id]`
- Source: `meetings` table with `calendar_connections` relationship
- Filters: next 7 days from now, ordered by `start_time`

### 4. Component Layer

**Pages** (`src/pages/`) — Full-page views, routing targets

**Container Components** (`src/components/calendar/`)
- `CalendarHub.tsx` — Main layout, tab navigation (overview/connections/settings)
- `CalendarConnections.tsx` — Provider cards, OAuth connect/disconnect
- `MeetingsList.tsx` — Upcoming meetings display
- `CalendarSettings.tsx` — User preferences

**Presentational Components** (`src/components/ui/`) — shadcn/ui components (Radix UI primitives)

### 5. Edge Functions (Supabase / Deno)

**`supabase/functions/google-oauth/index.ts`**
- Exchanges Google auth code for access/refresh tokens
- Upserts encrypted tokens into `calendar_connections`

**`supabase/functions/google-calendar-sync/index.ts`**
- Validates user session
- Checks/refreshes token expiry
- Fetches primary calendar events (7-day window, timed events only)
- Upserts into `meetings`, deletes stale records
- Updates `last_synced_at`

## Data Flow

### Authentication Flow
```
Login/Signup Form
  → AuthContext.signIn/signUp()
  → Supabase Auth API
  → DB Trigger: creates profiles + user_roles + user_settings
  → AuthContext updates state
  → Navigate to /calendar
```

### Calendar OAuth Flow
```
CalendarConnections.tsx "Connect" button
  → Constructs Google OAuth URL (scope: calendar.readonly, access_type: offline)
  → Redirect to Google consent screen
  → Google redirects to /auth/callback?code=...
  → AuthCallback.tsx
    → invoke("google-oauth") → stores encrypted tokens
    → invoke("google-calendar-sync") → initial sync
  → Navigate to /calendar?tab=overview
```

### Meeting Sync Flow
```
Manual "Sync now" or initial connect
  → google-calendar-sync edge function
  → Check token expiry, refresh if < 5 min remaining
  → Google Calendar API: GET /calendar/v3/calendars/primary/events
  → Map events to meetings schema
  → Supabase UPSERT meetings (conflict: user_id + external_id)
  → DELETE stale meetings outside 7-day window
  → Update last_synced_at
  → TanStack Query invalidates ["meetings"] cache
  → MeetingsList re-renders
```

## State Management Strategy

| State Type | Mechanism | Location |
|-----------|-----------|----------|
| Auth State | React Context + Supabase | `AuthContext` |
| Server Data | TanStack Query | `useCalendarConnections`, `useMeetings` |
| Local UI State | React `useState` | Individual components |
| Background Preference | localStorage + `useState` | `useBackground` hook |
| Global Providers | React Context | `App.tsx` |

## Form & Validation

**`src/lib/auth-schemas.ts`** — Zod schemas
- `signUpSchema`: fullName (1-100 chars), email, password (min 8, requires upper/lower/number)
- `signInSchema`: email + password
- Used in Login.tsx and Signup.tsx with `safeParse()` and toast error display

## Design System

- **Tailwind CSS** with custom wellness/nature theme
- **Glassmorphism** utilities: `.glass-panel` (70% opacity, 40px blur), `.glass-heavy`, `.glass-light`
- **Color palette**: forest-green, ocean-blue, sage-green (HSL CSS variables)
- **Animations**: `breathe`, `gentle-float`, `fade-in`, `scale-in`, spring curves
- **Dark mode**: `next-themes` with Tailwind `class` strategy

## Database Schema

Tables managed via `supabase/migrations/`:
- `profiles` — user metadata, auto-created by trigger on signup
- `user_roles` — RBAC (admin / user / premium)
- `calendar_connections` — encrypted OAuth tokens per provider
- `meetings` — calendar events, linked to `calendar_connections`
- `user_settings` — user preferences

Security: RLS enabled on all tables, user-scoped policies, encrypted token fields.
