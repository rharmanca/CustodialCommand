# Phase 03: Workflow Improvements - Research

**Researched:** 2026-02-16
**Domain:** Mobile PWA Capture Patterns, Photo-First Review Workflows
**Confidence:** HIGH

## Summary

This phase implements two complementary workflow enhancements: **Quick Capture** for rapid mobile photo documentation and **Photo-First Review** for desktop completion of partial inspections. The key insight is that field workers need minimal friction for capture while office workers need comprehensive context for completion.

**Primary recommendation:** Extend the existing PWA architecture with a dedicated "pending review" state pattern, leveraging already-implemented offline storage (IndexedDB + Service Worker Background Sync) and enhancing the existing react-webcam integration for continuous capture mode.

## Standard Stack

### Core (Already Implemented)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-webcam | 7.2.0 | Camera access | Already in use, supports getScreenshot() for rapid capture |
| IndexedDB | Native | Offline storage | Service worker already implements PhotoManager class |
| Service Worker | Native | Background sync | Already handles offline form queuing and photo sync |
| Framer Motion | 11.13.1 | UI animations | Already in use for transitions |

### Additions Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | ^0.33.x | Server-side thumbnail generation | Thumbnails for pending review list (backend) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp (Node) | Canvas-based (client) | Canvas is already used for client compression, but sharp is 4-5x faster for thumbnails |
| IndexedDB | localStorage | IndexedDB already implemented; localStorage has 5MB limit vs IndexedDB's 50MB+ |
| Background Sync | WebSocket push | Background Sync works offline-first, WebSocket requires connection |

**Installation:**
```bash
npm install sharp
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   ├── quick-capture.tsx          # Mobile-optimized quick capture page
│   └── photo-first-review.tsx     # Desktop review completion page
├── components/
│   ├── capture/
│   │   ├── CameraCapture.tsx      # Continuous camera component
│   │   ├── PhotoPreviewStrip.tsx  # Horizontal scrolling thumbnails
│   │   └── QuickNoteInput.tsx     # 200-char limited text input
│   ├── review/
│   │   ├── PhotoReviewPane.tsx    # Sticky photo reference panel
│   │   ├── InspectionCompletionForm.tsx # Full form completion
│   │   └── PendingInspectionList.tsx # Filterable pending list
│   └── ui/
│       └── FloatingActionButton.tsx # Quick capture entry point
├── hooks/
│   ├── useCamera.ts               # react-webcam wrapper with rapid capture
│   ├── usePhotoQueue.ts           # IndexedDB photo queue management
│   └── usePendingInspections.ts   # Pending review data fetching
└── utils/
    ├── quickCapture.ts            # Quick capture state management
    └── thumbnailGenerator.ts      # Client-side thumbnail helper
```

### Pattern 1: Pending Review State Machine
**What:** Inspection records have a `status` field transitioning: `pending_review` → `completed` | `discarded`
**When to use:** All quick captures start in pending_review; full inspections skip this state
**Database schema:**
```typescript
// Source: existing schema.ts extended
export const inspections = pgTable("inspections", {
  // ... existing fields ...
  status: text("status").default('pending_review'), // 'pending_review', 'completed', 'discarded'
  captureTimestamp: timestamp("capture_timestamp"), // When quick capture happened
  completionTimestamp: timestamp("completion_timestamp"), // When full form completed
  quickNotes: text("quick_notes"), // 200-char limit
  captureLocation: text("capture_location"), // Quick-select location
});
```

### Pattern 2: Continuous Camera Stream
**What:** Camera stays active between shots using react-webcam ref pattern
**When to use:** Quick capture mode only; normal inspection uses existing file upload
**Example:**
```typescript
// Source: Context7 /mozmorris/react-webcam getScreenshot examples
const webcamRef = useRef<Webcam>(null);
const [capturedImages, setCapturedImages] = useState<string[]>([]);

// Camera stays active - no re-initialization
const capture = useCallback(() => {
  const imageSrc = webcamRef.current?.getScreenshot();
  if (imageSrc) {
    setCapturedImages(prev => [...prev, imageSrc]);
  }
}, [webcamRef]);

// Multiple captures without camera restart
<Webcam
  audio={false}
  ref={webcamRef}
  screenshotFormat="image/jpeg"
  screenshotQuality={0.8}
  videoConstraints={{ facingMode: "environment" }}
/>
```

