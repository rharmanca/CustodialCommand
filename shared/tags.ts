/**
 * Issue Tag Taxonomy for Custodial Command
 * Fixed set of 8 tags for categorizing inspection issues
 */

import { Footprints, Layers, Bath, Trash2, AlertTriangle, Wrench, Thermometer, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface InspectionTag {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const INSPECTION_TAGS: InspectionTag[] = [
  {
    id: "floors",
    label: "Floors",
    description: "Floor cleaning, waxing, or damage issues",
    icon: Footprints,
    color: "blue",
  },
  {
    id: "surfaces",
    label: "Surfaces",
    description: "Walls, windows, desks, and other surfaces",
    icon: Layers,
    color: "blue",
  },
  {
    id: "restrooms",
    label: "Restrooms",
    description: "Bathroom cleanliness and supplies",
    icon: Bath,
    color: "amber",
  },
  {
    id: "trash",
    label: "Trash",
    description: "Trash removal and disposal issues",
    icon: Trash2,
    color: "amber",
  },
  {
    id: "safety",
    label: "Safety",
    description: "Safety hazards or compliance issues",
    icon: AlertTriangle,
    color: "red",
  },
  {
    id: "equipment",
    label: "Equipment",
    description: "Cleaning equipment problems or needs",
    icon: Wrench,
    color: "slate",
  },
  {
    id: "hvac",
    label: "HVAC",
    description: "Heating, ventilation, air conditioning",
    icon: Thermometer,
    color: "slate",
  },
  {
    id: "lighting",
    label: "Lighting",
    description: "Light fixtures and electrical issues",
    icon: Lightbulb,
    color: "slate",
  },
];

export type InspectionTagId = typeof INSPECTION_TAGS[number]["id"];

/**
 * Get a tag by its ID
 */
export function getTagById(id: string): InspectionTag | undefined {
  return INSPECTION_TAGS.find((tag) => tag.id === id);
}

/**
 * Validate and filter tags to only include valid taxonomy IDs
 */
export function validateTags(tags: string[]): string[] {
  const validTagIds = new Set(INSPECTION_TAGS.map((tag) => tag.id));
  return tags.filter((tag) => validTagIds.has(tag));
}

/**
 * Check if a tag ID is valid
 */
export function isValidTagId(tagId: string): boolean {
  return INSPECTION_TAGS.some((tag) => tag.id === tagId);
}

/**
 * Get tags grouped by category color
 */
export function getTagsByColor(): Record<string, InspectionTag[]> {
  return INSPECTION_TAGS.reduce((acc, tag) => {
    if (!acc[tag.color]) {
      acc[tag.color] = [];
    }
    acc[tag.color].push(tag);
    return acc;
  }, {} as Record<string, InspectionTag[]>);
}
