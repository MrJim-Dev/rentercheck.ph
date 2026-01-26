# Redirect After Authentication

This document explains how the redirect-after-authentication feature works in RenterCheck.

## Overview

When users navigate to login or signup pages from anywhere in the app, they will be automatically redirected back to their original page after successful authentication.

## How It Works

### 1. URL Parameter
The system uses a `returnTo` query parameter to track where users should be redirected after authentication:
```
/login?returnTo=/report
/signup?returnTo=/search
```

### 2. Supported Authentication Methods
- Email/password login
- Email/password signup
- Google OAuth
- Other OAuth providers

### 3. Implementation Details

#### Pages with Auto-Redirect
The following pages automatically redirect unauthenticated users to login with `returnTo`:
- `/report` - Report submission page
- `/search` - Search results page
- `/my-reports` - User's reports dashboard
- `/admin` - Admin panel

#### Helper Functions
Use the utility functions in `lib/utils.ts`:
```typescript
import { getLoginUrl, getSignupUrl } from "@/lib/utils"

// Generate login URL with current path
const loginUrl = getLoginUrl() // Uses current path

// Generate login URL with specific path
const loginUrl = getLoginUrl("/report")

// Same for signup
const signupUrl = getSignupUrl("/search")
```

#### Manual Implementation
To add redirect support to a page:

1. **Add to protected route check:**
```typescript
useEffect(() => {
  if (!user) {
    router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)
  }
}, [user, pathname])
```

2. **Add to Link components:**
```tsx
<Link href="/login?returnTo=/your-page">Sign In</Link>
<Link href="/signup?returnTo=/your-page">Sign Up</Link>
```

3. **Use utility functions:**
```tsx
import { getLoginUrl, getSignupUrl } from "@/lib/utils"

<Link href={getLoginUrl("/your-page")}>Sign In</Link>
```

### 4. Modified Files

The following files were updated to support this feature:
- `app/(auth)/login/page.tsx` - Accepts `returnTo` parameter
- `app/(auth)/signup/page.tsx` - Accepts `returnTo` parameter
- `app/actions/auth.ts` - Handles `returnTo` in login/signup actions
- `components/auth/login-form.tsx` - Passes `returnTo` to auth action and OAuth
- `components/auth/signup-form.tsx` - Passes `returnTo` to auth action and OAuth
- `app/auth/callback/route.ts` - Already supported via `next` parameter
- `lib/utils.ts` - Added helper functions `getLoginUrl()` and `getSignupUrl()`
- `app/search/page.tsx` - Updated login/signup links
- `app/report/page.tsx` - Updated login/signup links
- `app/my-reports/page.tsx` - Updated redirect parameter
- `app/admin/page.tsx` - Updated redirect parameter
- `components/shared/app-header.tsx` - Updated login links to use `getLoginUrl()`

## Security Considerations

1. **URL Validation**: The redirect URL should be validated to prevent open redirect vulnerabilities. Currently, the implementation trusts all paths, but you may want to add validation.

2. **Encoding**: The `returnTo` parameter is properly URL-encoded to handle special characters and query parameters.

3. **OAuth Flow**: The OAuth callback already supported this via the `next` parameter, which is preserved through the authentication flow.

## Examples

### Example 1: User tries to file a report
1. User visits `/report` without being logged in
2. Page redirects to `/login?returnTo=/report`
3. User signs in
4. User is redirected back to `/report`

### Example 2: User clicks "Sign In" from search results
1. User on `/search` sees locked results
2. Clicks "Sign In" button
3. Navigates to `/login?returnTo=/search`
4. After login, returns to `/search`

### Example 3: User signs up via Google OAuth
1. User on `/report` clicks "Sign In with Google"
2. OAuth redirectTo includes: `/auth/callback?next=/report`
3. After OAuth completes, callback redirects to `/report`

## Future Improvements

1. **Add URL validation** to prevent open redirect attacks
2. **Preserve query parameters** from the original page
3. **Add session storage** as backup if URL parameter is lost
4. **Add redirect timeout** to prevent stale redirects
