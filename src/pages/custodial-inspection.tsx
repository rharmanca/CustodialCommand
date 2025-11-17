import { useState, useEffect, memo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveDraft, loadDraft, clearDraft, STORAGE_KEYS, migrateLegacyDrafts, processImageForStorage, getStorageStats } from '@/utils/storage';
import { compressImage, needsCompression, formatFileSize } from '@/utils/imageCompression';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Star, Upload, Camera, X, Save, Clock, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { ratingDescriptions, inspectionCategories } from '../../shared/custodial-criteria';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { singleAreaInspectionSchema, type SingleAreaInspectionForm, inspectionDefaultValues } from '@/schemas';
import { AutoSaveIndicator, type SaveStatus } from '@/components/auto-save-indicator';

interface CustodialInspectionPageProps {
  onBack?: () => void;
}

export default function CustodialInspectionPage({ onBack }: CustodialInspectionPageProps) {
  const { isMobile } = useIsMobile();
  const { toast } = useToast();

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    getValues,
    control
  } = useForm<SingleAreaInspectionForm>({
    resolver: zodResolver(singleAreaInspectionSchema),
    defaultValues: inspectionDefaultValues
  });

  // Watch all form values for auto-save functionality
  const formData = watch();

  // Draft-saving state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [draftInspections, setDraftInspections] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

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

  // Load existing drafts on component mount and migrate legacy storage
  useEffect(() => {
    migrateLegacyDrafts();
    loadDraftInspections();
    
    // Log storage stats for debugging
    const stats = getStorageStats();
    console.log('Storage stats:', stats);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (currentDraftId) {
      const timeoutId = setTimeout(() => {
        saveDraftData();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, selectedImages, currentDraftId]);

  const loadDraftInspections = () => {
    try {
      // Try to load from optimized storage first
      const draftData = loadDraft(STORAGE_KEYS.DRAFT_INSPECTION);
      if (draftData) {
        setDraftInspections([draftData]);
        setShowResumeDialog(true);
      }
      
      // Also check for any legacy drafts and show them
      const legacyDrafts = localStorage.getItem('custodial_inspection_drafts');
      if (legacyDrafts && !draftData) {
        const drafts = JSON.parse(legacyDrafts);
        const validDrafts = drafts.filter((draft: any) => {
          const draftDate = new Date(draft.lastModified);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return draftDate > weekAgo;
        });
        
        if (validDrafts.length > 0) {
          setDraftInspections(validDrafts);
          setShowResumeDialog(true);
        }
      }
    } catch (error) {
      console.error('Error loading draft inspections:', error);
    }
  };

  const generateDraftId = () => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveDraftData = async () => {
    if (!formData.school || !formData.date) {
      return; // Don't save empty drafts
    }

    setIsAutoSaving(true);
    setSaveStatus('saving');
    try {
      const draftId = currentDraftId || generateDraftId();
      if (!currentDraftId) {
        setCurrentDraftId(draftId);
      }

      // Process images with compression for optimized storage
      const imageData: string[] = [];
      for (const file of selectedImages) {
        try {
          const processedImage = await processImageForStorage(file);
          imageData.push(processedImage);
        } catch (error) {
          console.error('Failed to process image:', error);
          // Skip the problematic image rather than failing completely
        }
      }

      const draftData = {
        id: draftId,
        ...formData,
        selectedImages: imageData,
        lastModified: new Date().toISOString(),
        title: `${formData.school} - ${formData.roomNumber || 'Room'} - ${formData.locationCategory || 'Inspection'}`
      };

      // Use optimized storage system
      saveDraft(STORAGE_KEYS.DRAFT_INSPECTION, draftData);
      setLastSaved(new Date());
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveStatus('error');
    } finally {
      setIsAutoSaving(false);
    }
  };

  const loadDraftData = (draft: any) => {
    // Load draft data into React Hook Form using setValue
    setValue('school', draft.school || '');
    setValue('date', draft.date || '');
    setValue('inspectionType', draft.inspectionType || 'single_room');
    setValue('locationDescription', draft.locationDescription || '');
    setValue('roomNumber', draft.roomNumber || '');
    setValue('locationCategory', draft.locationCategory || '');
    setValue('floors', draft.floors || 0);
    setValue('verticalHorizontalSurfaces', draft.verticalHorizontalSurfaces || 0);
    setValue('ceiling', draft.ceiling || 0);
    setValue('restrooms', draft.restrooms || 0);
    setValue('customerSatisfaction', draft.customerSatisfaction || 0);
    setValue('trash', draft.trash || 0);
    setValue('projectCleaning', draft.projectCleaning || 0);
    setValue('activitySupport', draft.activitySupport || 0);
    setValue('safetyCompliance', draft.safetyCompliance || 0);
    setValue('equipment', draft.equipment || 0);
    setValue('monitoring', draft.monitoring || 0);
    setValue('notes', draft.notes || '');

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
    // Clear from optimized storage
    clearDraft(STORAGE_KEYS.DRAFT_INSPECTION);
    
    // Also clean up any legacy storage entries
    const existingDrafts = JSON.parse(localStorage.getItem('custodial_inspection_drafts') || '[]');
    const updatedDrafts = existingDrafts.filter((d: any) => d.id !== draftId);
    if (updatedDrafts.length !== existingDrafts.length) {
      localStorage.setItem('custodial_inspection_drafts', JSON.stringify(updatedDrafts));
    }
    
    setDraftInspections([]);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const currentCount = selectedImages.length;
      const availableSlots = 5 - currentCount;
      const imagesToAdd = newImages.slice(0, availableSlots);
      
      // Compress images that need it
      const compressedImages: File[] = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      
      for (const image of imagesToAdd) {
        totalOriginalSize += image.size;
        
        if (needsCompression(image, 500)) {
          try {
            const result = await compressImage(image, { maxSizeKB: 500 });
            compressedImages.push(result.compressedFile);
            totalCompressedSize += result.compressedSize;
            
            console.log(`Compressed ${image.name}: ${formatFileSize(image.size)} → ${formatFileSize(result.compressedSize)}`);
          } catch (error) {
            console.error('Failed to compress image:', error);
            compressedImages.push(image); // Use original if compression fails
            totalCompressedSize += image.size;
          }
        } else {
          compressedImages.push(image);
          totalCompressedSize += image.size;
        }
      }
      
      setSelectedImages(prev => [...prev, ...compressedImages]);
      
      if (compressedImages.length > 0) {
        const compressionSaved = totalOriginalSize - totalCompressedSize;
        const compressionRatio = (compressionSaved / totalOriginalSize * 100).toFixed(1);
        
        toast({
          title: "📸 Photos Uploaded Successfully!",
          description: `Added ${compressedImages.length} photo${compressedImages.length > 1 ? 's' : ''} to inspection documentation.${compressionSaved > 0 ? ` Saved ${formatFileSize(compressionSaved)} (${compressionRatio}% compression).` : ''}`,
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
      
      console.log('Files selected:', compressedImages.length, 'files');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form submission handler with Zod validation
  const onSubmit = async (data: SingleAreaInspectionForm) => {
    // Validation is automatically handled by Zod schema via zodResolver
    try {
      // Use FormData for multipart upload (same as custodial-notes)
      const formDataToSend = new FormData();

      // Add all form fields from validated data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images') { // Skip images array from form data
          formDataToSend.append(key, value?.toString() || '');
        }
      });

      // Add image files as multipart data
      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      // Add timeout to prevent hanging indefinitely (30 second timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/inspections', {
        method: 'POST',
        body: formDataToSend, // No Content-Type header - let browser set it for multipart
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Show success notification
        toast({
          title: "✅ Inspection Submitted Successfully!",
          description: `Single area inspection for ${data.school} has been submitted and saved.`,
          variant: "default",
          duration: 5000
        });

        // Clean up draft after successful submission
        if (currentDraftId) {
          deleteDraft(currentDraftId);
        }

        // Reset form using React Hook Form's reset
        reset();
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

      let errorTitle = "Submission Failed";
      let errorMessage = "Unable to submit inspection. Please try again.";

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorTitle = "Request Timeout";
          errorMessage = "The request took too long to complete. This might be due to slow internet connection or large file uploads. Please try again.";
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          errorTitle = "Network Error";
          errorMessage = "Unable to connect to the server. Please check your connection and try again.";
        } else if (error.message.includes('validation') || error.message.includes('Invalid')) {
          errorTitle = "Invalid Data";
          errorMessage = "Please check all required fields and try again.";
        }
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
        duration: 7000
      });
    }
  };

  const renderMobileStarRating = useCallback((categoryObj: any, currentRating: number) => {
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
                className="p-3 min-w-[48px] min-h-[48px] rounded-md hover:bg-yellow-50 transition-colors touch-manipulation flex items-center justify-center"
                onClick={() => setValue(categoryObj.key as keyof SingleAreaInspectionForm, star)}
              >
                <Star
                  className={`w-7 h-7 ${
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
              className={`px-6 py-3 min-h-[48px] rounded-md border text-sm font-medium transition-colors touch-manipulation ${
                currentRating === 0
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setValue(categoryObj.key as keyof SingleAreaInspectionForm, 0)}
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
  }, [setValue]);

  const renderStarRating = useCallback((categoryObj: any, currentRating: number) => {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant={currentRating === 0 ? "default" : "outline"}
            size="sm"
            className="px-4 py-3 text-xs min-h-[48px]"
            onClick={() => setValue(categoryObj.key as keyof SingleAreaInspectionForm, 0)}
          >
            Not Rated
          </Button>
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              type="button"
              variant="ghost"
              size="icon"
              className="min-w-[48px] min-h-[48px]"
              onClick={() => setValue(categoryObj.key as keyof SingleAreaInspectionForm, star)}
            >
              <Star
                className={`w-7 h-7 ${
                  star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </Button>
          ))}
        </div>

        {/* Current Rating Status */}
        <div className="text-center px-3">
          {currentRating > 0 ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {ratingDescriptions[currentRating - 1]?.label}
              </Badge>
              <div className="text-xs text-gray-600 leading-relaxed">
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
            <CardContent className="p-4">
              <div className="text-xs text-accent-foreground">
                <strong className="text-sm">Rating {currentRating} Criteria:</strong>
                <p className="mt-1 leading-relaxed">{categoryObj.criteria[currentRating]}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }, [setValue]);

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
                      onClick={() => loadDraftData(draft)}
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
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={onBack} className="flex items-center gap-1 cursor-pointer">
              <Home className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Single Area Inspection</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Submit Inspection</h1>
        <p className="text-muted-foreground mt-2">Use this form to inspect a single room or location. Example: Cafeteria. If performing a whole building inspection please select that from the previous screen.</p>

        {/* Important Note */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>📋 Important:</strong> This form is for inspecting a single room or area using the same rating criteria as the Whole Building Inspection. However, single area inspections are recorded separately and do not automatically count toward a building-wide inspection or monthly metrics. If you're conducting these inspections as part of a comprehensive building review or to meet monthly inspection requirements, you'll need to manually track your progress across all required areas.
          </p>
        </div>

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

        {/* Manual Save Button */}
        {currentDraftId && (
          <Button
            type="button"
            variant="outline"
            onClick={saveDraftData}
            disabled={isAutoSaving}
            className="mt-4"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        )}
      </div>

      <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information - Organized in columns */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="school">School *</Label>
                <Controller
                  name="school"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.school && (
                  <p className="text-sm text-red-500 mt-1">{errors.school.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="date">Inspection Date *</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    aria-describedby="date-help"
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                {errors.date && (
                  <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
                )}
                <p id="date-help" className="text-sm text-muted-foreground mt-1">
                  Click the field or calendar icon to select a date
                </p>
              </div>

              <div>
                <Label htmlFor="locationCategory">Location Category</Label>
                <Controller
                  name="locationCategory"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.locationCategory && (
                  <p className="text-sm text-red-500 mt-1">{errors.locationCategory.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  {...register('roomNumber')}
                  placeholder="e.g., 101, Main Hall"
                />
                {errors.roomNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.roomNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="locationDescription">Location Description</Label>
              <Input
                id="locationDescription"
                {...register('locationDescription')}
                placeholder="e.g., Main Building, Second Floor, Near Library"
              />
              {errors.locationDescription && (
                <p className="text-sm text-red-500 mt-1">{errors.locationDescription.message}</p>
              )}
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
                {...register('notes')}
                placeholder="Enter detailed notes about this inspection...&#10;&#10;Examples:&#10;• Specific areas that need attention&#10;• Safety concerns observed&#10;• Maintenance recommendations&#10;• Follow-up actions required&#10;• Staff performance observations&#10;• Equipment issues noted"
                rows={8}
                className="min-h-[200px]"
                aria-describedby="notes-help"
              />
              {errors.notes && (
                <p className="text-sm text-red-500 mt-2">{errors.notes.message}</p>
              )}
              <p id="notes-help" className="text-sm text-muted-foreground mt-2">
                Provide detailed observations, specific issues, recommendations, or additional context for this inspection
              </p>
              </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Photo Documentation</CardTitle>
              <CardDescription>Upload images or take photos to document inspection findings (up to 5 images)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Label htmlFor="image-upload" className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors min-h-[48px]">
                    <Upload className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="font-medium">Upload Images</span>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={selectedImages.length >= 5}
                  />
                </Label>

                <Label htmlFor="camera-capture" className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors min-h-[48px]">
                    <Camera className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="font-medium">Take Photo</span>
                  </div>
                  <Input
                    id="camera-capture"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={selectedImages.length >= 5}
                  />
                </Label>
              </div>

              {/* Image count badge */}
              {selectedImages.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedImages.length} of 5 images selected
                  </span>
                  {selectedImages.length >= 5 && (
                    <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      Maximum reached
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs sm:text-sm text-gray-500">
                📸 Select multiple images or take photos • Up to 5 images • JPG, PNG, GIF supported
              </p>

              {/* Image Previews */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Image Previews</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 sm:h-24 object-cover rounded-lg border-2 border-gray-200"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
                          aria-label={`Remove image ${index + 1}`}
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

    {/* Loading overlay during form submission */}
    {isSubmitting && (
      <LoadingOverlay message="Submitting inspection..." />
    )}

    {/* Auto-save status indicator */}
    <AutoSaveIndicator
      status={saveStatus}
      lastSaved={lastSaved}
    />
    </>
  );
}