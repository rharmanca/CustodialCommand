import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { custodialNotesSchema, type CustodialNotesForm, custodialNotesDefaultValues } from '@/schemas';
import { compressImage, needsCompression, formatFileSize } from '@/utils/imageCompression';

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

  // Form submission handler with Zod validation
  const onSubmit = async (data: CustodialNotesForm) => {
    // Validation is automatically handled by Zod schema via zodResolver
    try {
      const formDataToSend = new FormData();

      // Add text fields from validated data
      Object.entries(data).forEach(([key, value]) => {
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
      }
    } catch (error) {
      console.error('Error submitting custodial note:', error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        duration: 7000
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mb-4 back-button">
          ← Back to Custodial
        </Button>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Submit Custodial Note</h1>
        <p className="text-gray-600">Report maintenance issues, concerns, or general observations</p>
      </div>

      <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this custodial note</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspectorName">Inspector Name <span className="text-red-500">*</span></Label>
              <Input
                id="inspectorName"
                {...register('inspectorName')}
                placeholder="Enter your name"
              />
              {errors.inspectorName && (
                <p className="text-sm text-red-500">{errors.inspectorName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School <span className="text-red-500">*</span></Label>
              <Input
                id="school"
                {...register('school')}
                placeholder="Enter school name"
              />
              {errors.school && (
                <p className="text-sm text-red-500">{errors.school.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., Room 105, Gymnasium, Cafeteria"
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
              />
              {errors.locationDescription && (
                <p className="text-sm text-red-500">{errors.locationDescription.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Photos & Documentation</CardTitle>
            <CardDescription>Upload images or capture photos to document the issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="imageUpload" className="block mb-2">Upload Images</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={capturePhoto} variant="outline" className="w-full sm:w-auto">
                  📷 Capture Photo
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
            disabled={isSubmitting}
            className="w-full md:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              'Report a Problem'
            )}
          </Button>
        </div>
      </form>

      {/* Loading overlay during form submission */}
      {isSubmitting && (
        <LoadingOverlay message="Submitting report..." />
      )}
    </div>
  );
}