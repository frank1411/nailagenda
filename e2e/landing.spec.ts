import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows the title and CTA', async ({ page }) => {
    await page.goto('/');

    // The app renders LandingPage for unauthenticated users
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    await expect(page.getByRole('button').or(page.getByRole('link')).first()).toBeVisible();
  });

  test('redirects authenticated user to dashboard', async ({ page }) => {
    // Set a fake auth cookie to simulate being logged in
    await page.context().addCookies([
      {
        name: 'nailagenda-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/');
    // The router should redirect to /dashboard or show AppShell
    await expect(page).toHaveURL(/dashboard/);
  });
});
