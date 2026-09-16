# RenterCheck AWS runtime

This directory contains read-only checks and the application-side contract for
the MrJim AWS runtime:

- direct server-side PostgreSQL access from Vercel to the MrJim AWS database;
- `mrjim-auth` as the shared owner of users and identities; and
- private S3 object storage for evidence files.

The source Supabase project is retained as migration/rollback material, but it
is no longer a supported application runtime. Nothing in this directory
connects to AWS or Supabase automatically, changes a database, copies objects,
or handles password hashes.

## Runtime contract

The MrJim provider is authoritative. `RENTERCHECK_RUNTIME` is retained as an
explicit deployment marker and must be `mrjim` when set:

```text
RENTERCHECK_RUNTIME=mrjim
MRJIM_DATABASE_URL=<server-only PostgreSQL URL>
MRJIM_DB_SSL_CA=<verified Amazon RDS CA PEM>
# or MRJIM_DB_SSL_CA_BASE64=<base64-encoded verified Amazon RDS CA PEM>
MRJIM_DATABASE_SSL_REJECT_UNAUTHORIZED=true
MRJIM_DATABASE_POOL_MAX=3
AWS_REGION=<MrJim S3 region>
MRJIM_S3_BUCKET=<private evidence bucket>
MRJIM_SITE_URL=<https://www.rentercheck.ph>
MRJIM_AUTH_URL=<same-origin /auth/v1 base URL>
MRJIM_AUTH_PUBLISHABLE_KEY=<server-safe MrJim Auth publishable key>
MRJIM_AUTH_TOKEN_AUDIENCE=<RenterCheck JWT audience>
MRJIM_AUTH_ES256_KEY_ID=<active signing-key id>
MRJIM_AUTH_ES256_PRIVATE_JWK=<server-only signing key>
MRJIM_AUTH_TOKEN_HASH_KEY=<server-only base64url secret>
MRJIM_AUTH_ENCRYPTION_KEY=<server-only base64url secret>
RESEND_API_KEY=<server-only mail provider key>
MRJIM_AUTH_FROM_EMAIL=<verified sender address>
NEXT_PUBLIC_MRJIM_AUTH_URL=<same-origin /auth/v1 URL>
NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY=<browser-safe publishable key>
MRJIM_SYNC_USER_PROFILE=false
```

Values above are names/placeholders only. Keep the database URL, signing
material, AWS credentials, and mail-provider key server-only. The S3 adapter
uses the default AWS credential provider chain, so no credential value belongs
in this repository.

`mrjim-auth` issues short-lived signed JWTs through the local `/auth/v1` route
and the OAuth code + PKCE flow implemented in `app/api/auth/authorize` and
`app/auth/callback`. The JWT uses the existing application user UUID as `sub`,
includes `iss`, `aud`, and an email claim, and keeps roles in signed auth
metadata rather than user-editable profile data.

Direct PostgreSQL access is TLS-verified and intentionally public at the
network layer so Vercel can reach RDS without a VPS or Lambda. The database
and S3 credentials remain server-only.

## Sequence

1. Run `preflight.sql` against the source and intended target with read-only
   credentials. Resolve every missing table, identity-type mismatch, and
   foreign key still pointing at `auth.users`.
2. Establish the target schema from the complete canonical schema. The
   checked-in Supabase migrations are not that schema: they omit several tables
   referenced by `lib/database.types.ts` and application actions. Do not infer
   missing DDL from the generated type file.
3. Run `runtime-hardening.sql` as the target database owner. It adds the
   authenticated self-insert policies required when `ensureUserProfile` creates
   a profile, starter wallet, and signup bonus after a password signup or first
   login.
4. Load application rows with explicit `id` values. Preserve every UUID and
   every `*_id` relationship; defaults may generate IDs only for new rows after
   cutover. Do not export or transform password hashes—the shared auth service
   owns credentials and must be reconciled by UUID.
5. Copy evidence objects to the private S3 bucket with the exact existing
   `storage_path` as the S3 key. Keep the logical database bucket value
   (`evidence`) and verify object counts and checksums before switching reads.
   Enable encryption, Block Public Access, least-privilege IAM, versioning, and
   CloudTrail/CloudWatch monitoring as part of the AWS change window.
6. Set `MRJIM_SYNC_USER_PROFILE=true` only after the target `public.users` table
   is ready. `ensureUserProfile` upserts the auth subject as the UUID; it never
   creates a replacement identity.
7. Canary the non-sensitive `/api/health/runtime` endpoint, auth callback,
   authenticated read paths, report/evidence flows, and admin authorization.
   CORS or a successful health response alone is not end-to-end proof.
8. Keep the source data and object copy intact during observation. Do not
   delete or resume the source project until business, recovery, and production
   cutover checks are signed off. Any rollback must be an explicit redeploy of
   the retained legacy release; the current source tree no longer supports a
   Supabase runtime switch.

## Checks

`preflight.sql` reports schema presence, UUID-compatible identity columns,
Supabase-auth foreign keys, and storage-reference columns without returning
user data. `uuid-preservation.sql` produces only per-table counts and a digest
of sorted UUID sets; compare source and target output before cutover.

The application server actions use the MrJim/RDS compatibility boundary and the
storage adapter is S3-only. Full production cutover still requires an
authenticated browser canary, recovery-email delivery, admin authorization,
and a Vercel deployment with the complete secret set. A successful health
response is only connectivity evidence, not migration completion.
