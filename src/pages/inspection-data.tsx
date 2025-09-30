import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Building, Star, FileText, Image as ImageIcon, BarChart3, TrendingUp, Download } from 'lucide-react';
import type { Inspection, CustodialNote } from '../../shared/schema';
import { LoadingState } from '@/components/ui/loading-spinner';

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

  // Summary calculations
  const getSchoolSummary = () => {
    const schoolGroups = filteredInspections.reduce((acc, inspection) => {
      if (!acc[inspection.school]) {
        acc[inspection.school] = [];
      }
      acc[inspection.school].push(inspection);
      return acc;
    }, {} as Record<string, Inspection[]>);

    return Object.entries(schoolGroups).map(([school, schoolInspections]) => {
      const totalInspections = schoolInspections.length;
      const perInspectionAverages = schoolInspections
        .map(inspection => calculateAverageRating(inspection))
        .filter((avg): avg is number => avg !== null);
      const averageRating = perInspectionAverages.length > 0
        ? perInspectionAverages.reduce((sum, avg) => sum + avg, 0) / perInspectionAverages.length
        : 0;
      
      const singleRoomCount = schoolInspections.filter(i => i.inspectionType === 'single_room').length;
      const wholeBuildingCount = schoolInspections.filter(i => i.inspectionType === 'whole_building').length;
      
      const categoryAverages = categories.reduce((acc, category) => {
        const categoryRatings = schoolInspections
          .map(inspection => inspection[category.key as keyof Inspection] as number)
          .filter(rating => rating !== null && rating !== undefined);
        acc[category.key] = categoryRatings.length > 0 
          ? categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length 
          : 0;
        return acc;
      }, {} as Record<string, number>);

      return {
        school,
        totalInspections,
        averageRating: Math.round(averageRating * 10) / 10,
        singleRoomCount,
        wholeBuildingCount,
        categoryAverages,
        inspections: schoolInspections
      };
    }).sort((a, b) => b.totalInspections - a.totalInspections);
  };

  const getRoomSummary = () => {
    const roomGroups = filteredInspections
      .filter(inspection => inspection.roomNumber)
      .reduce((acc, inspection) => {
        const key = `${inspection.school}-${inspection.roomNumber}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(inspection);
        return acc;
      }, {} as Record<string, Inspection[]>);

    return Object.entries(roomGroups).map(([key, roomInspections]) => {
      const [school, roomNumber] = key.split('-');
      const totalInspections = roomInspections.length;
      const perInspectionAverages = roomInspections
        .map(inspection => calculateAverageRating(inspection))
        .filter((avg): avg is number => avg !== null);
      const averageRating = perInspectionAverages.length > 0
        ? perInspectionAverages.reduce((sum, avg) => sum + avg, 0) / perInspectionAverages.length
        : 0;
      
      const latestInspection = roomInspections.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        school,
        roomNumber,
        totalInspections,
        averageRating: Math.round(averageRating * 10) / 10,
        latestInspection,
        inspections: roomInspections
      };
    }).sort((a, b) => b.totalInspections - a.totalInspections);
  };

  const getCategorySummary = () => {
    return categories.map(category => {
      const categoryRatings = filteredInspections
        .map(inspection => inspection[category.key as keyof Inspection] as number)
        .filter(rating => rating !== null && rating !== undefined);
      
      const average = categoryRatings.length > 0 
        ? categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length 
        : 0;
      
      const distribution = [1, 2, 3, 4, 5].reduce((acc, rating) => {
        acc[rating] = categoryRatings.filter(r => r === rating).length;
        return acc;
      }, {} as Record<number, number>);

      return {
        category: category.label,
        key: category.key,
        average: Math.round(average * 10) / 10,
        totalRatings: categoryRatings.length,
        distribution
      };
    }).sort((a, b) => b.average - a.average);
  };

  // CSV export based on current summary view
  const exportCSV = () => {
    let rows: string[] = [];
    if (summaryView === 'school') {
      rows = [
        ['School', 'Avg Rating', 'Total Inspections', 'Single Room', 'Whole Building'].join(',')
      ].concat(
        getSchoolSummary().map(s =>
          [s.school, s.averageRating, s.totalInspections, s.singleRoomCount, s.wholeBuildingCount].join(',')
        )
      );
    } else if (summaryView === 'room') {
      rows = [
        ['School', 'Room', 'Avg Rating', 'Total Inspections', 'Last Inspected'].join(',')
      ].concat(
        getRoomSummary().map(s =>
          [s.school, s.roomNumber, s.averageRating, s.totalInspections, new Date(s.latestInspection.date).toLocaleDateString()].join(',')
        )
      );
    } else {
      rows = [
        ['Category', 'Avg Rating', 'Total Ratings'].join(',')
      ].concat(
        getCategorySummary().map(s =>
          [s.category, s.average, s.totalRatings].join(',')
        )
      );
    }
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${summaryView}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {selectedInspection.school} - Inspection Details
            </CardTitle>
            <CardDescription>
              Completed on {new Date(selectedInspection.date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{new Date(selectedInspection.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{selectedInspection.locationDescription}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span>
                  {selectedInspection.inspectionType === 'single_room' 
                    ? `Room ${selectedInspection.roomNumber}` 
                    : `Building: ${selectedInspection.buildingName}`
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Type:</span>
              <Badge variant={selectedInspection.inspectionType === 'single_room' ? 'default' : 'secondary'}>
                {selectedInspection.inspectionType === 'single_room' ? 'Single Room' : 'Whole Building'}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-5 mt-2">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Search school, room, location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All schools</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-3">
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    {summaryView === 'school' && (
                      <>
                        <SelectItem value="default">Sort: Inspections (desc)</SelectItem>
                        <SelectItem value="avg-desc">Sort: Avg Rating (desc)</SelectItem>
                        <SelectItem value="avg-asc">Sort: Avg Rating (asc)</SelectItem>
                        <SelectItem value="name-asc">Sort: School (A→Z)</SelectItem>
                      </>
                    )}
                    {summaryView === 'room' && (
                      <>
                        <SelectItem value="default">Sort: Inspections (desc)</SelectItem>
                        <SelectItem value="avg-desc">Sort: Avg Rating (desc)</SelectItem>
                        <SelectItem value="avg-asc">Sort: Avg Rating (asc)</SelectItem>
                        <SelectItem value="date-desc">Sort: Last Inspected (newest)</SelectItem>
                      </>
                    )}
                    {summaryView === 'category' && (
                      <>
                        <SelectItem value="default">Sort: Avg Rating (desc)</SelectItem>
                        <SelectItem value="avg-asc">Sort: Avg Rating (asc)</SelectItem>
                        <SelectItem value="name-asc">Sort: Category (A→Z)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearch(''); setSchoolFilter('all'); setDateFrom(''); setDateTo(''); }}>
                  Clear
                </Button>
              </div>
              <Button onClick={exportCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            {/* Show verified rooms for whole building inspections */}
            {selectedInspection.inspectionType === 'whole_building' && selectedInspection.verifiedRooms && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Verified Room Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedInspection.verifiedRooms.map((roomId: string, index: number) => {
                    const roomLabels: Record<string, string> = {
                      'cafeteria': 'Cafeteria',
                      'athletic_bleachers': 'Athletic & Bleachers',
                      'restroom': 'Restroom',
                      'classroom': 'Classroom',
                      'office_admin': 'Office/Admin',
                      'hallways': 'Hallways',
                      'stairwells': 'Stairwell'
                    };
                    return (
                      <Badge key={index} variant="outline" className="text-xs">
                        {roomLabels[roomId] || roomId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Images */}
            {selectedInspection.images && selectedInspection.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Inspection Photos ({selectedInspection.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedInspection.images.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Inspection photo ${index + 1}`}
                        className="w-full h-20 sm:h-24 md:h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Ratings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Category Ratings</h3>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between">
                    <span className="font-medium">{category.label}</span>
                    {renderStars(selectedInspection[category.key as keyof Inspection] as number)}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedInspection.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Additional Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedInspection.notes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mb-6">
          ← Back to Custodial
        </Button>
      )}
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Custodial Data</h1>
        <p className="text-gray-600">View all submitted inspections and custodial notes</p>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary & Reports</TabsTrigger>
          <TabsTrigger value="inspections">Inspections ({inspections.length})</TabsTrigger>
          <TabsTrigger value="notes">Custodial Notes ({custodialNotes.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Data Summary & Reports
              </h2>
              <Select value={summaryView} onValueChange={(value: 'school' | 'room' | 'category') => setSummaryView(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">By School</SelectItem>
                  <SelectItem value="room">By Room Number</SelectItem>
                  <SelectItem value="category">By Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {summaryView === 'school' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Summary by School</h3>
                {getSchoolSummary().length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No inspection data available for summary.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {getSchoolSummary()
                      .sort((a, b) => {
                        if (sortBy === 'avg-desc') return b.averageRating - a.averageRating;
                        if (sortBy === 'avg-asc') return a.averageRating - b.averageRating;
                        if (sortBy === 'name-asc') return a.school.localeCompare(b.school);
                        return b.totalInspections - a.totalInspections;
                      })
                      .map((summary) => (
                      <Card key={summary.school} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building className="w-5 h-5" />
                              {summary.school}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                Avg: {summary.averageRating}/5
                              </Badge>
                              <Badge variant="outline">
                                {summary.totalInspections} inspections
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{summary.totalInspections}</p>
                                <p className="text-sm text-gray-600">Total Inspections</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{summary.singleRoomCount}</p>
                                <p className="text-sm text-gray-600">Single Room</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{summary.wholeBuildingCount}</p>
                                <p className="text-sm text-gray-600">Whole Building</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center">
                                  {renderStars(Math.round(summary.averageRating))}
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-medium mb-3">Category Performance</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {categories.map((category) => (
                                  <div key={category.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium truncate">{category.label}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {(summary.categoryAverages[category.key] || 0).toFixed(1)}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {summaryView === 'room' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Summary by Room Number</h3>
                {getRoomSummary().length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No room-specific inspection data available.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {getRoomSummary()
                      .sort((a, b) => {
                        if (sortBy === 'avg-desc') return b.averageRating - a.averageRating;
                        if (sortBy === 'avg-asc') return a.averageRating - b.averageRating;
                        if (sortBy === 'date-desc') return new Date(b.latestInspection.date).getTime() - new Date(a.latestInspection.date).getTime();
                        return b.totalInspections - a.totalInspections;
                      })
                      .map((summary) => (
                      <Card key={`${summary.school}-${summary.roomNumber}`} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              {summary.school} - Room {summary.roomNumber}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                Avg: {summary.averageRating}/5
                              </Badge>
                              <Badge variant="outline">
                                {summary.totalInspections} inspections
                              </Badge>
                            </div>
                          </CardTitle>
                          <CardDescription>
                            Last inspected: {new Date(summary.latestInspection.date).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{summary.totalInspections}</p>
                              <p className="text-sm text-gray-600">Total Inspections</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center">
                                {renderStars(Math.round(summary.averageRating))}
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700">Location</p>
                              <p className="text-sm text-gray-600">{summary.latestInspection.locationDescription}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {summaryView === 'category' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Summary by Category</h3>
                {getCategorySummary().length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No category data available for summary.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {getCategorySummary()
                      .sort((a, b) => {
                        if (sortBy === 'avg-asc') return a.average - b.average;
                        if (sortBy === 'name-asc') return a.category.localeCompare(b.category);
                        return b.average - a.average;
                      })
                      .map((summary) => (
                      <Card key={summary.key} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5" />
                              {summary.category}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                Avg: {summary.average}/5
                              </Badge>
                              <Badge variant="outline">
                                {summary.totalRatings} ratings
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-center">
                              {renderStars(Math.round(summary.average))}
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-medium mb-3">Rating Distribution</h4>
                              <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <div key={rating} className="text-center">
                                    <div className="bg-gray-100 p-2 rounded">
                                      <Star className={`w-4 h-4 mx-auto mb-1 ${
                                        rating <= Math.round(summary.average)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`} />
                                      <p className="text-lg font-bold">{summary.distribution[rating] || 0}</p>
                                      <p className="text-xs text-gray-600">{rating} star{rating !== 1 ? 's' : ''}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inspections" className="mt-6">
          {inspections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Inspections Found</h3>
                <p className="text-gray-500">No inspection data has been submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredInspections.map((inspection) => (
                <Card key={inspection.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedInspection(inspection)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {inspection.school}
                      </div>
                      <Badge variant="secondary">
                        {(() => {
                          const avg = calculateAverageRating(inspection);
                          return `Avg: ${avg !== null ? avg : 'N/A'}/5`;
                        })()}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(inspection.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {inspection.locationDescription}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          {inspection.inspectionType === 'single_room' 
                            ? `Room ${inspection.roomNumber}` 
                            : `Building: ${inspection.buildingName}`
                          } • Click to view details
                        </p>
                        <Badge variant={inspection.inspectionType === 'single_room' ? 'default' : 'secondary'} className="text-xs">
                          {inspection.inspectionType === 'single_room' ? 'Single Room' : 'Whole Building'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const avg = calculateAverageRating(inspection);
                          return avg !== null ? renderStars(Math.round(avg)) : <span className="text-xs text-gray-500">N/A</span>;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          {custodialNotes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Custodial Notes Found</h3>
                <p className="text-gray-500">No custodial notes have been submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {custodialNotes
                .filter(n => {
                  const ts = new Date(n.date).getTime();
                  const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
                  const toTs = dateTo ? new Date(dateTo).getTime() : null;
                  if (fromTs !== null && ts < fromTs) return false;
                  if (toTs !== null && ts > toTs) return false;
                  if (schoolFilter !== 'all' && n.school !== schoolFilter) return false;
                  if (search.trim()) {
                    const hay = [n.school, n.location, n.locationDescription, n.notes].filter(Boolean).join(' ').toLowerCase();
                    if (!hay.includes(search.trim().toLowerCase())) return false;
                  }
                  return true;
                })
                .map((note) => (
                <Card key={note.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      {note.school}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(note.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {note.location} - {note.locationDescription}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Notes & Issues:</h4>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{note.notes}</p>
                      </div>
                      {note.createdAt && (
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(note.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}