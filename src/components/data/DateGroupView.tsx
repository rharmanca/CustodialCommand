import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import type { Inspection } from '../../../shared/schema';
import GroupedInspectionCard from './GroupedInspectionCard';

interface DateGroupViewProps {
  inspections: Inspection[];
  onInspectionClick?: (inspection: Inspection) => void;
}

const DateGroupView: React.FC<DateGroupViewProps> = ({
  inspections,
  onInspectionClick
}) => {
  // Group inspections by month (YYYY-MM format)
  const monthGroups = inspections.reduce((acc, inspection) => {
    const date = new Date(inspection.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthName,
        inspections: []
      };
    }
    acc[monthKey].inspections.push(inspection);
    return acc;
  }, {} as Record<string, { monthName: string; inspections: Inspection[] }>);

  // Sort months by date (newest first)
  const sortedMonths = Object.entries(monthGroups)
    .sort(([a], [b]) => b.localeCompare(a));

  // Calculate overall statistics
  const totalMonths = sortedMonths.length;
  const totalInspections = inspections.length;
  const avgInspectionsPerMonth = totalMonths > 0 ? Math.round((totalInspections / totalMonths) * 10) / 10 : 0;

  // Get current month stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthData = monthGroups[currentMonth];
  const currentMonthInspections = currentMonthData?.inspections.length || 0;

  return (
    <div className="space-y-6">
      {/* Monthly Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            Monthly Performance Overview
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Inspections grouped by month with trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{totalMonths}</p>
              <p className="text-sm text-muted-foreground">Active Months</p>
            </div>
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{totalInspections}</p>
              <p className="text-sm text-muted-foreground">Total Inspections</p>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{avgInspectionsPerMonth}</p>
              <p className="text-sm text-muted-foreground">Avg per Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Month Highlight */}
      {currentMonthData && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" />
              Current Month: {currentMonthData.monthName}
            </CardTitle>
            <CardDescription>
              {currentMonthInspections} inspections this month
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Monthly Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Monthly Breakdown ({totalMonths} months)
        </h3>
        
        {sortedMonths.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Monthly Data</h3>
              <p className="text-muted-foreground">No inspection data available for monthly grouping.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedMonths.map(([monthKey, monthData]) => (
              <GroupedInspectionCard
                key={monthKey}
                groupName={monthData.monthName}
                inspections={monthData.inspections}
                type="date"
                onInspectionClick={onInspectionClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateGroupView;
