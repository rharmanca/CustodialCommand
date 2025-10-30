import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Building, Calendar, User, Star, MapPin, FileText } from 'lucide-react';
import type { Inspection } from '../../../shared/schema';

interface GroupedInspectionCardProps {
  groupName: string;
  inspections: Inspection[];
  type: 'school' | 'date' | 'inspector';
  onInspectionClick?: (inspection: Inspection) => void;
}

const GroupedInspectionCard: React.FC<GroupedInspectionCardProps> = ({
  groupName,
  inspections,
  type,
  onInspectionClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate group statistics
  const totalInspections = inspections.length;
  const ratings = inspections
    .map(inspection => {
      const categories = [
        'floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms',
        'customerSatisfaction', 'trash', 'projectCleaning', 'activitySupport',
        'safetyCompliance', 'equipment', 'monitoring'
      ];
      
      const validRatings = categories
        .map(cat => inspection[cat as keyof Inspection] as number | null | undefined)
        .filter((rating): rating is number => typeof rating === 'number');
      
      return validRatings.length > 0 
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        : null;
    })
    .filter((rating): rating is number => rating !== null);

  const averageRating = ratings.length > 0 
    ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
    : 0;

  const dateRange = inspections.length > 0 
    ? {
        earliest: new Date(Math.min(...inspections.map(i => new Date(i.date).getTime()))),
        latest: new Date(Math.max(...inspections.map(i => new Date(i.date).getTime())))
      }
    : null;

  const getIcon = () => {
    switch (type) {
      case 'school':
        return <Building className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'inspector':
        return <User className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'school':
        return 'School';
      case 'date':
        return 'Month';
      case 'inspector':
        return 'Inspector';
      default:
        return 'Group';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const formatDateRange = () => {
    if (!dateRange) return '';
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(dateRange.earliest)} - ${formatDate(dateRange.latest)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-foreground">{groupName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalInspections} inspections
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {getTypeLabel()}: {groupName}
            </span>
            {dateRange && (
              <span className="text-xs text-muted-foreground">
                {formatDateRange()}
              </span>
            )}
          </div>
          {averageRating > 0 && (
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating))}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Group Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalInspections}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">
                  {inspections.filter(i => i.inspectionType === 'single_room').length}
                </p>
                <p className="text-xs text-muted-foreground">Single Room</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">
                  {inspections.filter(i => i.inspectionType === 'whole_building').length}
                </p>
                <p className="text-xs text-muted-foreground">Building</p>
              </div>
            </div>

            {/* Individual Inspections */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground mb-2">Individual Inspections</h4>
              {inspections
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((inspection) => {
                  const inspectionRating = (() => {
                    const categories = [
                      'floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms',
                      'customerSatisfaction', 'trash', 'projectCleaning', 'activitySupport',
                      'safetyCompliance', 'equipment', 'monitoring'
                    ];
                    
                    const validRatings = categories
                      .map(cat => inspection[cat as keyof Inspection] as number | null | undefined)
                      .filter((rating): rating is number => typeof rating === 'number');
                    
                    return validRatings.length > 0 
                      ? Math.round((validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length) * 10) / 10
                      : 0;
                  })();

                  return (
                    <div
                      key={inspection.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onInspectionClick?.(inspection)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {inspection.inspectionType === 'single_room' 
                              ? `Room ${inspection.roomNumber ?? 'Not specified'}` 
                              : `Building: ${inspection.buildingName || inspection.locationDescription || 'Whole Building'}`
                            }
                          </span>
                        </div>
                        <Badge 
                          variant={inspection.inspectionType === 'single_room' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {inspection.inspectionType === 'single_room' ? 'Single Room' : 'Whole Building'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {inspectionRating > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(Math.round(inspectionRating))}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(inspection.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default GroupedInspectionCard;
