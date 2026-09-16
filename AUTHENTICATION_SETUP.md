# Authentication Setup

RenterCheck uses shared `mrjim-auth` backed by the MrJim AWS PostgreSQL
database. Existing user UUIDs remain the auth subject (`sub`), sessions are
stored in HttpOnly cookies, and evidence files are stored in private S3.
Supabase is retained only as migration/rollback material; it is not a runtime
dependency.

See [`scripts/migration/README.md`](scripts/migration/README.md) for the full
runtime and cutover contract. Never expose database URLs, AWS credentials,
private signing keys, token secrets, or mail-provider keys through a
`NEXT_PUBLIC_` variable.

## Setup instructions

### 1. Configure MrJim Auth and the AWS database

1. Copy `.env.local.example` to `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Set the MrJim runtime variables from the migration README. The local
   `/auth/v1` route handles email/password, recovery, and provider flows.
3. Set `MRJIM_DB_SSL_CA` (or its base64 form) to the verified Amazon RDS CA;
   do not disable certificate verification.
4. Configure a verified `MRJIM_AUTH_FROM_EMAIL` and working `RESEND_API_KEY`
   before testing signup confirmation or password recovery.

### 2. Start the development server

```bash
pnpm dev
```

## Project structure

```text
lib/
├── auth/
│   ├── auth-server.ts      # MrJim Auth server and mail adapter
│   ├── browser-client.ts   # Browser recovery/OAuth client
│   ├── server.ts           # HttpOnly-cookie auth client
│   └── auth-provider.tsx   # Auth context provider
├── db/
│   ├── pool.ts             # TLS-verified RDS connection pool
│   └── compat-client.ts    # Allowlisted application query boundary
app/
├── actions/auth.ts         # Sign up, sign in, sign out, current identity
├── auth/v1/[...path]/      # Local MrJim Auth protocol route
└── api/auth/               # Session, signout, and OAuth entrypoints
```

## Features

- Password-based sign up and sign in
- Sign out and HttpOnly-cookie session management
- Password recovery and update-password flow
- Optional Google OAuth through MrJim Auth
- Existing UUID preservation and profile synchronization

## Usage

```typescript
import { login, signup, logout, getUser } from '@/app/actions/auth'

await signup(formData)
await login(formData)
await logout()
const user = await getUser()
```

The client auth context remains available through:

```typescript
'use client'
import { useAuth } from '@/lib/auth/auth-provider'
```

When signing up, the user's full name is stored in `user_metadata`:

```typescript
{ full_name: "John Doe" }
```

Roles belong in signed auth metadata, not user-editable profile fields.

## Troubleshooting

### Auth key or database connection errors

- Confirm the MrJim Auth publishable key and server signing-key variables match
  the target project.
- Confirm the RDS URL uses the fixed AWS endpoint and the verified RDS CA is
  present.
- Restart the development server after changing `.env.local`.

### Redirects not working

- Clear the `mrjim-auth-rentercheck` and PKCE cookies.
- Confirm `MRJIM_SITE_URL`, `MRJIM_AUTH_URL`, and the OAuth redirect origin are
  consistent.

### Recovery or confirmation email is not delivered

- Confirm the sender is verified and sending-enabled in the mail provider.
- Confirm `MRJIM_AUTH_FROM_EMAIL` and `RESEND_API_KEY` are present in the
  server environment.
- Treat a successful database health check as insufficient until a real email
  and authenticated browser flow have been verified.
