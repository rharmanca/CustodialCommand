# Test Data Cleanup with Backup - Task Plan

## Goal
Delete verified test data with complete backup in case restoration is needed.

## Backup Location
`.backups/test-data-cleanup-2026-02-10/`

## Phases

### Phase 1: Create Backup Infrastructure
**Status:** in_progress
- [ ] Create backup directory structure
- [ ] Export inspections (IDs 460-714, 237 records)
- [ ] Export room_inspections (IDs 85-149, 17 records)
- [ ] Export photos metadata
- [ ] Copy photo files from /objects/inspections/
- [ ] Create BACKUP_MANIFEST.md

### Phase 2: Verify Backup Completeness
**Status:** pending
- [ ] Verify all backup files exist
- [ ] Verify record counts match
- [ ] Verify photo files copied correctly
- [ ] Document backup integrity

### Phase 3: Execute Deletion
**Status:** pending
- [ ] Delete room_inspections (child records first)
- [ ] Delete inspection_photos records
- [ ] Delete inspections (parent records)
- [ ] Remove photo files from /objects/inspections/

### Phase 4: Verify Deletion
**Status:** pending
- [ ] Confirm test data counts are zero
- [ ] Run health check
- [ ] Verify application still works

### Phase 5: Document Results
**Status:** pending
- [ ] Create 02-04-CLEANUP-SUMMARY.md
- [ ] Record what was backed up
- [ ] Record what was deleted
- [ ] Document restoration instructions

## Critical Rules
1. Backup FIRST - never delete before backup is verified
2. Delete in proper order (children before parents)
3. Verify after each major step
4. Document everything for potential restoration
