import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Clock, 
  Database, 
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { ExportConfig } from './PDFExportWizard';
import { estimateFileSize, estimatePageCount, validateExportConfig, filterDataByConfig, getActiveFilterLabels } from '@/utils/exportHelpers';
import type { Inspection, CustodialNote } from '../../../shared/schema';

interface ExportPreviewProps {
  config: ExportConfig;
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  onExport: () => void;
  isExporting?: boolean;
  exportProgress?: number;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({
  config,
  inspections,
  custodialNotes,
  onExport,
  isExporting = false,
  exportProgress = 0
}) => {
  const validation = validateExportConfig(config);
  const filteredData = filterDataByConfig({ inspections, custodialNotes }, config);
  const fileSize = estimateFileSize(config, { inspections, custodialNotes });
  const pageCount = estimatePageCount(config, { inspections, custodialNotes });
  const activeFilters = getActiveFilterLabels(config);
  
  const getReportTypeInfo = () => {
    const types = {
      'executive': { name: 'Executive Summary', icon: '📊', color: 'bg-blue-100 text-blue-800' },
      'school-performance': { name: 'School Performance', icon: '🏫', color: 'bg-green-100 text-green-800' },
      'category-analysis': { name: 'Category Analysis', icon: '🎯', color: 'bg-purple-100 text-purple-800' },
      'issues': { name: 'Issues Report', icon: '⚠️', color: 'bg-red-100 text-red-800' },
      'custom': { name: 'Custom Report', icon: '⚙️', color: 'bg-gray-100 text-gray-800' }
    };
    return types[config.reportType] || types.custom;
  };
  
  const reportInfo = getReportTypeInfo();
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review & Export</h3>
        <p className="text-sm text-muted-foreground">
          Review your selections and generate the PDF report
        </p>
      </div>
      
      {/* Export Progress */}
      {isExporting && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Generating PDF...</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                This may take a moment for large reports with images and charts
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Report Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Report Type</span>
            <Badge className={reportInfo.color}>
              <span className="mr-1">{reportInfo.icon}</span>
              {reportInfo.name}
            </Badge>
          </div>
          
          {/* Data Included */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Data Included</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {config.dataTypes.inspections && (
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-blue-600" />
                  <span>{filteredData.inspections.length} inspections</span>
                </div>
              )}
              {config.dataTypes.custodialNotes && (
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-green-600" />
                  <span>{filteredData.custodialNotes.length} notes</span>
                </div>
              )}
              {config.dataTypes.images && (
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-purple-600" />
                  <span>Images included</span>
                </div>
              )}
              {config.includeCharts && (
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3 text-orange-600" />
                  <span>Charts included</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Active Filters
              </span>
              <div className="flex flex-wrap gap-1">
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Export Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Export Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">File Size</span>
              <span className="font-medium">{fileSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pages</span>
              <span className="font-medium">{pageCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Records</span>
              <span className="font-medium">{filteredData.totalRecords}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Schools</span>
              <span className="font-medium">
                {filteredData.schools.length > 0 ? filteredData.schools.length : 'All'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Errors */}
      {!validation.isValid && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800">Please fix the following issues:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Export Button */}
      <div className="flex justify-center">
        <Button
          onClick={onExport}
          disabled={!validation.isValid || isExporting}
          size="lg"
          className="min-w-[200px]"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export PDF Report
            </>
          )}
        </Button>
      </div>
      
      {/* Success Message */}
      {!isExporting && validation.isValid && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>Ready to export! Click the button above to generate your PDF.</span>
        </div>
      )}
    </div>
  );
};

export default ExportPreview;
