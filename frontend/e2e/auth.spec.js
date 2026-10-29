import { expect, test } from '@playwright/test';

import { mockAppApi } from './mock-api';

test('signs in from the landing page', async ({ page }) => {
  await mockAppApi(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Create or join a team' })).toBeVisible();
});

test('a member of one team lands on today after sign-in', async ({ page }) => {
  await mockAppApi(page, { withTeam: true });
  await page.goto('/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
});

test('shows an API error for a bad password', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'login_bad_credentials', message: 'Incorrect email or password.' },
      }),
    });
  });

  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.');
});

test('sends anonymous visitors from team routes to sign-in', async ({ page }) => {
  await page.goto('/teams');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
