-- RenterCheck migration preflight (read-only)
--
-- Run this separately against the current source database and the MrJim
-- target database using a read-only connection. Do not put credentials in
-- this file. This script intentionally does not select auth passwords,
-- password hashes, raw report data, or storage object bodies.

\set ON_ERROR_STOP on

SELECT current_database() AS database_name,
       current_user AS database_user,
       current_setting('server_version') AS postgres_version;

WITH expected(table_name) AS (
    VALUES
        ('users'),
        ('admin_users'),
        ('credit_wallets'),
        ('credit_transactions'),
        ('renters'),
        ('renter_identifiers'),
        ('incident_reports'),
        ('report_identifiers'),
        ('report_evidence'),
        ('report_amendments'),
        ('report_edits'),
        ('report_info_requests'),
        ('incident_disputes'),
        ('dispute_evidence'),
        ('search_access_logs')
)
SELECT expected.table_name,
       to_regclass(format('public.%s', expected.table_name)) IS NOT NULL AS present
FROM expected
ORDER BY expected.table_name;

-- Every identity-bearing application column must remain uuid-compatible.
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      column_name IN ('id', 'user_id', 'reporter_id', 'disputer_id', 'uploaded_by', 'admin_id')
      OR column_name LIKE '%_id'
  )
ORDER BY table_name, ordinal_position;

-- A target database must not retain a foreign key to Supabase auth.users.
-- Shared mrjim-auth owns identities outside the application's data schema.
SELECT conrelid::regclass AS referencing_table,
       conname AS constraint_name,
       confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND to_regclass('auth.users') IS NOT NULL
  AND confrelid = to_regclass('auth.users');

-- Report only structural metadata for storage references. Object keys are not
-- selected; the existing storage_path values must be copied byte-for-byte.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('storage_bucket', 'storage_path')
ORDER BY table_name, column_name;
