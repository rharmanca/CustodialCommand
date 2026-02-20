import * as React from "react";
import { ReviewSection } from "@/components/dashboard/ReviewSection";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

/**
 * Dashboard - Main landing page with workflow sections
 * 
 * Layout:
 * - Capture Section (amber/warm theme)
 * - Review Section (teal/cool theme) 
 * - Analyze Section (neutral theme)
 * 
 * Responsive: Stacked on mobile, side-by-side on desktop
 */
export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Review Section - Teal/Cool Theme */}
      <section className="bg-teal-50/50 rounded-xl p-1">
        <ReviewSection onNavigate={onNavigate} />
      </section>
    </div>
  );
}
