import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export interface CategoryScore {
  category: string;
  averageRating: number;
  count: number;
}

export interface ScoringResult {
  overallScore: number;
  inspectionScore: number;
  notesModifier: number;
  level2Compliant: boolean;
  inspectionCount: number;
  notesCount: number;
  categoryBreakdown?: CategoryScore[];
}

export interface ComplianceStatus {
  text: string;
  color: 'green' | 'yellow' | 'red';
}

interface BuildingScoreCardProps {
  school: string;
  score: ScoringResult;
  complianceStatus: ComplianceStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  compact?: boolean;
}

export function BuildingScoreCard({
  school,
  score,
  complianceStatus,
  dateRange,
  compact = false
}: BuildingScoreCardProps) {
  const scorePercentage = (score.overallScore / 5) * 100;

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 4.0) return 'text-green-700';
    if (scoreValue >= 3.0) return 'text-green-600';
    if (scoreValue >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (scoreValue: number) => {
    if (scoreValue >= 4.0) return 'bg-green-600';
    if (scoreValue >= 3.0) return 'bg-green-500';
    if (scoreValue >= 2.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBadgeVariant = (color: string) => {
    switch (color) {
      case 'green':
        return 'default';
      case 'yellow':
        return 'secondary';
      case 'red':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{school}</CardTitle>
            <Badge variant={getBadgeVariant(complianceStatus.color)}>
              {score.level2Compliant ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {complianceStatus.text}
            </Badge>
          </div>
          {dateRange && (
            <CardDescription className="text-xs">
              {dateRange.start} to {dateRange.end}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold" style={{ color: getScoreColor(score.overallScore) }}>
                {score.overallScore.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
            <Progress value={scorePercentage} className={getProgressColor(score.overallScore)} />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Inspections</div>
                <div className="font-semibold">{score.inspectionCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Notes</div>
                <div className="font-semibold">{score.notesCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Rating</div>
                <div className="font-semibold">{score.inspectionScore.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{school}</CardTitle>
            {dateRange && (
              <CardDescription>
                Period: {dateRange.start} to {dateRange.end}
              </CardDescription>
            )}
          </div>
          <Badge variant={getBadgeVariant(complianceStatus.color)} className="text-sm px-3 py-1">
            {score.level2Compliant ? (
              <CheckCircle className="w-4 h-4 mr-1" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-1" />
            )}
            {complianceStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className="text-6xl font-bold" style={{ color: getScoreColor(score.overallScore) }}>
            {score.overallScore.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Overall Building Score (out of 5.0)</div>
          <Progress value={scorePercentage} className={`h-3 ${getProgressColor(score.overallScore)}`} />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Inspection Average</div>
            <div className="text-2xl font-bold">{score.inspectionScore.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">75% weight • {score.inspectionCount} inspections</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Notes Impact</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {score.notesModifier > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : score.notesModifier < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : null}
              {score.notesModifier > 0 ? '+' : ''}{score.notesModifier.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">25% weight • {score.notesCount} notes</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {score.categoryBreakdown && score.categoryBreakdown.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="text-sm font-medium">Category Breakdown</div>
            <div className="space-y-2">
              {score.categoryBreakdown
                .filter(cat => cat.count > 0)
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, 5)
                .map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <span className="text-sm">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(category.averageRating / 5) * 100}
                        className="w-24 h-2"
                      />
                      <span className="text-sm font-semibold w-12 text-right">
                        {category.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            {score.categoryBreakdown.filter(cat => cat.count > 0).length > 5 && (
              <div className="text-xs text-muted-foreground text-center">
                Showing top 5 categories
              </div>
            )}
          </div>
        )}

        {/* Compliance Threshold Indicator */}
        <div className={`p-3 rounded-lg border ${
          score.level2Compliant
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            {score.level2Compliant ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <div className="text-sm">
              {score.level2Compliant ? (
                <span className="font-semibold text-green-800">
                  Meets Level 2 Standards (≥3.0)
                </span>
              ) : (
                <span className="font-semibold text-yellow-800">
                  Below Level 2 Standards (target: ≥3.0)
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
