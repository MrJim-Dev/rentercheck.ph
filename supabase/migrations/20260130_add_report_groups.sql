-- Migration: Add Report Groups for Merging Duplicate Reports
-- Created: 2026-01-30
-- Description: Creates tables to group related incident reports (non-destructive merge)

-- Table to group related incident reports (for merging duplicates)
CREATE TABLE IF NOT EXISTS report_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES admin_users(id),
    group_name TEXT, -- Optional name like "John Doe - Multiple Reports"
    primary_report_id UUID REFERENCES incident_reports(id) ON DELETE SET NULL,
    notes TEXT, -- Admin notes about why these were merged
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table linking reports to groups
CREATE TABLE IF NOT EXISTS report_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES report_groups(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    added_by UUID NOT NULL REFERENCES admin_users(id),
    UNIQUE(report_id) -- A report can only belong to one group
);

-- Indexes for performance
CREATE INDEX idx_report_group_members_group_id ON report_group_members(group_id);
CREATE INDEX idx_report_group_members_report_id ON report_group_members(report_id);
CREATE INDEX idx_report_groups_primary_report ON report_groups(primary_report_id);

-- RLS Policies
ALTER TABLE report_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_group_members ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage report groups"
    ON report_groups FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can manage report group members"
    ON report_group_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Public read access for search results
CREATE POLICY "Public can view report groups"
    ON report_groups FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Public can view report group members"
    ON report_group_members FOR SELECT
    TO public
    USING (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_report_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_groups_updated_at
    BEFORE UPDATE ON report_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_report_group_updated_at();

-- Add comments for documentation
COMMENT ON TABLE report_groups IS 'Groups of related incident reports that should be displayed together (merged duplicates)';
COMMENT ON TABLE report_group_members IS 'Junction table linking incident reports to their groups';
COMMENT ON COLUMN report_groups.primary_report_id IS 'The primary report to display first in the group';
COMMENT ON COLUMN report_groups.group_name IS 'Optional descriptive name for the group';
COMMENT ON COLUMN report_groups.notes IS 'Admin notes explaining why these reports were merged';
