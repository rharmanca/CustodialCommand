import { lazy } from 'react';

// Lazy load page components for better performance
export const LazyCustodialInspection = lazy(() => 
  import('@/pages/custodial-inspection').then(module => ({
    default: module.default
  }))
);

export const LazyWholeBuildingInspection = lazy(() =>
  import('@/pages/whole-building-inspection').then(module => ({
    default: module.default
  }))
);

export const LazyInspectionData = lazy(() => 
  import('@/pages/inspection-data').then(module => ({
    default: module.default
  }))
);

export const LazyCustodialNotes = lazy(() => 
  import('@/pages/custodial-notes').then(module => ({
    default: module.default
  }))
);

export const LazyRatingCriteria = lazy(() => 
  import('@/pages/rating-criteria').then(module => ({
    default: module.default
  }))
);

export const LazyAdminInspections = lazy(() => 
  import('@/pages/admin-inspections').then(module => ({
    default: module.default
  }))
);

export const LazyNotFound = lazy(() => 
  import('@/pages/not-found').then(module => ({
    default: module.default
  }))
);
