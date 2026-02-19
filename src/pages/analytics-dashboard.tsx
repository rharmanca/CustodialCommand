import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PerformanceTrendChart from "@/components/charts/PerformanceTrendChart";
import SchoolComparisonChart from "@/components/charts/SchoolComparisonChart";
import { TrendingUp, AlertCircle, Download, Loader2 } from "lucide-react";

interface TrendRow {
  month: string;
  avgRating: number;
  inspectionCount: number;
}

interface ComparisonRow {
  school: string;
  avgRating: number;
  inspectionCount: number;
  completedCount: number;
}

interface AnalyticsDashboardProps {
  onBack: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"trends" | "comparison">("comparison");
  const [school, setSchool] = useState("");
  const [months, setMonths] = useState(6);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [trendsData, setTrendsData] = useState<TrendRow[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getToken = (): string | null => {
    return sessionStorage.getItem("adminToken");
  };

  const authHeaders = useCallback((): HeadersInit => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchComparison = useCallback(async (sd?: string, ed?: string) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sd) params.set("startDate", sd);
      if (ed) params.set("endDate", ed);
      const res = await fetch(`/api/analytics/comparison?${params}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setComparisonData(json.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load comparison data");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchTrends = useCallback(async (s: string, m: number) => {
    const token = getToken();
    if (!token || !s) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ school: s, months: String(m) });
      const res = await fetch(`/api/analytics/trends?${params}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTrendsData(json.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load trends data");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // Initial load — comparison data (populates school list too)
  useEffect(() => {
    fetchComparison(startDate, endDate);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Set default school from comparison data
  useEffect(() => {
    if (comparisonData.length > 0 && !school) {
      setSchool(comparisonData[0].school);
    }
  }, [comparisonData, school]);

  // Debounced re-fetch on filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (activeTab === "comparison") {
        fetchComparison(startDate, endDate);
      } else if (activeTab === "trends" && school) {
        fetchTrends(school, months);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeTab, school, months, startDate, endDate, fetchComparison, fetchTrends]);

  const handleExportCsv = async () => {
    const token = getToken();
    if (!token) return;
    setCsvLoading(true);
    try {
      const params = new URLSearchParams();
      if (school && activeTab === "trends") params.set("school", school);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/export/inspections.csv?${params}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inspections.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message ?? "CSV export failed");
    } finally {
      setCsvLoading(false);
    }
  };

  const token = getToken();

  if (!token) {
    return (
      <div className="min-h-screen bg-background p-4">
        <button onClick={onBack} className="mb-4 text-sm text-muted-foreground underline">
          ← Back
        </button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Admin login required to view analytics.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Map API data to chart props
  const trendChartData = trendsData.map((r) => ({
    date: r.month,
    averageRating: r.avgRating,
    totalInspections: r.inspectionCount,
  }));

  const comparisonChartData = comparisonData.map((r) => ({
    school: r.school,
    averageRating: r.avgRating,
    totalInspections: r.inspectionCount,
    singleRoomCount: 0,
    wholeBuildingCount: 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to main menu"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 flex-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Analytics Dashboard</h1>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={csvLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          aria-label="Export inspections as CSV"
        >
          {csvLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </button>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "trends" | "comparison")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="comparison" className="flex-1">
              School Comparison
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">
              School Trends
            </TabsTrigger>
          </TabsList>

          {/* ── Comparison Tab ── */}
          <TabsContent value="comparison" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Date Range</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : comparisonChartData.length === 0 ? (
              <Alert>
                <AlertDescription>No data for selected date range.</AlertDescription>
              </Alert>
            ) : (
              <SchoolComparisonChart
                data={comparisonChartData}
                title="School Performance Comparison"
                description={`Comparing all schools from ${startDate} to ${endDate}`}
              />
            )}
          </TabsContent>

          {/* ── Trends Tab ── */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">School</label>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
                  >
                    <option value="">Select a school…</option>
                    {comparisonData.map((r) => (
                      <option key={r.school} value={r.school}>
                        {r.school}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">Time Range</label>
                  <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
                  >
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                    <option value={24}>Last 24 months</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !school ? (
              <Alert>
                <AlertDescription>Select a school to view trend data.</AlertDescription>
              </Alert>
            ) : trendChartData.length === 0 ? (
              <Alert>
                <AlertDescription>No completed inspections found for {school} in the last {months} months.</AlertDescription>
              </Alert>
            ) : (
              <PerformanceTrendChart
                data={trendChartData}
                title={`${school} — Monthly Trends`}
                description={`Average ratings over the last ${months} months`}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
