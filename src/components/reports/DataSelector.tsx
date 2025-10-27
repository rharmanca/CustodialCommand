import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Image, 
  BarChart3, 
  List,
  Database
} from 'lucide-react';
import type { ExportConfig } from './PDFExportWizard';
import { calculateDataCounts } from '@/utils/exportHelpers';
import type { Inspection, CustodialNote } from '../../../shared/schema';

interface DataSelectorProps {
  config: ExportConfig;
  onConfigChange: (config: ExportConfig) => void;
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
}

const DataSelector: React.FC<DataSelectorProps> = ({
  config,
  onConfigChange,
  inspections,
  custodialNotes
}) => {
  const dataCounts = calculateDataCounts({ inspections, custodialNotes });
  
  const updateDataTypes = (key: keyof ExportConfig['dataTypes'], value: boolean) => {
    onConfigChange({
      ...config,
      dataTypes: {
        ...config.dataTypes,
        [key]: value
      }
    });
  };
  
  const updateOptions = (key: keyof Pick<ExportConfig, 'includeCharts' | 'includeDetails'>, value: boolean) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Data to Include</h3>
        <p className="text-sm text-muted-foreground">
          Choose what data and content to include in your PDF report
        </p>
      </div>
      
      {/* Data Types */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">Data Types</h4>
        
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="inspections"
                  checked={config.dataTypes.inspections}
                  onCheckedChange={(checked) => updateDataTypes('inspections', !!checked)}
                />
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <CardTitle className="text-sm">Inspections</CardTitle>
                    <CardDescription className="text-xs">
                      Individual inspection records with ratings and details
                    </CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {dataCounts.inspections} records
              </Badge>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="custodialNotes"
                  checked={config.dataTypes.custodialNotes}
                  onCheckedChange={(checked) => updateDataTypes('custodialNotes', !!checked)}
                />
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <div>
                    <CardTitle className="text-sm">Custodial Notes</CardTitle>
                    <CardDescription className="text-xs">
                      Notes and comments from custodial staff
                    </CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {dataCounts.custodialNotes} notes
              </Badge>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="images"
                  checked={config.dataTypes.images}
                  onCheckedChange={(checked) => updateDataTypes('images', !!checked)}
                />
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-600" />
                  <div>
                    <CardTitle className="text-sm">Images</CardTitle>
                    <CardDescription className="text-xs">
                      Photos and visual documentation from inspections
                    </CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {dataCounts.images} images ({dataCounts.totalSize})
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {/* Content Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">Content Options</h4>
        
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => updateOptions('includeCharts', !!checked)}
                />
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  <div>
                    <CardTitle className="text-sm">Charts & Visualizations</CardTitle>
                    <CardDescription className="text-xs">
                      Include performance charts, trends, and data visualizations
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="includeDetails"
                  checked={config.includeDetails}
                  onCheckedChange={(checked) => updateOptions('includeDetails', !!checked)}
                />
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-indigo-600" />
                  <div>
                    <CardTitle className="text-sm">Individual Details</CardTitle>
                    <CardDescription className="text-xs">
                      Include full inspection details instead of summary only
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Selected Data Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            {config.dataTypes.inspections && (
              <div>• {dataCounts.inspections} inspections</div>
            )}
            {config.dataTypes.custodialNotes && (
              <div>• {dataCounts.custodialNotes} notes</div>
            )}
            {config.dataTypes.images && (
              <div>• {dataCounts.images} images</div>
            )}
          </div>
          <div>
            {config.includeCharts && <div>• Charts included</div>}
            {config.includeDetails && <div>• Full details</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSelector;
