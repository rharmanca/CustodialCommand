import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { ProblemSeverity } from '../../utils/problemAnalysis';

export interface FilterState {
  search: string;
  dateRange: { from: Date | null; to: Date | null };
  schools: string[];
  severityLevels: ProblemSeverity[];
  categories: string[];
  inspectors: string[];
  ratingThreshold: number;
  inspectionType: 'all' | 'single_room' | 'whole_building';
  showProblemsOnly: boolean;
  hasCustodialNotes: boolean;
}

interface AdvancedFiltersProps {
  inspections: any[];
  custodialNotes: any[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FILTER_PRESETS = {
  last7Days: { from: subDays(new Date(), 7), to: new Date() },
  last30Days: { from: subDays(new Date(), 30), to: new Date() },
  thisMonth: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  thisQuarter: { from: startOfMonth(subDays(new Date(), 90)), to: new Date() }
};

const INSPECTION_CATEGORIES = [
  { key: 'floors', label: 'Floors' },
  { key: 'verticalHorizontalSurfaces', label: 'Vertical and Horizontal Surfaces' },
  { key: 'ceiling', label: 'Ceiling' },
  { key: 'restrooms', label: 'Restrooms' },
  { key: 'customerSatisfaction', label: 'Customer Satisfaction and Coordination' },
  { key: 'trash', label: 'Trash' },
  { key: 'projectCleaning', label: 'Project Cleaning' },
  { key: 'activitySupport', label: 'Activity Support' },
  { key: 'safetyCompliance', label: 'Safety and Compliance' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'monitoring', label: 'Monitoring' }
];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  inspections,
  custodialNotes,
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onToggle
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll into view when expanding so users see the content
  React.useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isOpen]);
  // Draft state to avoid auto-applying until user confirms
  const [draft, setDraft] = useState<FilterState>(filters);

  // Keep draft in sync when external filters reset (e.g., Clear All outside)
  React.useEffect(() => {
    setDraft(filters);
  }, [filters, isOpen]);
  // Get unique schools and inspectors
  const schools = Array.from(new Set(inspections.map(i => i.school).filter(Boolean))).sort();
  const inspectors = Array.from(new Set(inspections.map(i => i.inspectorName).filter(Boolean))).sort();

  const updateFilter = (key: keyof FilterState, value: any) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const applyDatePreset = (preset: keyof typeof FILTER_PRESETS) => {
    const presetDates = FILTER_PRESETS[preset];
    updateFilter('dateRange', presetDates);
  };

  const toggleArrayFilter = (key: 'schools' | 'severityLevels' | 'categories' | 'inspectors', value: string) => {
    const currentArray = (draft[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (draft.search) count++;
    if (draft.dateRange.from || draft.dateRange.to) count++;
    if (draft.schools.length > 0) count++;
    if (draft.severityLevels.length > 0) count++;
    if (draft.categories.length > 0) count++;
    if (draft.inspectors.length > 0) count++;
    if (draft.ratingThreshold > 0) count++;
    if (draft.inspectionType !== 'all') count++;
    if (draft.showProblemsOnly) count++;
    if (draft.hasCustodialNotes) count++;
    return count;
  };

  const getInspectorFullName = (initials: string) => {
    // Keep initials as-is for now, could be expanded with full names if available
    return initials;
  };

  const activeFilterCount = getActiveFilterCount();

  const applyDraft = () => {
    onFiltersChange(draft);
    onToggle();
  };

  const resetDraft = () => {
    onClearFilters();
    setDraft({
      search: '',
      dateRange: { from: null, to: null },
      schools: [],
      severityLevels: [],
      categories: [],
      inspectors: [],
      ratingThreshold: 0,
      inspectionType: 'all',
      showProblemsOnly: false,
      hasCustodialNotes: false
    });
  };

  return (
    <Card className="w-full" ref={containerRef}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onClearFilters();
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
            <CardDescription>
              Filter inspections by date, school, rating, and more
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by school, room, location, or notes..."
                value={draft.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={draft.dateRange.from?.getTime() === FILTER_PRESETS.last7Days.from.getTime() ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyDatePreset('last7Days')}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={draft.dateRange.from?.getTime() === FILTER_PRESETS.last30Days.from.getTime() ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyDatePreset('last30Days')}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={draft.dateRange.from?.getTime() === FILTER_PRESETS.thisMonth.from.getTime() ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyDatePreset('thisMonth')}
                >
                  This Month
                </Button>
                <Button
                  variant={draft.dateRange.from?.getTime() === FILTER_PRESETS.thisQuarter.from.getTime() ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyDatePreset('thisQuarter')}
                >
                  This Quarter
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom">From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                  value={draft.dateRange.from ? format(draft.dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => updateFilter('dateRange', {
                      ...draft.dateRange,
                      from: e.target.value ? new Date(e.target.value) : null
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                  value={draft.dateRange.to ? format(draft.dateRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => updateFilter('dateRange', {
                      ...draft.dateRange,
                      to: e.target.value ? new Date(e.target.value) : null
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Schools */}
            <div className="space-y-2">
              <Label>Schools</Label>
              <div className="flex flex-wrap gap-2">
                {schools.map(school => (
                  <Button
                    key={school}
                    variant={draft.schools.includes(school) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('schools', school)}
                  >
                    {school}
                  </Button>
                ))}
              </div>
            </div>

            {/* Severity Levels */}
            <div className="space-y-2">
              <Label>Severity Levels</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="critical"
                    checked={draft.severityLevels.includes('critical')}
                    onCheckedChange={() => toggleArrayFilter('severityLevels', 'critical')}
                  />
                  <Label htmlFor="critical" className="text-red-600">Critical (&lt; 2.0)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needs-attention"
                    checked={draft.severityLevels.includes('needs-attention')}
                    onCheckedChange={() => toggleArrayFilter('severityLevels', 'needs-attention')}
                  />
                  <Label htmlFor="needs-attention" className="text-orange-600">Needs Attention (2.0-3.0)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptable"
                    checked={draft.severityLevels.includes('acceptable')}
                    onCheckedChange={() => toggleArrayFilter('severityLevels', 'acceptable')}
                  />
                  <Label htmlFor="acceptable" className="text-green-600">Acceptable (&gt; 3.0)</Label>
                </div>
              </div>
            </div>

            {/* Rating Threshold */}
            <div className="space-y-2">
              <Label>Minimum Rating: {draft.ratingThreshold.toFixed(1)}</Label>
              <Slider
                value={[draft.ratingThreshold]}
                onValueChange={([value]) => updateFilter('ratingThreshold', value)}
                max={5}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0</span>
                <span>2.5</span>
                <span>5.0</span>
              </div>
            </div>

            {/* Categories - Collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-base font-medium">Categories</Label>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  {INSPECTION_CATEGORIES.map(category => (
                    <div key={category.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.key}
                    checked={draft.categories.includes(category.key)}
                        onCheckedChange={() => toggleArrayFilter('categories', category.key)}
                      />
                      <Label htmlFor={category.key} className="text-sm">{category.label}</Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Inspectors - Collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-base font-medium">Inspectors</Label>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="flex flex-wrap gap-2">
                  {inspectors.map(inspector => (
                    <Button
                      key={inspector}
                    variant={draft.inspectors.includes(inspector) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayFilter('inspectors', inspector)}
                      title={getInspectorFullName(inspector)}
                    >
                      {inspector}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Inspection Type */}
            <div className="space-y-2">
              <Label>Inspection Type</Label>
              <Select
                value={draft.inspectionType}
                onValueChange={(value: 'all' | 'single_room' | 'whole_building') => updateFilter('inspectionType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="single_room">Single Room</SelectItem>
                  <SelectItem value="whole_building">Whole Building</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Toggles */}
            <div className="space-y-2">
              <Label>Quick Filters</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="problemsOnly"
                    checked={draft.showProblemsOnly}
                    onCheckedChange={(checked) => updateFilter('showProblemsOnly', !!checked)}
                  />
                  <Label htmlFor="problemsOnly">Problems Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasNotes"
                    checked={draft.hasCustodialNotes}
                    onCheckedChange={(checked) => updateFilter('hasCustodialNotes', !!checked)}
                  />
                  <Label htmlFor="hasNotes">Has Custodial Notes</Label>
                </div>
              </div>
            </div>

            {/* Apply and Reset Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetDraft}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </Button>
              <Button
                onClick={applyDraft}
                className="flex items-center gap-2"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdvancedFilters;
