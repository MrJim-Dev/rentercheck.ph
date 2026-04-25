-- Migration: Add business profile fields to users table
-- This enables the semi-automated business verification flow.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_type text CHECK (business_type IN (
    'SOLE_PROPRIETORSHIP',
    'PARTNERSHIP',
    'CORPORATION',
    'COOPERATIVE',
    'INDIVIDUAL',
    'OTHER'
)),
ADD COLUMN IF NOT EXISTS dti_sec_number text,
ADD COLUMN IF NOT EXISTS business_address text,
ADD COLUMN IF NOT EXISTS contact_number text,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'UNVERIFIED' CHECK (verification_status IN (
    'UNVERIFIED',
    'PENDING',
    'VERIFIED',
    'REJECTED'
)),
ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_notes text,
ADD COLUMN IF NOT EXISTS rental_categories text[] DEFAULT '{}';

-- Index for admin to quickly find pending verifications
CREATE INDEX IF NOT EXISTS idx_users_verification_status 
ON public.users(verification_status) 
WHERE verification_status = 'PENDING';

-- Allow users to update their own business profile fields
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.users;
CREATE POLICY "Users can update their own business profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Comment for documentation
COMMENT ON COLUMN public.users.verification_status IS 
    'UNVERIFIED: No submission. PENDING: Submitted, awaiting admin review. VERIFIED: Approved. REJECTED: Rejected with notes.';
COMMENT ON COLUMN public.users.dti_sec_number IS 
    'DTI registration number (sole proprietors) or SEC registration number (corporations/partnerships).';
COMMENT ON COLUMN public.users.rental_categories IS 
    'Array of rental categories this business operates in (e.g. VEHICLE_CAR, REAL_ESTATE_CONDO).';