### Pattern 3: Offline Photo Queue
**What:** Photos stored in IndexedDB with sync queue, uploaded when online
**When to use:** All mobile photo capture (existing pattern in sw.js)
**Key insight:** Service worker already implements PhotoManager with `storePhoto()`, `getStoredPhotos()`, `updatePhotoStatus()`

### Pattern 4: Progressive Photo Loading
**What:** Blur placeholder → thumbnail → full image loading sequence
**When to use:** Photo-first review page with potentially many images
**Implementation:**
```typescript
// Pattern from research: Low Quality Image Placeholder (LQIP)
const ProgressiveImage = ({ src, placeholderSrc, alt }) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
  }, [src]);
  
  return (
    <img 
      src={imageSrc} 
      alt={alt}
      style={{ 
        filter: imageSrc === placeholderSrc ? 'blur(10px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
    />
  );
};
```

### Pattern 5: Split-Pane Review Layout
**What:** Photos visible in sticky sidebar while scrolling through form
**When to use:** Desktop photo-first review page
**CSS Grid implementation:**
```css
.review-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  height: 100vh;
  overflow: hidden;
}

.photo-pane {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.form-pane {
  overflow-y: auto;
  padding: 24px;
}
```

### Anti-Patterns to Avoid
- **Creating new camera instances per shot:** This causes 1-2s re-initialization delay. Use ref pattern.
- **Storing full-resolution images in IndexedDB:** Store compressed versions; full quality uploads to server.
- **Blocking UI during photo upload:** Queue uploads, show progress indicator, allow continued capture.
- **Forcing landscape orientation:** PWA can't reliably force orientation; design for portrait.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera access | Custom getUserMedia wrapper | react-webcam | Handles permissions, ref API, mobile quirks |
| Offline queue | Custom sync algorithm | Service Worker + IndexedDB | Already implemented in sw.js PhotoManager |
| Image compression | Server-side compression for thumbnails | sharp (backend) + Canvas (client) | sharp is 4-5x faster than ImageMagick |
| Touch targets | Manual sizing | Tailwind min-h-11 min-w-11 (44px) | WCAG 2.5.5 compliance, Tailwind native |
| Photo transitions | Custom CSS transitions | Framer Motion AnimatePresence | Already in project, layout animations built-in |

**Key insight:** The existing service worker (`sw.js`) already implements a complete offline photo sync system with IndexedDB storage, retry logic, and background sync registration. Don't rebuild this—extend it.

## Common Pitfalls

### Pitfall 1: Camera Permission Denied
**What goes wrong:** User denies camera access, app shows infinite spinner
**Why it happens:** react-webcam doesn't expose permission state clearly
**How to avoid:**
```typescript
const [hasPermission, setHasPermission] = useState<boolean | null>(null);

useEffect(() => {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(() => setHasPermission(true))
    .catch(() => setHasPermission(false));
}, []);

// Show manual instructions if denied
if (hasPermission === false) return <CameraPermissionHelp />;
```

### Pitfall 2: Memory Leaks from Blob URLs
**What goes wrong:** Captured photos create blob URLs that aren't revoked
**Why it happens:** `URL.createObjectURL()` needs manual cleanup
**How to avoid:**
```typescript
useEffect(() => {
  return () => {
    capturedImages.forEach(url => URL.revokeObjectURL(url));
  };
}, [capturedImages]);
```

### Pitfall 3: Service Worker Update Breaking Offline Queue
**What goes wrong:** New SW version clears old IndexedDB stores
**Why it happens:** SW lifecycle can delete caches
**How to avoid:** Store queue in IndexedDB (persistent) not Cache API; migrate data on upgrade

### Pitfall 4: Oversized Touch Targets Breaking Layout
**What goes wrong:** 44px buttons cause layout shifts on small screens
**Why it happens:** Fixed sizing without responsive consideration
**How to avoid:** Use Tailwind's responsive modifiers: `min-h-11 md:min-h-12`

### Pitfall 5: Race Conditions in Background Sync
**What goes wrong:** Multiple sync events fire simultaneously, duplicate uploads
**Why it happens:** SW `sync` event can fire multiple times
**How to avoid:** Implement sync status flag in IndexedDB records

## Code Examples

