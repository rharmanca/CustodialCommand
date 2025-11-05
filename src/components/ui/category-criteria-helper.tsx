import { HelpCircle, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoryCriteriaHelperProps {
  categoryLabel: string;
  criteria: Record<number, string>;
}

export function CategoryCriteriaHelper({ categoryLabel, criteria }: CategoryCriteriaHelperProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2 hover:bg-blue-100 rounded-full"
          type="button"
        >
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <span className="sr-only">View criteria for {categoryLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto" align="start">
        <div className="space-y-3">
          <div className="font-semibold text-sm border-b pb-2">
            {categoryLabel} - Rating Criteria
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <Card key={rating} className="border-l-4" style={{
                borderLeftColor: rating >= 4 ? '#10B981' : rating >= 3 ? '#F59E0B' : '#EF4444'
              }}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Rating {rating}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {criteria[rating]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MobileCategoryCriteriaHelper({ categoryLabel, criteria }: CategoryCriteriaHelperProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 text-xs"
          type="button"
        >
          <HelpCircle className="h-3 w-3 mr-2" />
          View Rating Guide
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-80 overflow-y-auto" align="center">
        <div className="space-y-3">
          <div className="font-semibold text-sm border-b pb-2">
            {categoryLabel} - Rating Criteria
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <Card key={rating} className="border-l-4" style={{
                borderLeftColor: rating >= 4 ? '#10B981' : rating >= 3 ? '#F59E0B' : '#EF4444'
              }}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Rating {rating}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {criteria[rating]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
