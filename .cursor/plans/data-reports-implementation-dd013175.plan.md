<!-- dd013175-f127-4dbe-a1db-a9dd1daaa252 3a4412ed-e41e-41b5-9ba8-81ac97857b5c -->
# Codebase Audit Fixes for Reporting/Visualization Implementation

## Scope

Fix TypeScript and runtime issues introduced by the new reporting, charts, and filtering features; clean up API usage to match library typings; remove unused state; validate via build.

## Confirmed Issues (all verified)

1. **CategoryRadarChart import error** - `PolarAngleAxisTick` doesn't exist in recharts
2. **Icon rendering bug** - Lucide icons receive invalid SVG props (`x`, `y`, `fill`) 
3. **ReferenceLine label position** - `"topRight"` is not a valid Recharts position
4. **compressImageData type mismatch** - Returns Promise but typed as string
5. **Checkbox boolean coercion** - Radix emits `boolean | "indeterminate"` 
6. **Unused legacy state** - 5 filter state variables never used (confirmed with grep)

## Implementation Steps

### 1. Fix CategoryRadarChart import and icon rendering

File: `src/components/charts/CategoryRadarChart.tsx`

**Remove invalid import:**

```tsx
// Line 2 - remove PolarAngleAxisTick from import
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
```

**Fix icon rendering in CustomTick (lines 50-58):**

Since Lucide icons can't be rendered directly in SVG `<g>` tags with `x`/`y` props, replace with SVG circle indicator:

```tsx
{showProblemHighlighting && performance?.level !== 'acceptable' && (
  <circle 
    cx={-20} 
    cy={0} 
    r={4} 
    fill={performance.color}
  />
)}
```

### 2. Fix SchoolComparisonChart label positions

File: `src/components/charts/SchoolComparisonChart.tsx`

**Lines 92 and 99 - change position from "topRight" to "top":**

```tsx
// Line 92
label={{ value: "Acceptable (3.0)", position: "top" }}

// Line 99  
label={{ value: "Critical (2.0)", position: "top" }}
```

### 3. Fix compressImageData type signature

File: `src/utils/reportHelpers.ts`

**Line 354 - add async and correct return type:**

```tsx
export async function compressImageData(imageData: string, quality: number = 0.8): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise<string>((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = imageData;
  });
}
```

### 4. Fix AdvancedFilters checkbox coercion

File: `src/components/filters/AdvancedFilters.tsx`

**Line 344 - coerce to boolean:**

```tsx
onCheckedChange={(checked) => updateFilter('showProblemsOnly', !!checked)}
```

**Line 352 - coerce to boolean:**

```tsx
onCheckedChange={(checked) => updateFilter('hasCustodialNotes', !!checked)}
```

### 5. Remove unused legacy filter state

File: `src/pages/inspection-data.tsx`

**Lines 47-51 - delete unused state declarations:**

Remove these 5 lines completely (grep confirmed no setters are used anywhere):

```tsx
const [search, setSearch] = useState('');
const [dateFrom, setDateFrom] = useState<string>('');
const [dateTo, setDateTo] = useState<string>('');
const [schoolFilter, setSchoolFilter] = useState<string>('all');
const [sortBy, setSortBy] = useState<string>('default');
```

## Validation

1. **Type check:** `npm run check` (confirmed script exists)
2. **Build:** `npm run build`
3. **Smoke test in browser:**

   - Radar chart renders without console errors
   - Threshold lines show labels correctly
   - Filters toggle work (checkboxes)
   - Excel export still functions

## Rollback

All changes are isolated to 4 files and easily revertible via git.

### To-dos

- [ ] Remove PolarAngleAxisTick import and replace icon with SVG circle in CategoryRadarChart.tsx
- [ ] Change position from topRight to top in SchoolComparisonChart.tsx
- [ ] Add async and Promise<string> return type to compressImageData
- [ ] Add !! coercion for both checkboxes in AdvancedFilters.tsx
- [ ] Delete 5 unused filter state declarations in inspection-data.tsx
- [ ] Run npm run check and npm run build to verify all fixes