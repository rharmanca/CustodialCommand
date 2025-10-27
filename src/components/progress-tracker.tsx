import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  completed: Record<string, number>;
  requirements: Record<string, number>;
  categoryLabels: Record<string, string>;
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = memo(({
  completed,
  requirements,
  categoryLabels,
  className
}) => {
  // Calculate overall progress
  const totalRequired = Object.values(requirements).reduce((sum, count) => sum + count, 0);
  const totalCompleted = Object.values(completed).reduce((sum, count) => sum + count, 0);
  const overallProgress = Math.round((totalCompleted / totalRequired) * 100);

  // Count completed categories
  const completedCategories = Object.keys(requirements).filter(category => 
    completed[category] >= requirements[category]
  ).length;
  const totalCategories = Object.keys(requirements).length;

  // Get status summary
  const getStatusSummary = () => {
    if (overallProgress === 100) {
      return {
        text: 'Inspection Complete!',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (overallProgress > 0) {
      return {
        text: 'In Progress',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    } else {
      return {
        text: 'Not Started',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  const status = getStatusSummary();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Inspection Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <Badge 
              variant="secondary"
              className={cn('flex items-center gap-1', status.color, status.bgColor, status.borderColor)}
            >
              {overallProgress === 100 ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              {status.text}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{totalCompleted} of {totalRequired} inspections completed</span>
              <span>{overallProgress}%</span>
            </div>
          </div>
        </div>

        {/* Category Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Category Progress</h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(requirements).map(([category, required]) => {
              const completedCount = completed[category] || 0;
              const isComplete = completedCount >= required;
              const categoryProgress = Math.round((completedCount / required) * 100);
              
              return (
                <div 
                  key={category}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border',
                    isComplete 
                      ? 'bg-green-50 border-green-200' 
                      : completedCount > 0 
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {categoryLabels[category]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{required}
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          isComplete 
                            ? 'bg-green-500' 
                            : completedCount > 0 
                              ? 'bg-yellow-500' 
                              : 'bg-gray-300'
                        )}
                        style={{ width: `${categoryProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {completedCategories}
            </div>
            <div className="text-xs text-muted-foreground">
              Categories Complete
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {totalCompleted}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Inspections
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {overallProgress}%
            </div>
            <div className="text-xs text-muted-foreground">
              Overall Progress
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProgressTracker.displayName = 'ProgressTracker';

export default ProgressTracker;
