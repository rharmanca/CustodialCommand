import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { custodialNotesSchema, type CustodialNotesForm, custodialNotesDefaultValues } from '@/schemas';
import { compressImage, needsCompression, formatFileSize } from '@/utils/imageCompression';
import { Check, ChevronsUpDown, ChevronDown } from 'lucide-react';

// School list for dropdown
const SCHOOLS = [
  'ASA',
  'CBR',
  'GWC',
  'LCA',
  'OA',
  'WLC',
];

interface CustodialNotesPageProps {
  onBack?: () => void;
}

export default function CustodialNotesPage({ onBack }: CustodialNotesPageProps) {
  const { toast } = useToast();

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    getValues
  } = useForm<CustodialNotesForm>({
    resolver: zodResolver(custodialNotesSchema),
    defaultValues: custodialNotesDefaultValues
  });

  // Image state (handled separately from form data)
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formDataToConfirm, setFormDataToConfirm] = useState<CustodialNotesForm | null>(null);
  const [isActuallySubmitting, setIsActuallySubmitting] = useState(false);

  // School dropdown state
  const [openSchoolDropdown, setOpenSchoolDropdown] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");

  // Form progress tracking
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Track scroll position to determine current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.form-section');
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = sectionTop + rect.height;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          setCurrentSection(index + 1);
        }
      });

      // Hide scroll hint after user scrolls
      if (window.scrollY > 100) {
        setShowScrollHint(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const currentCount = images.length;
      const availableSlots = 5 - currentCount;
      const imagesToAdd = newImages.slice(0, availableSlots);

      if (imagesToAdd.length < newImages.length) {
        toast({
          title: "Maximum Images Reached",
          description: `Only ${imagesToAdd.length} images were added. Maximum of 5 images allowed.`
        });
      }

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
            compressedImages.push(image);
            totalCompressedSize += image.size;
          }
        } else {
          compressedImages.push(image);
          totalCompressedSize += image.size;
        }
      }

      setImages(prev => [...prev, ...compressedImages]);

      // Create preview URLs
      const urls = compressedImages.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...urls]);

      if (compressedImages.length > 0) {
        const compressionSaved = totalOriginalSize - totalCompressedSize;
        const compressionRatio = compressionSaved > 0
          ? ((compressionSaved / totalOriginalSize) * 100).toFixed(1)
          : '0';

        toast({
          title: "📸 Photos Uploaded Successfully!",
          description: `Successfully added ${compressedImages.length} photo${compressedImages.length > 1 ? 's' : ''} to your custodial note documentation.${compressionSaved > 0 ? ` Saved ${formatFileSize(compressionSaved)} (${compressionRatio}% compression).` : ''}`,
          duration: 3000
        });
      }
    }

    // Reset input value to allow same file to be selected again
    event.target.value = '';
  };

  const capturePhoto = () => {
    if (images.length >= 5) {
      toast({
        variant: "destructive",
        title: "Maximum Images Reached",
        description: "Maximum of 5 images allowed. Please remove some images first."
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const event = e as any;
      if (event.target.files && event.target.files.length > 0) {
        // Show immediate feedback for camera capture
        toast({
          title: "📷 Photo Captured Successfully!",
          description: "Camera photo is being processed and added to your documentation.",
          duration: 2000
        });
      }
      handleImageUpload(event);
    };
    input.click();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);

    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  // Form submission handler with Zod validation - shows confirmation dialog
  const onSubmit = async (data: CustodialNotesForm) => {
    // Validation is automatically handled by Zod schema via zodResolver
    // Store form data and show confirmation dialog
    setFormDataToConfirm(data);
    setShowConfirmDialog(true);
  };

  // Actual submission after confirmation
  const handleConfirmedSubmit = async () => {
    if (!formDataToConfirm) return;

    setIsActuallySubmitting(true);
    setShowConfirmDialog(false);

    try {
      const formDataToSend = new FormData();

      // Add text fields from validated data
      Object.entries(formDataToConfirm).forEach(([key, value]) => {
        if (key !== 'images') { // Skip images array from form data
          formDataToSend.append(key, value?.toString() || '');
        }
      });

      // Add image files - use 'images' field name that backend expects
      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await fetch('/api/custodial-notes', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        toast({
          title: "✅ Custodial Note Submitted Successfully!",
          description: "Your custodial concern has been recorded and will be reviewed.",
          variant: "default",
          duration: 5000
        });

        // Reset form using React Hook Form's reset
        reset();
        setImages([]);
        // Clean up preview URLs
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        setImagePreviewUrls([]);
        setFormDataToConfirm(null);
        setIsActuallySubmitting(false);

        // Navigate back to home page after enough time to read the notification
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: `Error: ${errorData.message || 'Unable to submit custodial note. Please try again.'}`,
          duration: 7000
        });
        setIsActuallySubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting custodial note:', error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        duration: 7000
      });
      setIsActuallySubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mb-4 back-button min-h-[48px] px-6">
          ← Back to Custodial
        </Button>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Submit Custodial Note</h1>
        <p className="text-gray-600">Report maintenance issues, concerns, or general observations</p>
      </div>

      {/* Progress Indicator */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-blue-200 py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-800">
              Form Progress:
            </span>
            {currentSection && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border-2 border-blue-300">
                Section {currentSection} of 3
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <div className={`w-16 h-2 rounded-full transition-colors ${currentSection === 1 ? 'bg-blue-600' : currentSection && currentSection > 1 ? 'bg-blue-400' : 'bg-gray-200'}`} />
            <div className={`w-16 h-2 rounded-full transition-colors ${currentSection === 2 ? 'bg-blue-600' : currentSection && currentSection > 2 ? 'bg-blue-400' : 'bg-gray-200'}`} />
            <div className={`w-16 h-2 rounded-full transition-colors ${currentSection === 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>

      {/* Scroll Hint */}
      {showScrollHint && (
        <div className="animate-bounce text-center text-gray-500 text-sm">
          <ChevronDown className="inline-block" />
          <p>Scroll down to continue</p>
        </div>
      )}

      {/* Inspector Name Requirement Notice */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⭐</span>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 text-lg mb-1">New Requirement: Inspector Name</h3>
            <p className="text-amber-800 text-sm">
              Please enter your name in the <strong>Inspector Name</strong> field. This is now required for all custodial notes to ensure proper accountability and follow-up.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="form-section">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this custodial note</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="inspectorName" className="flex items-center gap-2 flex-wrap">
                <span>Inspector Name</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                  Required
                </span>
              </Label>
              <Input
                id="inspectorName"
                {...register('inspectorName')}
                placeholder="Enter your name"
                className="border-2 min-h-[48px]"
              />
              {errors.inspectorName && (
                <p className="text-sm text-red-500">{errors.inspectorName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="school" className="flex items-center gap-2 flex-wrap">
                <span>School</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                  Required
                </span>
              </Label>
              <Popover open={openSchoolDropdown} onOpenChange={setOpenSchoolDropdown}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSchoolDropdown}
                    className="w-full justify-between border-2 min-h-[48px] text-left font-normal"
                  >
                    {selectedSchool || "Select school..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search schools..." />
                    <CommandEmpty>No school found.</CommandEmpty>
                    <CommandGroup>
                      {SCHOOLS.map((school) => (
                        <CommandItem
                          key={school}
                          value={school}
                          onSelect={(currentValue) => {
                            const newValue = currentValue.toUpperCase();
                            setSelectedSchool(newValue);
                            setValue('school', newValue);
                            setOpenSchoolDropdown(false);
                          }}
                          className="min-h-[48px] cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedSchool === school ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {school}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.school && (
                <p className="text-sm text-red-500">{errors.school.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 flex-wrap">
                <span>Date</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                  Required
                </span>
              </Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className="border-2 min-h-[48px]"
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2 flex-wrap">
                <span>Location</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                  Required
                </span>
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., Room 105, Gymnasium, Cafeteria"
                className="border-2 min-h-[48px]"
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationDescription">Location Description</Label>
              <Input
                id="locationDescription"
                {...register('locationDescription')}
                placeholder="e.g., Main Building, East Wing, 2nd Floor"
                className="min-h-[48px]"
              />
              {errors.locationDescription && (
                <p className="text-sm text-red-500">{errors.locationDescription.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="form-section">
          <CardHeader>
            <CardTitle>Issue Description & Notes</CardTitle>
            <CardDescription>Provide detailed information about the custodial issue or observation</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('notes')}
              placeholder="Describe the issue, maintenance need, or observation...&#10;&#10;Examples:&#10;• Broken equipment or fixtures&#10;• Cleaning supply needs&#10;• Safety concerns&#10;• Maintenance requests&#10;• General observations&#10;• Follow-up needed"
              rows={10}
              className="min-h-[250px]"
            />
            {errors.notes && (
              <p className="text-sm text-red-500 mt-2">{errors.notes.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card className="form-section">
          <CardHeader>
            <CardTitle>Photos & Documentation</CardTitle>
            <CardDescription>Upload images or capture photos to document the issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="imageUpload" className="block mb-2">Upload Images (Optional)</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('imageUpload')?.click()}
                  variant="outline"
                  className="w-full h-12 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-base">
                    <span className="text-2xl">📁</span>
                    <span className="font-medium">
                      Tap to Select Photos {images.length > 0 && `(${images.length} selected)`}
                    </span>
                  </span>
                </Button>
                <p className="text-xs text-gray-500 mt-1">Maximum 5 images • Images auto-compressed</p>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={capturePhoto} variant="outline" className="w-full sm:w-auto h-12 border-2">
                  <span className="flex items-center gap-2 text-base">
                    <span className="text-xl">📷</span>
                    <span>Capture Photo</span>
                  </span>
                </Button>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="mt-4">
                <Label className="block mb-2">Uploaded Images ({images.length})</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        onClick={() => removeImage(index)}
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || isActuallySubmitting}
            className="w-full md:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {(isSubmitting || isActuallySubmitting) ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              'Submit Custodial Note'
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-800 text-xl">
              ✅ Confirm Submission
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Please review your custodial note before submitting:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {formDataToConfirm && (
            <div className="space-y-3 py-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div>
                  <span className="font-semibold text-sm text-gray-700">Inspector:</span>
                  <p className="text-gray-900">{formDataToConfirm.inspectorName}</p>
                </div>
                <div>
                  <span className="font-semibold text-sm text-gray-700">School:</span>
                  <p className="text-gray-900">{formDataToConfirm.school}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold text-sm text-gray-700">Date:</span>
                    <p className="text-gray-900">{formDataToConfirm.date}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-700">Location:</span>
                    <p className="text-gray-900">{formDataToConfirm.location}</p>
                  </div>
                </div>
                {formDataToConfirm.locationDescription && (
                  <div>
                    <span className="font-semibold text-sm text-gray-700">Location Details:</span>
                    <p className="text-gray-900 text-sm">{formDataToConfirm.locationDescription}</p>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-sm text-gray-700">Notes:</span>
                  <p className="text-gray-900 text-sm max-h-24 overflow-y-auto">
                    {formDataToConfirm.notes && formDataToConfirm.notes.length > 200
                      ? `${formDataToConfirm.notes.substring(0, 200)}...`
                      : formDataToConfirm.notes || 'No notes provided'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-sm text-gray-700">Photos:</span>
                  <p className="text-gray-900">{images.length} image{images.length !== 1 ? 's' : ''} attached</p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Review/Edit</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit} className="bg-blue-600 hover:bg-blue-700">
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading overlay during form submission */}
      {isActuallySubmitting && (
        <LoadingOverlay message="Submitting report..." />
      )}
    </div>
  );
}