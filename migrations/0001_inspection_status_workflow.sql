-- Add quick capture workflow columns to inspections table
ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'completed' NOT NULL;
ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "capture_timestamp" timestamp;
ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "completion_timestamp" timestamp;
ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "quick_notes" text;
ALTER TABLE "inspections" ADD COLUMN IF NOT EXISTS "capture_location" text;

--> statement-breakpoint

-- Create indexes for pending review queries
CREATE INDEX IF NOT EXISTS "inspections_status_idx" ON "inspections" ("status");
CREATE INDEX IF NOT EXISTS "inspections_status_school_idx" ON "inspections" ("status", "school");
CREATE INDEX IF NOT EXISTS "inspections_capture_timestamp_idx" ON "inspections" ("capture_timestamp");
