import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, FileImage, Loader2 } from 'lucide-react';
import type { Inspection, CustodialNote } from '../../../shared/schema';
import { exportToExcel, exportToCSV, type ExportOptions } from '../../utils/excelExporter';

interface ExportDialogProps {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  trigger?: React.ReactNode;
  onExport?: () => void;
}

type ExportFormat = 'excel' | 'csv' | 'pdf';
type ExportScope = 'all' | 'filtered' | 'problems' | 'custom';

const ExportDialog: React.FC<ExportDialogProps> = ({
  inspections,
  custodialNotes,
  trigger,
  onExport
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [scope, setScope] = useState<ExportScope>('all');
  const [options, setOptions] = useState<ExportOptions>({
    includeSummary: true,
    includeAllInspections: true,
    includeProblemAreas: true,
    includeCustodialNotes: true
  });

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const exportData = {
        inspections,
        custodialNotes,
        options
      };

      switch (format) {
        case 'excel':
          exportToExcel(exportData);
          break;
        case 'csv':
          const sheetName = scope === 'problems' ? 'problems' : 'inspections';
          exportToCSV(exportData, sheetName);
          break;
        case 'pdf':
          // TODO: Implement PDF export
          console.log('PDF export not yet implemented');
          break;
      }

      onExport?.();
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedFileSize = (): string => {
    const baseSize = inspections.length * 0.5; // KB per inspection
    const multiplier = format === 'excel' ? 1.5 : 0.3; // Excel is larger than CSV
    const sheets = Object.values(options).filter(Boolean).length;
    const estimatedKB = Math.round(baseSize * multiplier * sheets);
    
    if (estimatedKB < 1024) {
      return `${estimatedKB} KB`;
    } else {
      return `${(estimatedKB / 1024).toFixed(1)} MB`;
    }
  };

  const getRecordCount = (): number => {
    switch (scope) {
      case 'all':
        return inspections.length;
      case 'filtered':
        return inspections.length; // This would be filtered inspections in real implementation
      case 'problems':
        return inspections.filter(inspection => {
          // Simple problem detection - could be enhanced
          const categories = ['floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms'];
          const ratings = categories.map(cat => inspection[cat as keyof Inspection] as number).filter(r => r !== null);
          const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
          return avgRating < 3.0;
        }).length;
      case 'custom':
        return inspections.length;
      default:
        return inspections.length;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose format and options for exporting inspection data and reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (.xlsx) - Multiple sheets with formatting
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV (.csv) - Single sheet, compatible with all tools
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" disabled />
                <Label htmlFor="pdf" className="flex items-center gap-2 text-muted-foreground">
                  <FileImage className="w-4 h-4" />
                  PDF (.pdf) - Formatted reports (Coming Soon)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Scope</Label>
            <Select value={scope} onValueChange={(value: ExportScope) => setScope(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data ({inspections.length} inspections)</SelectItem>
                <SelectItem value="filtered">Filtered Data ({getRecordCount()} inspections)</SelectItem>
                <SelectItem value="problems">Problems Only ({getRecordCount()} inspections)</SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Options (Excel only) */}
          {format === 'excel' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Include in Export</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summary"
                    checked={options.includeSummary}
                    onCheckedChange={(checked) => setOptions({...options, includeSummary: !!checked})}
                  />
                  <Label htmlFor="summary">Executive Summary</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inspections"
                    checked={options.includeAllInspections}
                    onCheckedChange={(checked) => setOptions({...options, includeAllInspections: !!checked})}
                  />
                  <Label htmlFor="inspections">All Inspections</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="problems"
                    checked={options.includeProblemAreas}
                    onCheckedChange={(checked) => setOptions({...options, includeProblemAreas: !!checked})}
                  />
                  <Label htmlFor="problems">Problem Areas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notes"
                    checked={options.includeCustodialNotes}
                    onCheckedChange={(checked) => setOptions({...options, includeCustodialNotes: !!checked})}
                  />
                  <Label htmlFor="notes">Custodial Notes</Label>
                </div>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Records:</span>
                <span>{getRecordCount()} inspections</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Format:</span>
                <span>{format.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Size:</span>
                <span>{getEstimatedFileSize()}</span>
              </div>
              {format === 'excel' && (
                <div className="flex justify-between text-sm">
                  <span>Sheets:</span>
                  <span>{Object.values(options).filter(Boolean).length} sheets</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
