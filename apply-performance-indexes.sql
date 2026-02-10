-- Performance Optimization Indexes
-- Apply these to your Railway PostgreSQL database
-- Created: 2026-02-10

-- Indexes for room_inspections table (from Plan 02-03)
CREATE INDEX IF NOT EXISTS idx_room_inspections_inspection_id 
  ON room_inspections(inspection_id);

CREATE INDEX IF NOT EXISTS idx_room_inspections_room_number 
  ON room_inspections(room_number);

CREATE INDEX IF NOT EXISTS idx_room_inspections_created_at 
  ON room_inspections(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_room_inspections_inspection_room 
  ON room_inspections(inspection_id, room_number);

-- Index for inspections table (for listing/filtering)
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_name 
  ON inspections(inspector_name);

CREATE INDEX IF NOT EXISTS idx_inspections_school 
  ON inspections(school);

CREATE INDEX IF NOT EXISTS idx_inspections_created_at 
  ON inspections(created_at DESC);

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('room_inspections', 'inspections')
ORDER BY tablename, indexname;
