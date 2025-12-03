import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, X, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Inspection, CustodialNote } from '../../../shared/schema';
import ReportTypeSelector from './ReportTypeSelector';
import DataSelector from './DataSelector';
import ExportFilters from './ExportFilters';
import ExportPreview from './ExportPreview';
import { 
  generateIssuesReport, 
  generateExecutiveSummaryPDF,
  generateSchoolPerformancePDF,
  generateCategoryAnalysisPDF,
  generateCustomReportPDF
} from '@/utils/printReportGenerator';
import { filterDataByConfig, validateExportConfig } from '@/utils/exportHelpers';

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

interface WizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
}

interface PDFExportWizardProps {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  availableSchools: string[];
  availableCategories: Array<{ key: string; label: string }>;
  trigger?: React.ReactNode;
  onExportComplete?: () => void;
}

const PDFExportWizard: React.FC<PDFExportWizardProps> = ({
  inspections,
  custodialNotes,
  availableSchools,
  availableCategories,
  trigger,
  onExportComplete
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const [config, setConfig] = useState<ExportConfig>({
    reportType: 'executive',
    dataTypes: {
      inspections: true,
      custodialNotes: false,
      images: false
    },
    filters: {
      dateRange: { from: null, to: null },
      schools: [],
      severityLevels: [],
      categories: [],
      ratingThreshold: 0
    },
    includeCharts: true,
    includeDetails: false
  });
  
  const steps: WizardStep[] = [
    { id: 1, title: 'Report Type', description: 'Choose your report type', isComplete: false },
    { id: 2, title: 'Data Selection', description: 'Select data to include', isComplete: false },
    { id: 3, title: 'Filters', description: 'Apply filters and criteria', isComplete: false },
    { id: 4, title: 'Export', description: 'Review and generate PDF', isComplete: false }
  ];
  
  const updateStepCompletion = useCallback((stepId: number, isComplete: boolean) => {
    // This would update the steps array, but for now we'll just track current step
  }, []);
  
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleConfigChange = (newConfig: ExportConfig) => {
    setConfig(newConfig);
    
    // Update step completion based on current step
    const validation = validateExportConfig(newConfig);
    if (currentStep === 1 && newConfig.reportType) {
      updateStepCompletion(1, true);
    } else if (currentStep === 2 && (newConfig.dataTypes.inspections || newConfig.dataTypes.custodialNotes)) {
      updateStepCompletion(2, true);
    } else if (currentStep === 3) {
      updateStepCompletion(3, true);
    }
  };
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      
      // Validate configuration
      const validation = validateExportConfig(config);
      if (!validation.isValid) {
        toast({
          title: "Export Error",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);
      
      // Filter data based on configuration
      const filteredData = filterDataByConfig({ inspections, custodialNotes }, config);
      
      // Generate PDF based on report type (async - uses dynamic imports)
      let pdfBlob: Blob;
      
      switch (config.reportType) {
        case 'issues':
          pdfBlob = await generateIssuesReport({
            inspections: filteredData.inspections,
            custodialNotes: filteredData.custodialNotes,
            startDate: config.filters.dateRange.from || undefined,
            endDate: config.filters.dateRange.to || undefined,
            schoolFilter: config.filters.schools.length === 1 ? config.filters.schools[0] : undefined,
            activeFilters: []
          });
          break;
        case 'executive':
          pdfBlob = await generateExecutiveSummaryPDF({ inspections, custodialNotes }, config);
          break;
        case 'school-performance':
          pdfBlob = await generateSchoolPerformancePDF({ inspections, custodialNotes }, config);
          break;
        case 'category-analysis':
          pdfBlob = await generateCategoryAnalysisPDF({ inspections, custodialNotes }, config);
          break;
        case 'custom':
          pdfBlob = await generateCustomReportPDF({ inspections, custodialNotes }, config);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      // Complete progress
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custodial-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Success feedback
      toast({
        title: "Export Successful",
        description: "Your PDF report has been generated and downloaded.",
      });
      
      // Close wizard and call completion callback
      setOpen(false);
      onExportComplete?.();
      
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ReportTypeSelector
            selectedType={config.reportType}
            onTypeChange={(type) => handleConfigChange({ ...config, reportType: type })}
          />
        );
      case 2:
        return (
          <DataSelector
            config={config}
            onConfigChange={handleConfigChange}
            inspections={inspections}
            custodialNotes={custodialNotes}
          />
        );
      case 3:
        return (
          <ExportFilters
            config={config}
            onConfigChange={handleConfigChange}
            availableSchools={availableSchools}
            availableCategories={availableCategories}
          />
        );
      case 4:
        return (
          <ExportPreview
            config={config}
            inspections={inspections}
            custodialNotes={custodialNotes}
            onExport={handleExport}
            isExporting={isExporting}
            exportProgress={exportProgress}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {trigger}
        </div>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF Export Wizard
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                  ${currentStep > step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : currentStep === step.id 
                    ? 'border-primary text-primary' 
                    : 'border-muted-foreground text-muted-foreground'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-2 transition-colors
                    ${currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step) => (
              <div key={step.id} className="text-center max-w-20">
                <div className="font-medium">{step.title}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="py-6">
          {renderStepContent()}
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isExporting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isExporting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep < steps.length && (
              <Button
                onClick={handleNext}
                disabled={isExporting}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExportWizard;
