-- Migration: Ensure report_admin_actions table exists and supports merge actions
-- Created: 2026-01-31
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.report_admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    report_id UUID NOT NULL REFERENCES public.incident_reports (id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.admin_users (id),
    action_type TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_report_admin_actions_report_id ON public.report_admin_actions (report_id);

CREATE INDEX IF NOT EXISTS idx_report_admin_actions_created_at ON public.report_admin_actions (created_at);

-- Enable RLS
ALTER TABLE public.report_admin_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them safely
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.report_admin_actions;

DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.report_admin_actions;

-- Create Policies
CREATE POLICY "Admins can view admin actions" ON public.report_admin_actions FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_users
            WHERE
                admin_users.id = auth.uid ()
                AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can insert admin actions" ON public.report_admin_actions FOR INSERT TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_users
            WHERE
                admin_users.id = auth.uid ()
                AND admin_users.is_active = true
        )
    );

-- Comments
COMMENT ON TABLE public.report_admin_actions IS 'Log of administrative actions taken on reports';