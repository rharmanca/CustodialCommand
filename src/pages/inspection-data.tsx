import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Building, Star, FileText, Image as ImageIcon, BarChart3, TrendingUp, Download, Clock, Target, Users } from 'lucide-react';
import type { Inspection, CustodialNote } from '../../shared/schema';
import { LoadingState } from '@/components/ui/loading-spinner';

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

interface InspectionDataPageProps {
  onBack?: () => void;
}

export default function InspectionDataPage({ onBack }: InspectionDataPageProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [custodialNotes, setCustodialNotes] = useState<CustodialNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [summaryView, setSummaryView] = useState<'school' | 'room' | 'category'>('school');

  // Filters and sorting
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

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

  // Apply filters consistently
  const filteredInspections = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() : null;
    const q = search.trim().toLowerCase();
    return inspections.filter(i => {
      const ts = new Date(i.date).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (schoolFilter !== 'all' && i.school !== schoolFilter) return false;
      if (q) {
        const hay = [
          i.school,
          i.roomNumber?.toString(),
          i.locationDescription,
          i.buildingName,
          i.notes
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [inspections, dateFrom, dateTo, schoolFilter, search]);

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

  if (loading) {
    return (
      <LoadingState text="Loading inspection data..." />
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
                : `Building: ${selectedInspection.buildingName} at ${selectedInspection.school}`
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
            onClick={onBack} 
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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="school">By School</TabsTrigger>
            <TabsTrigger value="date">By Date</TabsTrigger>
            <TabsTrigger value="inspector">By Inspector</TabsTrigger>
            <TabsTrigger value="notes">Custodial Notes</TabsTrigger>
        </TabsList>
        
          <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Inspections"
                  value={kpiData.totalInspections}
                  description="All time inspections"
                  icon={FileText}
                  color="primary"
                />
                <KPICard
                  title="Average Rating"
                  value={`${kpiData.avgRating}/5`}
                  description="Overall performance"
                  icon={Star}
                  color="success"
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
                    {filteredInspections.slice(0, 5).map((inspection) => (
                      <div key={inspection.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building className="w-4 h-4 text-muted-foreground" />
                            <div>
                            <p className="font-medium text-foreground">{inspection.school}</p>
                            <p className="text-sm text-muted-foreground">
                              {inspection.inspectionType === 'single_room' 
                                ? `Room ${inspection.roomNumber}` 
                                : `Building: ${inspection.buildingName}`
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
