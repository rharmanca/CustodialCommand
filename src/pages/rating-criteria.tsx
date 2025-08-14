import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Star, BookOpen } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ratingDescriptions, inspectionCategories } from '../../shared/custodial-criteria';

interface RatingCriteriaPageProps {
  onBack?: () => void;
}

export default function RatingCriteriaPage({ onBack }: RatingCriteriaPageProps) {
  const { isMobile } = useIsMobile();

  const renderStarDisplay = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6">
        {onBack && (
          <div className="flex justify-start mb-4">
            <Button variant="outline" onClick={onBack} className="flex-shrink-0">
              ← Back
            </Button>
          </div>
        )}

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Rating Criteria Reference</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Complete reference guide for custodial inspection ratings. Use this to understand what each star rating means and the specific criteria for each category.
          </p>
        </div>
      </div>

      {/* General Rating Scale */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            General Rating Scale
          </CardTitle>
          <CardDescription>
            This 5-star scale applies to all inspection categories
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {ratingDescriptions.map((rating, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex-shrink-0">
                  {renderStarDisplay(index + 1)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 mb-1">
                    {rating.label}
                  </div>
                  <div className="text-gray-700">
                    {rating.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category-Specific Criteria */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Category-Specific Criteria</h2>
          <p className="text-muted-foreground">
            Detailed criteria for each inspection category showing what qualifies for each star rating
          </p>
        </div>

        <div className="grid gap-6">
          {inspectionCategories.map((category) => (
            <Card key={category.key} className="border border-gray-200">
              <CardHeader className="bg-accent/10">
                <CardTitle className="text-xl text-primary">
                  {category.label}
                </CardTitle>
                <CardDescription>
                  Specific criteria for rating {category.label.toLowerCase()} cleanliness and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {category.criteria ? (
                  <div className="space-y-4">
                    {Object.entries(category.criteria).map(([rating, criteria]) => (
                      <div key={rating} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          {renderStarDisplay(parseInt(rating))}
                          <Badge variant="outline" className="text-sm">
                            {parseInt(rating)} Star{parseInt(rating) > 1 ? 's' : ''}
                          </Badge>
                          <span className="font-medium text-primary">
                            {ratingDescriptions[parseInt(rating) - 1]?.label}
                          </span>
                        </div>
                        <div className="text-gray-700 leading-relaxed">
                          {criteria}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Detailed criteria for this category will be available soon.</p>
                    <p className="text-sm mt-1">Use the general rating scale above for guidance.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Tips */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Use This Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-800">
          <div>
            <strong>During Inspections:</strong> Reference this page to ensure consistent and accurate ratings across all categories.
          </div>
          <div>
            <strong>For Training:</strong> Use this as a training guide for new inspectors to understand rating standards.
          </div>
          <div>
            <strong>For Consistency:</strong> When multiple inspectors are involved, this ensures everyone applies the same standards.
          </div>
          <div>
            <strong>For Documentation:</strong> Print or bookmark this page for offline reference during field inspections.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}