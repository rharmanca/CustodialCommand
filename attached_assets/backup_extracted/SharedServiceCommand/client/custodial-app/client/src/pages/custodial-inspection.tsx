import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Star, Upload, Camera, X } from 'lucide-react';

interface CustodialInspectionPageProps {
  onBack?: () => void;
}

export default function CustodialInspectionPage({ onBack }: CustodialInspectionPageProps) {
  const [formData, setFormData] = useState({
    school: '',
    date: '',
    locationDescription: '',
    roomNumber: '',
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

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const ratingDescriptions = [
    { stars: 1, label: "Unkempt Neglect", description: "Crisis" },
    { stars: 2, label: "Moderate Dinginess", description: "Reactive" },
    { stars: 3, label: "Casual Inattention", description: "Managed Care" },
    { stars: 4, label: "Ordinary Tidiness", description: "Comprehensive Care" },
    { stars: 5, label: "Orderly Spotlessness", description: "Showpiece Facility" }
  ];

  const inspectionCategories = [
    { 
      key: 'floors', 
      label: 'Floors',
      criteria: {
        5: "Floors and base moldings shine and/or are bright and clean; colors are fresh. No dirt buildup in corners or along walls.",
        4: "Floors and base moldings shine and/or are bright and clean. There is no buildup in corners along walls, but there can be up to two days' worth of dust, dirt, stains, or streaks.",
        3: "Floors are swept or vacuumed clean, but upon close observation there can be stains. A buildup of dirt and/or floor finish in corners and along walls can be seen. There are dull spots and/or matted carpet in walking lanes. Base molding is dull and dingy with streaks or splashes.",
        2: "Floors are swept or vacuumed clean, but are dull, dingy, and stained. There is an obvious buildup of dirt and/or floor finish in corners and along walls. There is a dull path and/or obviously matted carpet in the walking lanes. Base molding is dull and dingy with streaks or splashes.",
        1: "Floors and carpet are dull, dirty, dingy, scuffed, and/or matted. There is a conspicuous buildup of old dirt and/or floor finish in corners and along walls. Base molding is dirty, stained, and streaked. Gum, stains, dirt, dust balls, and trash are broadcast."
      }
    },
    { 
      key: 'verticalHorizontalSurfaces', 
      label: 'Vertical and Horizontal Surfaces',
      criteria: {
        5: "All vertical and horizontal surfaces have a freshly cleaned or polished appearance and have no accumulation of dust, dirt, marks, streaks, smudges, or fingerprints. Windows, glass, sills, frames, and related surfaces are free of dust, smudges, fingerprints etc.",
        4: "All vertical and horizontal surfaces are clean, but marks, dust, smudges, and fingerprints are noticeable upon close observation. Windows appear clean, but on close inspection marks, dust, cobwebs may be found. Sills and frames may have visible dust, dirt, or cobwebs on them.",
        3: "All vertical and horizontal surfaces have obvious dust, dirt, marks, smudges, and fingerprints. Windows frames are dusty and dirty, window glass is acceptable but it is obvious they have not been cleaned.",
        2: "All vertical and horizontal surfaces have conspicuous dust, dirt, smudges, fingerprints, and marks. At a quick glance windows are visibly dirty.",
        1: "All vertical and horizontal surfaces have major accumulations of dust, dirt, smudges, and fingerprints, all of which will be difficult to remove. Lack of attention is obvious. Window glass has obvious smudges, dirt, and marks. Frames are visibly dirty, dusty, and cobwebs are appearing."
      }
    },
    { 
      key: 'ceiling', 
      label: 'Ceiling',
      criteria: {
        5: "Ceilings and air vents are clean and free of dust/debris including cobwebs. No deficiencies.",
        4: "Ceilings and air vents are clean but dust/debris/cobwebs are noticeable upon close inspection.",
        3: "Ceilings and air vents have obvious dust/debris/cobwebs.",
        2: "Ceilings and air vents have conspicuous dust/debris/cobwebs.",
        1: "Ceilings and air vents have major accumulation of dust/debris/cobwebs."
      }
    },
    { 
      key: 'restrooms', 
      label: 'Restrooms',
      criteria: {
        5: "Consistent Monitoring: Restrooms must be regularly checked for use and cleanliness. Stocked and Maintained: Supplies (soap, paper products, etc.) must be fully stocked at all times. Spotless and Polished: Surfaces must be free of dirt, smudges, and water stains, with polished fixtures and mirrors. Graffiti-Free: No graffiti or defacement is present. Pleasant Odor: Restrooms must have a fresh, pleasant scent with no unpleasant odors.",
        4: "Routine Monitoring: Restrooms are checked regularly but may have minor lapses between inspections. Adequately Stocked: Supplies are generally available, though occasional low stock may occur. Clean but Lived-In: Surfaces are mostly clean, but minor smudges, water spots, or streaks may be present. Graffiti-Free: No significant graffiti, though faint markings or minor blemishes may be visible. Neutral Odor: The restroom has no strong odors—neither noticeably fresh nor unpleasant.",
        3: "Infrequent Monitoring: Restrooms are checked sporadically, leading to noticeable gaps in maintenance. Partially Stocked: Supplies are inconsistent—some items may be low or temporarily unavailable. Visible Wear: Surfaces show clear signs of use, including smudges, water spots, and minor grime. Minor Graffiti: Small or faint graffiti, scratches, or markings are present but not overwhelming. Slight Odor: A faint but noticeable stale or musty odor may be present, though not overpowering.",
        2: "Inconsistent Monitoring: Restrooms are rarely checked, leading to noticeable lapses in cleanliness and maintenance. Low Stock: Many supplies are missing, and those that remain are often running low. Dirty Surfaces: Surfaces show significant grime, stains, and streaks. Cleaning is overdue, and the overall appearance is visibly unkempt. Graffiti and Damage: Obvious graffiti, markings, or damage is present in several areas. Unpleasant Odor: A strong, unpleasant odor may be present, creating a noticeable discomfort for users.",
        1: "Rare or No Monitoring: Restrooms are infrequently checked or completely overlooked, leading to prolonged periods of neglect. No Stock: Essential supplies are completely absent or inadequate, with no immediate plans to restock. Filthy Surfaces: Surfaces are visibly dirty, with heavy stains, grime, and possibly mold or mildew. The overall environment is unsanitary. Extensive Graffiti and Damage: Graffiti, damage, or vandalism is widespread and has not been addressed. Strong, Offensive Odor: The restroom emits a strong, unpleasant odor, often foul, making the space uncomfortable and potentially unsanitary."
      }
    },
    { 
      key: 'customerSatisfaction', 
      label: 'Customer Satisfaction and Coordination',
      criteria: {
        5: "Proud of facilities, have a high level of trust for the custodial organization.",
        4: "Satisfied with custodial-related services, usually complimentary of custodial staff.",
        3: "Accustomed to basic level of custodial care. Generally able to perform mission duties. Lack of pride in physical environment.",
        2: "Generally critical of cost, responsiveness, and quality of custodial services.",
        1: "Consistent customer ridicule, mistrust of custodial services."
      }
    },
    { 
      key: 'trash', 
      label: 'Trash',
      criteria: {
        5: "Interior trash cans only hold daily waste, and are clean and free from odor. Dumpster area is free from litter, dumpsters are closed and if applicable after hours locked. Exterior grounds are free from litter, and exterior trash cans are well placed and maintained.",
        4: "Most interior trash cans only hold daily waste, and are largely clean and free from odor. Dumpster area is free from litter, dumpsters are closed and if applicable after hours locked. Exterior grounds have some litter but appear to be regularly tended to. Exterior trash cans are present, maintenance is frequency of emptying is unclear but acceptable.",
        3: "Interior trash is regularly cleared, some cans are ill maintained and have odor. Litter is present near dumpsters. Some litter is blowing around exterior and does not appear to be addressed on a regular basis.",
        2: "Trash containers smell, are stained and are frequently at capacity with old trash. Litter is present at dumpster area, dumpsters are poorly secured and contributing to exterior litter issues. Exterior litter is present and obvious.",
        1: "Trash containers smell, are stained and are overflowing with old trash. Dumpster areas are overflowing, litter is present near dumpsters and does not appear regularly cleaned. Exterior litter is present, and affecting the overall appearance of school."
      }
    },
    { 
      key: 'projectCleaning', 
      label: 'Project Cleaning',
      criteria: {
        5: "Break work scope is completed on time and regarded well by school based staff. Items are organized, prioritized, and presented by custodial team. Work exceeds expectations.",
        4: "Break work scope is mostly completed, however not on time and some work is shifted throughout year. Custodial team organizes most items. Work meets expectations.",
        3: "Priority break work items are completed, some are pushed to a later date. Items have been organized, prioritized, and presented by school and network. Most of the work meets expectations.",
        2: "Break work items must be requested and organized by school or network. Some items are not able to be completed. Completed work does not meet expectations.",
        1: "There are insufficient funds and staffing for project cleaning."
      }
    },
    { 
      key: 'activitySupport', 
      label: 'Activity Support',
      criteria: {
        5: "Activity (athletics, events, afterschool activities) support happens, and is planned along with the weekly routine. All comments are complimentary. Activity support compliments and does not impede regular work.",
        4: "Activity support happens, and is planned along with the weekly routine. Most comments are complimentary.",
        3: "Activity support happens, and is planned along with the weekly routine. Work at times do not meet customer expectations. Comments are generally complimentary. Activity support is at the expense of some other duties.",
        2: "Activity support happens, but staffing is not allocated. Support is done by redirecting staff away from normal custodial duties on a routine basis.",
        1: "Activity support happens ad hoc and often leads to duties not being completed."
      }
    },
    { 
      key: 'safetyCompliance', 
      label: 'Safety and Compliance',
      criteria: {
        5: "All chemicals are properly labeled, secured, and used in accordance with manufacturer instructions. Gas, propane, and highly combustible items are stored off site. Closets are organized and compliant with DHH regulations.",
        4: "Most chemicals are properly labeled, secured, and used in accordance with manufacturer instructions. Gas, propane, and highly combustible items are stored off site. Some disorganization and lack of tidiness in closets.",
        3: "Some chemicals are properly labeled, secured. Proper use of chemicals is not clear, visible misuse of chemicals such as buildup or material damage is present. Gas, propane, and highly combustible items are usually stored off site, though often after use left on campus. Closets are dirty, though organizational and safety systems appear to be present.",
        2: "Many chemicals not labeled. Proper use of chemicals is not clear, visible misuse of chemicals such as buildup or material damage is present. Gas, propane, and highly combustible items can be found on site. Closets are dirty, no apparent regular organization or safety assessment.",
        1: "Improper use and knowledge of chemicals is widespread. Closets are consistently disorganized, dirty, and lacking safety precautions. Combustible materials prohibited may be present. It is unclear if there are any organizational or safety systems in place."
      }
    },
    { 
      key: 'equipment', 
      label: 'Equipment',
      criteria: {
        5: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is kept in good repair and is replaced as needed. Equipment is evaluated and optimized for the tasks at hand. Equipment is being used in facility with regularity.",
        4: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is kept in good repair and is replaced as needed. Equipment is evaluated and optimized for the tasks at hand.",
        3: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is replaced as needed, but may not be the optimal equipment for the tasks at hand.",
        2: "Equipment is frequently shared and transported and occasionally in disrepair, but there is a basic inventory of equipment on hand.",
        1: "There is no or minimal capital investment for custodial operations. Equipment is limited and in disrepair. Staff do not use available equipment and or not trained on operation."
      }
    },
    { 
      key: 'monitoring', 
      label: 'Monitoring',
      criteria: {
        5: "Real-Time Monitoring: A system is in place to track performance and cleanliness frequently, with some elements monitored in real time. Contract Alignment: Performance standards are fully aligned with the specifications outlined in the contract. Responsive Feedback: Feedback from schools is immediately incorporated into operations.",
        4: "Regular Monitoring: A system is in place to track performance and cleanliness at scheduled intervals, though not in real time. Contract Compliance: Performance generally aligns with contractual standards, with only occasional minor deviations. Feedback Incorporated: Feedback from schools is regularly incorporated into operations.",
        3: "Periodic Monitoring: Performance is monitored intermittently, leading to some inconsistencies in cleanliness and efficiency. Partial Contract Compliance: Standards are mostly followed, but occasional oversights or delays occur. Reactive Feedback Response: Feedback from schools is addressed, though not always promptly.",
        2: "Infrequent Monitoring: Performance is rarely tracked, leading to noticeable inconsistencies. Contract Deviations: Several standards outlined in the contract are not being consistently met. Delayed Feedback Response: Feedback from schools is often ignored or addressed with significant delays.",
        1: "No Monitoring: Performance is rarely or never tracked, resulting in significant inefficiencies. Contract Non-Compliance: Most contractual standards are not being met. Disregarded Feedback: Feedback from schools is ignored or dismissed."
      }
    }
  ];

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert images to base64
      const imageData = await convertImagesToBase64(selectedImages);
      
      const submissionData = {
        ...formData,
        images: imageData
      };

      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const inspection = await response.json();
        alert('Inspection submitted successfully!');
        // Reset form
        setFormData({
          school: '',
          date: '',
          locationDescription: '',
          roomNumber: '',
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
      } else {
        throw new Error('Failed to submit inspection');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Failed to submit inspection. Please try again.');
    }
  };

  const renderStarRating = (categoryObj: any, currentRating: number) => {
    const { key: category, criteria } = categoryObj;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                  star <= currentRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-200'
                }`}
                onClick={() => handleInputChange(category, star)}
              />
            ))}
          </div>
          {currentRating > 0 && (
            <span className="text-sm font-medium text-gray-700">
              {ratingDescriptions[currentRating - 1]?.label}
            </span>
          )}
        </div>
        
        {currentRating > 0 && criteria && criteria[currentRating] && (
          <div className="mt-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              {currentRating} Star{currentRating !== 1 ? 's' : ''} - {ratingDescriptions[currentRating - 1]?.label}
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              {criteria[currentRating]}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mb-4">
          ← Back to Custodial
        </Button>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Submit New Custodial Inspection</h1>
        <p className="text-gray-600">Complete the inspection form based on facility cleanliness criteria</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this inspection</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="locationDescription">Location Description</Label>
              <Input
                id="locationDescription"
                value={formData.locationDescription}
                onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                placeholder="e.g., Main Building, Gym, Cafeteria"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                placeholder="Enter room number"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Rating Scale Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Scale Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              {ratingDescriptions.map((rating) => (
                <div key={rating.stars} className="p-3 border rounded-lg">
                  <div className="flex justify-center mb-2">
                    {[...Array(rating.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {[...Array(5 - rating.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gray-300" />
                    ))}
                  </div>
                  <div className="text-sm font-medium">{rating.label}</div>
                  <div className="text-xs text-gray-500">{rating.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Photos</CardTitle>
            <CardDescription>Upload or take photos related to this inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Images</span>
                  </div>
                  <input
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
                  <input
                    id="camera-capture"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspection Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Categories</CardTitle>
            <CardDescription>Rate each category based on the criteria (1-5 stars). Detailed criteria will appear when you select a rating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {inspectionCategories.map((category, index) => (
              <div key={category.key}>
                <div className="space-y-4">
                  <Label className="text-base font-medium">{category.label}</Label>
                  {renderStarRating(category, formData[category.key as keyof typeof formData] as number)}
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

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button type="submit" size="lg" className="w-full md:w-auto">
            Submit Inspection
          </Button>
        </div>
      </form>
    </div>
  );
}