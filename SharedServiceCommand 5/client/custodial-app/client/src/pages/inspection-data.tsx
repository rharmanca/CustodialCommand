import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Building, Star, FileText, Image as ImageIcon } from 'lucide-react';
import type { Inspection, CustodialNote } from '@shared/schema';

interface InspectionDataPageProps {
  onBack?: () => void;
}

export default function InspectionDataPage({ onBack }: InspectionDataPageProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [custodialNotes, setCustodialNotes] = useState<CustodialNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

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

  const calculateAverageRating = (inspection: Inspection) => {
    const ratings = categories.map(cat => inspection[cat.key as keyof Inspection] as number);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading inspection data...</div>
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
                <span>Room {selectedInspection.roomNumber}</span>
              </div>
            </div>

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
                        className="w-full h-32 object-cover"
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

      <Tabs defaultValue="inspections" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inspections">Inspections ({inspections.length})</TabsTrigger>
          <TabsTrigger value="notes">Custodial Notes ({custodialNotes.length})</TabsTrigger>
        </TabsList>
        
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
              {inspections.map((inspection) => (
                <Card key={inspection.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedInspection(inspection)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {inspection.school}
                      </div>
                      <Badge variant="secondary">
                        Avg: {calculateAverageRating(inspection)}/5
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
                      <p className="text-sm text-gray-600">
                        Room {inspection.roomNumber} • Click to view details
                      </p>
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(calculateAverageRating(inspection)))}
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
              {custodialNotes.map((note) => (
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