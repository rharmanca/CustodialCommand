# Coding Conventions

**Analysis Date:** 2026-02-09

## Naming Patterns

**Files:**
- React components: PascalCase (`Button.tsx`, `CustodialInspection.tsx`)
- Hooks: camelCase with `use` prefix (`use-toast.ts`, `use-mobile.tsx`)
- Utilities: camelCase (`utils.ts`, `validation.ts`)
- Server files: camelCase (`routes.ts`, `logger.ts`)
- Test files: kebab-case with `.test.cjs` or `.spec.ts` suffix

**Functions:**
- React components: PascalCase (`function App()`, `const Button = () =>`)
- Hooks: camelCase with `use` prefix (`useToast()`, `useMobile()`)
- Utilities/Helpers: camelCase (`calculateScore()`, `sanitizeFilePath()`)
- Event handlers: camelCase with `handle` prefix (`handleSubmit()`, `handleClick()`)
- API route handlers: camelCase (`registerRoutes()`, `validateAdminSession()`)

**Variables:**
- camelCase for all variables (`isLoading`, `currentPage`, `inspectionData`)
- Boolean flags: prefix with `is`, `has`, `should` (`isCompleted`, `hasError`)
- Constants: UPPER_SNAKE_CASE for true constants (`TOAST_LIMIT`, `TOAST_REMOVE_DELAY`)
- TypeScript types: PascalCase (`InsertInspection`, `StandardResponse`)

**Types:**
- Interfaces: PascalCase (`interface ButtonProps`, `interface LogEntry`)
- Type aliases: PascalCase (`type Toast`, `type ActionType`)
- Zod schemas: camelCase with `Schema` suffix (`insertInspectionSchema`, `insertCustodialNoteSchema`)

## Code Style

**Formatting:**
- No ESLint or Prettier config detected
- Indentation: 2 spaces (observed in all files)
- Semicolons: Used consistently
- Quotes: Double quotes for strings
- Trailing commas: Not consistently enforced
- Line endings: Mixed (LF observed in most files)

**TypeScript Strictness:**
- Strict mode enabled (`tsconfig.json`)
- Explicit return types on public functions
- Type annotations on function parameters
- Use `type` for simple unions, `interface` for object shapes

## Import Organization

**Order:**
1. React imports
2. External library imports (alphabetical)
3. Internal path aliases (`@/*`, `@shared/*`)
4. Type imports
5. Relative imports (last resort)

**Path Aliases:**
- `@/*` → `./src/*` (frontend source)
- `@shared/*` → `./shared/*` (shared types/schemas)
- `@assets/*` → `./src/assets/*` (static assets)

**Example:**
```typescript
import React, { useState, useEffect } from "react";
import { useIsMobile } from "./hooks/use-mobile";
import { useCustomNotifications } from "@/hooks/use-custom-notifications";
import SafeLocalStorage from "@/utils/SafeLocalStorage";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";

import type { Express } from "express";
import { insertInspectionSchema } from "@shared/schema";
```

## Error Handling

**Patterns:**
- Try-catch blocks with logger
- Return structured error responses: `{ success: false, message: string }`
- Zod validation errors: Extract and return field-level details
- Express middleware for centralized error handling
- Always log errors with context

**Backend Example:**
```typescript
try {
  const validatedData = insertInspectionSchema.parse(req.body);
  const newInspection = await storage.createInspection(validatedData);
  res.status(201).json({ message: "Success", id: newInspection.id });
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: "Invalid inspection data",
      details: error.errors,
    });
  }
  logger.error("Error creating inspection:", error);
  res.status(500).json({ message: "Internal server error" });
}
```

**Frontend Pattern:**
```typescript
try {
  const response = await fetch('/api/inspections');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
} catch (error) {
  console.error('Fetch error:', error);
  showError('Failed to load inspections');
}
```

## Logging

**Framework:** Custom logger (`server/logger.ts`)

**Patterns:**
- Use logger instance instead of console in backend
- Include request IDs for tracing
- Structured logging with context objects
- Log levels: `info`, `warn`, `error`, `debug`

**Example:**
```typescript
import { logger } from "./logger";

logger.info("Creating inspection", { inspectionId, userId });
logger.error("Database connection failed", { error, connectionString });
logger.debug("Processing request", { requestId, payload });
```

## Comments

**When to Comment:**
- Accessibility status comments at top of files (`// ACCESSIBILITY STATUS: ✅ COMPLETE`)
- Security notes (`// SECURITY: Directory traversal protection`)
- Complex business logic
- Workarounds or temporary fixes

**JSDoc/TSDoc:**
- Minimal usage observed
- Prefer self-documenting code
- TypeScript types provide most documentation

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract complex logic into helper functions
- Maximum ~50 lines for main functions

**Parameters:**
- Use destructuring for multiple parameters
- Prefer options objects for 3+ parameters
- Default values for optional parameters

**Return Values:**
- Consistent return types
- Use discriminated unions for success/error: `{ success: true, data: T } | { success: false, error: string }`

## Module Design

**Exports:**
- Named exports preferred
- Default exports for page components
- Barrel files for clean imports (`components/ui/index.ts`)

**Example:**
```typescript
// Named exports for utilities
export { useToast, toast } from "./use-toast";
export { Button, buttonVariants } from "./button";

// Default export for pages
export default function CustodialInspectionPage() { }
```

## React Patterns

**Components:**
- Functional components with hooks
- Props interface always defined
- Forward refs for reusable components
- `displayName` for debugging

**Example:**
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

**State Management:**
- React Query for server state (`@tanstack/react-query`)
- useState/useReducer for local state
- Custom hooks for complex state logic

## Database Patterns

**ORM:** Drizzle ORM with Zod validation

**Patterns:**
- Define schemas in `shared/schema.ts`
- Use `createInsertSchema` from drizzle-zod
- Extend schemas with Zod refinements
- Database indexes for query performance

**Example:**
```typescript
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  school: text("school").notNull(),
  // ...
}, (table) => ({
  schoolIdx: index("inspections_school_idx").on(table.school),
}));

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
}).extend({
  school: z.string().min(1, "School is required"),
});
```

## Accessibility Requirements

**Mandatory:**
- Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ARIA labels on interactive elements
- `role` attributes for custom components
- `aria-live` regions for dynamic content
- Skip links for keyboard navigation
- Focus management for modals

**Example:**
```tsx
<main id="main-content" role="main" aria-label="Main content" tabIndex={-1}>
  <div role="status" aria-live="polite" aria-busy="true">
    Loading...
  </div>
  <button aria-label="Submit inspection" aria-describedby="submit-help">
    Submit
  </button>
</main>
```

---

*Convention analysis: 2026-02-09*
