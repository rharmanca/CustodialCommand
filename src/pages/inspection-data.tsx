import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Building, Star, FileText, Image as ImageIcon, BarChart3, TrendingUp, Download, Clock, Target, Users, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import type { Inspection, CustodialNote } from '../../shared/schema';
import { LoadingState } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

// Import new chart components
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import SchoolComparisonChart from '@/components/charts/SchoolComparisonChart';
import CategoryRadarChart from '@/components/charts/CategoryRadarChart';
import KPICard from '@/components/charts/KPICard';
import RoomHeatmap from '@/components/charts/RoomHeatmap';

// Import grouped view components
import SchoolGroupView from '@/components/data/SchoolGroupView';
import DateGroupView from '@/components/data/DateGroupView';
import InspectorGroupView from '@/components/data/InspectorGroupView';

// Import Problem Areas component
import ProblemAreasView from '@/components/reports/ProblemAreasView';

// Import filter components
import AdvancedFilters, { type FilterState } from '@/components/filters/AdvancedFilters';
import FilterPresets from '@/components/filters/FilterPresets';

// Import export components
import ExportDialog from '@/components/reports/ExportDialog';
import PDFExportWizard from '@/components/reports/PDFExportWizard';
import { generateIssuesReport, type IssuesReportData } from '@/utils/printReportGenerator';
import { useToast } from '@/hooks/use-toast';

interface InspectionDataPageProps {
  onBack?: () => void;
}

