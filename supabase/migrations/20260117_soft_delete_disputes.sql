-- Add 'DELETED' to the incident_status enum if it doesn't exist
DO $$
BEGIN
    ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'DELETED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
