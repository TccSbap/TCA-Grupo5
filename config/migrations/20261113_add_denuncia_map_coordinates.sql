-- Adds optional, coarse map coordinates to reports.
-- The application rounds submitted points to an approximately 2 km grid before storage.
ALTER TABLE denuncias
  ADD COLUMN latitude DECIMAL(10, 7) NULL AFTER location,
  ADD COLUMN longitude DECIMAL(10, 7) NULL AFTER latitude;
