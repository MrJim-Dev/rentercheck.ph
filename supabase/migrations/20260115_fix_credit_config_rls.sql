-- Allow authenticated users to update credit costs
-- NOTE: In a real production app, this should be restricted to admin roles.
-- Since we don't have roles implemented yet, we allow all authenticated users (the owner) to update.

drop policy if exists "Admin update access" on public.credit_action_costs;

create policy "Admin update access"
  on public.credit_action_costs for update
  using (
    auth.role() = 'authenticated'
  );
