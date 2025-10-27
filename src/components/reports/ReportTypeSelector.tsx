import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Settings,
  FileText,
  Building,
  PieChart
} from 'lucide-react';
import type { ExportConfig } from './PDFExportWizard';

interface ReportTypeSelectorProps {
  selectedType: ExportConfig['reportType'];
  onTypeChange: (type: ExportConfig['reportType']) => void;
}

const REPORT_TYPES = [
  {
    id: 'executive' as const,
    title: 'Executive Summary',
    description: 'High-level overview with KPIs, trends, and critical issues for leadership',
    icon: BarChart3,
    badge: 'Best for monthly reports',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    selectedColor: 'bg-blue-100 border-blue-300',
    iconColor: 'text-blue-600'
  },
  {
    id: 'school-performance' as const,
    title: 'School Performance',
    description: 'Compare schools, identify trends, and track performance over time',
    icon: Building,
    badge: 'Best for comparisons',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    selectedColor: 'bg-green-100 border-green-300',
    iconColor: 'text-green-600'
  },
  {
    id: 'category-analysis' as const,
    title: 'Category Analysis',
    description: 'Deep dive into specific cleaning categories and problem areas',
    icon: Target,
    badge: 'Best for detailed analysis',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    selectedColor: 'bg-purple-100 border-purple-300',
    iconColor: 'text-purple-600'
  },
  {
    id: 'issues' as const,
    title: 'Issues Report',
    description: 'List of problems, critical issues, and items needing attention',
    icon: AlertTriangle,
    badge: 'Best for problem tracking',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    selectedColor: 'bg-red-100 border-red-300',
    iconColor: 'text-red-600'
  },
  {
    id: 'custom' as const,
    title: 'Custom Report',
    description: 'Build your own report with flexible sections and data combinations',
    icon: Settings,
    badge: 'Best for specific needs',
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    selectedColor: 'bg-gray-100 border-gray-300',
    iconColor: 'text-gray-600'
  }
];

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Report Type</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of report that best fits your needs
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? `${type.selectedColor} ring-2 ring-primary/20` 
                  : `${type.color} hover:shadow-md`
              }`}
              onClick={() => onTypeChange(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white' : 'bg-white/50'}`}>
                      <Icon className={`w-5 h-5 ${type.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{type.title}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className="text-xs mt-1"
                      >
                        {type.badge}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">
                  {type.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {selectedType && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>
              Selected: <strong>{REPORT_TYPES.find(t => t.id === selectedType)?.title}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTypeSelector;
