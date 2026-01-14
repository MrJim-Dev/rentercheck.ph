# Reports Cache

This module provides caching functionality for the My Reports page to reduce API calls and improve performance.

## Features

- **Automatic Caching**: Reports are automatically cached after fetching from the API
- **Cache Duration**: 5 minutes (configurable in `reports-cache.ts`)
- **Persistent Storage**: Uses localStorage to persist cache across page reloads
- **Manual Refresh**: Users can manually refresh to bypass cache
- **Cache Age Display**: Shows how long ago the data was last updated

## Usage

### In Components

```typescript
import { loadReportsCache, saveReportsCache, clearReportsCache } from '@/lib/cache'

// Load cached data
const cachedData = loadReportsCache<MyReport>()
if (cachedData) {
  setReports(cachedData.reports)
}

// Save to cache
saveReportsCache(reportsData)

// Clear cache (e.g., after creating/updating a report)
clearReportsCache()
```

### Cache Invalidation

The cache should be cleared when:
1. A new report is submitted
2. A report is updated
3. An amendment is added
4. User manually clicks refresh

### Implementation in My Reports Page

The `/my-reports` page automatically:
- Loads cached data on initial load if available
- Falls back to API if cache is expired or missing
- Caches fresh data from API
- Shows cache age in the UI
- Provides a refresh button to force API call

## Configuration

Edit `lib/cache/reports-cache.ts` to change:
- `CACHE_DURATION`: How long cache is valid (default: 5 minutes)
- `CACHE_KEY`: localStorage key name (default: "my-reports-cache")

## Benefits

1. **Reduced API Calls**: Fewer database queries
2. **Faster Load Times**: Instant data display from cache
3. **Better UX**: No loading spinner on repeat visits
4. **Offline Resilience**: Data available even if API is temporarily unavailable
5. **Bandwidth Savings**: Particularly useful on mobile devices
