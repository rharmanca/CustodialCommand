import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import type { ExportConfig } from './PDFExportWizard';

interface ExportFiltersProps {
  config: ExportConfig;
  onConfigChange: (config: ExportConfig) => void;
  availableSchools: string[];
  availableCategories: Array<{ key: string; label: string }>;
}

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: 365 }
];

const SEVERITY_LEVELS = [
  { id: 'critical', label: 'Critical', description: 'Rating ≤ 2 stars' },
  { id: 'needs-attention', label: 'Needs Attention', description: 'Rating ≤ 3 stars' },
  { id: 'acceptable', label: 'Acceptable', description: 'Rating > 3 stars' }
];

const ExportFilters: React.FC<ExportFiltersProps> = ({
  config,
  onConfigChange,
  availableSchools,
  availableCategories
}) => {
  const updateFilters = (key: keyof ExportConfig['filters'], value: any) => {
    onConfigChange({
      ...config,
      filters: {
        ...config.filters,
        [key]: value
      }
    });
  };
  
  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    updateFilters('dateRange', { from, to });
  };
  
  const toggleArrayFilter = (key: 'schools' | 'severityLevels' | 'categories', value: string) => {
    const currentArray = config.filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters(key, newArray);
  };
  
  const clearAllFilters = () => {
    onConfigChange({
      ...config,
      filters: {
        dateRange: { from: null, to: null },
        schools: [],
        severityLevels: [],
        categories: [],
        ratingThreshold: 0
      }
    });
  };
  
  const getActiveFilterCount = () => {
    let count = 0;
    if (config.filters.dateRange.from || config.filters.dateRange.to) count++;
    if (config.filters.schools.length > 0) count++;
    if (config.filters.severityLevels.length > 0) count++;
    if (config.filters.categories.length > 0) count++;
    if (config.filters.ratingThreshold > 0) count++;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Apply Filters</h3>
        <p className="text-sm text-muted-foreground">
          Narrow down the data to include in your report
        </p>
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-6 px-2"
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>
      
      {/* Date Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Presets */}
          <div className="grid grid-cols-2 gap-2">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyDatePreset(preset.days)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                From
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.filters.dateRange.from ? (
                      format(config.filters.dateRange.from, 'MMM dd, yyyy')
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.filters.dateRange.from || undefined}
                    onSelect={(date) => updateFilters('dateRange', { 
                      ...config.filters.dateRange, 
                      from: date || null 
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                To
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.filters.dateRange.to ? (
                      format(config.filters.dateRange.to, 'MMM dd, yyyy')
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.filters.dateRange.to || undefined}
                    onSelect={(date) => updateFilters('dateRange', { 
                      ...config.filters.dateRange, 
                      to: date || null 
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Schools */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Schools</CardTitle>
          <CardDescription className="text-xs">
            Select specific schools to include
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableSchools.map((school) => (
              <div key={school} className="flex items-center space-x-2">
                <Checkbox
                  id={`school-${school}`}
                  checked={config.filters.schools.includes(school)}
                  onCheckedChange={() => toggleArrayFilter('schools', school)}
                />
                <label htmlFor={`school-${school}`} className="text-sm">
                  {school}
                </label>
              </div>
            ))}
          </div>
          {config.filters.schools.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {config.filters.schools.map((school) => (
                <Badge key={school} variant="secondary" className="text-xs">
                  {school}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Severity Levels */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Severity Levels</CardTitle>
          <CardDescription className="text-xs">
            Filter by problem severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SEVERITY_LEVELS.map((level) => (
              <div key={level.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`severity-${level.id}`}
                  checked={config.filters.severityLevels.includes(level.id)}
                  onCheckedChange={() => toggleArrayFilter('severityLevels', level.id)}
                />
                <div className="flex-1">
                  <label htmlFor={`severity-${level.id}`} className="text-sm font-medium">
                    {level.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Categories</CardTitle>
          <CardDescription className="text-xs">
            Select specific cleaning categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableCategories.map((category) => (
              <div key={category.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.key}`}
                  checked={config.filters.categories.includes(category.key)}
                  onCheckedChange={() => toggleArrayFilter('categories', category.key)}
                />
                <label htmlFor={`category-${category.key}`} className="text-sm">
                  {category.label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Rating Threshold */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Rating Threshold</CardTitle>
          <CardDescription className="text-xs">
            Only include inspections with average rating at or below this threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Slider
              value={[config.filters.ratingThreshold]}
              onValueChange={([value]) => updateFilters('ratingThreshold', value)}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>All ratings</span>
              <span className="font-medium">
                {config.filters.ratingThreshold > 0 
                  ? `≤ ${config.filters.ratingThreshold} stars`
                  : 'No filter'
                }
              </span>
              <span>1 star only</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportFilters;
