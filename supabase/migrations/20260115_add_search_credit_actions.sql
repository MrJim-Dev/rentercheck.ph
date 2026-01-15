-- Migration: Add granular search credit actions

INSERT INTO public.credit_action_costs (action_key, action_name, cost, description, is_active)
VALUES 
    ('search_by_name', 'Search by Name', 1, 'Cost for including a Name in the search query', true),
    ('search_by_phone', 'Search by Phone', 1, 'Cost for including a Phone Number in the search query', true),
    ('search_by_email', 'Search by Email', 1, 'Cost for including an Email in the search query', true),
    ('search_by_facebook', 'Search by Facebook', 1, 'Cost for including a Facebook Link/ID in the search query', true)
ON CONFLICT (action_key) DO NOTHING;
