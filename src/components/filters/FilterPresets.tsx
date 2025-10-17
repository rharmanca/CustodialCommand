import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Calendar, School, TrendingDown } from 'lucide-react';
import type { FilterState } from './AdvancedFilters';

// Helper to ensure boolean values are never null
const ensureBoolean = (value: boolean | null | undefined): boolean => value ?? false;

// Helper to ensure all boolean fields are properly typed
const ensureFilterState = (filters: FilterState): FilterState => ({
  ...filters,
  showProblemsOnly: Boolean(filters.showProblemsOnly),
  hasCustodialNotes: Boolean(filters.hasCustodialNotes)
});

interface FilterPreset {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  applyFilter: (currentFilters: FilterState) => FilterState;
  isActive: (filters: FilterState) => boolean;
}

interface FilterPresetsProps {
  filters: FilterState;
  onApplyPreset: (newFilters: FilterState) => void;
  schools: string[];
}

const FilterPresets: React.FC<FilterPresetsProps> = ({
  filters,
  onApplyPreset,
  schools
}) => {
  const presets: FilterPreset[] = [
    {
      id: 'critical-only',
      label: 'Critical Only',
      description: 'Show only critical issues (rating < 2.0)',
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      applyFilter: (current) => ({
        ...current,
        severityLevels: ['critical'],
        showProblemsOnly: true,
        ratingThreshold: 0
      }),
      isActive: (current) => 
        current.severityLevels.length === 1 && 
        current.severityLevels.includes('critical') &&
        ensureBoolean(current.showProblemsOnly)
    },
    {
      id: 'asa-issues',
      label: 'ASA Issues',
      description: 'Focus on ASA school problems',
      icon: <School className="w-4 h-4 text-orange-600" />,
      applyFilter: (current) => ({
        ...current,
        schools: ['ASA School'],
        severityLevels: ['critical', 'needs-attention'],
        showProblemsOnly: true
      }),
      isActive: (current) => 
        current.schools.length === 1 && 
        current.schools.includes('ASA School') &&
        ensureBoolean(current.showProblemsOnly)
    },
    {
      id: 'gwc-issues',
      label: 'GWC Issues',
      description: 'Focus on GWC school problems',
      icon: <School className="w-4 h-4 text-orange-600" />,
      applyFilter: (current) => ({
        ...current,
        schools: ['GWC School'],
        severityLevels: ['critical', 'needs-attention'],
        showProblemsOnly: true
      }),
      isActive: (current) => 
        current.schools.length === 1 && 
        current.schools.includes('GWC School') &&
        ensureBoolean(current.showProblemsOnly)
    },
    {
      id: 'recent-problems',
      label: 'Recent Problems',
      description: 'Problems from last 30 days',
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      applyFilter: (current) => ({
        ...current,
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        },
        severityLevels: ['critical', 'needs-attention'],
        showProblemsOnly: true
      }),
      isActive: (current) => {
        const safe = ensureFilterState(current);
        return safe.showProblemsOnly === true &&
          current.severityLevels.includes('critical') &&
          current.severityLevels.includes('needs-attention') &&
          Boolean(current.dateRange.from) &&
          Math.abs(current.dateRange.from!.getTime() - (Date.now() - 30 * 24 * 60 * 60 * 1000)) < 24 * 60 * 60 * 1000;
      }
    },
    {
      id: 'urgent-notes',
      label: 'Urgent Notes',
      description: 'Show inspections with urgent custodial notes',
      icon: <AlertCircle className="w-4 h-4 text-red-600" />,
      applyFilter: (current) => ({
        ...current,
        hasCustodialNotes: true,
        severityLevels: ['critical', 'needs-attention'],
        showProblemsOnly: true
      }),
      isActive: (current) => 
        ensureBoolean(current.hasCustodialNotes) === true &&
        ensureBoolean(current.showProblemsOnly) === true &&
        current.severityLevels.includes('critical')
    },
    {
      id: 'low-performance',
      label: 'Low Performance',
      description: 'All ratings below 3.0',
      icon: <TrendingDown className="w-4 h-4 text-orange-600" />,
      applyFilter: (current) => ({
        ...current,
        ratingThreshold: 0,
        severityLevels: ['critical', 'needs-attention'],
        showProblemsOnly: true
      }),
      isActive: (current) => 
        current.ratingThreshold === 0 &&
        ensureBoolean(current.showProblemsOnly) &&
        current.severityLevels.includes('critical') &&
        current.severityLevels.includes('needs-attention')
    },
    {
      id: 'this-month',
      label: 'This Month',
      description: 'All inspections from current month',
      icon: <Calendar className="w-4 h-4 text-green-600" />,
      applyFilter: (current) => ({
        ...current,
        dateRange: {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date()
        },
        schools: [],
        severityLevels: [],
        showProblemsOnly: false
      }),
      isActive: (current) => {
        const safe = ensureFilterState(current);
        return Boolean(current.dateRange.from) &&
          current.dateRange.from!.getMonth() === new Date().getMonth() &&
          current.dateRange.from!.getFullYear() === new Date().getFullYear() &&
          safe.showProblemsOnly === false;
      }
    },
    {
      id: 'all-schools',
      label: 'All Schools',
      description: 'Show all schools with problems',
      icon: <School className="w-4 h-4 text-purple-600" />,
      applyFilter: (current) => ({
        ...current,
        schools: schools,
        severityLevels: ['critical', 'needs-attention'],
        showProblemsOnly: true
      }),
      isActive: (current) => 
        current.schools.length === schools.length &&
        ensureBoolean(current.showProblemsOnly) &&
        current.severityLevels.includes('critical') &&
        current.severityLevels.includes('needs-attention')
    }
  ];

  const handlePresetClick = (preset: FilterPreset) => {
    const newFilters = preset.applyFilter(filters);
    onApplyPreset(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Quick Filters</h3>
        <Badge variant="outline" className="text-xs">
          {presets.filter(p => p.isActive(filters)).length} active
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {presets.map(preset => {
          const isActive = preset.isActive(filters);
          
          return (
            <Button
              key={preset.id}
              variant={isActive ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start gap-2 text-left"
              onClick={() => handlePresetClick(preset)}
            >
              <div className="flex items-center gap-2 w-full">
                {preset.icon}
                <span className="font-medium text-sm">{preset.label}</span>
                {isActive && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {preset.description}
              </p>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterPresets;
