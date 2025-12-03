import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuildingScoreCard, type ScoringResult, type ComplianceStatus } from '@/components/building-score-card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, RefreshCw, TrendingUp, Building2, AlertTriangle } from 'lucide-react';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

interface SchoolScore {
  school: string;
  score: ScoringResult;
  complianceStatus: ComplianceStatus;
  dateRange: {
    start: string;
    end: string;
  };
}

interface ScoresDashboardProps {
  onBack?: () => void;
}

export default function ScoresDashboard({ onBack }: ScoresDashboardProps) {
  const { toast } = useToast();
  const { isMobile } = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schoolScores, setSchoolScores] = useState<SchoolScore[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredScores, setFilteredScores] = useState<SchoolScore[]>([]);

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchScores = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      // Add timeout to prevent hanging (15 second timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`/api/scores?${params.toString()}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch scores' }));
        throw new Error(errorData.message || 'Failed to fetch scores');
      }

      const data = await response.json();
      setSchoolScores(data.scores || []);
      setFilteredScores(data.scores || []);
    } catch (error) {
      console.error('Error fetching scores:', error);

      let errorDescription = 'Failed to load building scores. Please try again.';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorDescription = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorDescription = 'Unable to connect to the server. Please check your internet connection.';
        }
      }

      toast({
        title: 'Error',
        description: errorDescription,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchScores(startDate, endDate);
    }
  }, [startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScores(startDate, endDate);
  };

  const handleClearFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  };

  // Memoize expensive calculations that depend on schoolScores
  const { compliantCount, totalSchools, compliancePercentage, averageScore, topPerformer, needsAttention } = useMemo(() => {
    const compliant = schoolScores.filter(s => s.score.level2Compliant).length;
    const total = schoolScores.length;
    const percentage = total > 0 ? (compliant / total) * 100 : 0;

    const avgScore = schoolScores.length > 0
      ? schoolScores.reduce((sum, s) => sum + s.score.overallScore, 0) / schoolScores.length
      : 0;

    const top = schoolScores.length > 0
      ? schoolScores.reduce((prev, current) =>
          current.score.overallScore > prev.score.overallScore ? current : prev
        )
      : null;

    const attention = schoolScores.filter(s => s.score.overallScore < 3.0);

    return {
      compliantCount: compliant,
      totalSchools: total,
      compliancePercentage: percentage,
      averageScore: avgScore,
      topPerformer: top,
      needsAttention: attention
    };
  }, [schoolScores]);

  if (loading && !refreshing) {
    return <LoadingOverlay message="Loading building scores..." />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Building Scores Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track custodial performance across all campuses
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Filter by Date Range
              </CardTitle>
              <CardDescription>View scores for a specific time period</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button variant="secondary" onClick={handleClearFilters} className="w-full">
                Last 30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Schools</CardDescription>
            <CardTitle className="text-3xl">{totalSchools}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Monitored campuses</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Level 2 Compliance</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {compliancePercentage.toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {compliantCount} of {totalSchools} schools ≥3.0
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Network Average</CardDescription>
            <CardTitle className="text-3xl">{averageScore.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Across all schools
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Needs Attention</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {needsAttention.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>Below Level 2</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performer Highlight */}
      {topPerformer && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Top Performer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <BuildingScoreCard
              school={topPerformer.school}
              score={topPerformer.score}
              complianceStatus={topPerformer.complianceStatus}
              dateRange={topPerformer.dateRange}
              compact={isMobile}
            />
          </CardContent>
        </Card>
      )}

      {/* Schools Needing Attention */}
      {needsAttention.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-lg">Schools Needing Attention</CardTitle>
            </div>
            <CardDescription>
              {needsAttention.length} {needsAttention.length === 1 ? 'school is' : 'schools are'} below Level 2 standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {needsAttention.map((schoolScore) => (
                <BuildingScoreCard
                  key={schoolScore.school}
                  school={schoolScore.school}
                  score={schoolScore.score}
                  complianceStatus={schoolScore.complianceStatus}
                  dateRange={schoolScore.dateRange}
                  compact
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All School Scores */}
      <Card>
        <CardHeader>
          <CardTitle>All School Scores</CardTitle>
          <CardDescription>
            Showing {schoolScores.length} schools sorted by overall score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schoolScores.map((schoolScore) => (
              <BuildingScoreCard
                key={schoolScore.school}
                school={schoolScore.school}
                score={schoolScore.score}
                complianceStatus={schoolScore.complianceStatus}
                dateRange={schoolScore.dateRange}
                compact
              />
            ))}
          </div>
          {schoolScores.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No scores available for the selected date range.</p>
              <p className="text-sm mt-2">Try adjusting your date filters or refresh the page.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
