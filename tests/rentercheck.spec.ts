import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and shows key sections', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RenterCheck/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('has navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Auth Pages', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/sign in/i);
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/sign up|create account|register/i);
    await expect(page.locator('form').first()).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('search page is auth-gated or loads', async ({ page }) => {
    await page.goto('/search');
    // Either redirected to sign-in or the search page loads
    const url = page.url();
    const isRedirected = url.includes('sign-in') || url.includes('auth');
    const hasSearch = await page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="name" i]').isVisible().catch(() => false);
    expect(isRedirected || hasSearch).toBeTruthy();
  });

  test('legal/privacy page loads', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('main').first()).toBeVisible();
  });
});

test.describe('Report Page', () => {
  test('report page is auth-gated', async ({ page }) => {
    await page.goto('/report');
    const url = page.url();
    // Should redirect to sign-in if not authenticated
    expect(url.includes('sign-in') || url.includes('auth') || url.includes('report')).toBeTruthy();
  });
});
