import * as React from "react";
import { ReviewSection } from "@/components/dashboard/ReviewSection";
import { QuickCaptureCard } from "@/components/dashboard/QuickCaptureCard";
import { SafeAreaWrapper, SafeAreaSpacer } from "@/components/dashboard/SafeAreaWrapper";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

/**
 * Dashboard - Main landing page with workflow sections
 *
 * Layout:
 * - Capture Section (amber/warm theme) - Primary action in thumb zone
 * - Review Section (teal/cool theme) - Secondary workflow
 * - Analyze Section (slate/neutral theme) - Data and insights
 *
 * Responsive Design:
 * - Mobile (< 640px): Single column, stacked sections
 * - Tablet/Desktop (>= 640px): Two-column grid for Capture + Review
 * - Large Desktop (>= 1024px): Enhanced spacing
 *
 * Mobile-First:
 * - 44px+ touch targets on all interactive elements
 * - Safe area insets for iPhone home indicator
 * - Thumb-zone positioning for primary actions
 */
export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <SafeAreaWrapper edges={["bottom"]} className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/*
          Responsive Grid Layout:
          - Mobile: Single column (grid-cols-1)
          - Tablet+: Two columns (sm:grid-cols-2)
          - Gap: 1rem mobile, 1.5rem tablet+
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

          {/* CAPTURE SECTION - Amber/Warm Theme */}
          <section
            className="bg-amber-50/50 rounded-xl p-4 border border-amber-100"
            aria-labelledby="capture-heading"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  id="capture-heading"
                  className="text-lg font-bold text-amber-900"
                >
                  Capture
                </h2>
                <p className="text-sm text-amber-700 hidden sm:block">
                  Document issues in the field
                </p>
              </div>
            </div>

            {/* Quick Capture - Primary Action (120px touch target) */}
            <QuickCaptureCard
              onClick={() => onNavigate("Quick Capture")}
              className="mb-4"
            />

            {/* Secondary Capture Options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide px-1">
                Full Inspections
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => onNavigate("Custodial Notes")}
                  className="p-3 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors text-left min-h-[48px] flex items-center"
                >
                  <span className="text-sm font-medium text-amber-900">
                    Report Concern
                  </span>
                </button>
                <button
                  onClick={() => onNavigate("Custodial Inspection")}
                  className="p-3 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors text-left min-h-[48px] flex items-center"
                >
                  <span className="text-sm font-medium text-amber-900">
                    Single Area Inspection
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* REVIEW SECTION - Teal/Cool Theme */}
          <ReviewSection
            onNavigate={onNavigate}
            className="border-0 shadow-none bg-teal-50/50 rounded-xl p-4 border border-teal-100"
          />
        </div>

        {/* ANALYZE SECTION - Slate/Neutral Theme (spans full width) */}
        <section
          className="bg-slate-50 rounded-xl p-4 border border-slate-200 sm:col-span-2"
          aria-labelledby="analyze-heading"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="analyze-heading"
                className="text-lg font-bold text-slate-900"
              >
                Analyze
              </h2>
              <p className="text-sm text-slate-600 hidden sm:block">
                View reports and insights
              </p>
            </div>
          </div>

          {/* Analytics Grid - 2 cols mobile, 4 cols desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigate("Scores Dashboard")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center min-h-[80px] flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📈</span>
              <span className="text-sm font-medium text-slate-900">
                Building Scores
              </span>
            </button>
            <button
              onClick={() => onNavigate("Analytics Dashboard")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center min-h-[80px] flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📊</span>
              <span className="text-sm font-medium text-slate-900">
                Analytics
              </span>
            </button>
            <button
              onClick={() => onNavigate("Inspection Data")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center min-h-[80px] flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📋</span>
              <span className="text-sm font-medium text-slate-900">
                Data & Reports
              </span>
            </button>
            <button
              onClick={() => onNavigate("Monthly Feedback")}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-center min-h-[80px] flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📄</span>
              <span className="text-sm font-medium text-slate-900">
                Monthly Feedback
              </span>
            </button>
          </div>

          {/* Rating Criteria Link */}
          <button
            onClick={() => onNavigate("Rating Criteria")}
            className="mt-4 w-full p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left flex items-center gap-2 min-h-[48px]"
          >
            <span>ℹ️</span>
            <span className="text-sm font-medium text-slate-700">
              Rating Criteria Guide
            </span>
          </button>
        </section>

        {/* Footer Tagline */}
        <p className="text-lg text-muted-foreground text-center mt-8">
          Cleanliness is a duty for all.
        </p>

        {/* Safe Area Spacer to clear FAB on mobile */}
        <SafeAreaSpacer />
      </div>
    </SafeAreaWrapper>
  );
}
