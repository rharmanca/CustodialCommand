import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectionCategoryCardProps {
  category: string;
  label: string;
  required: number;
  completed: number;
  isCompleted: boolean;
  onSelect: (category: string) => void;
  disabled?: boolean;
  className?: string;
}

export const InspectionCategoryCard: React.FC<InspectionCategoryCardProps> = memo(({
  category,
  label,
  required,
  completed,
  isCompleted,
  onSelect,
  disabled = false,
  className
}) => {
  const progressPercentage = Math.round((completed / required) * 100);
  const remaining = required - completed;

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 border-green-300 text-green-800';
    if (completed > 0) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getStatusIcon = () => {
    if (isCompleted) return <Check className="w-4 h-4" />;
    if (completed > 0) return <Clock className="w-4 h-4" />;
    return <Play className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isCompleted) return 'Complete';
    if (completed > 0) return 'In Progress';
    return 'Not Started';
  };

  return (
    <Card className={cn(
      isCompleted ? 'ring-2 ring-green-200' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {label}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={cn('flex items-center gap-1', getStatusColor())}
          >
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Progress: {completed}/{required}
            </span>
            <span className="text-muted-foreground">
              {progressPercentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isCompleted 
                  ? 'bg-green-500' 
                  : completed > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-300'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Information */}
        <div className="text-sm text-muted-foreground">
          {isCompleted ? (
            <span className="text-green-600 font-medium">
              ✅ All {required} inspections completed
            </span>
          ) : remaining > 0 ? (
            <span>
              {remaining} more inspection{remaining > 1 ? 's' : ''} needed
            </span>
          ) : (
            <span>Ready to start</span>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onSelect(category)}
          disabled={disabled}
          variant={isCompleted ? "outline" : "default"}
          className={cn(
            'w-full',
            isCompleted 
              ? 'border-green-300 text-green-700 hover:bg-green-50' 
              : ''
          )}
        >
          {isCompleted ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              View Completed
            </>
          ) : completed > 0 ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Continue ({remaining} left)
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Inspection
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

InspectionCategoryCard.displayName = 'InspectionCategoryCard';

export default InspectionCategoryCard;
