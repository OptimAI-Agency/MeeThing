# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript 5.5 - All frontend source files in `src/`
- TypeScript (Deno runtime) - Supabase Edge Functions in `supabase/functions/`
- SQL - Database migrations in `supabase/migrations/`

**Secondary:**
- CSS - Custom design system in `src/index.css`

## Runtime

**Environment:**
- Node.js (frontend build/dev tooling)
- Deno (Supabase Edge Functions runtime, `deno.land/std@0.168.0`)

**Package Manager:**
- npm (primary, `package-lock.json` present)
- bun (`bun.lockb` also present — secondary/alternative)
- Lockfile: Both `package-lock.json` and `bun.lockb` committed

## Frameworks

**Core:**
- React 18.3 (`react@^18.3.1`) - UI framework
- React Router 6.26 (`react-router-dom@^6.26.2`) - Client-side routing, hash/browser history
- TanStack Query 5.56 (`@tanstack/react-query@^5.56.2`) - Server state, async data fetching

**Forms & Validation:**
- React Hook Form 7.53 (`react-hook-form@^7.53.0`) - Form state management
- `@hookform/resolvers@^3.9.0` - Zod adapter for React Hook Form
- Zod 3.23 (`zod@^3.23.8`) - Runtime schema validation

**UI Components:**
- shadcn/ui (component collection, configured via `components.json`, style: default, baseColor: slate)
- Radix UI primitives (full suite: accordion, dialog, dropdown, popover, select, tabs, toast, tooltip, etc.)
- Lucide React 0.462 (`lucide-react@^0.462.0`) - Icon library
- Tailwind CSS 3.4 (`tailwindcss@^3.4.11`) - Utility-first CSS

**Theming:**
- next-themes 0.3 (`next-themes@^0.3.0`) - Dark/light/system mode via Tailwind `class` strategy

**Build/Dev:**
- Vite 5.4 (`vite@^5.4.1`) - Dev server and bundler, port 8080
- `@vitejs/plugin-react-swc@^3.5.0` - SWC-based React fast refresh
- `lovable-tagger@^1.1.7` - Lovable.dev component tagging plugin (dev only)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js@^2.84.0` - Database, auth, and edge function client; singleton at `src/integrations/supabase/client.ts`
- `react-router-dom@^6.26.2` - All navigation and protected routes
- `@tanstack/react-query@^5.56.2` - All async data fetching patterns

**UI/Data Utilities:**
- `date-fns@^3.6.0` - Date formatting and arithmetic for meeting times
- `recharts@^2.12.7` - Chart components (present but usage scope is limited currently)
- `clsx@^2.1.1` + `tailwind-merge@^2.5.2` - Conditional class merging via `cn()` utility in `src/lib/utils.ts`
- `class-variance-authority@^0.7.1` - Variant-based component styling (used by shadcn/ui)
- `sonner@^1.5.0` - Toast notifications
- `cmdk@^1.0.0` - Command palette component
- `embla-carousel-react@^8.3.0` - Carousel component
- `input-otp@^1.2.4` - OTP input component
- `vaul@^0.9.3` - Drawer component
- `react-day-picker@^8.10.1` - Calendar date picker
- `react-resizable-panels@^2.1.3` - Resizable panel layout

## Configuration

**Environment:**
- Variables loaded from `.env` at project root (not committed)
- Required vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Edge Function vars (set in Supabase dashboard): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

**TypeScript:**
- `tsconfig.json` - Root config, references `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json` - App source config; strict mode OFF, `noImplicitAny` OFF, target ES2020
- Path alias `@/*` → `./src/*` configured in both `tsconfig.app.json` and `vite.config.ts`

**Build:**
- `vite.config.ts` - Vite config with `@vitejs/plugin-react-swc`, dev port 8080, `@` alias
- `tailwind.config.ts` - Tailwind config with custom design system (wellness/nature theme)
- `postcss.config.js` - PostCSS with autoprefixer
- `components.json` - shadcn/ui CLI configuration

**Linting:**
- `eslint.config.js` - ESLint 9 flat config; TypeScript ESLint recommended + react-hooks + react-refresh; `@typescript-eslint/no-unused-vars` disabled

## Platform Requirements

**Development:**
- Node.js (version not pinned; no `.nvmrc` present)
- Supabase CLI for edge function deployment and local dev
- `npm run dev` — starts Vite dev server at `localhost:8080`

**Production:**
- Vite SPA build (`npm run build`) produces static assets
- Deployed via Lovable.dev platform (indicated by `lovable-tagger` dependency)
- Edge functions deployed to Supabase managed infrastructure (Deno runtime)

---

*Stack analysis: 2026-03-22*
