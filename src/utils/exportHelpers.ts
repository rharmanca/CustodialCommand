import type { Inspection, CustodialNote } from '../../shared/schema';
import type { ExportConfig } from '../components/reports/PDFExportWizard';

export interface ReportData {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
}

export interface FilteredData {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  totalRecords: number;
  dateRange: { from: Date | null; to: Date | null };
  schools: string[];
  categories: string[];
}

/**
 * Estimate file size based on export configuration
 */
export function estimateFileSize(config: ExportConfig, data: ReportData): string {
  let baseSize = 0;
  
  // Base size for PDF structure
  baseSize += 50; // KB
  
  // Add size for each data type
  if (config.dataTypes.inspections) {
    const inspectionCount = data.inspections.length;
    baseSize += inspectionCount * 0.8; // ~0.8 KB per inspection
  }
  
  if (config.dataTypes.custodialNotes) {
    const noteCount = data.custodialNotes.length;
    baseSize += noteCount * 0.3; // ~0.3 KB per note
  }
  
  if (config.dataTypes.images) {
    const imageCount = data.inspections.reduce((count, inspection) => 
      count + (inspection.images?.length || 0), 0);
    baseSize += imageCount * 200; // ~200 KB per image
  }
  
  if (config.includeCharts) {
    baseSize += 500; // ~500 KB for charts
  }
  
  if (config.includeDetails) {
    baseSize *= 1.5; // 50% more for detailed reports
  }
  
  // Convert to appropriate unit
  if (baseSize < 1024) {
    return `${Math.round(baseSize)} KB`;
  } else {
    return `${(baseSize / 1024).toFixed(1)} MB`;
  }
}

/**
 * Estimate page count based on export configuration
 */
export function estimatePageCount(config: ExportConfig, data: ReportData): number {
  let pages = 1; // Title page
  
  if (config.dataTypes.inspections) {
    const inspectionCount = data.inspections.length;
    const inspectionsPerPage = config.includeDetails ? 2 : 8;
    pages += Math.ceil(inspectionCount / inspectionsPerPage);
  }
  
  if (config.dataTypes.custodialNotes) {
    const noteCount = data.custodialNotes.length;
    const notesPerPage = 10;
    pages += Math.ceil(noteCount / notesPerPage);
  }
  
  if (config.includeCharts) {
    pages += 2; // Charts typically take 2 pages
  }
  
  return Math.max(pages, 1);
}

/**
 * Validate export configuration
 */
