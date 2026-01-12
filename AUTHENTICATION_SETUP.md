# Supabase Authentication Setup

This project uses Supabase for password-based authentication.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project or select an existing one
3. Wait for the project to be fully initialized

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy the **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the **anon/public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Save the `.env.local` file

### 3. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication > Providers**
2. Make sure **Email** is enabled
3. Configure email settings:
   - Enable email confirmations if needed
   - Set up email templates (optional)

### 4. Start Development Server

```bash
pnpm dev
```

## Project Structure

```
lib/
├── supabase/
│   ├── client.ts       # Client-side Supabase client
│   ├── server.ts       # Server-side Supabase client
│   └── middleware.ts   # Middleware for session management
├── auth/
│   └── auth-provider.tsx  # Auth context provider
app/
├── actions/
│   └── auth.ts         # Server actions (login, signup, logout)
middleware.ts           # Next.js middleware for route protection
```

## Features

- ✅ Password-based authentication
- ✅ Sign up with email and password
- ✅ Sign in with email and password
- ✅ Sign out
- ✅ Protected routes
- ✅ Session management
- ✅ Automatic redirect after login
- ✅ User state in navigation

## Usage

### Authentication Actions

```typescript
// Login
import { login } from '@/app/actions/auth'
await login(formData)

// Signup
import { signup } from '@/app/actions/auth'
await signup(formData)

// Logout
import { logout } from '@/app/actions/auth'
await logout()

// Get current user
import { getUser } from '@/app/actions/auth'
const user = await getUser()
```

### Using Auth Context

```typescript
'use client'
import { useAuth } from '@/lib/auth/auth-provider'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>
  
  return <div>Welcome {user.email}</div>
}
```

## Route Protection

The middleware automatically:
- Redirects unauthenticated users away from protected routes
- Redirects authenticated users away from auth pages (login/signup)
- Refreshes session cookies on every request

## Supabase Configuration

### User Metadata

When signing up, the user's full name is stored in the `user_metadata`:

```typescript
{
  full_name: "John Doe"
}
```

You can access this in your app:

```typescript
const fullName = user.user_metadata?.full_name
```

### Custom Policies

If you need to create tables with Row Level Security (RLS), use the Supabase dashboard to set up policies that allow users to access their own data.

## Troubleshooting

### "Invalid API key" error
- Make sure you copied the correct keys from Supabase
- Restart your development server after changing `.env.local`

### Redirects not working
- Clear your browser cookies
- Check that middleware.ts is at the root level
- Verify the middleware config matcher

### Email confirmation required
- Check Authentication > Settings in Supabase
- Disable "Enable email confirmations" for development
