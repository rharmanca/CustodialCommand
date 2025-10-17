import * as XLSX from 'xlsx';
import type { Inspection, CustodialNote } from '../../shared/schema';
import { analyzeProblemAreas, identifyUrgentCustodialNotes, calculateAverageRating, getSeverityLevel } from './problemAnalysis';

export interface ExportOptions {
  includeSummary: boolean;
  includeAllInspections: boolean;
  includeProblemAreas: boolean;
  includeCustodialNotes: boolean;
  dateRange?: { from: Date | null; to: Date | null };
  schools?: string[];
  problemsOnly?: boolean;
}

export interface ExportData {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  options: ExportOptions;
}

/**
 * Export inspections and custodial notes to Excel with multiple sheets
 */
export function exportToExcel(data: ExportData): void {
  const workbook = XLSX.utils.book_new();
  
  // Add Summary sheet if requested
  if (data.options.includeSummary) {
    const summarySheet = createSummarySheet(data);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }
  
  // Add All Inspections sheet if requested
  if (data.options.includeAllInspections) {
    const inspectionsSheet = createInspectionsSheet(data.inspections);
    XLSX.utils.book_append_sheet(workbook, inspectionsSheet, 'All Inspections');
  }
  
  // Add Problem Areas sheet if requested
  if (data.options.includeProblemAreas) {
    const problemAreasSheet = createProblemAreasSheet(data.inspections);
    XLSX.utils.book_append_sheet(workbook, problemAreasSheet, 'Problem Areas');
  }
  
  // Add Custodial Notes sheet if requested
  if (data.options.includeCustodialNotes) {
    const notesSheet = createCustodialNotesSheet(data.custodialNotes);
    XLSX.utils.book_append_sheet(workbook, notesSheet, 'Custodial Notes');
  }
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `Custodial_Command_Report_${timestamp}.xlsx`;
  
  // Save the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Create Summary sheet with key metrics and statistics
 */
function createSummarySheet(data: ExportData): XLSX.WorkSheet {
  const problemAnalysis = analyzeProblemAreas(data.inspections);
  const urgentNotes = identifyUrgentCustodialNotes(data.custodialNotes);
  
  const summaryData = [
    ['CUSTODIAL COMMAND - EXECUTIVE SUMMARY'],
    ['Generated:', new Date().toLocaleString()],
    [''],
    ['KEY METRICS'],
    ['Total Inspections:', data.inspections.length],
    ['Critical Issues (Rating < 2.0):', problemAnalysis.critical.length],
    ['Needs Attention (Rating 2.0-3.0):', problemAnalysis.needsAttention.length],
    ['Urgent Custodial Notes:', urgentNotes.length],
    ['Affected Schools:', problemAnalysis.summary.affectedSchools.length],
    [''],
    ['SCHOOL PERFORMANCE'],
    ['Most Problematic School:', problemAnalysis.summary.mostProblematicSchool || 'N/A'],
    ['Affected Schools:', problemAnalysis.summary.affectedSchools.join(', ')],
    [''],
    ['SEVERITY BREAKDOWN'],
    ['Critical Issues:', problemAnalysis.critical.length],
    ['Needs Attention:', problemAnalysis.needsAttention.length],
    ['Acceptable Performance:', data.inspections.length - problemAnalysis.summary.totalProblems],
    [''],
    ['AVERAGE RATINGS BY SCHOOL']
  ];
  
  // Add school performance data
  const schoolPerformance = data.inspections.reduce((acc, inspection) => {
    const avgRating = calculateAverageRating(inspection);
    if (avgRating === null) return acc;
    
    if (!acc[inspection.school]) {
      acc[inspection.school] = { total: 0, count: 0 };
    }
    acc[inspection.school].total += avgRating;
    acc[inspection.school].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);
  
  Object.entries(schoolPerformance).forEach(([school, stats]) => {
    const avgRating = (stats.total / stats.count).toFixed(2);
    const severity = getSeverityLevel(stats.total / stats.count);
    summaryData.push([school, avgRating, severity.toUpperCase()]);
  });
  
  return XLSX.utils.aoa_to_sheet(summaryData);
}

/**
 * Create All Inspections sheet with detailed inspection data
 */
function createInspectionsSheet(inspections: Inspection[]): XLSX.WorkSheet {
  const headers = [
    'ID', 'Date', 'School', 'Type', 'Room Number', 'Building Name', 'Location',
    'Inspector', 'Average Rating', 'Severity',
    'Floors', 'Vertical/Horizontal Surfaces', 'Ceiling', 'Restrooms',
    'Customer Satisfaction', 'Trash', 'Project Cleaning', 'Activity Support',
    'Safety & Compliance', 'Equipment', 'Monitoring', 'Notes'
  ];
  
  const data = inspections.map(inspection => {
    const avgRating = calculateAverageRating(inspection);
    const severity = avgRating ? getSeverityLevel(avgRating) : 'N/A';
    
    return [
      inspection.id,
      new Date(inspection.date).toLocaleDateString(),
      inspection.school,
      inspection.inspectionType === 'single_room' ? 'Single Room' : 'Whole Building',
      inspection.roomNumber || '',
      inspection.buildingName || '',
      inspection.locationDescription || '',
      inspection.inspectorName || '',
      avgRating?.toFixed(2) || 'N/A',
      severity.toUpperCase(),
      inspection.floors || '',
      inspection.verticalHorizontalSurfaces || '',
      inspection.ceiling || '',
      inspection.restrooms || '',
      inspection.customerSatisfaction || '',
      inspection.trash || '',
      inspection.projectCleaning || '',
      inspection.activitySupport || '',
      inspection.safetyCompliance || '',
      inspection.equipment || '',
      inspection.monitoring || '',
      inspection.notes || ''
    ];
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  const columnWidths = [
    { wch: 8 },   // ID
    { wch: 12 },  // Date
    { wch: 20 },  // School
    { wch: 15 },  // Type
    { wch: 12 },  // Room Number
    { wch: 20 },  // Building Name
    { wch: 25 },  // Location
    { wch: 15 },  // Inspector
    { wch: 12 },  // Average Rating
    { wch: 12 },  // Severity
    { wch: 8 },   // Floors
    { wch: 25 },  // Vertical/Horizontal
    { wch: 10 },  // Ceiling
    { wch: 12 },  // Restrooms
    { wch: 20 },  // Customer Satisfaction
    { wch: 8 },   // Trash
    { wch: 15 },  // Project Cleaning
    { wch: 15 },  // Activity Support
    { wch: 18 },  // Safety & Compliance
    { wch: 12 },  // Equipment
    { wch: 12 },  // Monitoring
    { wch: 30 }   // Notes
  ];
  
  worksheet['!cols'] = columnWidths;
  
  return worksheet;
}

/**
 * Create Problem Areas sheet with critical and needs-attention issues
 */
function createProblemAreasSheet(inspections: Inspection[]): XLSX.WorkSheet {
  const problemAnalysis = analyzeProblemAreas(inspections);
  
  const headers = [
    'Severity', 'School', 'Location', 'Date', 'Rating', 'Inspector', 'Type',
    'Floors', 'Vertical/Horizontal', 'Ceiling', 'Restrooms', 'Customer Satisfaction',
    'Trash', 'Project Cleaning', 'Activity Support', 'Safety & Compliance',
    'Equipment', 'Monitoring', 'Notes'
  ];
  
  const problemAreas = [...problemAnalysis.critical, ...problemAnalysis.needsAttention];
  
  const data = problemAreas.map(problem => {
    const inspection = problem.inspection;
    return [
      problem.severity.toUpperCase(),
      problem.school,
      problem.location,
      new Date(problem.date).toLocaleDateString(),
      problem.rating.toFixed(2),
      inspection.inspectorName || '',
      inspection.inspectionType === 'single_room' ? 'Single Room' : 'Whole Building',
      inspection.floors || '',
      inspection.verticalHorizontalSurfaces || '',
      inspection.ceiling || '',
      inspection.restrooms || '',
      inspection.customerSatisfaction || '',
      inspection.trash || '',
      inspection.projectCleaning || '',
      inspection.activitySupport || '',
      inspection.safetyCompliance || '',
      inspection.equipment || '',
      inspection.monitoring || '',
      inspection.notes || ''
    ];
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  const columnWidths = [
    { wch: 12 },  // Severity
    { wch: 20 },  // School
    { wch: 25 },  // Location
    { wch: 12 },  // Date
    { wch: 8 },   // Rating
    { wch: 15 },  // Inspector
    { wch: 15 },  // Type
    { wch: 8 },   // Floors
    { wch: 25 },  // Vertical/Horizontal
    { wch: 10 },  // Ceiling
    { wch: 12 },  // Restrooms
    { wch: 20 },  // Customer Satisfaction
    { wch: 8 },   // Trash
    { wch: 15 },  // Project Cleaning
    { wch: 15 },  // Activity Support
    { wch: 18 },  // Safety & Compliance
    { wch: 12 },  // Equipment
    { wch: 12 },  // Monitoring
    { wch: 30 }   // Notes
  ];
  
  worksheet['!cols'] = columnWidths;
  
  return worksheet;
}

/**
 * Create Custodial Notes sheet with urgent and high-priority notes
 */
function createCustodialNotesSheet(notes: CustodialNote[]): XLSX.WorkSheet {
  const urgentNotes = identifyUrgentCustodialNotes(notes);
  
  const headers = [
    'Priority', 'School', 'Location', 'Date', 'Notes', 'Keywords', 'Inspector'
  ];
  
  const data = urgentNotes.map(urgentNote => {
    const note = urgentNote.note;
    return [
      urgentNote.severity.toUpperCase(),
      note.school,
      note.location,
      new Date(note.date).toLocaleDateString(),
      note.notes,
      urgentNote.keywords.join(', '),
      note.inspectorName || ''
    ];
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  const columnWidths = [
    { wch: 12 },  // Priority
    { wch: 20 },  // School
    { wch: 25 },  // Location
    { wch: 12 },  // Date
    { wch: 50 },  // Notes
    { wch: 30 },  // Keywords
    { wch: 15 }   // Inspector
  ];
  
  worksheet['!cols'] = columnWidths;
  
  return worksheet;
}

/**
 * Export to CSV format (single sheet)
 */
export function exportToCSV(data: ExportData, sheetName: 'inspections' | 'problems' | 'notes' = 'inspections'): void {
  let worksheet: XLSX.WorkSheet;
  
  switch (sheetName) {
    case 'inspections':
      worksheet = createInspectionsSheet(data.inspections);
      break;
    case 'problems':
      worksheet = createProblemAreasSheet(data.inspections);
      break;
    case 'notes':
      worksheet = createCustodialNotesSheet(data.custodialNotes);
      break;
    default:
      worksheet = createInspectionsSheet(data.inspections);
  }
  
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Custodial_Command_${sheetName}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
