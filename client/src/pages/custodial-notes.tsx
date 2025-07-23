import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CustodialNotesPageProps {
  onBack?: () => void;
}

export default function CustodialNotesPage({ onBack }: CustodialNotesPageProps) {
  const [formData, setFormData] = useState({
    inspectorName: '',
    school: '',
    date: '',
    location: '',
    locationDescription: '',
    notes: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files];
    setImages(newImages);

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImages(prev => [...prev, file]);
            setImagePreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
          }
          stream.getTracks().forEach(track => track.stop());
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please use file upload instead.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Add images
      images.forEach((image, index) => {
        formDataToSend.append(`image_${index}`, image);
      });

      const response = await fetch('/api/custodial-notes', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        alert('Custodial note submitted successfully!');
        // Reset form
        setFormData({
          inspectorName: '',
          school: '',
          date: '',
          location: '',
          locationDescription: '',
          notes: ''
        });
        setImages([]);
        // Clean up preview URLs
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        setImagePreviewUrls([]);
      } else {
        throw new Error('Failed to submit custodial note');
      }
    } catch (error) {
      console.error('Error submitting custodial note:', error);
      alert('Failed to submit custodial note. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mb-4">
          ← Back to Custodial
        </Button>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Submit Custodial Note</h1>
        <p className="text-gray-600">Report maintenance issues, concerns, or general observations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this custodial note</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspectorName">Inspector Name</Label>
              <Input
                id="inspectorName"
                value={formData.inspectorName}
                onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => handleInputChange('school', e.target.value)}
                placeholder="Enter school name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Room 105, Gymnasium, Cafeteria"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationDescription">Location Description</Label>
              <Input
                id="locationDescription"
                value={formData.locationDescription}
                onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                placeholder="e.g., Main Building, East Wing, 2nd Floor"
                required
              />
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
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Describe the issue, maintenance need, or observation...&#10;&#10;Examples:&#10;• Broken equipment or fixtures&#10;• Cleaning supply needs&#10;• Safety concerns&#10;• Maintenance requests&#10;• General observations&#10;• Follow-up needed"
              rows={10}
              className="min-h-[250px]"
              required
            />
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
          <Button type="submit" size="lg" className="w-full md:w-auto">
            Submit Custodial Note
          </Button>
        </div>
      </form>
    </div>
  );
}