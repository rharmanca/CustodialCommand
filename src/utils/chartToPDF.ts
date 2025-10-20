import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ExportConfig } from '../components/reports/PDFExportWizard';

export interface ChartExportOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Capture a chart element as canvas using html2canvas
 */
export async function captureChartAsCanvas(
  chartElement: HTMLElement,
  options: ChartExportOptions = {}
): Promise<HTMLCanvasElement> {
  const {
    width = 800,
    height = 600,
    quality = 1,
    backgroundColor = '#ffffff',
    scale = 2
  } = options;

  const canvas = await html2canvas(chartElement, {
    width,
    height,
    backgroundColor,
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    onclone: (clonedDoc) => {
      // Ensure charts are fully rendered in the cloned document
      const clonedElement = clonedDoc.querySelector(`[data-chart-id="${chartElement.dataset.chartId}"]`);
      if (clonedElement) {
        // Force chart re-render if needed
        clonedElement.style.visibility = 'visible';
      }
    }
  });

  return canvas;
}

/**
 * Add a chart to PDF at specified position
 */
export async function addChartToPDF(
  doc: jsPDF,
  chartElement: HTMLElement,
  yPosition: number,
  options: ChartExportOptions = {}
): Promise<number> {
  try {
    const canvas = await captureChartAsCanvas(chartElement, options);
    
    // Calculate dimensions to fit within page margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - yPosition - margin;
    
    // Calculate scaling to fit within page
    const scaleX = maxWidth / canvas.width;
    const scaleY = maxHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    
    // Center horizontally
    const xPosition = (pageWidth - scaledWidth) / 2;
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 0.95);
    
    // Add image to PDF
    doc.addImage(imgData, 'PNG', xPosition, yPosition, scaledWidth, scaledHeight);
    
    return yPosition + scaledHeight + 10; // Return new Y position with padding
  } catch (error) {
    console.error('Error adding chart to PDF:', error);
    // Add error message to PDF instead
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);
    doc.text('Error rendering chart', 20, yPosition);
    return yPosition + 20;
  }
}

/**
 * Capture multiple charts and add them to PDF with pagination
 */
export async function addMultipleChartsToPDF(
  doc: jsPDF,
  chartElements: HTMLElement[],
  startY: number = 20,
  options: ChartExportOptions = {}
): Promise<number> {
  let currentY = startY;
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  for (let i = 0; i < chartElements.length; i++) {
    const chartElement = chartElements[i];
    
    // Check if we need a new page
    if (currentY > pageHeight - 200) { // Leave room for chart
      doc.addPage();
      currentY = margin;
    }
    
    // Add chart title if available
    const chartTitle = chartElement.dataset.chartTitle || `Chart ${i + 1}`;
    if (chartTitle) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(chartTitle, 20, currentY);
      currentY += 15;
    }
    
    // Add the chart
    currentY = await addChartToPDF(doc, chartElement, currentY, options);
    
    // Add spacing between charts
    currentY += 20;
  }
  
  return currentY;
}

/**
 * Capture dashboard charts for export
 */
export async function captureDashboardCharts(
  dashboardElement: HTMLElement,
  chartSelectors: string[] = [
    '[data-chart="performance-trend"]',
    '[data-chart="school-comparison"]',
    '[data-chart="category-radar"]',
    '[data-chart="room-heatmap"]'
  ]
): Promise<HTMLElement[]> {
  const charts: HTMLElement[] = [];
  
  for (const selector of chartSelectors) {
    const chartElement = dashboardElement.querySelector(selector) as HTMLElement;
    if (chartElement) {
      // Ensure chart is visible and rendered
      chartElement.style.visibility = 'visible';
      chartElement.style.display = 'block';
      
      // Wait a bit for chart to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      charts.push(chartElement);
    }
  }
  
  return charts;
}

/**
 * Get chart export options based on report type
 */
export function getChartExportOptions(reportType: ExportConfig['reportType']): ChartExportOptions {
  const baseOptions: ChartExportOptions = {
    quality: 0.95,
    backgroundColor: '#ffffff',
    scale: 2
  };
  
  switch (reportType) {
    case 'executive':
      return {
        ...baseOptions,
        width: 1000,
        height: 400
      };
    case 'school-performance':
      return {
        ...baseOptions,
        width: 1200,
        height: 600
      };
    case 'category-analysis':
      return {
        ...baseOptions,
        width: 800,
        height: 800
      };
    default:
      return {
        ...baseOptions,
        width: 800,
        height: 500
      };
  }
}
