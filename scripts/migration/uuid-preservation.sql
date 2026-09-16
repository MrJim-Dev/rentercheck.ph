-- RenterCheck UUID preservation check (read-only)
--
-- Run once against the source and once against the target after loading data.
-- Compare the (table_name, row_count, distinct_id_count, id_set_digest) rows.
-- A mismatch is a cutover blocker. The digest is over UUIDs only; this query
-- never reads or prints password hashes or row contents.

\set ON_ERROR_STOP on

SELECT 'public.users' AS table_name,
       count(*) AS row_count,
       count(DISTINCT id) AS distinct_id_count,
       md5(coalesce(string_agg(id::text, ',' ORDER BY id), '')) AS id_set_digest
FROM public.users
UNION ALL
SELECT 'public.admin_users', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.admin_users
UNION ALL
SELECT 'public.credit_wallets', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.credit_wallets
UNION ALL
SELECT 'public.credit_transactions', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.credit_transactions
UNION ALL
SELECT 'public.renters', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.renters
UNION ALL
SELECT 'public.renter_identifiers', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.renter_identifiers
UNION ALL
SELECT 'public.incident_reports', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.incident_reports
UNION ALL
SELECT 'public.report_identifiers', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.report_identifiers
UNION ALL
SELECT 'public.report_evidence', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.report_evidence
UNION ALL
SELECT 'public.report_amendments', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.report_amendments
UNION ALL
SELECT 'public.report_edits', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.report_edits
UNION ALL
SELECT 'public.report_info_requests', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.report_info_requests
UNION ALL
SELECT 'public.incident_disputes', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.incident_disputes
UNION ALL
SELECT 'public.dispute_evidence', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.dispute_evidence
UNION ALL
SELECT 'public.search_access_logs', count(*), count(DISTINCT id), md5(coalesce(string_agg(id::text, ',' ORDER BY id), ''))
FROM public.search_access_logs
ORDER BY table_name;
