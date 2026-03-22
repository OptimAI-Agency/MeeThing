# Testing

## Status: No Tests Configured

**There is currently no test framework in this project.**

- `package.json` has no `jest`, `vitest`, `@testing-library/*`, `cypress`, or `playwright` dependencies
- Zero test files exist (`*.test.*`, `*.spec.*`) across the entire codebase
- The only automated quality check is `npm run lint` (ESLint)

## Current Quality Gates

| Tool | Command | Coverage |
|------|---------|----------|
| ESLint | `npm run lint` | Static analysis only |

## Recommended Setup (Not Yet Implemented)

### Framework Stack
- **Unit/Integration:** Vitest + `@testing-library/react`
- **Supabase Mocking:** `msw` (Mock Service Worker) for edge function calls
- **E2E (future):** Playwright

### Priority Files to Test First

1. **`src/lib/auth-schemas.ts`** — Pure Zod schemas, zero external dependencies; easiest wins
2. **`src/lib/utils.ts`** — `cn()` utility, trivial to test
3. **`src/hooks/useCalendarConnections.ts`** — TanStack Query hook; test with mocked Supabase
4. **`src/hooks/useMeetings.ts`** — TanStack Query hook; test filtering logic
5. **`src/components/auth/ProtectedRoute.tsx`** — Auth redirect logic

### Mocking Pattern for Supabase

```ts
// Supabase client mock (vitest)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    // ...
  }
}))
```

### Mocking Pattern for AuthContext

```ts
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, session: mockSession, loading: false })
}))
```

## What to Test

### High Value
- Zod schema validation edge cases (password rules, email format)
- `useMeetings` date range filtering (next 7 days)
- `ProtectedRoute` redirect when unauthenticated

### Medium Value
- `CalendarConnections` OAuth URL construction
- `AuthCallback` success/error paths
- `MeetingsList` rendering with empty/populated data

### Lower Value (integration-heavy)
- Edge function token exchange (test in Supabase local dev)
- Full auth flow (E2E with Playwright)

## Notes

- No CI/CD pipeline configured — tests would need to be added to GitHub Actions manually
- Supabase edge functions are Deno — test separately with `deno test` if needed
