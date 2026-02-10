-- ============================================================
-- CLEANUP SCRIPT: Orphaned Room Inspections
-- ============================================================
-- 
-- PURPOSE: Remove 14 orphaned room_inspection records that 
--          reference non-existent parent inspections
--
-- SAFETY: This script is READ-ONLY until you uncomment the
--         DELETE statements. Review the SELECT results first.
--
-- DATE: December 16, 2025
-- ============================================================

-- ============================================================
-- STEP 1: PREVIEW - See what will be deleted (READ-ONLY)
-- ============================================================

-- View all orphaned records with details
SELECT 
    ri.id,
    ri.building_inspection_id AS missing_parent_id,
    ri.room_type,
    ri.room_identifier,
    ri.notes,
    ri.created_at
FROM room_inspections ri 
WHERE NOT EXISTS (
    SELECT 1 FROM inspections i 
    WHERE i.id = ri.building_inspection_id
)
ORDER BY ri.building_inspection_id, ri.id;

-- Count of records to be deleted
SELECT COUNT(*) AS records_to_delete
FROM room_inspections ri 
WHERE NOT EXISTS (
    SELECT 1 FROM inspections i 
    WHERE i.id = ri.building_inspection_id
);

-- ============================================================
-- STEP 2: BACKUP - Export orphaned records before deletion
-- ============================================================

-- Run this to create a backup (copy output to a file):
-- 
-- SELECT * FROM room_inspections ri 
-- WHERE NOT EXISTS (
--     SELECT 1 FROM inspections i 
--     WHERE i.id = ri.building_inspection_id
-- );

-- ============================================================
-- STEP 3: DELETE - Remove orphaned records
-- ============================================================
-- 
-- ⚠️  UNCOMMENT THE FOLLOWING LINES ONLY AFTER:
--     1. Reviewing the SELECT results above
--     2. Backing up the data if needed
--     3. Confirming you want to proceed
--
-- DELETE FROM room_inspections ri 
-- WHERE NOT EXISTS (
--     SELECT 1 FROM inspections i 
--     WHERE i.id = ri.building_inspection_id
-- );

-- ============================================================
-- STEP 4: VERIFY - Confirm deletion was successful
-- ============================================================

-- After running DELETE, verify no orphans remain:
-- SELECT COUNT(*) AS remaining_orphans
-- FROM room_inspections ri 
-- WHERE NOT EXISTS (
--     SELECT 1 FROM inspections i 
--     WHERE i.id = ri.building_inspection_id
-- );

-- ============================================================
-- OPTIONAL: Add foreign key constraint to prevent future orphans
-- ============================================================
--
-- ⚠️  This will fail if there are still orphaned records!
--     Run the DELETE first, then add the constraint.
--
-- ALTER TABLE room_inspections
-- ADD CONSTRAINT fk_room_inspections_building
-- FOREIGN KEY (building_inspection_id) 
-- REFERENCES inspections(id)
-- ON DELETE CASCADE;
