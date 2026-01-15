# Implementation Plan: Search History Ledger

## Goal
Prevent users from being charged multiple times for searching the same parameters (Name, Phone, etc.) within a 24-hour window.

## 1. Database Schema
Create a new table `search_access_logs` to track what a user has "paid for".
- `id`: uuid
- `user_id`: uuid (references auth.users)
- `parameter_type`: string (enum: 'NAME', 'PHONE', 'EMAIL', 'FACEBOOK')
- `parameter_value`: string (normalized hash or value)
- `created_at`: timestamp
- `expires_at`: timestamp (default: 24 hours from now)

**Indexes:**
- Compound index on `(user_id, parameter_type, parameter_value)` for fast O(1) lookups.

## 2. Application Logic (`lib/credits/search-gatekeeper.ts`)

**Current Flow:**
1. Parse Input.
2. Calculate Total Cost.
3. Charge Total.

**New Flow:**
1. Parse Input -> Get List of Parameters `[{type: 'NAME', value: 'john'}, {type: 'PHONE', value: '0917...'}]`.
2. **Check Ledger**: Query `search_access_logs` for this user.
   - Filter out parameters that are already active (not expired).
3. Calculate Cost for **NEW** parameters only.
4. **Charge**:
   - If cost > 0, deduct credits.
   - If cost == 0 (all cached), skip deduction.
5. **Update Ledger**:
   - Insert records for the newly paid parameters into `search_access_logs`.

## 3. Security & Cleanup
- The log table should have RLS (User can select their own rows).
- (Optional) Cron job or manual cleanup for expired rows, but for now we can just filter by `expires_at > now()`.

## 4. Migration File
`supabase/migrations/20260115_search_ledger.sql`
