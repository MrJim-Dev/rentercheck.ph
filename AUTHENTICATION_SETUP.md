# MrJim Auth setup

RenterCheck uses MrJim Auth for password, OAuth, session, and account recovery flows. The application database is PostgreSQL on the MrJim AWS RDS instance; evidence files are private objects in the RenterCheck S3 bucket.

## Environment

Copy `.env.local.example` to `.env.local` and configure:

```bash
MRJIM_AUTH_URL=https://www.rentercheck.ph/auth/v1
NEXT_PUBLIC_MRJIM_AUTH_URL=https://www.rentercheck.ph/auth/v1
MRJIM_AUTH_PUBLISHABLE_KEY=...
NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://www.rentercheck.ph
DATABASE_URL=...
S3_BUCKET=...
S3_REGION=ap-southeast-1
```

Keep signing keys, token/encryption keys, database credentials, and email-provider credentials server-side. Browser code only receives the MrJim Auth URL and publishable key; it must never receive AWS credentials or a database connection string.

## Authentication actions

```typescript
import { login, signup, logout, getUser } from '@/app/actions/auth'
```

Client components use `useAuth` from `@/lib/auth/auth-provider`. Server actions use `createMrJimRequestClient` from `@/lib/mrjim-auth/request-client`; database access uses the MrJim AWS client in `@/lib/aws/client/request-client`.

## Route protection

Root middleware refreshes MrJim Auth session cookies and protects `/profile` and `/search-history`. The mounted auth API is served at `/auth/v1/[[...mrjimAuth]]` and is backed by the same RDS database.

## Local development

```bash
pnpm install
pnpm dev
```

Use a development database and bucket prefix. Never point local development at the production RDS database or production evidence prefix unless the operation is explicitly a read-only migration check.

## File uploads

Uploads go through the MrJim Auth storage boundary and the private S3 adapter in `@/lib/aws/storage/service`. The server validates bytes and MIME type, normalizes image orientation, and creates `.display.webp` and `.thumb.webp` derivatives with `sharp`. Display URLs are short-lived signed S3 URLs; browser code does not receive AWS credentials.
