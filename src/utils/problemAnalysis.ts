import type { Inspection, CustodialNote } from '../../shared/schema';

export const CRITICAL_THRESHOLD = 2.0;
export const NEEDS_ATTENTION_THRESHOLD = 3.0;

export type ProblemSeverity = 'critical' | 'needs-attention' | 'acceptable';

export interface ProblemArea {
  inspection: Inspection;
  category?: string;
  rating: number;
  severity: ProblemSeverity;
  location: string;
  school: string;
  date: string;
}

export interface UrgentCustodialNote {
  note: CustodialNote;
  severity: 'urgent' | 'high' | 'medium' | 'low';
  keywords: string[];
}

export interface ProblemAnalysisResult {
  critical: ProblemArea[];
  needsAttention: ProblemArea[];
  urgentNotes: UrgentCustodialNote[];
  summary: {
    totalProblems: number;
    criticalCount: number;
    needsAttentionCount: number;
    urgentNotesCount: number;
    affectedSchools: string[];
    mostProblematicSchool: string | null;
    mostProblematicCategory: string | null;
  };
}

/**
 * Calculate average rating for an inspection
 */
export function calculateAverageRating(inspection: Inspection): number | null {
  const categories = [
    'floors', 'verticalHorizontalSurfaces', 'ceiling', 'restrooms',
    'customerSatisfaction', 'trash', 'projectCleaning', 'activitySupport',
    'safetyCompliance', 'equipment', 'monitoring'
  ];

  const ratings = categories
    .map(cat => inspection[cat as keyof Inspection] as number | null | undefined)
    .filter((rating): rating is number => typeof rating === 'number');

  if (ratings.length === 0) return null;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}

/**
 * Determine severity level based on rating
 */
export function getSeverityLevel(rating: number): ProblemSeverity {
  if (rating < CRITICAL_THRESHOLD) return 'critical';
  if (rating < NEEDS_ATTENTION_THRESHOLD) return 'needs-attention';
  return 'acceptable';
}

/**
 * Analyze custodial notes for urgency
 */
export function analyzeCustodialNoteUrgency(note: CustodialNote): UrgentCustodialNote {
  const urgentKeywords = ['urgent', 'emergency', 'safety', 'hazard', 'leak', 'flood', 'fire', 'electrical'];
  const highKeywords = ['immediate', 'asap', 'critical', 'dangerous', 'broken', 'damaged'];
  const mediumKeywords = ['needs', 'require', 'attention', 'maintenance', 'repair'];
  
  const text = `${note.notes} ${note.location} ${note.locationDescription}`.toLowerCase();
  
  let severity: 'urgent' | 'high' | 'medium' | 'low' = 'low';
  const foundKeywords: string[] = [];
  
  if (urgentKeywords.some(keyword => text.includes(keyword))) {
    severity = 'urgent';
    foundKeywords.push(...urgentKeywords.filter(keyword => text.includes(keyword)));
  } else if (highKeywords.some(keyword => text.includes(keyword))) {
    severity = 'high';
    foundKeywords.push(...highKeywords.filter(keyword => text.includes(keyword)));
  } else if (mediumKeywords.some(keyword => text.includes(keyword))) {
    severity = 'medium';
    foundKeywords.push(...mediumKeywords.filter(keyword => text.includes(keyword)));
  }
  
  return {
    note,
    severity,
    keywords: foundKeywords
  };
}

/**
 * Analyze problem areas from inspections
 */
export function analyzeProblemAreas(inspections: Inspection[]): ProblemAnalysisResult {
  const critical: ProblemArea[] = [];
  const needsAttention: ProblemArea[] = [];
  
  inspections.forEach(inspection => {
    const rating = calculateAverageRating(inspection);
    if (rating === null) return;
    
    const severity = getSeverityLevel(rating);
    if (severity === 'acceptable') return;
    
    const problemArea: ProblemArea = {
      inspection,
      rating,
      severity,
      location: inspection.inspectionType === 'single_room' 
        ? `Room ${inspection.roomNumber}` 
        : inspection.buildingName || inspection.locationDescription || 'Whole Building',
      school: inspection.school,
      date: inspection.date
    };
    
    if (severity === 'critical') {
      critical.push(problemArea);
    } else {
      needsAttention.push(problemArea);
    }
  });
  
  // Sort by rating (worst first)
  critical.sort((a, b) => a.rating - b.rating);
  needsAttention.sort((a, b) => a.rating - b.rating);
  
  const affectedSchools = new Set([...critical, ...needsAttention].map(p => p.school));
  
  // Find most problematic school
  const schoolProblemCounts = [...critical, ...needsAttention].reduce((acc, problem) => {
    acc[problem.school] = (acc[problem.school] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostProblematicSchool = Object.entries(schoolProblemCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
  
  return {
    critical,
    needsAttention,
    urgentNotes: [], // Will be populated separately
    summary: {
      totalProblems: critical.length + needsAttention.length,
      criticalCount: critical.length,
      needsAttentionCount: needsAttention.length,
      urgentNotesCount: 0, // Will be populated separately
      affectedSchools: Array.from(affectedSchools),
      mostProblematicSchool,
      mostProblematicCategory: null // Could be enhanced to analyze specific categories
    }
  };
}

/**
 * Analyze urgent custodial notes
 */
export function identifyUrgentCustodialNotes(notes: CustodialNote[]): UrgentCustodialNote[] {
  return notes
    .map(analyzeCustodialNoteUrgency)
    .filter(urgentNote => urgentNote.severity === 'urgent' || urgentNote.severity === 'high')
    .sort((a, b) => {
      const severityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

/**
 * Get severity badge props for UI components
 */
export function getSeverityBadgeProps(severity: ProblemSeverity) {
  switch (severity) {
    case 'critical':
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200',
        text: 'Critical'
      };
    case 'needs-attention':
      return {
        variant: 'secondary' as const,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        text: 'Needs Attention'
      };
    case 'acceptable':
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200',
        text: 'Acceptable'
      };
  }
}

/**
 * Get urgent note badge props for UI components
 */
export function getUrgentNoteBadgeProps(severity: 'urgent' | 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'urgent':
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
        text: 'URGENT'
      };
    case 'high':
      return {
        variant: 'secondary' as const,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        text: 'High Priority'
      };
    case 'medium':
      return {
        variant: 'outline' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Medium Priority'
      };
    case 'low':
      return {
        variant: 'outline' as const,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        text: 'Low Priority'
      };
  }
}
