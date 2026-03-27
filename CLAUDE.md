# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:8080)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

No test framework is configured — linting is the only automated quality check.

## Architecture

**MeeThing** is a React SPA (Vite + TypeScript) for calendar integration and meeting management, with Supabase as the backend.

### Stack
- **Frontend:** React 18, React Router 6, TanStack Query, React Hook Form + Zod
- **UI:** shadcn-ui components (`src/components/ui/`) + Tailwind CSS with a custom wellness/nature design system
- **Backend:** Supabase (PostgreSQL + Auth)
- **Path alias:** `@/` maps to `src/`

### Key Data Flow
- Auth state lives in `AuthContext` (`src/contexts/AuthContext.tsx`), provided at the app root
- Supabase client is a singleton at `src/integrations/supabase/client.ts`
- Generated TypeScript types from the DB schema are in `src/integrations/supabase/types.ts`
- Protected pages are wrapped in `ProtectedRoute` (`src/components/auth/`)

### Pages & Routing (`src/App.tsx`)
| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | Index (landing) | No |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/calendar` | Calendar | Yes |

### Database Schema
Defined in `supabase/migrations/`. Key tables:
- `profiles` — user info, created automatically on signup via trigger
- `user_roles` — RBAC (admin / user / premium)
- `calendar_connections` — encrypted OAuth tokens per provider (Google, Microsoft, Apple)
- `meetings` — meeting records linked to a calendar connection

### Design System
Defined in `src/index.css` and `tailwind.config.ts`. Uses wellness/nature metaphors:
- Glassmorphism utilities: `.glass-panel`, `.glass-heavy`, `.glass-light`
- Custom animations: `breathe`, `gentle-float`, `fade-in`, `scale-in`
- Color palette: forest-green, ocean-blue, sage-green, etc.
- Dark mode via Tailwind `class` strategy (`next-themes`)

### Supabase Local Dev
Config is in `supabase/config.toml`. The project ID is `kpuyjhwyojeqenuocoyd`. Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are loaded from `.env`.
