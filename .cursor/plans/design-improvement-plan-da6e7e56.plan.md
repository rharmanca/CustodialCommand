<!-- da6e7e56-3783-4e73-abc5-bf2522350c8a 48b1b700-76f2-4199-b7df-37017127e99b -->
# PDF Export Wizard Implementation Plan

## Overview

Create a multi-step wizard that makes PDF exporting intuitive and flexible, allowing users to choose from multiple report types and easily control what data is included.

## Step 1: Create PDF Export Wizard Component

**File: `src/components/reports/PDFExportWizard.tsx`** (new file)

Create a multi-step wizard with 4 steps using Dialog and internal state management:

1. **Choose Report Type** - Select from Executive Summary, School Performance, Category Analysis, Issues Report, Custom Report
2. **Select Data** - Choose data types (inspections, custodial notes, images) with visual counts
3. **Apply Filters** - Date range, schools, severity levels, categories, rating threshold
4. **Review & Export** - Preview selections and export

Key features:

- Use Dialog with max-w-4xl for larger content area
- Custom step navigation (not Tabs - better UX for wizard flow)
- Visual progress indicator with step numbers and checkmarks
- "Back" and "Next" buttons for navigation, "Cancel" always visible
- Preview card showing what will be exported (record counts, date range, file size estimate)
- Simple checkbox/radio controls throughout
- Keyboard accessible (Escape to cancel, Enter to proceed)
- Loading state during PDF generation with Progress component
```typescript
interface WizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
}

export interface ExportConfig {
  reportType: 'executive' | 'school-performance' | 'category-analysis' | 'issues' | 'custom';
  dataTypes: {
    inspections: boolean;
    custodialNotes: boolean;
    images: boolean;
  };
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    schools: string[];
    severityLevels: string[];
    categories: string[];
    ratingThreshold: number;
  };
  includeCharts: boolean;
  includeDetails: boolean;
}

interface PDFExportWizardProps {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  availableSchools: string[];
  availableCategories: Array<{ key: string; label: string }>;
  trigger?: React.ReactNode;
  onExportComplete?: () => void;
}
```


## Step 2: Enhance Report Generator Functions

**File: `src/utils/printReportGenerator.ts`**

Add new report generation functions:

```typescript
// Add new functions
export function generateExecutiveSummaryPDF(data: ReportData, config: ExportConfig): Blob
export function generateSchoolPerformancePDF(data: ReportData, config: ExportConfig): Blob
export function generateCategoryAnalysisPDF(data: ReportData, config: ExportConfig): Blob
export function generateCustomReportPDF(data: ReportData, config: ExportConfig): Blob
```

Update existing `generateIssuesReport` to accept `ExportConfig` parameter for better filtering.

## Step 3: Create Report Type Selection Component

**File: `src/components/reports/ReportTypeSelector.tsx`** (new file)

Create a visual card-based selector for report types:

- Large clickable cards with icons and descriptions
- "Executive Summary" - High-level overview with KPIs
- "School Performance" - Compare schools and trends
- "Category Analysis" - Deep dive into specific categories
- "Issues Report" - List of problems (existing functionality)
- "Custom Report" - Build your own with flexible sections

Each card shows:

- Icon representing the report type
- Title and description
- Example preview badge ("Best for monthly reports", etc.)

## Step 4: Create Data Selection Component

**File: `src/components/reports/DataSelector.tsx`** (new file)

Simple checkboxes with visual feedback:

- "Include Inspections" (shows count: e.g., "142 inspections")
- "Include Custodial Notes" (shows count: e.g., "23 notes")
- "Include Images" (shows count and size: e.g., "45 images, ~2.3 MB")
- "Include Charts & Visualizations" (checkbox)
- "Include Individual Details" (checkbox - shows full inspection details vs summary only)

Add helpful text under each option explaining what will be included.

## Step 5: Create Filter Selection Component

**File: `src/components/reports/ExportFilters.tsx`** (new file)

Reuse existing filter components but in a simplified, wizard-friendly layout:

