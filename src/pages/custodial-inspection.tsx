import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Star, Upload, Camera, X, Save, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { ratingDescriptions, inspectionCategories } from '../../shared/custodial-criteria';

interface CustodialInspectionPageProps {
  onBack?: () => void;
}

export default function CustodialInspectionPage({ onBack }: CustodialInspectionPageProps) {
  const { isMobile } = useIsMobile();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    school: '',
    date: '',
    inspectionType: 'single_room',
    locationDescription: '',
    roomNumber: '',
    locationCategory: '',
    floors: 0,
    verticalHorizontalSurfaces: 0,
    ceiling: 0,
    restrooms: 0,
    customerSatisfaction: 0,
    trash: 0,
    projectCleaning: 0,
    activitySupport: 0,
    safetyCompliance: 0,
    equipment: 0,
    monitoring: 0,
    notes: '',
    images: [] as string[]
  });

  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [draftInspections, setDraftInspections] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // School options
  const schoolOptions = [
    { value: 'ASA', label: 'ASA' },
    { value: 'LCA', label: 'LCA' },
    { value: 'GWC', label: 'GWC' },
    { value: 'OA', label: 'OA' },
    { value: 'CBR', label: 'CBR' },
    { value: 'WLC', label: 'WLC' }
  ];

  // Location category options
  const locationCategoryOptions = [
    { value: 'exterior', label: 'Exterior' },
    { value: 'gym_bleachers', label: 'Gym and Bleachers' },
    { value: 'classroom', label: 'Classroom' },
    { value: 'cafeteria', label: 'Cafeteria' },
    { value: 'utility_storage', label: 'Utility Or Storage' },
    { value: 'admin_office', label: 'Admin or Office Area' },
    { value: 'hallway', label: 'Hallway' },
    { value: 'stairwell', label: 'Stairwell' },
    { value: 'restroom', label: 'Restroom' },
    { value: 'staff_single_restroom', label: 'Staff or Single Restroom' }
  ];

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Load existing drafts on component mount
  useEffect(() => {
    loadDraftInspections();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (currentDraftId) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, selectedImages, currentDraftId]);

  const loadDraftInspections = () => {
    try {
      const savedDrafts = localStorage.getItem('custodial_inspection_drafts');
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        const validDrafts = drafts.filter((draft: any) => {
          // Filter out old drafts (older than 7 days)
          const draftDate = new Date(draft.lastModified);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return draftDate > weekAgo;
        });

        if (validDrafts.length > 0) {
          setDraftInspections(validDrafts);
          setShowResumeDialog(true);
        }

        // Clean up old drafts
        if (validDrafts.length !== drafts.length) {
          localStorage.setItem('custodial_inspection_drafts', JSON.stringify(validDrafts));
        }
      }
    } catch (error) {
      console.error('Error loading draft inspections:', error);
    }
  };

  const generateDraftId = () => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveDraft = async () => {
    if (!formData.school || !formData.date) {
      return; // Don't save empty drafts
    }

    setIsAutoSaving(true);
    try {
      const draftId = currentDraftId || generateDraftId();
      if (!currentDraftId) {
        setCurrentDraftId(draftId);
      }

      // Convert images to base64 for storage
      const imagePromises = selectedImages.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const imageData = await Promise.all(imagePromises);

      const draftData = {
        id: draftId,
        ...formData,
        selectedImages: imageData,
        lastModified: new Date().toISOString(),
        title: `${formData.school} - ${formData.roomNumber || 'Room'} - ${formData.locationCategory || 'Inspection'}`
      };

      // Get existing drafts
      const existingDrafts = JSON.parse(localStorage.getItem('custodial_inspection_drafts') || '[]');
      
      // Update or add current draft
      const draftIndex = existingDrafts.findIndex((d: any) => d.id === draftId);
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = draftData;
      } else {
        existingDrafts.push(draftData);
      }

      localStorage.setItem('custodial_inspection_drafts', JSON.stringify(existingDrafts));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const loadDraft = (draft: any) => {
    setFormData({
      school: draft.school || '',
      date: draft.date || '',
      inspectionType: draft.inspectionType || 'single_room',
      locationDescription: draft.locationDescription || '',
      roomNumber: draft.roomNumber || '',
      locationCategory: draft.locationCategory || '',
      floors: draft.floors || 0,
      verticalHorizontalSurfaces: draft.verticalHorizontalSurfaces || 0,
      ceiling: draft.ceiling || 0,
      restrooms: draft.restrooms || 0,
      customerSatisfaction: draft.customerSatisfaction || 0,
      trash: draft.trash || 0,
      projectCleaning: draft.projectCleaning || 0,
      activitySupport: draft.activitySupport || 0,
      safetyCompliance: draft.safetyCompliance || 0,
      equipment: draft.equipment || 0,
      monitoring: draft.monitoring || 0,
      notes: draft.notes || '',
      images: []
    });

    // Load images from base64
    if (draft.selectedImages && draft.selectedImages.length > 0) {
      const imageFiles = draft.selectedImages.map((base64: string, index: number) => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new File([byteArray], `image_${index}.jpg`, { type: 'image/jpeg' });
      });
      setSelectedImages(imageFiles);
    }

    setCurrentDraftId(draft.id);
    setShowResumeDialog(false);
  };

  const deleteDraft = (draftId: string) => {
    const existingDrafts = JSON.parse(localStorage.getItem('custodial_inspection_drafts') || '[]');
    const updatedDrafts = existingDrafts.filter((d: any) => d.id !== draftId);
    localStorage.setItem('custodial_inspection_drafts', JSON.stringify(updatedDrafts));
    setDraftInspections(updatedDrafts);
    
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
      setLastSaved(null);
    }
  };

  const startNewInspection = () => {
    setShowResumeDialog(false);
    setCurrentDraftId(null);
    setLastSaved(null);
  };

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const currentCount = selectedImages.length;
      const availableSlots = 5 - currentCount;
      const imagesToAdd = newImages.slice(0, availableSlots);
      
      setSelectedImages(prev => [...prev, ...imagesToAdd]);
      
      if (imagesToAdd.length > 0) {
        toast({
          title: "📸 Photos Uploaded Successfully!",
          description: `Added ${imagesToAdd.length} photo${imagesToAdd.length > 1 ? 's' : ''} to inspection documentation.`,
          duration: 3000
        });
      }
      
      if (imagesToAdd.length < newImages.length) {
        toast({
          variant: "destructive",
          title: "Upload Limit Reached",
          description: `Only ${imagesToAdd.length} photos were added. Maximum of 5 images allowed per inspection.`,
          duration: 5000
        });
      }
      
      console.log('Files selected:', imagesToAdd.length, 'files');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions

    if (!formData.school || !formData.date) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please fill in school and date fields before submitting.",
        duration: 6000
      });
      return;
    }

    // Check if at least one rating category has been filled
    const hasRating = inspectionCategories.some(category => {
      const rating = formData[category.key as keyof typeof formData] as number;
      return rating > 0;
    });

    if (!hasRating) {
      toast({
        variant: "destructive",
        title: "Missing Ratings",
        description: "Please provide at least one rating for the inspection categories.",
        duration: 6000
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert images to base64 strings
      const imagePromises = selectedImages.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const imageData = await Promise.all(imagePromises);

      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school: formData.school,
          date: formData.date,
          inspectionType: formData.inspectionType,
          locationDescription: formData.locationDescription,
          roomNumber: formData.roomNumber,
          locationCategory: formData.locationCategory,
          floors: formData.floors || null,
          verticalHorizontalSurfaces: formData.verticalHorizontalSurfaces || null,
          ceiling: formData.ceiling || null,
          restrooms: formData.restrooms || null,
          customerSatisfaction: formData.customerSatisfaction || null,
          trash: formData.trash || null,
          projectCleaning: formData.projectCleaning || null,
          activitySupport: formData.activitySupport || null,
          safetyCompliance: formData.safetyCompliance || null,
          equipment: formData.equipment || null,
          monitoring: formData.monitoring || null,
          notes: formData.notes,
          images: imageData
        })
      });

      if (response.ok) {
        // Show success notification
        toast({
          title: "✅ Inspection Submitted Successfully!",
          description: `Single area inspection for ${formData.school} has been submitted and saved.`,
          variant: "default",
          duration: 5000
        });
        
        // Clean up draft after successful submission
        if (currentDraftId) {
          deleteDraft(currentDraftId);
        }
        
        // Reset form
        setFormData({
          school: '',
          date: '',
          inspectionType: 'single_room',
          locationDescription: '',
          roomNumber: '',
          locationCategory: '',
          floors: 0,
          verticalHorizontalSurfaces: 0,
          ceiling: 0,
          restrooms: 0,
          customerSatisfaction: 0,
          trash: 0,
          projectCleaning: 0,
          activitySupport: 0,
          safetyCompliance: 0,
          equipment: 0,
          monitoring: 0,
          notes: '',
          images: []
        });
        setSelectedImages([]);
        setCurrentDraftId(null);
        setLastSaved(null);
        
        // Navigate back to home page after enough time to read the notification
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 6000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: `Error: ${errorData.message || 'Unable to submit inspection. Please try again.'}`,
          duration: 7000
        });
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        duration: 7000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMobileStarRating = (categoryObj: any, currentRating: number) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-3 text-center">
            Rate this category:
          </div>
          
          {/* Star Rating Buttons */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-2 rounded-md hover:bg-yellow-50 transition-colors touch-manipulation"
                onClick={() => handleInputChange(categoryObj.key, star)}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= currentRating && currentRating > 0
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {/* Not Rated Button */}
          <div className="flex justify-center">
            <button
              type="button"
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors touch-manipulation ${
                currentRating === 0
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleInputChange(categoryObj.key, 0)}
            >
              Not Rated
            </button>
          </div>
        </div>

        {/* Current Rating Status */}
        <div className="text-center">
          {currentRating > 0 ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {ratingDescriptions[currentRating - 1]?.label}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="text-sm px-3 py-1">
              No rating selected
            </Badge>
          )}
        </div>

        {/* Detailed Criteria */}
        {currentRating > 0 && categoryObj.criteria && categoryObj.criteria[currentRating] && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="text-xs text-blue-800">
                <strong className="text-sm">Rating {currentRating} Criteria:</strong>
                <p className="mt-1 leading-relaxed">{categoryObj.criteria[currentRating]}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderStarRating = (categoryObj: any, currentRating: number) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant={currentRating === 0 ? "default" : "outline"}
            size="sm"
            className="px-3 py-2 text-xs"
            onClick={() => handleInputChange(categoryObj.key, 0)}
          >
            Not Rated
          </Button>
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              type="button"
              variant="ghost"
              size="sm"
              className="p-2 h-auto"
              onClick={() => handleInputChange(categoryObj.key, star)}
            >
              <Star
                className={`w-6 h-6 ${
                  star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </Button>
          ))}
        </div>

        {/* Current Rating Status */}
        <div className="text-center">
          {currentRating > 0 ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {ratingDescriptions[currentRating - 1]?.label}
              </Badge>
              <div className="text-xs text-gray-600">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="text-sm px-3 py-1">
              No rating selected
            </Badge>
          )}
        </div>

        {/* Detailed Criteria */}
        {currentRating > 0 && categoryObj.criteria && categoryObj.criteria[currentRating] && (
          <Card className="bg-accent/10 border-accent/30">
            <CardContent className="p-3">
              <div className="text-xs text-accent-foreground">
                <strong className="text-sm">Rating {currentRating} Criteria:</strong>
                <p className="mt-1 leading-relaxed">{categoryObj.criteria[currentRating]}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Resume Draft Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resume Previous Inspection?</DialogTitle>
            <DialogDescription>
              You have unfinished inspection drafts. Would you like to continue one of them or start a new inspection?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {draftInspections.map((draft) => (
              <Card key={draft.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{draft.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last modified: {new Date(draft.lastModified).toLocaleString()}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      School: {draft.school} • Date: {draft.date}
                      {draft.roomNumber && ` • Room: ${draft.roomNumber}`}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => loadDraft(draft)}
                    >
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDraft(draft.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <div className="flex justify-center space-x-4 pt-4">
              <Button onClick={startNewInspection} variant="outline">
                Start New Inspection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            ← Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Submit Inspection</h1>
          <p className="text-muted-foreground mt-2">Use this form to inspect a single room or location. Example: Cafeteria. If performing a whole building inspection please select that from the previous screen.</p>
          
          {/* Save Status Indicator */}
          {(lastSaved || isAutoSaving) && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
              {isAutoSaving ? (
                <>
                  <Save className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Manual Save Button */}
        {currentDraftId && (
          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            disabled={isAutoSaving}
            className="flex-shrink-0"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information - Organized in columns */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="school">School *</Label>
                <Select value={formData.school} onValueChange={(value) => handleInputChange('school', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Inspection Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="locationCategory">Location Category</Label>
                <Select value={formData.locationCategory} onValueChange={(value) => handleInputChange('locationCategory', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location category" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  placeholder="e.g., 101, Main Hall"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="locationDescription">Location Description</Label>
              <Input
                id="locationDescription"
                value={formData.locationDescription}
                onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                placeholder="e.g., Main Building, Second Floor, Near Library"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspection Categories - Collapsible sections */}
        <Card>
            <CardHeader>
              <CardTitle>Inspection Categories</CardTitle>
              <CardDescription>
                {isMobile 
                  ? "Expand each category to rate it. Detailed criteria will appear when you select a rating."
                  : "Expand each category to rate it based on the criteria (1-5 stars). Detailed criteria will appear when you select a rating."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {isMobile ? (
              // Mobile: Keep single column with collapsible sections
              inspectionCategories.map((category) => (
                <CollapsibleSection
                  key={category.key}
                  title={category.label}
                  defaultCollapsed={true}
                  className="border border-gray-200"
                  titleClassName="text-left font-medium"
                  contentClassName="space-y-3"
                >
                  {renderMobileStarRating(category, formData[category.key as keyof typeof formData] as number)}
                </CollapsibleSection>
              ))
            ) : (
              // Desktop: Two-column layout with collapsible sections
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inspectionCategories.map((category) => (
                  <CollapsibleSection
                    key={category.key}
                    title={category.label}
                    defaultCollapsed={true}
                    className="border border-gray-200"
                    titleClassName="text-left font-medium"
                    contentClassName="space-y-3"
                  >
                    {renderStarRating(category, formData[category.key as keyof typeof formData] as number)}
                  </CollapsibleSection>
                ))}
              </div>
            )}
            </CardContent>
        </Card>

        {/* Additional Notes and Photo Documentation - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Additional Notes */}
          <Card>
              <CardHeader>
                <CardTitle>Additional Notes & Observations</CardTitle>
                <CardDescription>Detailed observations, specific issues, recommendations, or additional context</CardDescription>
              </CardHeader>
              <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter detailed notes about this inspection...&#10;&#10;Examples:&#10;• Specific areas that need attention&#10;• Safety concerns observed&#10;• Maintenance recommendations&#10;• Follow-up actions required&#10;• Staff performance observations&#10;• Equipment issues noted"
                rows={8}
                className="min-h-[200px]"
              />
              </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Documentation</CardTitle>
              <CardDescription>Upload images or take photos to document inspection findings (up to 5 images)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Images</span>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
                
                <Label htmlFor="camera-capture" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </div>
                  <Input
                    id="camera-capture"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
              </div>
              <p className="text-sm text-gray-500">
                Select multiple images from your device or take new photos with your camera (up to 5 images - JPG, PNG, GIF supported)
              </p>

              {/* Image Previews */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Images ({selectedImages.length}/5)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                          {image.name.length > 12 ? image.name.substring(0, 12) + '...' : image.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className={`bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed ${isMobile ? 'w-full h-14 text-lg' : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              'Submit Inspection'
            )}
          </Button>
        </div>
      </form>
    </div>
    </>
  );
}