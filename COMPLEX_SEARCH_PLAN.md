# Plan: Granular Credit Costs for Complex Search

## Goal
Adjust the search feature so that credit consumption is calculated based on the specific parameters used (Name, Email, Phone, Facebook). Each parameter type will have its own configurable cost in the Admin Dashboard.

## 1. Database Configuration (Admin Config)
We will introduce distinct action keys for each search parameter type. This allows you to set different costs (e.g., Phone = 2 credits, Name = 1 credit).

**New `CreditAction` Keys:**
*   `search_by_name` (Default: 1)
*   `search_by_phone` (Default: 2 - as requested)
*   `search_by_email` (Default: 1)
*   `search_by_facebook` (Default: 1)

**Action:**
Run a SQL migration to insert these keys into `credit_action_costs`.

## 2. Updates to `CreditAction` Enum
Update `lib/credits/gatekeeper.ts` to include these new keys so they can be referenced in code.

```typescript
export enum CreditAction {
    REPORT_CREATION = 'report_creation',
    // New Search Actions
    SEARCH_NAME = 'search_by_name',
    SEARCH_PHONE = 'search_by_phone',
    SEARCH_EMAIL = 'search_by_email',
    SEARCH_FACEBOOK = 'search_by_facebook',
}
```

## 3. Cost Calculation Logic
We need a way to calculate the *total* cost dynamically before deducting credits. We cannot use the simple `gateAction()` because that only deducts for a single key.

**New Helper: `calculateAndGateSearch(input: SearchInput)`**
Located in `lib/credits/search-gatekeeper.ts` (new file).

**Logic:**
1.  Analyze `SearchInput` to count how many of each parameter are used.
    *   Example: `{ name: "John", phone: "0917..." }` -> Uses 1 Name, 1 Phone.
2.  Fetch cached costs for all relevant keys (`search_by_name`, `search_by_phone`, etc.).
3.  Calculate Total:
    `Total = (CountName * CostName) + (CountPhone * CostPhone) + ...`
4.  Perform Deduction:
    Call `consumeCredits(total, "Complex Search", referenceId)`.
5.  Return the calculated cost (optional, for UI display).

## 4. Integration into Search Action
Modify `app/actions/search.ts` -> `searchRenters()` function.

```typescript
// Inside searchRenters...
const searchInput = parseSearchQuery(queryOrInput);

// --- Credit Gate Start ---
try {
    await gateComplexSearch(searchInput, user.id);
} catch (err) {
    return { error: "Insufficient Credits" };
}
// --- Credit Gate End ---

// ... proceed with existing search logic
```

## 5. Admin UI
No code changes needed!
Because the Admin Page dynamically renders rows from the `credit_action_costs` table, these new "Search by..." actions will automatically appear there. You can then toggle them or adjust their costs (e.g., set Phone to 2) immediately.

## 6. Summary of Work
1.  [ ] **Migration**: Add new keys to DB.
2.  [ ] **Code**: Update Enum in `gatekeeper.ts`.
3.  [ ] **Code**: Create `gateComplexSearch` helper.
4.  [ ] **Code**: Integrate into `searchRenters`.
