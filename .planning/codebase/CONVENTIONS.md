# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (e.g., `Button.tsx`, `MobileBottomNav.tsx`)
- Utilities/Hooks: `camelCase.ts` or `kebab-case.ts` (e.g., `use-toast.ts`, `api.ts`)
- Server files: `camelCase.ts` (e.g., `routes.ts`, `security.ts`)
- Constants/Config: `UPPER_SNAKE_CASE` or `camelCase.ts` (e.g., `constants.ts`)

**Functions:**
- `camelCase` for all functions (e.g., `apiRequest`, `useToast`, `calculateBuildingScore`)
- Async functions prefixed with verb (e.g., `fetchData`, `processImage`)
- Private functions may use underscore prefix (e.g., `_validateInput`)

**Variables:**
- `camelCase` for all variables
- React hooks follow `useXxx` pattern (e.g., `useIsMobile`, `useToast`)
- Constants at module level use `UPPER_SNAKE_CASE` (e.g., `TOAST_LIMIT`, `TOAST_REMOVE_DELAY`)

**Types/Interfaces:**
- `PascalCase` for interfaces and types (e.g., `ApiResponse`, `ButtonProps`)
- Schema types from Drizzle use `InsertXxx` and `Xxx` patterns (e.g., `InsertInspection`, `Inspection`)
- Props interfaces use `ComponentNameProps` pattern (e.g., `ToastProps`)

## Code Style

**Formatting:**
- Uses TypeScript strict mode (`tsconfig.json`)
- Double quotes for strings (observed in source files)
- Semicolons at end of statements
- 2-space indentation

**Linting:**
- No ESLint/Prettier config files detected
- Relies on TypeScript strict mode for type checking
- AGENTS.md specifies: Use path aliases (`@/*` for src, `@shared/*` for shared)

**Tailwind/Styling:**
- Uses Tailwind CSS with `cn()` utility from `@/lib/utils.ts`
- Combines `clsx` and `tailwind-merge` for conditional classes
- CSS variables for theming (`--primary`, `--background`, etc.)

## Import Organization

**Order (from observed patterns):**
1. React imports (`import * as React from "react"`)
2. Third-party libraries (`@radix-ui/react-*`, `zod`, `drizzle-orm`)
3. Path aliased internal imports (`@/components/*`, `@/hooks/*`, `@/utils/*`)
4. Relative imports for same-directory files
5. Type-only imports when needed

**Path Aliases:**
- `@/*` → `./src/*`
- `@assets/*` → `./src/assets/*`
- `@shared/*` → `./shared/*`

**Example:**
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { ToastActionElement } from "@/components/ui/toast"
```

## Error Handling

**Frontend (React/TypeScript):**
- Custom error classes (e.g., `ApiError extends Error`)
- Structured error responses with `{ success: false, message: string }`
- Try-catch with logger integration
- Error boundaries for React components (`ErrorBoundary` in `App.tsx`)

**Backend (Express):**
- Standard response interface: `StandardResponse<T>` with `success`, `data`, `error`, `details`, `meta`
- Logger-based error tracking with context
- HTTP status codes: 400 (validation), 401 (auth), 413 (payload too large), etc.

**Example Pattern:**
```typescript
// Backend route handler
app.post("/api/inspections", async (req, res) => {
  try {
    // ... logic
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error("Failed to create inspection", { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create inspection",
      details: error.message 
    });
  }
});
```

## Logging

**Framework:** Custom logger (`server/logger.ts`)

**Patterns:**
- Structured JSON logging in production
- Human-readable format in development
- Request correlation via `AsyncLocalStorage`
- Context includes: `requestId`, `correlationId`, `userId`, `username`, `ip`

**Levels:**
- `logger.info(message, context?)` - General information
- `logger.warn(message, context?)` - Warnings
- `logger.error(message, context?)` - Errors
- `logger.debug(message, context?)` - Development-only debugging

**Example:**
```typescript
logger.info("[POST] Building inspection submission started", {
  body: req.body,
  files: req.files ? req.files.length : 0,
});
```

## Comments

**When to Comment:**
- Security-related code (e.g., `// Security: Directory traversal protection`)
- Complex logic explanations
- TODO/FIXME markers for known issues
- JSDoc for exported functions (minimal usage observed)

**Patterns Observed:**
```typescript
// Standard API response interface for consistency across all endpoints
// TODO: [TEST-FIX] Add error handling for EPIPE and TLS socket errors
// Issue: Test suite crashes with "Error: write EPIPE"
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Route handlers in `server/routes.ts` are typically 50-150 lines
- Component files are 50-200 lines

**Parameters:**
- Destructuring for options objects
- Optional parameters with defaults
- Type annotations required

**Return Values:**
- Explicit return types on exported functions
- Async functions return `Promise<T>`
- API functions return structured response objects

**Example:**
```typescript
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // implementation
}
```

## Module Design

**Exports:**
- Named exports preferred (`export { Button, buttonVariants }`)
- Default exports for page components (lazy loading compatibility)
- Barrel files for grouping exports (`src/schemas/index.ts`)

**Barrel Files:**
- `src/schemas/index.ts` exports all schemas
- Re-export pattern: `export * from "./file"`

**Example:**
```typescript
// src/schemas/index.ts
export * from "./inspectionSchema";
export * from "./custodialNotesSchema";
```

## Validation

**Framework:** Zod (via `drizzle-zod`)

**Patterns:**
- Schema definitions in `shared/schema.ts`
- Custom preprocessors for type coercion (e.g., `coerceNullableNumber`)
- Schema extension via `.extend()` and `.omit()`
- Validation before DB operations

**Example:**
```typescript
export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
}).extend({
  school: z.string().min(1, "School is required"),
  inspectionType: z.string().optional().default('whole_building'),
  floors: coerceNullableNumber.optional(),
});
```

## Security Conventions

**Input Sanitization:**
- All inputs validated with Zod schemas before processing
- Path validation utilities (`sanitizeFilePath`, `isValidFilename`)
- File upload restrictions (image only, 5MB limit)

**Authentication:**
- Session-based authentication with tokens
- CSRF protection with token validation
- Rate limiting on sensitive endpoints

**Example:**
```typescript
// Validate before DB operations
const validatedData = insertInspectionSchema.parse(req.body);
// Security: Directory traversal protection via pathValidation.ts
```

## Component Patterns

**Shadcn/UI Style:**
- Forward refs: `React.forwardRef<HTMLButtonElement, ButtonProps>`
- Variant props via `class-variance-authority` (cva)
- `cn()` utility for class merging
- `asChild` prop for composition

**Example:**
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

## Database Conventions

**ORM:** Drizzle ORM

**Patterns:**
- Table definitions with explicit column names
- Index definitions for frequently queried columns
- Relations via foreign key references
- Schema co-location in `shared/schema.ts`

**Example:**
```typescript
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  school: text("school").notNull(),
  // ...
}, (table) => ({
  schoolIdx: index("inspections_school_idx").on(table.school),
  dateIdx: index("inspections_date_idx").on(table.date),
}));
```

---

*Convention analysis: 2026-02-16*
