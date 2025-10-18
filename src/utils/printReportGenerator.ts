import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Inspection, CustodialNote } from '../../shared/schema';
import { PRINT_THEME, PRINT_FONTS, MARGINS } from './reportHelpers';
import { calculateAverageRating } from './problemAnalysis';

// Extend jsPDF type to include autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface IssueForReport {
  date: string;
  school: string;
  location: string;
  priority: 'Critical' | 'Needs Attention' | 'Info';
  description: string;
  reportedBy: string;
  category: 'Custodial Note' | 'Inspection';
}

export interface IssuesReportData {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  startDate?: Date;
  endDate?: Date;
  schoolFilter?: string;
  activeFilters?: string[]; // e.g., ["Critical Only", "ASA Issues"]
}

/**
 * Generate clean issues report for printing on white paper
 */
export function generateIssuesReport(data: IssuesReportData): Blob {
  const doc = new jsPDF('p', 'mm', 'letter'); // US Letter size
  let currentY = 20;
  
  // Parse issues from data
  const issues = parseIssuesFromData(data);
  
  // Header
  currentY = addPrintHeader(doc, data, currentY);
  
  // Summary statistics
  currentY = addSummaryStats(doc, issues, currentY);
  
  // Issues table
  currentY = addIssuesTable(doc, issues, currentY);
  
  // Footer on all pages
  addPrintFooter(doc);
  
  return doc.output('blob');
}

/**
 * Parse issues from inspections and custodial notes
 */
