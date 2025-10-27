import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, TrendingUp, Users } from 'lucide-react';
import type { Inspection } from '../../../shared/schema';
import GroupedInspectionCard from './GroupedInspectionCard';

interface SchoolGroupViewProps {
  inspections: Inspection[];
  onInspectionClick?: (inspection: Inspection) => void;
}

const SchoolGroupView: React.FC<SchoolGroupViewProps> = ({
  inspections,
  onInspectionClick
}) => {
  // Group inspections by school
  const schoolGroups = inspections.reduce((acc, inspection) => {
    if (!acc[inspection.school]) {
      acc[inspection.school] = [];
    }
    acc[inspection.school].push(inspection);
    return acc;
  }, {} as Record<string, Inspection[]>);

  // Sort schools by total inspections (descending)
  const sortedSchools = Object.entries(schoolGroups)
    .sort(([, a], [, b]) => b.length - a.length);

  // Calculate overall statistics
  const totalSchools = sortedSchools.length;
  const totalInspections = inspections.length;
  const avgInspectionsPerSchool = totalSchools > 0 ? Math.round((totalInspections / totalSchools) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* School Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building className="w-5 h-5 text-primary" />
            School Performance Overview
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Inspections grouped by school with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{totalSchools}</p>
              <p className="text-sm text-muted-foreground">Total Schools</p>
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
                <Users className="w-6 h-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{avgInspectionsPerSchool}</p>
              <p className="text-sm text-muted-foreground">Avg per School</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          Schools ({totalSchools})
        </h3>
        
        {sortedSchools.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No School Data</h3>
              <p className="text-muted-foreground">No inspection data available for school grouping.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedSchools.map(([schoolName, schoolInspections]) => (
              <GroupedInspectionCard
                key={schoolName}
                groupName={schoolName}
                inspections={schoolInspections}
                type="school"
                onInspectionClick={onInspectionClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolGroupView;
