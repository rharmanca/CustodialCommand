
-- Sample incomplete building inspections for testing
INSERT INTO inspections (
  inspector_name, 
  school, 
  date, 
  inspection_type, 
  location_description, 
  building_name,
  is_completed,
  created_at
) VALUES 
(
  'John Smith', 
  'ASA', 
  '2025-01-20', 
  'whole_building', 
  'Whole Building Inspection', 
  'Main Building',
  false,
  NOW()
),
(
  'Jane Doe', 
  'LCA', 
  '2025-01-19', 
  'whole_building', 
  'Whole Building Inspection', 
  'Science Wing',
  false,
  NOW()
),
(
  'Mike Johnson', 
  'GWC', 
  '2025-01-18', 
  'whole_building', 
  'Whole Building Inspection', 
  'Administration Building',
  false,
  NOW()
);

-- Add some sample room inspections for the first building inspection
-- (assuming the first building inspection gets ID 1)
INSERT INTO room_inspections (
  building_inspection_id,
  room_type,
  room_identifier,
  floors,
  vertical_horizontal_surfaces,
  ceiling,
  restrooms,
  customer_satisfaction,
  trash,
  project_cleaning,
  activity_support,
  safety_compliance,
  equipment,
  monitoring,
  notes,
  images,
  created_at
) VALUES
(
  1,
  'classroom',
  'Room 101',
  4,
  3,
  4,
  null,
  4,
  3,
  4,
  3,
  4,
  3,
  4,
  'Good condition overall',
  '{}',
  NOW()
),
(
  1,
  'hallway',
  'Main Hallway',
  3,
  3,
  3,
  null,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  'Needs some attention',
  '{}',
  NOW()
);