function parseIssuesFromData(data: IssuesReportData): IssueForReport[] {
  const issues: IssueForReport[] = [];
  
  // Filter by date range if provided
  const startTime = data.startDate?.getTime();
  const endTime = data.endDate?.getTime();
  
  // Add low-rated inspections
  data.inspections.forEach(inspection => {
    const inspectionDate = new Date(inspection.date).getTime();
    if (startTime && inspectionDate < startTime) return;
    if (endTime && inspectionDate > endTime) return;
    if (data.schoolFilter && inspection.school !== data.schoolFilter) return;
    
    const avgRating = calculateAverageRating(inspection);
    if (avgRating === null) return;
    
    let priority: 'Critical' | 'Needs Attention' | 'Info' = 'Info';
    if (avgRating < 2.0) priority = 'Critical';
    else if (avgRating < 3.0) priority = 'Needs Attention';
    else return; // Skip good ratings
    
    issues.push({
      date: new Date(inspection.date).toLocaleDateString(),
      school: inspection.school,
      location: inspection.locationDescription || inspection.roomNumber || 'N/A',
      priority,
      description: `Rating: ${avgRating.toFixed(1)}/5.0${inspection.notes ? ` - ${inspection.notes}` : ''}`,
      reportedBy: inspection.inspectorName || 'N/A',
      category: 'Inspection'
    });
  });
  
  // Add custodial notes
  data.custodialNotes.forEach(note => {
    const noteDate = new Date(note.date).getTime();
    if (startTime && noteDate < startTime) return;
    if (endTime && noteDate > endTime) return;
    if (data.schoolFilter && note.school !== data.schoolFilter) return;
    
    // Detect urgency by keywords
    const urgentKeywords = ['urgent', 'emergency', 'leak', 'unsafe', 'broken', 'immediate'];
    const isUrgent = urgentKeywords.some(keyword => 
      note.notes.toLowerCase().includes(keyword)
    );
    
    issues.push({
      date: new Date(note.date).toLocaleDateString(),
      school: note.school,
      location: note.location,
      priority: isUrgent ? 'Critical' : 'Needs Attention',
      description: note.notes,
      reportedBy: 'N/A',
      category: 'Custodial Note'
    });
  });
  
  // Sort: Critical first, then by date descending
  issues.sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { 'Critical': 0, 'Needs Attention': 1, 'Info': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return issues;
}

/**
 * Add print-friendly header with date range
 */
function addPrintHeader(doc: jsPDF, data: IssuesReportData, yPosition: number): number {
  doc.setFontSize(PRINT_FONTS.title);
  doc.setTextColor(PRINT_THEME.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Current Custodial Issues Report', MARGINS.left, yPosition);
  
  yPosition += 8;
  
  // Date range
  doc.setFontSize(PRINT_FONTS.body);
  doc.setTextColor(PRINT_THEME.secondary);
  doc.setFont('helvetica', 'normal');
  
  const dateRange = data.startDate && data.endDate
    ? `${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}`
    : 'All Dates';
  doc.text(`Date Range: ${dateRange}`, MARGINS.left, yPosition);
  
  yPosition += 5;
  
  // School filter
  if (data.schoolFilter) {
    doc.text(`School: ${data.schoolFilter}`, MARGINS.left, yPosition);
    yPosition += 5;
  }
  
  // Active filters
  if (data.activeFilters && data.activeFilters.length > 0) {
    doc.text(`Filters: ${data.activeFilters.join(', ')}`, MARGINS.left, yPosition);
    yPosition += 5;
  }
  
  // Generated timestamp
  doc.setFontSize(PRINT_FONTS.small);
  doc.setTextColor(PRINT_THEME.secondary);
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGINS.left, yPosition);
  
  // Separator line
  yPosition += 5;
  doc.setDrawColor(PRINT_THEME.border);
  doc.setLineWidth(0.5);
  doc.line(MARGINS.left, yPosition, doc.internal.pageSize.getWidth() - MARGINS.right, yPosition);
  
  return yPosition + 8;
}

/**
 * Add summary statistics box
 */
function addSummaryStats(doc: jsPDF, issues: IssueForReport[], yPosition: number): number {
  const critical = issues.filter(i => i.priority === 'Critical').length;
  const needsAttention = issues.filter(i => i.priority === 'Needs Attention').length;
  const schools = new Set(issues.map(i => i.school)).size;
  
  doc.setFontSize(PRINT_FONTS.heading);
  doc.setTextColor(PRINT_THEME.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', MARGINS.left, yPosition);
  
  yPosition += 6;
  
  const stats = [
    ['Total Issues:', issues.length.toString()],
    ['Critical:', critical.toString()],
    ['Needs Attention:', needsAttention.toString()],
    ['Schools Affected:', schools.toString()]
  ];
  
  doc.autoTable({
    startY: yPosition,
    body: stats,
    theme: 'plain',
    styles: {
      fontSize: PRINT_FONTS.body,
      textColor: PRINT_THEME.text,
      cellPadding: 2,
      lineWidth: 0.5,
      lineColor: PRINT_THEME.tableBorder
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 20 }
    }
  });
  
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Add issues table
 */
function addIssuesTable(doc: jsPDF, issues: IssueForReport[], yPosition: number): number {
  if (issues.length === 0) {
    doc.setFontSize(PRINT_FONTS.body);
    doc.setTextColor(PRINT_THEME.secondary);
    doc.text('No issues found for the selected criteria.', MARGINS.left, yPosition);
    return yPosition + 10;
  }
  
  doc.setFontSize(PRINT_FONTS.heading);
  doc.setTextColor(PRINT_THEME.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('Issues Detail', MARGINS.left, yPosition);
  
  yPosition += 6;
  
  const tableData = issues.map(issue => [
    issue.date,
    issue.school,
    issue.location,
    issue.priority,
    issue.description,
    issue.category
  ]);
  
  doc.autoTable({
    startY: yPosition,
    head: [['Date', 'School', 'Location', 'Priority', 'Description', 'Type']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: PRINT_THEME.tableHeader,
      textColor: PRINT_THEME.primary,
      fontStyle: 'bold',
      fontSize: PRINT_FONTS.small,
      lineWidth: 0.5,
      lineColor: PRINT_THEME.tableBorder
    },
    bodyStyles: {
      fontSize: PRINT_FONTS.small,
      textColor: PRINT_THEME.text,
      lineWidth: 0.5,
      lineColor: PRINT_THEME.tableBorder
    },
    columnStyles: {
      0: { cellWidth: 20 },  // Date
      1: { cellWidth: 20 },  // School
      2: { cellWidth: 30 },  // Location
      3: { cellWidth: 25 },  // Priority
      4: { cellWidth: 60 },  // Description
      5: { cellWidth: 25 }   // Type
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 3
    }
  });
  
  return doc.lastAutoTable.finalY;
}

/**
 * Add footer to all pages
 */
function addPrintFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(PRINT_FONTS.small);
    doc.setTextColor(PRINT_THEME.secondary);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    doc.text(
      'Custodial Command System',
      MARGINS.left,
      pageHeight - 10
    );
  }
}