- Date range picker (with presets: Last 7 days, Last 30 days, This month, All time)
- School multi-select dropdown
- Severity level chips (Critical, Needs Attention, All)
- Category multi-select
- Rating threshold slider (1-5 stars)

Show active filter count badge and "Clear all filters" button.

## Step 6: Create Export Preview Component

**File: `src/components/reports/ExportPreview.tsx`** (new file)

Summary card showing:

- Report type selected
- Data included (with counts)
- Active filters summary
- Estimated file size
- Estimated page count
- Export button (primary action)

Visual preview with icons and color-coded badges.

## Step 7: Integrate Wizard into Inspection Data Page

**File: `src/pages/inspection-data.tsx`**

Replace the simple "Export Issues (PDF)" button with:

```typescript
<PDFExportWizard
  inspections={filteredInspections}
  custodialNotes={custodialNotes}
  availableSchools={schools}
  availableCategories={categories}
  trigger={
    <Button variant="outline" className="flex items-center gap-2">
      <FileText className="w-4 h-4" />
      Export PDF Report
    </Button>
  }
/>
```

Keep the existing Excel export dialog separate and functional.

## Step 8: Add Chart Export Utilities

**File: `src/utils/chartToPDF.ts`** (new file)

Create utilities to convert chart components to PDF:

- Use `html2canvas` to capture chart visualizations
- Convert canvas to PDF images with proper sizing
- Handle multiple charts per page with smart pagination
```typescript
export async function addChartToPDF(
  doc: jsPDF,
  chartElement: HTMLElement,
  yPosition: number,
  options?: ChartExportOptions
): Promise<number>
```


## Step 9: Enhanced Error Handling & User Feedback

Add throughout wizard:

- Toast notifications for successful exports
- Error handling with helpful messages
- Loading states during PDF generation (can take time with images/charts)
- Progress indicator for multi-page reports
- Success dialog with "Open PDF" and "Export Another" options

## Step 10: Add Export Utilities & Helpers

**File: `src/utils/exportHelpers.ts`** (new file)

Helper functions:

- `estimateFileSize(config: ExportConfig): string` - Calculate size estimate
- `estimatePageCount(config: ExportConfig): number` - Calculate pages
- `validateExportConfig(config: ExportConfig): boolean` - Ensure valid selections
- `filterDataByConfig(data: ReportData, config: ExportConfig): FilteredData` - Apply filters

## Implementation Notes

- Keep the wizard simple with clear visual hierarchy
- Use existing UI components (Dialog, Card, Button, Checkbox, Select) for consistency
- Maintain the brown/cream theme throughout
- All steps should be accessible via keyboard navigation
- Add helpful tooltips for complex options
- Ensure mobile responsiveness (wizard works on tablets)
- Add "Save preferences" option for power users who export regularly

## Files to Create

1. `src/components/reports/PDFExportWizard.tsx`
2. `src/components/reports/ReportTypeSelector.tsx`
3. `src/components/reports/DataSelector.tsx`
4. `src/components/reports/ExportFilters.tsx`
5. `src/components/reports/ExportPreview.tsx`
6. `src/utils/chartToPDF.ts`
7. `src/utils/exportHelpers.ts`

## Files to Modify

1. `src/pages/inspection-data.tsx` - Integrate wizard
2. `src/utils/printReportGenerator.ts` - Add new report types
3. `src/components/reports/PDFReportBuilder.tsx` - Enhance with config support

## Dependencies to Add

- `html2canvas` - For chart capture (if not already installed)
- No other new dependencies needed

### To-dos

- [ ] Create PDFExportWizard component with 4-step navigation
- [ ] Create ReportTypeSelector with card-based UI for report types
- [ ] Create DataSelector with checkboxes and visual counts
- [ ] Create ExportFilters component with simplified filter controls
- [ ] Create ExportPreview summary card with estimates
- [ ] Add Executive Summary, School Performance, Category Analysis, and Custom report generators
- [ ] Create chartToPDF utilities for exporting visualizations
- [ ] Create exportHelpers for size estimates and validation
- [ ] Integrate PDFExportWizard into inspection-data page
- [ ] Add comprehensive error handling and user feedback throughout wizard
- [ ] Test all report types with various filter combinations