import { expect, test } from '@playwright/test';

test('shows the product name on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'One small activity. The whole team.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How a team shares the day' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join with an invite' })).toBeVisible();
});
