-- Add Professional Learning category to existing groups
INSERT INTO categories (group_id, name, icon, sort_order)
SELECT g.id, 'Professional Learning', '💼', 4
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = 'Professional Learning' AND c.group_id = g.id
);

-- Add logged_unit and logged_value columns to progress_entries
-- These record what the user actually typed before conversion to goal's stored unit
ALTER TABLE progress_entries
  ADD COLUMN IF NOT EXISTS logged_unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS logged_value NUMERIC(10,2);
