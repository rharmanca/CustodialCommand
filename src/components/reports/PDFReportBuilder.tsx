import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, Eye, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Inspection, CustodialNote } from '../../../shared/schema';
import { 
  initializePDF, 
  addPDFHeader, 
  addPDFFooter, 
  addKPISection, 
  addProblemAreasTable, 
  addUrgentNotesSection,
  addChartToPDF,
  captureChartAsImage,
  THEME_COLORS,
  FONT_SIZES,
  MARGINS
} from '../../utils/reportHelpers';
import { analyzeProblemAreas, identifyUrgentCustodialNotes, calculateAverageRating } from '../../utils/problemAnalysis';

interface PDFReportBuilderProps {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  reportType: 'executive' | 'school' | 'notes' | 'comprehensive';
  schoolName?: string;
  onComplete?: () => void;
}

interface ReportProgress {
  step: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const PDFReportBuilder: React.FC<PDFReportBuilderProps> = ({
  inspections,
  custodialNotes,
  reportType,
  schoolName,
  onComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ReportProgress>({
    step: 'Initializing',
    progress: 0,
    status: 'pending'
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateProgress = (step: string, progress: number, status: ReportProgress['status'] = 'processing') => {
    setProgress({ step, progress, status });
  };

  const generateExecutiveSummary = async (): Promise<Blob> => {
    const doc = initializePDF('Executive Problem Summary');
    let currentY = MARGINS.top;
    
    // Header
    addPDFHeader(doc, 'EXECUTIVE PROBLEM SUMMARY', 'Critical Issues and Performance Analysis');
    currentY = 60;
    
    // KPI Section
    updateProgress('Adding KPIs', 20);
    currentY = addKPISection(doc, inspections, currentY);
    
    // Problem Areas Table
    updateProgress('Adding problem areas', 40);
    currentY = addProblemAreasTable(doc, inspections, currentY);
    
    // Urgent Notes
    updateProgress('Adding urgent notes', 60);
    currentY = addUrgentNotesSection(doc, custodialNotes, currentY);
    
    // Summary Statistics
    updateProgress('Adding summary statistics', 80);
    const problemAnalysis = analyzeProblemAreas(inspections);
    const urgentNotes = identifyUrgentCustodialNotes(custodialNotes);
    
    doc.setFontSize(FONT_SIZES.heading);
    doc.setTextColor(THEME_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY STATISTICS', MARGINS.left, currentY);
    currentY += 20;
    
    const summaryData = [
      ['Total Inspections', inspections.length.toString()],
      ['Critical Issues', problemAnalysis.critical.length.toString()],
      ['Needs Attention', problemAnalysis.needsAttention.length.toString()],
      ['Urgent Notes', urgentNotes.length.toString()],
      ['Affected Schools', problemAnalysis.summary.affectedSchools.length.toString()],
      ['Most Problematic School', problemAnalysis.summary.mostProblematicSchool || 'N/A']
    ];
    
    (doc as any).autoTable({
      startY: currentY,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: {
        fillColor: THEME_COLORS.secondary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: FONT_SIZES.body
      }
    });
    
    // Footer
    addPDFFooter(doc, 1);
    
    return doc.output('blob');
  };

  const generateSchoolPerformance = async (): Promise<Blob> => {
    if (!schoolName) {
      throw new Error('School name is required for school performance report');
    }
    
    const schoolInspections = inspections.filter(i => i.school === schoolName);
    const doc = initializePDF(`School Performance Report - ${schoolName}`);
    let currentY = MARGINS.top;
    
    // Header
    addPDFHeader(doc, `SCHOOL PERFORMANCE REPORT`, schoolName);
    currentY = 60;
    
    // School-specific KPIs
    updateProgress('Adding school KPIs', 20);
    currentY = addKPISection(doc, schoolInspections, currentY);
    
    // School Problem Areas
    updateProgress('Adding school problems', 40);
    currentY = addProblemAreasTable(doc, schoolInspections, currentY);
    
    // Room-by-room breakdown
    updateProgress('Adding room breakdown', 60);
    doc.setFontSize(FONT_SIZES.heading);
    doc.setTextColor(THEME_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('ROOM-BY-ROOM BREAKDOWN', MARGINS.left, currentY);
    currentY += 20;
    
    const roomData = schoolInspections
      .filter(i => i.inspectionType === 'single_room')
      .map(inspection => {
        const avgRating = calculateAverageRating(inspection);
        return [
          inspection.roomNumber || 'N/A',
          new Date(inspection.date).toLocaleDateString(),
          avgRating?.toFixed(2) || 'N/A',
          inspection.inspectorName || 'N/A',
          inspection.notes || 'No notes'
        ];
      });
    
    if (roomData.length > 0) {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Room', 'Date', 'Rating', 'Inspector', 'Notes']],
        body: roomData,
        theme: 'grid',
        headStyles: {
          fillColor: THEME_COLORS.primary,
          textColor: '#FFFFFF',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: FONT_SIZES.small
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Footer
    addPDFFooter(doc, 1);
    
    return doc.output('blob');
  };

  const generateNotesDigest = async (): Promise<Blob> => {
    const doc = initializePDF('Custodial Notes Digest');
    let currentY = MARGINS.top;
    
    // Header
    addPDFHeader(doc, 'CUSTODIAL NOTES DIGEST', 'All Facility Issues and Maintenance Notes');
    currentY = 60;
    
    // Urgent Notes Section
    updateProgress('Adding urgent notes', 30);
    currentY = addUrgentNotesSection(doc, custodialNotes, currentY);
    
    // All Notes by School
    updateProgress('Adding notes by school', 60);
    const notesBySchool = custodialNotes.reduce((acc, note) => {
      if (!acc[note.school]) acc[note.school] = [];
      acc[note.school].push(note);
      return acc;
    }, {} as Record<string, CustodialNote[]>);
    
    Object.entries(notesBySchool).forEach(([school, notes]) => {
      if (currentY > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        currentY = MARGINS.top;
      }
      
      doc.setFontSize(FONT_SIZES.heading);
      doc.setTextColor(THEME_COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(`${school} - Custodial Notes`, MARGINS.left, currentY);
      currentY += 20;
      
      const schoolNotesData = notes.map(note => [
        new Date(note.date).toLocaleDateString(),
        note.location,
        note.notes,
        note.inspectorName || 'N/A'
      ]);
      
      (doc as any).autoTable({
        startY: currentY,
        head: [['Date', 'Location', 'Notes', 'Inspector']],
        body: schoolNotesData,
        theme: 'striped',
        headStyles: {
          fillColor: THEME_COLORS.secondary,
          textColor: '#FFFFFF',
          fontStyle: 'bold'
        },
        styles: {
          fontSize: FONT_SIZES.small
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
    });
    
    // Footer
    addPDFFooter(doc, 1);
    
    return doc.output('blob');
  };

  const generateComprehensiveReport = async (): Promise<Blob> => {
    const doc = initializePDF('Comprehensive Custodial Report');
    let currentY = MARGINS.top;
    
    // Header
    addPDFHeader(doc, 'COMPREHENSIVE CUSTODIAL REPORT', 'Complete Analysis and Recommendations');
    currentY = 60;
    
    // Executive Summary
    updateProgress('Adding executive summary', 20);
    currentY = addKPISection(doc, inspections, currentY);
    
    // Problem Areas
    updateProgress('Adding problem areas', 40);
    currentY = addProblemAreasTable(doc, inspections, currentY);
    
    // Urgent Notes
    updateProgress('Adding urgent notes', 60);
    currentY = addUrgentNotesSection(doc, custodialNotes, currentY);
    
    // School Performance Comparison
    updateProgress('Adding school comparison', 80);
    const schoolPerformance = inspections.reduce((acc, inspection) => {
      const avgRating = calculateAverageRating(inspection);
      if (avgRating === null) return acc;
      
      if (!acc[inspection.school]) {
        acc[inspection.school] = { total: 0, count: 0 };
      }
      acc[inspection.school].total += avgRating;
      acc[inspection.school].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    doc.setFontSize(FONT_SIZES.heading);
    doc.setTextColor(THEME_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHOOL PERFORMANCE COMPARISON', MARGINS.left, currentY);
    currentY += 20;
    
    const performanceData = Object.entries(schoolPerformance)
      .map(([school, stats]) => [
        school,
        (stats.total / stats.count).toFixed(2),
        stats.count.toString()
      ])
      .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
    
    (doc as any).autoTable({
      startY: currentY,
      head: [['School', 'Average Rating', 'Inspections']],
      body: performanceData,
      theme: 'grid',
      headStyles: {
        fillColor: THEME_COLORS.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: FONT_SIZES.body
      }
    });
    
    // Footer
    addPDFFooter(doc, 1);
    
    return doc.output('blob');
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    updateProgress('Starting report generation', 0, 'processing');
    
    try {
      let blob: Blob;
      
      switch (reportType) {
        case 'executive':
          blob = await generateExecutiveSummary();
          break;
        case 'school':
          blob = await generateSchoolPerformance();
          break;
        case 'notes':
          blob = await generateNotesDigest();
          break;
        case 'comprehensive':
          blob = await generateComprehensiveReport();
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      updateProgress('Report generated successfully', 100, 'completed');
      
      // Create download link
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Custodial_Report_${reportType}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onComplete?.();
    } catch (error) {
      console.error('Report generation failed:', error);
      updateProgress('Report generation failed', 0, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'executive':
        return 'Executive Problem Summary';
      case 'school':
        return `School Performance Report - ${schoolName}`;
      case 'notes':
        return 'Custodial Notes Digest';
      case 'comprehensive':
        return 'Comprehensive Custodial Report';
      default:
        return 'Custodial Report';
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'executive':
        return 'Critical issues and performance analysis for management review';
      case 'school':
        return `Detailed performance analysis for ${schoolName}`;
      case 'notes':
        return 'All facility issues and maintenance notes organized by school';
      case 'comprehensive':
        return 'Complete analysis with recommendations and action items';
      default:
        return 'Custodial performance report';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {getReportTitle()}
        </CardTitle>
        <CardDescription>
          {getReportDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Inspections:</span>
            <span>{inspections.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Custodial Notes:</span>
            <span>{custodialNotes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Report Type:</span>
            <Badge variant="outline">{reportType}</Badge>
          </div>
        </div>

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{progress.step}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate & Download PDF
              </>
            )}
          </Button>
          
          {previewUrl && (
            <Button 
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
        </div>

        {/* Error State */}
        {progress.status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Report generation failed. Please try again.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFReportBuilder;
