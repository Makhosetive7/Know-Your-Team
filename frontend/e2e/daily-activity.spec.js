import { expect, test } from '@playwright/test';

import { mockAppApi, TEAM } from './mock-api';

test('register, create a team, complete today, and see team progress', async ({ page }) => {
  await mockAppApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.getByLabel('Display name').fill('Ada');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Create or join a team' })).toBeVisible();

  await page.getByRole('button', { name: 'Create a team' }).click();
  await page.getByLabel('Team name').fill('Studio');
  await page.getByRole('button', { name: 'Create team' }).click();

  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Two truths' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByText(/You completed today/)).toBeVisible();

  await page.getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText('Counts are for the team, not individuals.')).toBeVisible();
});

test('skip is available and does not use penalty copy', async ({ page }) => {
  await mockAppApi(page, { withTeam: true });
  await page.goto(`/sign-in?next=/teams/${TEAM.id}`);
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText('You skipped today. No penalty.')).toBeVisible();
  await expect(page.getByText(/penalty/i)).toHaveCount(1);
});

test('team progress counts completions without naming individuals', async ({ page }) => {
  await mockAppApi(page, { withTeam: true, memberCount: 2, priorCompletedCount: 1 });
  await page.goto(`/sign-in?next=/teams/${TEAM.id}/progress`);
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByText('50%')).toBeVisible();
  await expect(page.getByText('Counts are for the team, not individuals.')).toBeVisible();
});

test('activity actions stay reachable on a small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAppApi(page, { withTeam: true });
  await page.goto(`/sign-in?next=/teams/${TEAM.id}`);
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('button', { name: 'Mark complete' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible();
});
