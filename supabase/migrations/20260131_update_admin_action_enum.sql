-- Add missing values to admin_action_type enum
-- Created: 2026-01-31
ALTER TYPE public.admin_action_type ADD VALUE IF NOT EXISTS 'MERGED';

ALTER TYPE public.admin_action_type ADD VALUE IF NOT EXISTS 'UNMERGED';

ALTER TYPE public.admin_action_type ADD VALUE IF NOT EXISTS 'GROUP_DISSOLVED';

ALTER TYPE public.admin_action_type ADD VALUE IF NOT EXISTS 'TRANSFERRED';

ALTER TYPE public.admin_action_type ADD VALUE IF NOT EXISTS 'NOTE_ADDED';