export default function InspectionDataPage({ onBack }: InspectionDataPageProps) {
  const { toast } = useToast();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [custodialNotes, setCustodialNotes] = useState<CustodialNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [summaryView, setSummaryView] = useState<'school' | 'room' | 'category'>('school');

  // Filters and sorting
  
  // Advanced filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: { from: null, to: null },
    schools: [],
    severityLevels: [],
    categories: [],
    inspectors: [],
    ratingThreshold: 0,
    inspectionType: 'all',
    showProblemsOnly: false,
    hasCustodialNotes: false
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ratingLabels = {
    1: "Unacceptable",
    2: "Below Standard", 
    3: "Acceptable",
    4: "Ordinary Tidiness",
    5: "Orderly Spotlessness"
  };

  const categories = [
    { key: 'floors', label: 'Floors' },
    { key: 'verticalHorizontalSurfaces', label: 'Vertical and Horizontal Surfaces' },
    { key: 'ceiling', label: 'Ceiling' },
    { key: 'restrooms', label: 'Restrooms' },
    { key: 'customerSatisfaction', label: 'Customer Satisfaction and Coordination' },
    { key: 'trash', label: 'Trash' },
    { key: 'projectCleaning', label: 'Project Cleaning' },
    { key: 'activitySupport', label: 'Activity Support' },
    { key: 'safetyCompliance', label: 'Safety and Compliance' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'monitoring', label: 'Monitoring' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inspectionsResponse, notesResponse] = await Promise.all([
        fetch('/api/inspections'),
        fetch('/api/custodial-notes')
      ]);
      
      if (inspectionsResponse.ok) {
        const inspectionsData = await inspectionsResponse.json();
        setInspections(inspectionsData);
      }
      
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setCustodialNotes(notesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = (inspection: Inspection): number | null => {
    const ratings = categories
      .map(cat => inspection[cat.key as keyof Inspection] as number | null | undefined)
      .filter((rating): rating is number => typeof rating === 'number');

    if (ratings.length === 0) return null;

    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    return Math.round(average * 10) / 10;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {ratingLabels[rating as keyof typeof ratingLabels]}
        </span>
      </div>
    );
  };


  // Determine unique schools for filter dropdown
  const schools = useMemo(() => {
    const set = new Set(inspections.map(i => i.school).filter(Boolean));
    return Array.from(set).sort();
  }, [inspections]);

  // Advanced filtering logic
  const filteredInspections = useMemo(() => {
    return inspections.filter(inspection => {
      // Search filter
      if (filters.search) {
        const searchText = [
          inspection.school,
          inspection.roomNumber?.toString(),
          inspection.locationDescription,
          inspection.buildingName,
          inspection.notes
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchText.includes(filters.search.toLowerCase())) return false;
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const inspectionDate = new Date(inspection.date);
        if (filters.dateRange.from && inspectionDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && inspectionDate > filters.dateRange.to) return false;
      }

      // School filter
      if (filters.schools.length > 0 && !filters.schools.includes(inspection.school)) return false;

      // Inspector filter
      if (filters.inspectors.length > 0 && inspection.inspectorName && !filters.inspectors.includes(inspection.inspectorName)) return false;

      // Inspection type filter
      if (filters.inspectionType !== 'all') {
        if (filters.inspectionType === 'single_room' && inspection.inspectionType !== 'single_room') return false;
        if (filters.inspectionType === 'whole_building' && inspection.inspectionType !== 'whole_building') return false;
      }

      // Rating threshold filter
      if (filters.ratingThreshold > 0) {
        const avgRating = calculateAverageRating(inspection);
        if (avgRating === null || avgRating < filters.ratingThreshold) return false;
      }

      // Severity level filter
      if (filters.severityLevels.length > 0) {
        const avgRating = calculateAverageRating(inspection);
        if (avgRating === null) return false;
        
        const severity = avgRating < 2.0 ? 'critical' : avgRating < 3.0 ? 'needs-attention' : 'acceptable';
        if (!filters.severityLevels.includes(severity)) return false;
      }

      // Problems only filter
      if (filters.showProblemsOnly) {
        const avgRating = calculateAverageRating(inspection);
        if (avgRating === null || avgRating >= 3.0) return false;
      }

      // Has custodial notes filter
      if (filters.hasCustodialNotes) {
        const hasNotes = custodialNotes.some(note => note.school === inspection.school);
        if (!hasNotes) return false;
      }

      return true;
    });
  }, [inspections, custodialNotes, filters]);


  // Calculate trends for KPI cards
  const calculateTrends = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    
    // Current month data
    const currentMonthData = filteredInspections.filter(i => {
      const inspectionDate = new Date(i.date);
      return inspectionDate >= new Date(now.getFullYear(), now.getMonth(), 1);
    });
    
    // Last month data
    const lastMonthData = filteredInspections.filter(i => {
      const inspectionDate = new Date(i.date);
      return inspectionDate >= new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1) && 
             inspectionDate < new Date(now.getFullYear(), now.getMonth(), 1);
    });
    
    // Calculate trends
    const inspectionTrend = lastMonthData.length > 0 
      ? ((currentMonthData.length - lastMonthData.length) / lastMonthData.length) * 100
      : 0;
    
    const currentAvgRating = currentMonthData.length > 0
      ? currentMonthData.reduce((sum, inspection) => {
          const rating = calculateAverageRating(inspection);
          return sum + (rating || 0);
        }, 0) / currentMonthData.length
      : 0;
    
    const lastAvgRating = lastMonthData.length > 0
      ? lastMonthData.reduce((sum, inspection) => {
          const rating = calculateAverageRating(inspection);
          return sum + (rating || 0);
        }, 0) / lastMonthData.length
      : 0;
    
    const ratingTrend = lastAvgRating > 0 
      ? ((currentAvgRating - lastAvgRating) / lastAvgRating) * 100
      : 0;
    
    return {
      inspectionTrend: Math.round(inspectionTrend * 10) / 10,
      ratingTrend: Math.round(ratingTrend * 10) / 10
    };
  };

  const trends = calculateTrends();

  // Helper function to get severity information
  const getSeverityInfo = (inspection: Inspection) => {
    const avgRating = calculateAverageRating(inspection);
    if (avgRating === null) return null;
    
    if (avgRating < 2.0) {
      return { level: 'critical', color: '#EF4444', icon: AlertTriangle, label: 'Critical' };
    } else if (avgRating < 3.0) {
      return { level: 'needs-attention', color: '#F59E0B', icon: AlertCircle, label: 'Needs Attention' };
    } else {
      return { level: 'acceptable', color: '#10B981', icon: CheckCircle, label: 'Acceptable' };
    }
  };

  // Enhanced data processing functions for charts
  const getPerformanceTrendData = () => {
    const monthlyData = filteredInspections.reduce((acc, inspection) => {
      const month = new Date(inspection.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { date: month, ratings: [], totalInspections: 0 };
      }
      const avg = calculateAverageRating(inspection);
      if (avg !== null) {
        acc[month].ratings.push(avg);
        acc[month].totalInspections++;
      }
      return acc;
    }, {} as Record<string, { date: string; ratings: number[]; totalInspections: number }>);

    return Object.values(monthlyData).map(data => ({
      date: data.date,
      averageRating: data.ratings.length > 0
        ? Math.round((data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length) * 10) / 10
        : 0,
      totalInspections: data.totalInspections
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getSchoolComparisonData = () => {
    const schoolData = filteredInspections.reduce((acc, inspection) => {
      if (!acc[inspection.school]) {
        acc[inspection.school] = {
          school: inspection.school,
          ratings: [],
          totalInspections: 0,
          singleRoomCount: 0,
          wholeBuildingCount: 0
        };
      }
      const avg = calculateAverageRating(inspection);
      if (avg !== null) {
        acc[inspection.school].ratings.push(avg);
      }
      acc[inspection.school].totalInspections++;
      if (inspection.inspectionType === 'single_room') {
        acc[inspection.school].singleRoomCount++;
      } else {
        acc[inspection.school].wholeBuildingCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(schoolData).map(data => ({
      ...data,
      averageRating: data.ratings.length > 0
        ? Math.round((data.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / data.ratings.length) * 10) / 10
        : 0
    }));
  };

  const getCategoryRadarData = () => {
    const categoryTotals = categories.reduce((acc, category) => {
      acc[category.key] = { category: category.label, ratings: [], totalRatings: 0 };
      return acc;
    }, {} as Record<string, { category: string; ratings: number[]; totalRatings: number }>);

    filteredInspections.forEach(inspection => {
      categories.forEach(category => {
        const rating = inspection[category.key as keyof Inspection] as number | null | undefined;
        if (typeof rating === 'number') {
          categoryTotals[category.key].ratings.push(rating);
          categoryTotals[category.key].totalRatings++;
        }
      });
    });

    return Object.values(categoryTotals).map(data => ({
      category: data.category,
      rating: data.ratings.length > 0
        ? Math.round((data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length) * 10) / 10
        : 0,
      fullMark: 5
    }));
  };

  const getRoomHeatmapData = () => {
    return filteredInspections
      .filter(inspection => inspection.inspectionType === 'single_room' && inspection.roomNumber)
      .map(inspection => ({
        number: inspection.roomNumber!,
        rating: calculateAverageRating(inspection) || 0,
        school: inspection.school,
        lastInspection: inspection.date
      }));
  };

  // KPI calculations
  const kpiData = useMemo(() => {
    const totalInspections = filteredInspections.length;
    const totalNotes = custodialNotes.length;
    const avgRating = filteredInspections.length > 0
      ? Math.round((filteredInspections
          .map(calculateAverageRating)
          .filter((rating): rating is number => rating !== null)
          .reduce((sum, rating) => sum + rating, 0) / filteredInspections.length) * 10) / 10
      : 0;

    const schools = new Set(filteredInspections.map(i => i.school)).size;

      return {
      totalInspections,
      totalNotes,
      avgRating,
      schools
    };
  }, [filteredInspections, custodialNotes]);

  // Handle PDF export for issues
  const handleExportIssuesPDF = () => {
    try {
      // Gather current filter state
      const reportData: IssuesReportData = {
        inspections: filteredInspections, // Already filtered by current filters
        custodialNotes: custodialNotes,
        startDate: filters.dateRange?.from || undefined,
        endDate: filters.dateRange?.to || undefined,
        schoolFilter: filters.schools.length === 1 ? filters.schools[0] : undefined,
        activeFilters: getActiveFilterLabels() // Get names of active quick filters
      };
      
      // Generate PDF
      const pdfBlob = generateIssuesReport(reportData);
      
      // Download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create meaningful filename
      const startDate = filters.dateRange?.from ? filters.dateRange.from.toISOString().slice(0, 10) : 'All';
      const endDate = filters.dateRange?.to ? filters.dateRange.to.toISOString().slice(0, 10) : 'All';
      const schoolName = filters.schools.length === 1 ? filters.schools[0] : 'All';
      link.download = `issues_${startDate}_${endDate}_${schoolName}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success toast
      toast({
        title: "Issues report generated successfully",
        description: "PDF has been downloaded to your device.",
      });
    } catch (error) {
      console.error('Failed to generate issues report:', error);
      toast({
        title: "Failed to generate issues report",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get active filter labels
  const getActiveFilterLabels = (): string[] => {
    const activeFilters: string[] = [];
    
    // Check quick filters (these would need to be tracked in state)
    // For now, we'll return empty array as the quick filters aren't tracked in state
    // This could be enhanced later to track which quick filters are active
    
    return activeFilters;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (selectedInspection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={() => setSelectedInspection(null)} variant="outline">
            ← Back to Inspections
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-6 h-6" />
              Inspection Details
            </CardTitle>
            <CardDescription>
              {selectedInspection.inspectionType === 'single_room' 
                ? `Room ${selectedInspection.roomNumber} at ${selectedInspection.school}`
                : `Building: ${selectedInspection.buildingName || selectedInspection.locationDescription || 'Whole Building'} at ${selectedInspection.school}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Inspection Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Date:</strong> {new Date(selectedInspection.date).toLocaleDateString()}</p>
                    <p><strong>School:</strong> {selectedInspection.school}</p>
                    <p><strong>Type:</strong> {selectedInspection.inspectionType === 'single_room' ? 'Single Room' : 'Whole Building'}</p>
                    {selectedInspection.roomNumber && <p><strong>Room:</strong> {selectedInspection.roomNumber}</p>}
                    {selectedInspection.buildingName && <p><strong>Building:</strong> {selectedInspection.buildingName}</p>}
                    {!selectedInspection.buildingName && selectedInspection.inspectionType === 'whole_building' && <p><strong>Building:</strong> {selectedInspection.locationDescription || 'Whole Building'}</p>}
                    {selectedInspection.locationDescription && <p><strong>Location:</strong> {selectedInspection.locationDescription}</p>}
                    {selectedInspection.inspectorName && <p><strong>Inspector:</strong> {selectedInspection.inspectorName}</p>}
              </div>
              </div>
              <div>
                  <h4 className="font-semibold mb-2">Overall Rating</h4>
                  {(() => {
                    const avg = calculateAverageRating(selectedInspection);
                    return avg !== null ? renderStars(Math.round(avg)) : <span className="text-gray-500">No ratings available</span>;
                  })()}
            </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Category Ratings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(category => {
                    const rating = selectedInspection[category.key as keyof Inspection] as number | null | undefined;
                    return (
                      <div key={category.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{category.label}</span>
                        {typeof rating === 'number' ? (
                          <div className="flex items-center gap-2">
                            {renderStars(rating)}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not rated</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedInspection.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Additional Notes</h4>
                    <p className="text-gray-700">{selectedInspection.notes}</p>
                  </div>
                </>
              )}

               {selectedInspection.images && selectedInspection.images.length > 0 && (
                 <>
            <Separator />
              <div>
                     <h4 className="font-semibold mb-4">Images</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedInspection.images.map((url: string, index: number) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                            src={url} 
                            alt={`Inspection image ${index + 1}`}
                            className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBack) onBack();
            }}
            variant="outline" 
            className="mb-4 back-button"
          >
            ← Back to Main Menu
        </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Enhanced Data & Reports</h1>
            <p className="text-muted-foreground">Advanced analytics and visualizations for custodial data</p>
          </div>
      </div>

      {/* Filter Presets */}
      <div className="mb-6">
        <FilterPresets
          filters={filters}
          onApplyPreset={setFilters}
          schools={schools}
        />
      </div>

      {/* Advanced Filters */}
      <div className="mb-6">
        <AdvancedFilters
          inspections={inspections}
          custodialNotes={custodialNotes}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({
            search: '',
            dateRange: { from: null, to: null },
            schools: [],
            severityLevels: [],
            categories: [],
            inspectors: [],
            ratingThreshold: 0,
            inspectionType: 'all',
            showProblemsOnly: false,
            hasCustodialNotes: false
          })}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
      </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="sticky top-0 z-10 bg-background border-b">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="problems">Problem Areas</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="school">By School</TabsTrigger>
              <TabsTrigger value="date">By Date</TabsTrigger>
              <TabsTrigger value="inspector">By Inspector</TabsTrigger>
              <TabsTrigger value="notes">Custodial Notes</TabsTrigger>
            </TabsList>
          </div>
        
          <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
              {/* Overview Header with Export */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Overview</h2>
                  <p className="text-muted-foreground">Key performance indicators and recent inspections</p>
                </div>
                <div className="flex gap-2">
                  <ExportDialog
                    inspections={filteredInspections}
                    custodialNotes={custodialNotes}
                    trigger={
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Overview
                      </Button>
                    }
                  />
                  <PDFExportWizard
                    inspections={filteredInspections}
                    custodialNotes={custodialNotes}
                    availableSchools={schools}
                    availableCategories={categories}
                    trigger={
                      <Button type="button" variant="outline" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Export PDF Report
                      </Button>
                    }
                    onExportComplete={() => {
                      toast({
                        title: "Export Complete",
                        description: "Your PDF report has been generated successfully.",
                      });
                    }}
                  />
                </div>
              </div>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Inspections"
                  value={kpiData.totalInspections}
                  description="All time inspections"
                  icon={FileText}
                  color="primary"
                  trend={trends.inspectionTrend !== 0 ? {
                    value: trends.inspectionTrend,
                    period: "vs last month"
                  } : undefined}
                />
                <KPICard
                  title="Average Rating"
                  value={`${kpiData.avgRating}/5`}
                  description="Overall performance"
                  icon={Star}
                  color="success"
                  trend={trends.ratingTrend !== 0 ? {
                    value: trends.ratingTrend,
                    period: "vs last month"
                  } : undefined}
                />
                <KPICard
                  title="Schools"
                  value={kpiData.schools}
                  description="Active locations"
                  icon={Building}
                  color="secondary"
                />
                <KPICard
                  title="Custodial Notes"
                  value={kpiData.totalNotes}
                  description="Issues reported"
                  icon={FileText}
                  color="warning"
                />
            </div>

              {/* Recent Activity */}
                  <Card>
                        <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                    {filteredInspections.slice(0, 5).map((inspection) => {
                      const severityInfo = getSeverityInfo(inspection);
                      return (
                        <div key={inspection.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{inspection.school}</p>
                                {severityInfo && severityInfo.level !== 'acceptable' && (
                                  <Badge 
                                    variant={severityInfo.level === 'critical' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    <severityInfo.icon className="w-3 h-3 mr-1" />
                                    {severityInfo.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {inspection.inspectionType === 'single_room' 
                                  ? `Room ${inspection.roomNumber ?? 'Not specified'}` 
                                  : `Building: ${inspection.buildingName || inspection.locationDescription || 'Whole Building'}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const avg = calculateAverageRating(inspection);
                              return avg !== null ? renderStars(Math.round(avg)) : <span className="text-xs text-muted-foreground">N/A</span>;
                            })()}
                            <Badge variant="outline">
                              {new Date(inspection.date).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="problems" className="mt-6">
            <ProblemAreasView 
              inspections={filteredInspections}
              custodialNotes={custodialNotes}
              onInspectionClick={setSelectedInspection}
              onExportReport={() => {
                // Export will be handled by the ExportDialog in ProblemAreasView
              }}
            />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <div className="space-y-6">
              <PerformanceTrendChart 
                data={getPerformanceTrendData()}
                title="Performance Trends Over Time"
                description="Average ratings and inspection volume by month"
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SchoolComparisonChart 
                  data={getSchoolComparisonData()}
                  title="School Performance Comparison"
                  description="Average ratings and inspection counts by school"
                />
                
                <CategoryRadarChart 
                  data={getCategoryRadarData()}
                  title="Category Performance Analysis"
                  description="Performance ratings across all inspection categories"
                />
              </div>
              
              <RoomHeatmap 
                data={getRoomHeatmapData()}
                title="Room Performance Heatmap"
                description="Visual overview of room performance ratings"
                maxRoomsPerRow={8}
              />
            </div>
          </TabsContent>

          <TabsContent value="school" className="mt-6">
            <SchoolGroupView 
              inspections={filteredInspections}
              onInspectionClick={setSelectedInspection}
            />
          </TabsContent>

          <TabsContent value="date" className="mt-6">
            <DateGroupView 
              inspections={filteredInspections}
              onInspectionClick={setSelectedInspection}
            />
          </TabsContent>

          <TabsContent value="inspector" className="mt-6">
            <InspectorGroupView 
              inspections={filteredInspections}
              onInspectionClick={setSelectedInspection}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Custodial Notes ({custodialNotes.length})
                </h2>
              </div>
              
              {custodialNotes.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No Custodial Notes</h3>
                    <p className="text-muted-foreground">No custodial notes have been submitted yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                  {custodialNotes.map((note) => (
                    <Card key={note.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {note.school}
                            </div>
                              <Badge variant="outline">
                            {new Date(note.createdAt).toLocaleDateString()}
                              </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Location:</p>
                              <p className="text-foreground">{note.location} - {note.locationDescription}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Notes:</p>
                              <p className="text-foreground">{note.notes}</p>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Created: {new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                </Card>
              ))}
            </div>
          )}
            </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
