import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Inspection, CustodialNote } from '../../shared/schema';
import { analyzeProblemAreas, identifyUrgentCustodialNotes, calculateAverageRating } from './problemAnalysis';

// Theme colors matching retro propaganda poster aesthetic
export const THEME_COLORS = {
  background: '#E8E1D3',      // Cream/beige background
  primary: '#C73E3A',         // Bold red
  secondary: '#3C3936',       // Dark gray
  accent: '#F4E4BC',          // Light yellow
  success: '#4CAF50',         // Green for good performance
  warning: '#FF9800',         // Orange for needs attention
  danger: '#F44336',          // Red for critical issues
  text: '#2C2C2C',            // Dark text
  muted: '#6B7280'            // Muted text
};

export const FONT_SIZES = {
  title: 24,
  subtitle: 18,
  heading: 16,
  body: 12,
  small: 10,
  tiny: 8
};

export const MARGINS = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20
};

// Clean print theme for white paper - NO COLORS
export const PRINT_THEME = {
  background: '#FFFFFF',      // Pure white
  primary: '#000000',         // Black text only
  secondary: '#333333',       // Dark gray for secondary text
  border: '#CCCCCC',          // Light gray borders (1px)
  critical: '#000000',        // Black text (no red ink)
  warning: '#000000',         // Black text (no orange ink)
  success: '#000000',         // Black text (no green ink)
  headerBg: '#F5F5F5',        // Very light gray header background
  text: '#212121',            // Near black text
  tableBorder: '#CCCCCC',     // Light gray table borders
  tableHeader: '#F0F0F0'      // Very light gray table headers
};

export const PRINT_FONTS = {
  title: 16,
  heading: 12,
  body: 10,
  small: 8
};

/**
 * Initialize PDF with theme colors and settings
 */
export function initializePDF(title: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Set theme colors
  doc.setProperties({
    title: title,
    subject: 'Custodial Command Report',
    author: 'Custodial Command System',
    creator: 'Custodial Command Application'
  });
  
  return doc;
}

/**
 * Add header to PDF with branding
 */
export function addPDFHeader(doc: jsPDF, title: string, subtitle?: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Background color
  doc.setFillColor(THEME_COLORS.background);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setFontSize(FONT_SIZES.title);
  doc.setTextColor(THEME_COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGINS.left, 25);
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(FONT_SIZES.subtitle);
    doc.setTextColor(THEME_COLORS.secondary);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, MARGINS.left, 35);
  }
  
  // Date
  doc.setFontSize(FONT_SIZES.small);
  doc.setTextColor(THEME_COLORS.muted);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - MARGINS.right, 25, { align: 'right' });
  
  // Line separator
  doc.setDrawColor(THEME_COLORS.primary);
  doc.setLineWidth(2);
  doc.line(MARGINS.left, 45, pageWidth - MARGINS.right, 45);
}

/**
 * Add footer to PDF
 */
export function addPDFFooter(doc: jsPDF, pageNumber?: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer line
  doc.setDrawColor(THEME_COLORS.primary);
  doc.setLineWidth(1);
  doc.line(MARGINS.left, pageHeight - 20, pageWidth - MARGINS.right, pageHeight - 20);
  
  // Footer text
  doc.setFontSize(FONT_SIZES.small);
  doc.setTextColor(THEME_COLORS.muted);
  doc.text('Custodial Command System', MARGINS.left, pageHeight - 10);
  
  if (pageNumber) {
    doc.text(`Page ${pageNumber}`, pageWidth - MARGINS.right, pageHeight - 10, { align: 'right' });
  }
}

/**
 * Add KPI cards section to PDF
 */
export function addKPISection(doc: jsPDF, inspections: Inspection[], yPosition: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - MARGINS.left - MARGINS.right - 30) / 4;
  
  // Calculate KPIs
  const totalInspections = inspections.length;
  const avgRating = inspections.length > 0
    ? inspections.reduce((sum, inspection) => {
        const rating = calculateAverageRating(inspection);
        return sum + (rating || 0);
      }, 0) / inspections.length
    : 0;
  
  const schools = new Set(inspections.map(i => i.school)).size;
  const problemAnalysis = analyzeProblemAreas(inspections);
  
  const kpis = [
    { title: 'Total Inspections', value: totalInspections.toString(), color: THEME_COLORS.primary },
    { title: 'Average Rating', value: avgRating.toFixed(1), color: THEME_COLORS.success },
    { title: 'Schools', value: schools.toString(), color: THEME_COLORS.secondary },
    { title: 'Critical Issues', value: problemAnalysis.critical.length.toString(), color: THEME_COLORS.danger }
  ];
  
  let currentY = yPosition;
  
  // KPI Cards
  kpis.forEach((kpi, index) => {
    const x = MARGINS.left + (index * (cardWidth + 10));
    
    // Card background
    doc.setFillColor(THEME_COLORS.accent);
    doc.roundedRect(x, currentY, cardWidth, 30, 3, 3, 'F');
    
    // Card border
    doc.setDrawColor(THEME_COLORS.primary);
    doc.setLineWidth(1);
    doc.roundedRect(x, currentY, cardWidth, 30, 3, 3, 'S');
    
    // Value
    doc.setFontSize(FONT_SIZES.heading);
    doc.setTextColor(kpi.color);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + 10, currentY + 15);
    
    // Title
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(THEME_COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.title, x + 10, currentY + 25);
  });
  
  return currentY + 40;
}

