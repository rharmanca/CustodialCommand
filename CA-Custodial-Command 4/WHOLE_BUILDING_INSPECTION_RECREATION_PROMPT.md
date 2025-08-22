# Complete Whole Building Inspection System Recreation Prompt

## System Overview
Create a sophisticated multi-step inspection workflow that breaks down comprehensive building assessments into manageable room categories with progress tracking, auto-save functionality, and resume capabilities.

## Core Architecture Requirements

### Database Schema (PostgreSQL with Drizzle ORM)

#### 1. Main Inspections Table
```sql
CREATE TABLE inspections (
  id SERIAL PRIMARY KEY,
  inspector_name TEXT,
  school TEXT NOT NULL,
  date TEXT NOT NULL,
  inspection_type TEXT NOT NULL, -- 'single_room' or 'whole_building'
  location_description TEXT NOT NULL,
  room_number TEXT,
  location_category TEXT,
  building_name TEXT,
  building_inspection_id INTEGER,
  -- Rating fields (nullable for building inspections)
  floors INTEGER,
  vertical_horizontal_surfaces INTEGER,
  ceiling INTEGER,
  restrooms INTEGER,
  customer_satisfaction INTEGER,
  trash INTEGER,
  project_cleaning INTEGER,
  activity_support INTEGER,
  safety_compliance INTEGER,
  equipment INTEGER,
  monitoring INTEGER,
  notes TEXT,
  images TEXT[],
  verified_rooms TEXT[],
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Room Inspections Table (Child Records)
```sql
CREATE TABLE room_inspections (
  id SERIAL PRIMARY KEY,
  building_inspection_id INTEGER NOT NULL,
  room_type TEXT NOT NULL,
  room_identifier TEXT,
  -- All 11 rating categories
  floors INTEGER,
  vertical_horizontal_surfaces INTEGER,
  ceiling INTEGER,
  restrooms INTEGER,
  customer_satisfaction INTEGER,
  trash INTEGER,
  project_cleaning INTEGER,
  activity_support INTEGER,
  safety_compliance INTEGER,
  equipment INTEGER,
  monitoring INTEGER,
  notes TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Category Requirements Matrix
```typescript
const requirements = {
  exterior: 2,                    // Must inspect 2 exterior areas
  gym_bleachers: 1,              // Must inspect 1 gym/bleacher area
  classroom: 3,                  // Must inspect 3 classrooms
  cafeteria: 1,                  // Must inspect 1 cafeteria
  utility_storage: 1,            // Must inspect 1 utility/storage area
  admin_office: 2,               // Must inspect 2 admin/office areas
  hallway: 3,                    // Must inspect 3 hallways
  stairwell: 2,                  // Must inspect 2 stairwells
  restroom: 2,                   // Must inspect 2 restrooms
  staff_single_restroom: 1       // Must inspect 1 staff/single restroom
};

const categoryLabels = {
  exterior: 'Exterior',
  gym_bleachers: 'Gym and Bleachers',
  classroom: 'Classroom',
  cafeteria: 'Cafeteria',
  utility_storage: 'Utility Or Storage',
  admin_office: 'Admin or Office Area',
  hallway: 'Hallway',
  stairwell: 'Stairwell',
  restroom: 'Restroom',
  staff_single_restroom: 'Staff or Single Restroom'
};
```

## Phase 1: Page Initialization & State Management

### Required React State Variables
```typescript
// Progress tracking
const [completed, setCompleted] = useState<Record<string, number>>(() => {
  const initial: Record<string, number> = {};
  Object.keys(requirements).forEach(key => { initial[key] = 0; });
  return initial;
});

// Inspection management
const [availableInspections, setAvailableInspections] = useState<any[]>([]);
const [showInspectionSelector, setShowInspectionSelector] = useState(false);
const [isResuming, setIsResuming] = useState(false);
const [buildingInspectionId, setBuildingInspectionId] = useState<number | null>(null);

// Form data with 11 rating categories (all start at -1 = "not rated")
const [formData, setFormData] = useState({
  inspectorName: '', school: '', date: '', locationCategory: '',
  roomNumber: '', locationDescription: '', notes: '',
  floors: -1, verticalHorizontalSurfaces: -1, ceiling: -1,
  restrooms: -1, customerSatisfaction: -1, trash: -1,
  projectCleaning: -1, activitySupport: -1, safetyCompliance: -1,
  equipment: -1, monitoring: -1
});

// UI state
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [isAllComplete, setIsAllComplete] = useState(false);

// Auto-save state
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [isAutoSaving, setIsAutoSaving] = useState(false);
const [currentFormDraftId, setCurrentFormDraftId] = useState<string | null>(null);
```

### Initialization Logic
```typescript
useEffect(() => {
  // Load incomplete building inspections on mount
  const loadAvailableInspections = async () => {
    try {
      const response = await fetch('/api/inspections?type=whole_building&incomplete=true');
      if (response.ok) {
        const inspections = await response.json();
        setAvailableInspections(inspections);
        if (inspections.length > 0) {
          setShowInspectionSelector(true);
        }
      }
    } catch (error) {
      console.error('Error loading available inspections:', error);
    }
  };

  loadAvailableInspections();
  loadFormDraft(); // Load localStorage drafts
}, []);

// Continuous completion checking
useEffect(() => {
  const checkCompletion = () => {
    return Object.entries(requirements).every(([category, required]) => {
      return completed[category] >= required;
    });
  };
  setIsAllComplete(checkCompletion());
}, [completed]);
```

## Phase 2: Inspection Selection Interface

### Selection Card UI Logic
```typescript
{showInspectionSelector && (
  <Card>
    <CardHeader>
      <CardTitle>Building Inspection Options</CardTitle>
      <CardDescription>You can continue a previous inspection or start a new one</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Always show Start New button first */}
      <Button
        onClick={startNewInspection}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8"
      >
        🏢 Start New Building Inspection
      </Button>
      
      {/* Show incomplete inspections if any exist */}
      {availableInspections.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Or Continue Previous Inspection:</h4>
          {availableInspections.map((inspection) => (
            <div key={inspection.id} className="flex items-center justify-between p-3 border rounded-lg bg-amber-50">
              <div>
                <div className="font-medium">{inspection.school}</div>
                <div className="text-sm">{new Date(inspection.date).toLocaleDateString()}</div>
                <div className="text-sm">Inspector: {inspection.inspectorName}</div>
              </div>
              <Button onClick={() => selectInspection(inspection)}>Continue</Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)}
```

### Start New vs Resume Logic
```typescript
const startNewInspection = () => {
  setShowInspectionSelector(false);
  setIsResuming(false);
  setBuildingInspectionId(null);
  
  // Reset all completion counts to zero
  setCompleted(() => {
    const initial: Record<string, number> = {};
    Object.keys(requirements).forEach(key => { initial[key] = 0; });
    return initial;
  });
  
  // Reset form to empty state
  setFormData({
    inspectorName: '', school: '', date: '', locationCategory: '',
    roomNumber: '', locationDescription: '', notes: '',
    floors: -1, verticalHorizontalSurfaces: -1, ceiling: -1,
    restrooms: -1, customerSatisfaction: -1, trash: -1,
    projectCleaning: -1, activitySupport: -1, safetyCompliance: -1,
    equipment: -1, monitoring: -1
  });
};

const selectInspection = async (inspection: any) => {
  try {
    setBuildingInspectionId(inspection.id);
    setFormData({
      inspectorName: inspection.inspectorName || '',
      school: inspection.school,
      date: inspection.date,
      locationCategory: '', roomNumber: '', locationDescription: '', notes: '',
      floors: -1, verticalHorizontalSurfaces: -1, ceiling: -1,
      restrooms: -1, customerSatisfaction: -1, trash: -1,
      projectCleaning: -1, activitySupport: -1, safetyCompliance: -1,
      equipment: -1, monitoring: -1
    });

    // Load existing room completion counts
    const roomResponse = await fetch(`/api/inspections/${inspection.id}/rooms`);
    if (roomResponse.ok) {
      const rooms = await roomResponse.json();
      const completedCount: Record<string, number> = {};
      Object.keys(requirements).forEach(key => {
        completedCount[key] = rooms.filter((room: any) => room.roomType === key).length;
      });
      setCompleted(completedCount);
      setIsResuming(true);
      setShowInspectionSelector(false);
    }
  } catch (error) {
    console.error('Error loading inspection:', error);
  }
};
```

## Phase 3: Building Information Form

### Form Display Conditions
```typescript
// Show form only when not resuming and not showing selector
{!isResuming && !showInspectionSelector && (
  <Card>
    <CardHeader>
      <CardTitle>Building Information</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inspector Name */}
        <div className="space-y-2">
          <Label>Inspector Name *</Label>
          <Input
            value={formData.inspectorName}
            onChange={(e) => handleInputChange('inspectorName', e.target.value)}
            required
          />
        </div>
        
        {/* School Dropdown */}
        <div className="space-y-2">
          <Label>School</Label>
          <Select
            value={formData.school}
            onValueChange={(value) => handleInputChange('school', value)}
          >
            <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ASA">ASA</SelectItem>
              <SelectItem value="LCA">LCA</SelectItem>
              <SelectItem value="GWC">GWC</SelectItem>
              <SelectItem value="OA">OA</SelectItem>
              <SelectItem value="CBR">CBR</SelectItem>
              <SelectItem value="WLC">WLC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Input */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
          />
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

## Phase 4: Dynamic Progress Checklist

### Progress Display Logic
```typescript
{!showInspectionSelector && (
  <Card data-inspection-progress>
    <CardHeader>
      <CardTitle>Inspection Progress</CardTitle>
      <CardDescription>
        Complete the required number of inspections for each category
        {formData.school && formData.date && " (Progress is automatically saved)"}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {Object.entries(requirements).map(([category, required]) => {
        const completedCount = completed[category];
        const isComplete = completedCount >= required;

        return (
          <div
            key={category}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isComplete 
                ? 'bg-green-50 border-green-200' 
                : selectedCategory === category 
                  ? 'bg-blue-50 border-blue-300 border-2' 
                  : 'bg-gray-50 border-gray-200'
            }`}
          >
            {/* Checkbox Visual */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center ${
                isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
              }`}>
                {isComplete && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-700'}`}>
                {categoryLabels[category]}
              </span>
            </div>
            
            {/* Progress Badge and Select Button */}
            <div className="flex items-center gap-3">
              <Badge variant={isComplete ? 'default' : 'secondary'}>
                {completedCount}/{required} Completed
              </Badge>
              {!isComplete && formData.school && formData.date && formData.inspectorName.trim() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCategorySelect(category)}
                  className={selectedCategory === category ? 'border-blue-500' : ''}
                >
                  Select
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
)}
```

### Validation Warning System
```typescript
{!showInspectionSelector && 
 selectedCategory && 
 !(formData.school && formData.date && formData.inspectorName.trim()) && (
  <Card className="border-amber-200 bg-amber-50">
    <CardContent className="pt-6">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">!</span>
        </div>
        <div>
          <h4 className="font-medium text-amber-800">Complete Required Information</h4>
          <p className="text-sm text-amber-700">Please fill in all required fields above:</p>
          <ul className="text-sm text-amber-700 mt-2 space-y-1">
            {!formData.inspectorName.trim() && <li>• Inspector Name is required</li>}
            {!formData.school && <li>• School selection is required</li>}
            {!formData.date && <li>• Inspection date is required</li>}
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

## Phase 5: Auto-Save Implementation

### Auto-Save Logic
```typescript
// Auto-save every 2 seconds when form data changes
useEffect(() => {
  if (buildingInspectionId && selectedCategory && (formData.inspectorName || formData.school || formData.date)) {
    const timeoutId = setTimeout(() => {
      saveFormDraft();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }
}, [formData, selectedCategory, buildingInspectionId]);

const saveFormDraft = async () => {
  if (!buildingInspectionId || !selectedCategory) return;

  setIsAutoSaving(true);
  try {
    const draftId = currentFormDraftId || `building_form_${buildingInspectionId}_${selectedCategory}_${Date.now()}`;
    if (!currentFormDraftId) setCurrentFormDraftId(draftId);

    const draftData = {
      id: draftId,
      buildingInspectionId,
      selectedCategory,
      formData: { ...formData },
      lastModified: new Date().toISOString(),
      title: `${formData.school} - Building - ${categoryLabels[selectedCategory]}`
    };

    // Save to localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('building_form_drafts') || '[]');
    const draftIndex = existingDrafts.findIndex((d: any) => d.id === draftId);
    
    if (draftIndex >= 0) {
      existingDrafts[draftIndex] = draftData;
    } else {
      existingDrafts.push(draftData);
    }

    localStorage.setItem('building_form_drafts', JSON.stringify(existingDrafts));
    setLastSaved(new Date());
  } catch (error) {
    console.error('Error saving form draft:', error);
  } finally {
    setIsAutoSaving(false);
  }
};
```

### Auto-Save Visual Indicators
```typescript
{lastSaved && (
  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
    <Clock className="w-4 h-4" />
    <span>Auto-saved at {lastSaved.toLocaleTimeString()}</span>
  </div>
)}

{isAutoSaving && (
  <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
    <Save className="w-4 h-4 animate-pulse" />
    <span>Saving...</span>
  </div>
)}
```

## Phase 6: Individual Room Inspection Form

### Star Rating System Implementation
```typescript
const renderMobileStarRating = (category: any, currentRating: number, onRatingChange: (rating: number) => void) => {
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-lg p-3 border">
        <div className="text-sm font-medium text-gray-700 mb-2 text-center">
          Rate this category:
        </div>
        
        {/* Star Buttons */}
        <div className="flex justify-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1.5 rounded-md hover:bg-yellow-50 transition-colors touch-manipulation"
              onClick={() => onRatingChange(star)}
            >
              <Star
                className={`w-6 h-6 ${
                  star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground hover:text-yellow-300'
                }`}
              />
            </button>
          ))}
        </div>
        
        {/* Not Rated Button */}
        <div className="flex justify-center">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
              currentRating === -1
                ? 'bg-muted border-border text-foreground'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => onRatingChange(-1)}
          >
            Not Rated
          </button>
        </div>
      </div>
      
      {/* Dynamic Rating Description */}
      {currentRating > 0 && currentRating !== -1 && (
        <div className="space-y-3">
          <div className="text-center space-y-1">
            <div className="text-base font-semibold text-yellow-600">
              {ratingDescriptions[currentRating - 1]?.label}
            </div>
            <div className="text-sm text-gray-600">
              {ratingDescriptions[currentRating - 1]?.description}
            </div>
          </div>
          
          {/* Detailed Criteria */}
          {category?.criteria && category.criteria[currentRating] && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-1">
                Detailed Criteria for {currentRating} Star{currentRating > 1 ? 's' : ''}:
              </div>
              <div className="text-sm text-blue-800">
                {category.criteria[currentRating]}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Complete Form Structure
```typescript
{!showInspectionSelector && selectedCategory && formData.school && formData.date && formData.inspectorName.trim() && (
  <form onSubmit={handleCategorySubmit} className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Inspecting: {categoryLabels[selectedCategory]}</CardTitle>
        {/* Auto-save indicators here */}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 11 Rating Categories */}
        {inspectionCategories.map((categoryData) => (
          <div key={categoryData.key} className="space-y-2">
            <Label className="text-base font-medium">{categoryData.label}</Label>
            {isMobile ? 
              renderMobileStarRating(categoryData, formData[categoryData.key], (rating) => handleInputChange(categoryData.key, rating)) :
              renderStarRating(categoryData, formData[categoryData.key], (rating) => handleInputChange(categoryData.key, rating))
            }
          </div>
        ))}
        
        {/* Room Number */}
        <div className="space-y-2">
          <Label>Room Number</Label>
          <Input
            value={formData.roomNumber}
            onChange={(e) => handleInputChange('roomNumber', e.target.value)}
            placeholder="e.g., 101, A-Wing, Main Entrance"
          />
        </div>
        
        {/* Notes */}
        <div className="space-y-2">
          <Label>Additional Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Optional: Add any additional observations..."
            rows={3}
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            Submit {categoryLabels[selectedCategory]} Inspection
          </Button>
          <Button type="button" variant="outline" onClick={resetCurrentForm}>
            Clear Form
          </Button>
        </div>
      </CardContent>
    </Card>
  </form>
)}
```

## Phase 7: Building Inspection Creation & Room Submission

### Building Inspection Creation
```typescript
const handleCategorySubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedCategory || !formData.inspectorName.trim()) return;

  try {
    // Create building inspection if it doesn't exist
    let currentBuildingId = buildingInspectionId;
    if (!currentBuildingId) {
      const buildingResponse = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectorName: formData.inspectorName,
          school: formData.school,
          date: formData.date,
          inspectionType: 'whole_building',
          locationDescription: 'Whole Building Inspection',
          isCompleted: false,
          locationCategory: null,
          roomNumber: null,
          floors: null, verticalHorizontalSurfaces: null, ceiling: null,
          restrooms: null, customerSatisfaction: null, trash: null,
          projectCleaning: null, activitySupport: null, safetyCompliance: null,
          equipment: null, monitoring: null, notes: ''
        }),
      });

      if (buildingResponse.ok) {
        const buildingInspection = await buildingResponse.json();
        currentBuildingId = buildingInspection.id;
        setBuildingInspectionId(currentBuildingId);
      }
    }

    // Submit room inspection
    const submissionData = {
      buildingInspectionId: currentBuildingId,
      roomType: selectedCategory,
      roomIdentifier: formData.roomNumber,
      floors: formData.floors === -1 ? null : formData.floors,
      verticalHorizontalSurfaces: formData.verticalHorizontalSurfaces === -1 ? null : formData.verticalHorizontalSurfaces,
      ceiling: formData.ceiling === -1 ? null : formData.ceiling,
      restrooms: formData.restrooms === -1 ? null : formData.restrooms,
      customerSatisfaction: formData.customerSatisfaction === -1 ? null : formData.customerSatisfaction,
      trash: formData.trash === -1 ? null : formData.trash,
      projectCleaning: formData.projectCleaning === -1 ? null : formData.projectCleaning,
      activitySupport: formData.activitySupport === -1 ? null : formData.activitySupport,
      safetyCompliance: formData.safetyCompliance === -1 ? null : formData.safetyCompliance,
      equipment: formData.equipment === -1 ? null : formData.equipment,
      monitoring: formData.monitoring === -1 ? null : formData.monitoring,
      notes: formData.notes || null,
      images: []
    };

    const response = await fetch('/api/room-inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    if (response.ok) {
      // Update completion count
      setCompleted(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory] + 1
      }));

      // Clear form and show success
      clearCurrentFormDraft();
      resetCurrentForm();
      
      toast({
        title: "Inspection Submitted",
        description: `${categoryLabels[selectedCategory]} inspection has been saved successfully!`,
        duration: 3000,
      });

      // Scroll to progress section
      setTimeout(() => {
        const progressSection = document.querySelector('[data-inspection-progress]');
        if (progressSection) {
          progressSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error submitting inspection:', error);
    toast({
      title: "Submission Failed",
      description: "Failed to save inspection. Please try again.",
      variant: "destructive",
      duration: 4000,
    });
  }
};
```

## Phase 8: Final Building Completion

### Finalization Logic
```typescript
// Show finalize button when all categories complete
{!showInspectionSelector && isAllComplete && buildingInspectionId && (
  <Card className="border-green-200 bg-green-50">
    <CardContent className="pt-6">
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold text-green-800">
          ✅ All Required Inspections Complete!
        </div>
        <p className="text-sm text-green-700">
          You have completed all required inspections for this building. 
          Click below to finalize and submit your comprehensive building inspection.
        </p>
        <Button
          onClick={handleFinalSubmit}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8"
          size="lg"
        >
          Finalize Building Inspection
        </Button>
      </div>
    </CardContent>
  </Card>
)}

const handleFinalSubmit = async () => {
  if (!isAllComplete || !buildingInspectionId) return;

  try {
    const response = await fetch(`/api/inspections/${buildingInspectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: true }),
    });

    if (response.ok) {
      toast({
        title: "Building Inspection Complete!",
        description: "Your whole building inspection has been finalized and saved successfully.",
        duration: 4000,
      });

      setTimeout(() => {
        if (onBack) onBack();
      }, 1000);
    }
  } catch (error) {
    console.error('Error finalizing inspection:', error);
    toast({
      title: "Finalization Failed",
      description: "Failed to finalize building inspection. Please try again.",
      variant: "destructive",
      duration: 4000,
    });
  }
};
```

## Required API Endpoints

### Backend Route Implementation
```typescript
// Get incomplete building inspections
app.get("/api/inspections", async (req, res) => {
  const { type, incomplete } = req.query;
  let inspections = await storage.getInspections();
  
  if (type === 'whole_building' && incomplete === 'true') {
    inspections = inspections.filter(inspection => 
      inspection.inspectionType === 'whole_building' && !inspection.isCompleted
    );
  }
  res.json(inspections);
});

// Create building inspection
app.post("/api/inspections", async (req, res) => {
  const validatedData = insertInspectionSchema.parse(req.body);
  const inspection = await storage.createInspection(validatedData);
  res.json(inspection);
});

// Create room inspection
app.post("/api/room-inspections", async (req, res) => {
  const validatedData = insertRoomInspectionSchema.parse(req.body);
  const roomInspection = await storage.createRoomInspection(validatedData);
  res.json(roomInspection);
});

// Get rooms for building
app.get("/api/inspections/:id/rooms", async (req, res) => {
  const buildingId = parseInt(req.params.id);
  const rooms = await storage.getRoomInspectionsByBuildingId(buildingId);
  res.json(rooms);
});

// Update building completion
app.patch("/api/inspections/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { isCompleted } = req.body;
  const updated = await storage.updateInspection(id, { isCompleted });
  res.json(updated);
});
```

## Key Implementation Notes

1. **Progress Tracking**: Real-time visual indicators with green checkmarks for completed categories
2. **Auto-Save**: Every 2 seconds with localStorage backup and visual feedback
3. **Resume Capability**: Automatic detection and restoration of incomplete inspections
4. **Mobile Optimization**: Touch-friendly rating interface with dropdowns for better compatibility
5. **Error Handling**: No alert() popups - use console.error() and toast notifications
6. **Data Integrity**: Proper null handling for unrated categories and validation throughout
7. **Scroll Management**: Prevent unwanted scrolling during category selection
8. **Form State**: Complete isolation between different room inspections within same building

This system creates a comprehensive, user-friendly workflow for conducting detailed building inspections while maintaining data integrity and providing excellent user experience across all devices.