### Continuous Capture Component
```typescript
// Verified pattern from Context7 react-webcam docs
import Webcam from 'react-webcam';

const ContinuousCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot({
      width: 1920,
      height: 1080
    });
    if (imageSrc) {
      setPhotos(prev => [...prev, imageSrc]);
    }
  }, []);
  
  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
        videoConstraints={{ facingMode: "environment" }}
        className="w-full rounded-lg"
      />
      <button 
        onClick={capture}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 
                   w-16 h-16 rounded-full bg-white shadow-lg
                   min-h-[44px] min-w-[44px]" // WCAG touch target
      >
        <Camera className="w-8 h-8" />
      </button>
    </div>
  );
};
```

### Pending Review Query Pattern
```typescript
// Leverage existing storage.ts patterns
export const storage = {
  async getPendingInspections(options?: { school?: string; page?: number }) {
    const cacheKey = `inspections:pending:${JSON.stringify(options || {})}`;
    return executeQuery('getPendingInspections', async () => {
      const conditions = [eq(inspections.status, 'pending_review')];
      
      if (options?.school) {
        conditions.push(eq(inspections.school, options.school));
      }
      
      return db.query.inspections.findMany({
        where: and(...conditions),
        orderBy: desc(inspections.captureTimestamp),
        limit: options?.page ? 20 : undefined,
        offset: options?.page ? (options.page - 1) * 20 : undefined
      });
    }, cacheKey, 60000);
  }
};
```

### Thumbnail Generation (Server)
```typescript
// Using sharp for server-side thumbnails
import sharp from 'sharp';

async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(200, 200, { 
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ 
      quality: 70,
      progressive: true 
    })
    .toBuffer();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| File input with `capture="camera"` | getUserMedia stream API | 2020+ | Live preview, continuous capture |
| localStorage for offline data | IndexedDB + Background Sync | 2022+ | Larger storage, automatic retry |
| ImageMagick for thumbnails | sharp (libvips) | 2023+ | 4-5x faster, better memory |
| Custom animation libraries | Framer Motion | 2023+ | Declarative, layout animations |
| CSS-only touch targets | Tailwind min-h/w-11 | 2024+ | WCAG 2.5.5 native compliance |

**Deprecated/outdated:**
- `accept="image/*" capture="camera"` input: Still works but limited to single capture with OS file picker
- Base64 image storage in localStorage: Inefficient, 33% overhead

## Open Questions

1. **Thumbnail Strategy**
   - What we know: Sharp is fastest for server-side; Canvas works client-side
   - What's unclear: Should thumbnails generate on upload or on-demand?
   - Recommendation: Generate on upload, store alongside original

2. **Offline Conflict Resolution**
   - What we know: Service worker queues with retry count
   - What's unclear: What if same inspection edited on multiple devices?
   - Recommendation: Last-write-wins with timestamp; show conflict UI

3. **Quick Capture Data Model**
   - What we know: Schema has `isCompleted` boolean already
   - What's unclear: Should quick capture be separate table or same inspections table?
   - Recommendation: Same table with `status` field; migration path for existing data

## Sources

### Primary (HIGH confidence)
- Context7 /mozmorris/react-webcam - getScreenshot API, video constraints, facingMode patterns
- Context7 /websites/motion_dev - AnimatePresence, layout animations
- MDN MediaDevices.getUserMedia() - Official browser API documentation
- W3C WCAG 2.5.5/2.5.8 Target Size - 44px/24px minimum requirements

### Secondary (MEDIUM confidence)
- Smashing Magazine "Building Offline-Friendly Image Upload System" - IndexedDB + Background Sync patterns
- Sharp documentation (sharp.pixelplumbing.com) - Thumbnail generation
- MDN Background Sync API - Service worker sync patterns

### Tertiary (LOW confidence)
- Reddit r/PWA discussions on background upload - Community patterns
- Medium articles on progressive image loading - Implementation approaches

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Built on existing project dependencies (react-webcam, Framer Motion, IndexedDB in sw.js)
- Architecture: HIGH - Extends existing storage.ts and schema.ts patterns
- Pitfalls: MEDIUM - Some from training data (e.g., memory leaks), some verified with official docs

**Research date:** 2026-02-16
**Valid until:** 2026-05-16 (90 days for stable stack)
