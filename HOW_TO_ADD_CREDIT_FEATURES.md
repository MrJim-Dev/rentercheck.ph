# How to Add New Credit-Gated Features

This guide explains how to add new actions (e.g., "Premium Search", "Background Check") to the credit system.

## Step 1: Define the Action Key
Open `lib/credits/gatekeeper.ts`.
Add a new entry to the `CreditAction` enum.

```typescript
export enum CreditAction {
    REPORT_CREATION = 'report_creation',
    // Add your new action here
    PREMIUM_SEARCH = 'premium_search',
}
```

## Step 2: Configure the Database
You need to add a row to the `credit_action_costs` table. You can do this via a SQL query in your Supabase SQL Editor.

```sql
INSERT INTO credit_action_costs (action_key, action_name, cost, description, is_active)
VALUES (
    'premium_search',           -- Must match the enum value from Step 1
    'Premium Search',           -- Human readable name
    5,                          -- Default cost (can be changed in Admin UI later)
    'Access detailed tenant history', -- Description
    true                        -- Active by default
);
```

> **Note:** Once this row is added, it will **automatically** appear in the Admin Dashboard > Credit Settings tab.

## Step 3: Implement the Gate
In your Server Action or API route, call `gateAction` before performing the business logic.

**File:** `app/actions/search.ts` (Example)

```typescript
import { gateAction, CreditAction } from "@/lib/credits/gatekeeper"

export async function performPremiumSearch(query: string) {
    const user = await getUser(); // ... get current user

    // 1. Gate the action (Deducts credits or throws error)
    try {
        await gateAction(CreditAction.PREMIUM_SEARCH, user.id);
    } catch (error) {
        if (error.message === 'INSUFFICIENT_CREDITS') {
            return { error: 'Insufficient credits' };
        }
        throw error;
    }

    // 2. Perform the actual search logic
    // ...
}
```

## Step 4: Verify
1.  Go to the **Admin Dashboard** > **Credit Settings**.
2.  Verify your new action appears in the list.
3.  Try changing the cost or toggling it off to test.
