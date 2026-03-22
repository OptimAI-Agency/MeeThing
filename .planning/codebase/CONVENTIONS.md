# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — `CalendarConnections.tsx`, `MeetingsList.tsx`, `AuthCallback.tsx`
- Custom hooks: camelCase prefixed with `use` — `useCalendarConnections.ts`, `useMeetings.ts`, `useBackground.tsx`
- shadcn/ui hooks follow kebab-case: `use-toast.ts`, `use-mobile.tsx`
- Utility/schema files: kebab-case — `auth-schemas.ts`, `utils.ts`
- Pages: PascalCase — `Login.tsx`, `Signup.tsx`, `Calendar.tsx`

**Components:**
- PascalCase for component names and their function declarations: `const CalendarHub = () => ...`
- Named exports for shared/utility components (`ProtectedRoute`, `AuthProvider`, `useAuth`)
- Default exports for pages and feature components (`export default Login`)

**Functions:**
- camelCase for all functions and event handlers: `handleSubmit`, `handleConnect`, `handleDisconnect`, `updateSetting`
- Event handlers prefixed with `handle`: `handleConnect`, `handleSync`, `handleCallback`
- Boolean state: `loading`, `syncing`, `disconnecting`

**Variables:**
- camelCase for local variables and state
- SCREAMING_SNAKE_CASE for module-level constants from env: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `const` for data maps/lookups: `providerLabel`, `providerColor`, `calendarProviders`

**Types/Interfaces:**
- PascalCase for interfaces: `AuthContextType`, `Props`, `BackgroundOption`
- Inline `interface Props` for local component props
- Type aliases use `export type` for shared types: `export type BackgroundOption`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is inconsistent between files
- Some files use single quotes (`'`): `AuthContext.tsx`, `Login.tsx`, `Signup.tsx`
- Other files use double quotes (`"`): `CalendarConnections.tsx`, `MeetingsList.tsx`, `CalendarHub.tsx`
- Trailing commas present in most files

**Linting:**
- ESLint flat config at `eslint.config.js`
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `eslint-plugin-react-hooks` (all recommended rules), `eslint-plugin-react-refresh`
- Notable rule override: `@typescript-eslint/no-unused-vars` is set to `"off"`

## Import Organization

**Order (observed pattern):**
1. React core imports (`import { useState } from 'react'`)
2. Third-party libraries (`@tanstack/react-query`, `react-router-dom`, `lucide-react`, `date-fns`)
3. Internal `@/` alias imports — UI components, then contexts/hooks, then integrations, then assets

**Path Aliases:**
- `@/` maps to `src/` — use for all internal imports
- Never use relative `../` paths for cross-directory imports

**Asset imports:**
- Static image assets imported directly: `import googleCalendarLogo from "@/assets/google-calendar-logo.png"`

## Error Handling

**Async operations:**
- Use `try/catch/finally` blocks for all async mutations
- On error: call `toast()` with `variant: "destructive"`, a `title`, and `description: err.message`
- On success: call `toast()` with `title` and `description`
- `finally` block always resets loading/busy state

**Supabase queries:**
- Destructure `{ error }` from every Supabase call
- If error exists, `throw error` immediately (do not inspect further inline)
- In TanStack Query `queryFn`, `throw error` causes the query to enter error state

**Error pattern example (`CalendarConnections.tsx`):**
```typescript
try {
  const { error } = await supabase.from("calendar_connections").update(...);
  if (error) throw error;
  queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
  toast({ title: "Calendar disconnected", ... });
} catch (err: any) {
  toast({ title: "Failed to disconnect", description: err.message, variant: "destructive" });
} finally {
  setDisconnecting(null);
}
```

**Context hook guards:**
- Custom hooks that require a context throw immediately if used outside provider:
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**`catch (error: any)`:**
- All catch blocks type the caught value as `any` to access `.message`
- This is an accepted project-wide pattern due to `no-unused-vars` being off

## Validation

**Library:** Zod (`src/lib/auth-schemas.ts`)

**Pattern:** Schemas defined in `src/lib/` as named exports. Call `schema.safeParse(data)` before any async operation. On failure, surface `validation.error.errors[0].message` via toast. Do not use `react-hook-form`'s built-in Zod resolver for auth pages — manual `safeParse` is used instead.

## Logging

**Framework:** `console` only — no logging library

**When used:**
- `console.warn` for non-fatal failures (e.g., initial sync failing after OAuth)
- `console.error` for unexpected errors in catch blocks
- No debug `console.log` calls in production code

## Comments

**When to comment:**
- Inline comments explain non-obvious sequencing: `// Set up auth state listener FIRST`
- Intent comments for workarounds: `// always return a refresh token`
- Section dividers in JSX using `{/* Section name */}` comments
- Short `// run once on mount` style notes on `useEffect` dependency arrays

**TSDoc/JSDoc:** Not used in this codebase.

## Component Design

**Size:** Components are medium-sized (50–220 lines). Feature components own their own state, handlers, and JSX in a single file. Sub-components are split into subdirectories when they grow (e.g., `src/components/calendar/settings/`).

**Props:** Single `interface Props` declared inline above each component. Props are destructured in the function signature.

**State:** `useState` for local UI state. TanStack Query for server state. No global client state manager (no Redux/Zustand).

**Return values:** Components return a single JSX fragment or element. Guard clauses (`if (isLoading) return ...`) appear before the main return.

## Module Design

**Exports:**
- Pages: `export default ComponentName`
- Shared hooks and context: named exports (`export const useAuth`, `export const AuthProvider`)
- Utility functions: named exports (`export function cn`)
- Schemas: named exports (`export const signUpSchema`)

**Barrel files:** Not used. Import directly from the file that defines the export.

## Tailwind CSS

**Class utilities:**
- `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) — use for conditional class merging
- Custom design-system classes applied directly: `glass-panel`, `glass-light`, `spring-smooth`, `spring-bounce`
- Responsive prefixes are used throughout: `sm:`, `md:`, `lg:`

---

*Convention analysis: 2026-03-22*
