-- Allow Admins to update any dispute
CREATE POLICY "Admins can update all disputes"
ON public.incident_disputes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- Allow Admins to update any incident report (needed for soft delete)
-- We check if policy exists first or just create it. Since we can't easily check logic in migrations without complex DO blocks,
-- we'll rely on the fact that if it duplicates name it errors, but we can drop if exists.

DROP POLICY IF EXISTS "Admins can update all reports" ON public.incident_reports;
CREATE POLICY "Admins can update all reports"
ON public.incident_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND is_active = true
  )
);
