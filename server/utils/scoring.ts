/**
 * Custodial Command Scoring System
 *
 * Calculates building scores by combining:
 * - Formal inspections (75% weight) - objective ratings across 11 categories
 * - Custodial notes (25% weight) - sentiment analysis of observation notes
 *
 * Level 2 Compliance Threshold: ≥3.0/5.0
 */

import type { Inspection, CustodialNote } from '../../shared/schema';

export interface ScoringResult {
  overallScore: number;           // Combined score (0-5)
  inspectionScore: number;        // Average of inspection ratings (0-5)
  notesModifier: number;          // Sentiment adjustment from notes (-0.5 to +0.5)
  level2Compliant: boolean;       // Whether score meets Level 2 standards (≥3.0)
  inspectionCount: number;        // Number of inspections included
  notesCount: number;             // Number of notes analyzed
  categoryBreakdown?: CategoryScore[];  // Detailed breakdown by category
}

export interface CategoryScore {
  category: string;
  averageRating: number;
  count: number;
}

export interface SchoolScore {
  school: string;
  score: ScoringResult;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Sentiment categories for note analysis
 */
export enum NoteSentiment {
  POSITIVE = 'positive',      // +0.1 per note
  NEUTRAL = 'neutral',        // 0
  MINOR_ISSUE = 'minor',      // -0.1 per note
  MAJOR_ISSUE = 'major'       // -0.3 per note
}

/**
 * Keyword patterns for sentiment analysis
 */
const SENTIMENT_PATTERNS = {
  positive: [
    /\b(excellent|outstanding|exceptional|great|good|clean|well maintained|shine|bright|fresh|spotless|tidy)\b/i,
    /\b(going well|improving|progress|complimentary)\b/i,
  ],
  major: [
    /\b(crisis|unsafe|hazard|broken|damaged|filthy|disgusting|unacceptable|failure|critical)\b/i,
    /\b(not working|completely|severe|major|serious|significant)\b/i,
    /\b(overflowing|overflow|smells|stinks|foul|offensive)\b/i,
  ],
  minor: [
    /\b(needs|need|should|could|minor|slight|small|little|dull|dingy|stain|streak|smudge)\b/i,
    /\b(attention|cleaning|maintenance|repair|replace|fix)\b/i,
  ],
};

/**
 * Analyze sentiment of a custodial note
 */
export function analyzeSentiment(noteText: string): NoteSentiment {
  const lowerText = noteText.toLowerCase();

  // Check for major issues first (highest priority)
  if (SENTIMENT_PATTERNS.major.some(pattern => pattern.test(lowerText))) {
    return NoteSentiment.MAJOR_ISSUE;
  }

  // Check for minor issues
  if (SENTIMENT_PATTERNS.minor.some(pattern => pattern.test(lowerText))) {
    return NoteSentiment.MINOR_ISSUE;
  }

  // Check for positive indicators
  if (SENTIMENT_PATTERNS.positive.some(pattern => pattern.test(lowerText))) {
    return NoteSentiment.POSITIVE;
  }

  // Default to neutral if no clear sentiment
  return NoteSentiment.NEUTRAL;
}

/**
 * Calculate sentiment score modifier from notes
 * Returns a value between -0.5 and +0.5 (capped)
 */
export function calculateNotesSentimentScore(notes: CustodialNote[]): number {
  if (notes.length === 0) return 0;

  let totalSentimentScore = 0;

  for (const note of notes) {
    const sentiment = analyzeSentiment(note.notes);

    switch (sentiment) {
      case NoteSentiment.POSITIVE:
        totalSentimentScore += 0.1;
        break;
      case NoteSentiment.MINOR_ISSUE:
        totalSentimentScore -= 0.1;
        break;
      case NoteSentiment.MAJOR_ISSUE:
        totalSentimentScore -= 0.3;
        break;
      case NoteSentiment.NEUTRAL:
      default:
        // No change
        break;
    }
  }

  // Average the sentiment score
  const averageSentiment = totalSentimentScore / notes.length;

  // Cap at ±0.5 to prevent extreme swings
  return Math.max(-0.5, Math.min(0.5, averageSentiment));
}

/**
 * Calculate average rating from an inspection
 * Returns null if no ratings are present
 */
export function calculateInspectionScore(inspection: Inspection): number | null {
  const ratingFields = [
    inspection.floors,
    inspection.verticalHorizontalSurfaces,
    inspection.ceiling,
    inspection.restrooms,
    inspection.customerSatisfaction,
    inspection.trash,
    inspection.projectCleaning,
    inspection.activitySupport,
    inspection.safetyCompliance,
    inspection.equipment,
    inspection.monitoring,
  ];

  // Filter out null/undefined values
  const validRatings = ratingFields.filter(
    rating => rating !== null && rating !== undefined && rating >= 0
  );

  if (validRatings.length === 0) return null;

  const sum = validRatings.reduce((acc, rating) => acc + (rating || 0), 0);
  return sum / validRatings.length;
}

/**
 * Calculate category breakdown from inspections
 */
export function calculateCategoryBreakdown(inspections: Inspection[]): CategoryScore[] {
  const categories = [
    { key: 'floors', name: 'Floors' },
    { key: 'verticalHorizontalSurfaces', name: 'Surfaces' },
    { key: 'ceiling', name: 'Ceiling' },
    { key: 'restrooms', name: 'Restrooms' },
    { key: 'customerSatisfaction', name: 'Customer Satisfaction' },
    { key: 'trash', name: 'Trash' },
    { key: 'projectCleaning', name: 'Project Cleaning' },
    { key: 'activitySupport', name: 'Activity Support' },
    { key: 'safetyCompliance', name: 'Safety & Compliance' },
    { key: 'equipment', name: 'Equipment' },
    { key: 'monitoring', name: 'Monitoring' },
  ];

  return categories.map(({ key, name }) => {
    const ratings = inspections
      .map(i => i[key as keyof Inspection] as number | null)
      .filter(r => r !== null && r !== undefined && r >= 0);

    const averageRating = ratings.length > 0
      ? ratings.reduce((acc, r) => acc + (r || 0), 0) / ratings.length
      : 0;

    return {
      category: name,
      averageRating,
      count: ratings.length,
    };
  });
}

/**
 * Calculate overall building score for a school
 *
 * @param inspections - Array of inspections for the school
 * @param notes - Array of custodial notes for the school
 * @returns Comprehensive scoring result
 */
export function calculateBuildingScore(
  inspections: Inspection[],
  notes: CustodialNote[]
): ScoringResult {
  // Calculate inspection score (75% weight)
  const inspectionScores = inspections
    .map(inspection => calculateInspectionScore(inspection))
    .filter((score): score is number => score !== null);

  const inspectionScore = inspectionScores.length > 0
    ? inspectionScores.reduce((acc, score) => acc + score, 0) / inspectionScores.length
    : 0;

  // Calculate notes sentiment modifier (25% weight, capped at ±0.5)
  const notesModifier = calculateNotesSentimentScore(notes);

  // Combine scores
  // 75% from inspections, 25% from notes (max ±0.5 impact)
  const weightedInspection = inspectionScore * 0.75;
  const weightedNotes = notesModifier * 0.25;
  const overallScore = weightedInspection + weightedNotes;

  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(inspections);

  return {
    overallScore,
    inspectionScore,
    notesModifier,
    level2Compliant: overallScore >= 3.0,
    inspectionCount: inspections.length,
    notesCount: notes.length,
    categoryBreakdown,
  };
}

/**
 * Calculate scores for multiple schools
 *
 * @param inspectionsBySchool - Map of school name to inspections
 * @param notesBySchool - Map of school name to custodial notes
 * @param dateRange - Optional date range filter
 * @returns Array of school scores sorted by overall score (descending)
 */
export function calculateSchoolScores(
  inspectionsBySchool: Record<string, Inspection[]>,
  notesBySchool: Record<string, CustodialNote[]>,
  dateRange?: { start: string; end: string }
): SchoolScore[] {
  const schools = Object.keys(inspectionsBySchool);

  const schoolScores: SchoolScore[] = schools.map(school => {
    const inspections = inspectionsBySchool[school] || [];
    const notes = notesBySchool[school] || [];

    return {
      school,
      score: calculateBuildingScore(inspections, notes),
      dateRange: dateRange || {
        start: inspections[0]?.date || notes[0]?.date || new Date().toISOString().split('T')[0],
        end: inspections[inspections.length - 1]?.date || notes[notes.length - 1]?.date || new Date().toISOString().split('T')[0],
      },
    };
  });

  // Sort by overall score (descending)
  return schoolScores.sort((a, b) => b.score.overallScore - a.score.overallScore);
}

/**
 * Get compliance status text
 */
export function getComplianceStatus(score: number): {
  text: string;
  color: 'green' | 'yellow' | 'red';
} {
  if (score >= 4.0) {
    return { text: 'Exceeds Standards', color: 'green' };
  } else if (score >= 3.0) {
    return { text: 'Meets Level 2 Standards', color: 'green' };
  } else if (score >= 2.0) {
    return { text: 'Below Standards', color: 'yellow' };
  } else {
    return { text: 'Needs Immediate Attention', color: 'red' };
  }
}
