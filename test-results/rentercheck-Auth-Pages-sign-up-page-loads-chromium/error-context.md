# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rentercheck.spec.ts >> Auth Pages >> sign-up page loads
- Location: tests/rentercheck.spec.ts:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /sign up|create account|register/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /sign up|create account|register/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - img [ref=e5]
      - generic [ref=e7]: RenterCheck is currently in beta. New features are coming soon — suggest a feature to help us improve.
      - img [ref=e8]
    - navigation [ref=e11]:
      - generic [ref=e12]:
        - link "RenterCheck Logo RenterCheck" [ref=e13] [cursor=pointer]:
          - /url: /
          - img "RenterCheck Logo" [ref=e15]
          - generic [ref=e16]: RenterCheck
        - generic [ref=e17]:
          - link "Features" [ref=e18] [cursor=pointer]:
            - /url: "#features"
          - link "How it works" [ref=e19] [cursor=pointer]:
            - /url: "#how-it-works"
        - generic [ref=e20]:
          - link "Report an Incident" [ref=e21] [cursor=pointer]:
            - /url: /report
            - button "Report an Incident" [ref=e22]:
              - img
              - text: Report an Incident
          - link "Sign in" [ref=e23] [cursor=pointer]:
            - /url: /login
            - button "Sign in" [ref=e24]
    - generic [ref=e26]:
      - generic [ref=e27]:
        - heading "Verify Rental Tenants In Seconds" [level=1] [ref=e29]:
          - text: Verify Rental Tenants
          - generic [ref=e30]: In Seconds
        - paragraph [ref=e31]: Search by name, birthdate, email, or phone number to check tenant history and identify potential issues before they come problems.
      - generic [ref=e33]:
        - generic [ref=e34]:
          - img [ref=e35]
          - textbox "Search by name, birthdate, email, or phone number..." [ref=e38]
        - button "Search" [ref=e39] [cursor=pointer]:
          - text: Search
          - img
      - paragraph [ref=e40]: "Try Searching: \"Juan Dela Cruz, July 28, 1991, 09171234567, juan@example.com\""
      - generic [ref=e41]:
        - generic [ref=e46]: Instant Results
        - generic [ref=e50]: Secure & Verified
        - generic [ref=e54]: 24/7 Database Access
    - generic [ref=e56]:
      - generic [ref=e58]:
        - heading "Protect Your Rental Business with Verified Tenant Screening" [level=2] [ref=e59]:
          - text: Protect Your Rental Business with
          - text: Verified Tenant Screening
        - paragraph [ref=e60]: Background-check renters before signing leases. Access verified incident reports, payment history, and tenant background information from landlords across the Philippines.
      - generic [ref=e61]:
        - generic [ref=e65] [cursor=pointer]:
          - img [ref=e67]
          - heading "Verified Tenant Reports" [level=3] [ref=e69]
          - paragraph [ref=e70]: Access admin-verified renter incident reports including payment history, property damage, and lease violations to protect your rental business.
        - generic [ref=e74] [cursor=pointer]:
          - img [ref=e76]
          - heading "Instant Background Checks" [level=3] [ref=e78]
          - paragraph [ref=e79]: Get tenant verification results in seconds. Search by name, email, or phone to check renter history instantly.
        - generic [ref=e83] [cursor=pointer]:
          - img [ref=e85]
          - heading "Growing Database" [level=3] [ref=e88]
          - paragraph [ref=e89]: Access continuously updated tenant records from rental businesses across the Philippines. Community-driven protection.
        - generic [ref=e93] [cursor=pointer]:
          - img [ref=e95]
          - heading "Trusted by Landlords" [level=3] [ref=e100]
          - paragraph [ref=e101]: Join property managers, landlords, and rental businesses using RenterCheck to screen tenants and avoid problem renters.
    - generic [ref=e103]:
      - generic [ref=e105]:
        - heading "How It Works" [level=2] [ref=e106]
        - paragraph [ref=e107]: Simple, fast, and reliable tenant verification in just three steps.
      - generic [ref=e108]:
        - generic [ref=e112]:
          - generic [ref=e113]:
            - img [ref=e115]
            - generic [ref=e118]: "01"
          - generic [ref=e119]:
            - heading "Search" [level=3] [ref=e120]
            - paragraph [ref=e121]: Enter tenant name, email, or phone number into our database
        - generic [ref=e124]:
          - generic [ref=e125]:
            - img [ref=e127]
            - generic [ref=e130]: "02"
          - generic [ref=e131]:
            - heading "Verify" [level=3] [ref=e132]
            - paragraph [ref=e133]: Our system instantly cross-references multiple verification sources
        - generic [ref=e136]:
          - generic [ref=e137]:
            - img [ref=e139]
            - generic [ref=e141]: "03"
          - generic [ref=e142]:
            - heading "Review" [level=3] [ref=e143]
            - paragraph [ref=e144]: Get comprehensive reports highlighting any potential issues or concerns
    - generic [ref=e146]:
      - generic [ref=e147]:
        - heading "Report Tenant Incidents Protect Your Business" [level=2] [ref=e148]
        - paragraph [ref=e149]: Had issues with a tenant? Document unpaid rent, property damage, or lease violations to help other landlords make informed decisions. Join property owners and managers building a safer rental community across the Philippines.
      - generic [ref=e150]:
        - link "Report an Incident" [ref=e151] [cursor=pointer]:
          - /url: /report
          - button "Report an Incident" [ref=e152]:
            - text: Report an Incident
            - img
        - button "Learn More" [ref=e153] [cursor=pointer]
      - paragraph [ref=e154]: Help build a transparent rental community. Your reports help protect fellow property owners.
    - generic [ref=e157]:
      - paragraph [ref=e158]: © 2026 RenterCheck. All rights reserved.
      - generic [ref=e159]:
        - link "Privacy Policy" [ref=e160] [cursor=pointer]:
          - /url: /legal/privacy
        - link "Terms of Use" [ref=e161] [cursor=pointer]:
          - /url: /legal/terms
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e167] [cursor=pointer]:
    - img [ref=e168]
  - alert [ref=e171]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing Page', () => {
  4  |   test('loads and shows key sections', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/RenterCheck/i);
  7  |     await expect(page.locator('main')).toBeVisible();
  8  |   });
  9  | 
  10 |   test('has navigation', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     await expect(page.locator('nav')).toBeVisible();
  13 |   });
  14 | });
  15 | 
  16 | test.describe('Auth Pages', () => {
  17 |   test('sign-in page loads', async ({ page }) => {
  18 |     await page.goto('/auth/sign-in');
  19 |     await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  20 |   });
  21 | 
  22 |   test('sign-up page loads', async ({ page }) => {
  23 |     await page.goto('/auth/sign-up');
> 24 |     await expect(page.getByRole('heading', { name: /sign up|create account|register/i })).toBeVisible();
     |                                                                                           ^ Error: expect(locator).toBeVisible() failed
  25 |   });
  26 | });
  27 | 
  28 | test.describe('Public Pages', () => {
  29 |   test('search page is auth-gated or loads', async ({ page }) => {
  30 |     await page.goto('/search');
  31 |     // Either redirected to sign-in or the search page loads
  32 |     const url = page.url();
  33 |     const isRedirected = url.includes('sign-in') || url.includes('auth');
  34 |     const hasSearch = await page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="name" i]').isVisible().catch(() => false);
  35 |     expect(isRedirected || hasSearch).toBeTruthy();
  36 |   });
  37 | 
  38 |   test('legal/privacy page loads', async ({ page }) => {
  39 |     await page.goto('/legal/privacy');
  40 |     await expect(page.locator('main, article, body')).toBeVisible();
  41 |   });
  42 | });
  43 | 
  44 | test.describe('Report Page', () => {
  45 |   test('report page is auth-gated', async ({ page }) => {
  46 |     await page.goto('/report');
  47 |     const url = page.url();
  48 |     // Should redirect to sign-in if not authenticated
  49 |     expect(url.includes('sign-in') || url.includes('auth') || url.includes('report')).toBeTruthy();
  50 |   });
  51 | });
  52 | 
```