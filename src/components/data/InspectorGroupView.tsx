import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, TrendingUp, Award } from 'lucide-react';
import type { Inspection } from '../../../shared/schema';
import GroupedInspectionCard from './GroupedInspectionCard';

interface InspectorGroupViewProps {
  inspections: Inspection[];
  onInspectionClick?: (inspection: Inspection) => void;
}

const InspectorGroupView: React.FC<InspectorGroupViewProps> = ({
  inspections,
  onInspectionClick
}) => {
  // Group inspections by inspector
  const inspectorGroups = inspections.reduce((acc, inspection) => {
    const inspectorName = inspection.inspectorName || 'Unknown Inspector';
    if (!acc[inspectorName]) {
      acc[inspectorName] = [];
    }
    acc[inspectorName].push(inspection);
    return acc;
  }, {} as Record<string, Inspection[]>);

  // Sort inspectors by total inspections (descending)
  const sortedInspectors = Object.entries(inspectorGroups)
    .sort(([, a], [, b]) => b.length - a.length);

  // Calculate overall statistics
  const totalInspectors = sortedInspectors.length;
  const totalInspections = inspections.length;
  const avgInspectionsPerInspector = totalInspectors > 0 ? Math.round((totalInspections / totalInspectors) * 10) / 10 : 0;

  // Find top performer
  const topInspector = sortedInspectors[0];
  const topInspectorCount = topInspector?.[1].length || 0;

  return (
    <div className="space-y-6">
      {/* Inspector Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <User className="w-5 h-5 text-primary" />
            Inspector Performance Overview
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Inspections grouped by inspector with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <User className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{totalInspectors}</p>
              <p className="text-sm text-muted-foreground">Active Inspectors</p>
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
                <Award className="w-6 h-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{avgInspectionsPerInspector}</p>
              <p className="text-sm text-muted-foreground">Avg per Inspector</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performer Highlight */}
      {topInspector && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Award className="w-5 h-5" />
              Top Performer: {topInspector[0]}
            </CardTitle>
            <CardDescription>
              {topInspectorCount} inspections completed
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Inspector Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Inspectors ({totalInspectors})
        </h3>
        
        {sortedInspectors.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Inspector Data</h3>
              <p className="text-muted-foreground">No inspection data available for inspector grouping.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedInspectors.map(([inspectorName, inspectorInspections]) => (
              <GroupedInspectionCard
                key={inspectorName}
                groupName={inspectorName}
                inspections={inspectorInspections}
                type="inspector"
                onInspectionClick={onInspectionClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorGroupView;
