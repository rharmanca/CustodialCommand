import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Upload, Camera, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ratingDescriptions, inspectionCategories } from '@shared/custodial-criteria';

interface CustodialInspectionPageProps {
  onBack?: () => void;
}

export default function CustodialInspectionPage({ onBack }: CustodialInspectionPageProps) {
  const { isMobile } = useIsMobile();
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
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.school || !formData.date) {
      alert('Please fill in school and date fields');
      return;
    }

    // Check if at least one rating category has been filled
    const hasRating = inspectionCategories.some(category => {
      const rating = formData[category.key as keyof typeof formData] as number;
      return rating > 0;
    });

    if (!hasRating) {
      alert('Please provide at least one rating for the inspection categories');
      return;
    }

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
        alert('Inspection submitted successfully!');
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
        // Navigate back to home page
        if (onBack) {
          onBack();
        }
      } else {
        const errorData = await response.json();
        alert(`Error submitting inspection: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Error submitting inspection. Please try again.');
    }
  };

  const renderMobileStarRating = (categoryObj: any, currentRating: number) => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-base font-medium text-foreground mb-3">
            Rate this category:
          </div>
          
          {/* Star Rating Buttons */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                onClick={() => handleInputChange(categoryObj.key, star)}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= currentRating && currentRating > 0
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {/* Not Rated Button */}
          <button
            type="button"
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              currentRating === 0
                ? 'bg-gray-100 border-gray-300 text-gray-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => handleInputChange(categoryObj.key, 0)}
          >
            Not Rated
          </button>
        </div>

        {/* Rating Description */}
        {currentRating > 0 && (
          <div className="space-y-2">
            <Badge variant="secondary" className="text-base px-4 py-2 w-full justify-center">
              {ratingDescriptions[currentRating - 1]?.label}
            </Badge>
            <div className="text-center text-sm text-muted-foreground">
              {ratingDescriptions[currentRating - 1]?.description}
            </div>
          </div>
        )}
        {currentRating === 0 && (
          <div className="space-y-2">
            <Badge variant="outline" className="text-base px-4 py-2 w-full justify-center">
              Not Rated
            </Badge>
            <div className="text-center text-sm text-muted-foreground">
              No rating selected
            </div>
          </div>
        )}

        {/* Detailed Criteria */}
        {currentRating > 0 && categoryObj.criteria && categoryObj.criteria[currentRating] && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm text-blue-800">
                <strong>Rating {currentRating} Criteria:</strong>
                <p className="mt-2">{categoryObj.criteria[currentRating]}</p>
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
            className="px-3 py-2 h-auto text-sm"
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
                className={`w-8 h-8 ${
                  star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </Button>
          ))}
        </div>

        {/* Rating Description */}
        {currentRating > 0 && (
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {ratingDescriptions[currentRating - 1]?.label}
            </Badge>
            <div className="text-sm text-gray-600">
              {ratingDescriptions[currentRating - 1]?.description}
            </div>
          </div>
        )}
        {currentRating === 0 && (
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Not Rated
            </Badge>
            <div className="text-sm text-gray-600">
              No rating selected
            </div>
          </div>
        )}

        {/* Detailed Criteria */}
        {currentRating > 0 && categoryObj.criteria && categoryObj.criteria[currentRating] && (
          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm text-blue-800">
                <strong>Rating {currentRating} Criteria:</strong>
                <p className="mt-2">{categoryObj.criteria[currentRating]}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-shrink-0 modern-button btn-violet">
            ← Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Submit Inspection</h1>
          <p className="text-muted-foreground mt-2">Use this form to inspect a single room or location. Example: Cafeteria. If performing a whole building inspection please select that from the previous screen.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Inspection Categories */}
        <Card>
            <CardHeader>
              <CardTitle>Inspection Categories</CardTitle>
              <CardDescription>
                {isMobile 
                  ? "Rate each category using the dropdown menus. Detailed criteria will appear when you select a rating."
                  : "Rate each category based on the criteria (1-5 stars). Detailed criteria will appear when you select a rating."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
            {inspectionCategories.map((category, index) => (
              <div key={category.key}>
                <div className="space-y-4">
                  <Label className={`font-medium ${isMobile ? 'text-lg' : 'text-base'}`}>{category.label}</Label>
                  {isMobile 
                    ? renderMobileStarRating(category, formData[category.key as keyof typeof formData] as number)
                    : renderStarRating(category, formData[category.key as keyof typeof formData] as number)
                  }
                </div>
                {index < inspectionCategories.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
            </CardContent>
        </Card>

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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            size="lg" 
            className={`modern-button btn-sky ${isMobile ? 'w-full h-14 text-lg' : ''}`}
          >
            Submit Inspection
          </Button>
        </div>
      </form>
    </div>
  );
}