/**
 * Add problem areas table to PDF
 */
export function addProblemAreasTable(doc: jsPDF, inspections: Inspection[], yPosition: number): number {
  const problemAnalysis = analyzeProblemAreas(inspections);
  const problemAreas = [...problemAnalysis.critical, ...problemAnalysis.needsAttention];
  
  if (problemAreas.length === 0) {
    doc.setFontSize(FONT_SIZES.body);
    doc.setTextColor(THEME_COLORS.success);
    doc.text('No problem areas found - all inspections are performing well!', MARGINS.left, yPosition);
    return yPosition + 20;
  }
  
  // Table headers
  const headers = ['Severity', 'School', 'Location', 'Date', 'Rating', 'Inspector'];
  
  // Table data
  const tableData = problemAreas.map(problem => [
    problem.severity.toUpperCase(),
    problem.school,
    problem.location,
    new Date(problem.date).toLocaleDateString(),
    problem.rating.toFixed(2),
    problem.inspection.inspectorName || 'N/A'
  ]);
  
  // Create table
  (doc as any).autoTable({
    startY: yPosition,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: THEME_COLORS.primary,
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: THEME_COLORS.accent
    },
    styles: {
      fontSize: FONT_SIZES.small,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Severity
      1: { cellWidth: 30 }, // School
      2: { cellWidth: 35 }, // Location
      3: { cellWidth: 20 }, // Date
      4: { cellWidth: 15 }, // Rating
      5: { cellWidth: 25 }  // Inspector
    }
  });
  
  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Add urgent custodial notes section to PDF
 */
export function addUrgentNotesSection(doc: jsPDF, custodialNotes: CustodialNote[], yPosition: number): number {
  const urgentNotes = identifyUrgentCustodialNotes(custodialNotes);
  
  if (urgentNotes.length === 0) {
    return yPosition;
  }
  
  // Section title
  doc.setFontSize(FONT_SIZES.heading);
  doc.setTextColor(THEME_COLORS.danger);
  doc.setFont('helvetica', 'bold');
  doc.text('🚨 URGENT FACILITY ISSUES', MARGINS.left, yPosition);
  
  let currentY = yPosition + 15;
  
  urgentNotes.forEach((urgentNote, index) => {
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = MARGINS.top;
    }
    
    const note = urgentNote.note;
    
    // Note card
    doc.setFillColor(urgentNote.severity === 'urgent' ? '#FFEBEE' : '#FFF3E0');
    doc.roundedRect(MARGINS.left, currentY, doc.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right, 25, 3, 3, 'F');
    
    // Priority badge
    doc.setFillColor(urgentNote.severity === 'urgent' ? THEME_COLORS.danger : THEME_COLORS.warning);
    doc.roundedRect(MARGINS.left + 5, currentY + 5, 20, 8, 2, 2, 'F');
    doc.setFontSize(FONT_SIZES.tiny);
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.text(urgentNote.severity.toUpperCase(), MARGINS.left + 7, currentY + 10);
    
    // School and location
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(THEME_COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(`${note.school} - ${note.location}`, MARGINS.left + 30, currentY + 8);
    
    // Date
    doc.setFontSize(FONT_SIZES.tiny);
    doc.setTextColor(THEME_COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(note.date).toLocaleDateString(), MARGINS.left + 30, currentY + 15);
    
    // Notes text
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(THEME_COLORS.text);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(note.notes, doc.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 30);
    doc.text(splitNotes, MARGINS.left + 30, currentY + 20);
    
    currentY += 30 + (splitNotes.length * 4);
  });
  
  return currentY + 10;
}

/**
 * Capture chart as image and add to PDF
 */
export async function captureChartAsImage(chartElementId: string): Promise<string> {
  const element = document.getElementById(chartElementId);
  if (!element) {
    throw new Error(`Chart element with id "${chartElementId}" not found`);
  }
  
  const canvas = await html2canvas(element, {
    backgroundColor: THEME_COLORS.background,
    scale: 2,
    useCORS: true,
    allowTaint: true
  });
  
  return canvas.toDataURL('image/png');
}

/**
 * Add chart image to PDF
 */
export function addChartToPDF(doc: jsPDF, imageData: string, title: string, yPosition: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - MARGINS.left - MARGINS.right;
  const maxHeight = 100; // Max height for charts
  
  // Chart title
  doc.setFontSize(FONT_SIZES.heading);
  doc.setTextColor(THEME_COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGINS.left, yPosition);
  
  // Add image
  doc.addImage(imageData, 'PNG', MARGINS.left, yPosition + 10, maxWidth, maxHeight);
  
  return yPosition + maxHeight + 20;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format rating with color coding
 */
export function formatRating(rating: number): { text: string; color: string } {
  if (rating < 2.0) {
    return { text: rating.toFixed(1), color: THEME_COLORS.danger };
  } else if (rating < 3.0) {
    return { text: rating.toFixed(1), color: THEME_COLORS.warning };
  } else {
    return { text: rating.toFixed(1), color: THEME_COLORS.success };
  }
}

/**
 * Compress image data for PDF
 */
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

/**
 * Add page break if needed
 */
export function checkPageBreak(doc: jsPDF, requiredSpace: number): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentY = (doc as any).lastAutoTable?.finalY || MARGINS.top;
  
  if (currentY + requiredSpace > pageHeight - MARGINS.bottom) {
    doc.addPage();
  }
}