export function validateExportConfig(config: ExportConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Must select at least one data type
  if (!config.dataTypes.inspections && !config.dataTypes.custodialNotes) {
    errors.push('Please select at least one data type to export');
  }
  
  // Must select a report type
  if (!config.reportType) {
    errors.push('Please select a report type');
  }
  
  // Validate date range
  if (config.filters.dateRange.from && config.filters.dateRange.to) {
    if (config.filters.dateRange.from > config.filters.dateRange.to) {
      errors.push('Start date must be before end date');
    }
  }
  
  // Validate rating threshold
  if (config.filters.ratingThreshold < 1 || config.filters.ratingThreshold > 5) {
    errors.push('Rating threshold must be between 1 and 5');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Filter data based on export configuration
 */
export function filterDataByConfig(data: ReportData, config: ExportConfig): FilteredData {
  let filteredInspections = [...data.inspections];
  let filteredNotes = [...data.custodialNotes];
  
  // Apply date range filter
  if (config.filters.dateRange.from) {
    const fromTime = config.filters.dateRange.from.getTime();
    filteredInspections = filteredInspections.filter(inspection => 
      new Date(inspection.date).getTime() >= fromTime
    );
    filteredNotes = filteredNotes.filter(note => 
      new Date(note.date).getTime() >= fromTime
    );
  }
  
  if (config.filters.dateRange.to) {
    const toTime = config.filters.dateRange.to.getTime();
    filteredInspections = filteredInspections.filter(inspection => 
      new Date(inspection.date).getTime() <= toTime
    );
    filteredNotes = filteredNotes.filter(note => 
      new Date(note.date).getTime() <= toTime
    );
  }
  
  // Apply school filter
  if (config.filters.schools.length > 0) {
    filteredInspections = filteredInspections.filter(inspection => 
      config.filters.schools.includes(inspection.school)
    );
    filteredNotes = filteredNotes.filter(note => 
      config.filters.schools.includes(note.school)
    );
  }
  
  // Apply category filter (for inspections)
  if (config.filters.categories.length > 0) {
    filteredInspections = filteredInspections.filter(inspection => {
      // Check if any of the selected categories have ratings
      return config.filters.categories.some(category => {
        const rating = inspection[category as keyof Inspection] as number | null | undefined;
        return typeof rating === 'number';
      });
    });
  }
  
  // Apply rating threshold filter
  if (config.filters.ratingThreshold > 0) {
    filteredInspections = filteredInspections.filter(inspection => {
      const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms', 
                         'customerSatisfaction', 'trash', 'projectCleaning', 'activitySupport', 
                         'safetyCompliance', 'equipment', 'monitoring'];
      const ratings = categories.map(cat => inspection[cat as keyof Inspection] as number)
                               .filter(r => typeof r === 'number');
      if (ratings.length === 0) return false;
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      return avgRating <= config.filters.ratingThreshold;
    });
  }
  
  // Apply severity level filter
  if (config.filters.severityLevels.length > 0) {
    filteredInspections = filteredInspections.filter(inspection => {
      const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
      const ratings = categories.map(cat => inspection[cat as keyof Inspection] as number)
                               .filter(r => typeof r === 'number');
      if (ratings.length === 0) return false;
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      
      if (config.filters.severityLevels.includes('critical') && avgRating <= 2) return true;
      if (config.filters.severityLevels.includes('needs-attention') && avgRating <= 3) return true;
      if (config.filters.severityLevels.includes('acceptable') && avgRating > 3) return true;
      
      return false;
    });
  }
  
  return {
    inspections: filteredInspections,
    custodialNotes: filteredNotes,
    totalRecords: filteredInspections.length + filteredNotes.length,
    dateRange: config.filters.dateRange,
    schools: config.filters.schools,
    categories: config.filters.categories
  };
}

/**
 * Get active filter labels for display
 */
export function getActiveFilterLabels(config: ExportConfig): string[] {
  const labels: string[] = [];
  
  if (config.filters.dateRange.from || config.filters.dateRange.to) {
    const from = config.filters.dateRange.from?.toLocaleDateString() || 'Start';
    const to = config.filters.dateRange.to?.toLocaleDateString() || 'End';
    labels.push(`Date: ${from} - ${to}`);
  }
  
  if (config.filters.schools.length > 0) {
    labels.push(`Schools: ${config.filters.schools.length} selected`);
  }
  
  if (config.filters.categories.length > 0) {
    labels.push(`Categories: ${config.filters.categories.length} selected`);
  }
  
  if (config.filters.severityLevels.length > 0) {
    labels.push(`Severity: ${config.filters.severityLevels.join(', ')}`);
  }
  
  if (config.filters.ratingThreshold > 0) {
    labels.push(`Rating ≤ ${config.filters.ratingThreshold} stars`);
  }
  
  return labels;
}

/**
 * Calculate data counts for display
 */
export function calculateDataCounts(data: ReportData): {
  inspections: number;
  custodialNotes: number;
  images: number;
  totalSize: string;
} {
  const imageCount = data.inspections.reduce((count, inspection) => 
    count + (inspection.images?.length || 0), 0);
  
  // Estimate image size (assuming 200KB per image)
  const imageSizeKB = imageCount * 200;
  const totalSize = imageSizeKB < 1024 
    ? `${imageSizeKB} KB` 
    : `${(imageSizeKB / 1024).toFixed(1)} MB`;
  
  return {
    inspections: data.inspections.length,
    custodialNotes: data.custodialNotes.length,
    images: imageCount,
    totalSize
  };
}
