# Agent Development Guide

## Quick Commands

```bash
npm run dev              # Start dev server (frontend + backend on :5000)
npm run check            # TypeScript type checking
npm run build            # Production build (runs check first)
npm test:comprehensive   # Run all tests
node tests/e2e-user-journey.test.cjs  # Run single test file
npx playwright test ui-tests/example.spec.ts  # Run single Playwright test
```

## Code Style

**Imports**: Use path aliases (`@/*` for src, `@shared/*` for shared), group by external → internal → types
**Types**: Strict TypeScript, use Zod schemas from `shared/schema.ts`, prefer interfaces for objects
**Naming**: camelCase (variables/functions), PascalCase (components/classes), UPPER_SNAKE_CASE (constants)
**Error Handling**: Try-catch with logger, return structured errors `{ success: false, message: string }`
**Async**: Always use async/await, never raw promises in route handlers
**Database**: Use Drizzle ORM with parameterized queries, validate with Zod before DB operations
**Security**: Sanitize all inputs, use `insertXSchema.parse()` for validation, never trust client data
**Components**: Functional React with hooks, use Radix UI primitives, Tailwind for styling
**API Routes**: Express handlers in `server/routes.ts`, validate → process → respond pattern
**Testing**: Playwright for UI (`.spec.ts`), Node scripts for API (`.test.cjs`), always test error cases

## Project Structure

- `src/` - React frontend (components, pages, hooks, utils)
- `server/` - Express backend (routes, security, storage, monitoring)
- `shared/` - Shared types and Zod schemas
- `tests/` - Test suites (e2e, performance, security, mobile)
- `public/` - Static assets and service worker

See `CLAUDE.md` for detailed architecture and `README.md` for setup instructions.
