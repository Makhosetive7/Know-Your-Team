import { expect, test } from '@playwright/test';

import { mockAppApi, TEAM } from './mock-api';

test('an administrator can share an invite link that previews the team', async ({ page }) => {
  await mockAppApi(page, { withTeam: true });
  await page.goto(`/sign-in?next=/teams/${TEAM.id}/settings`);
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Run this team' })).toBeVisible();
  await page.getByRole('button', { name: 'Create invite link' }).click();
  await expect(page.getByText(/Share this link once/)).toBeVisible();

  const inviteUrl = await page.locator('code').innerText();
  expect(inviteUrl).toContain('/join?token=share-token');
  await page.goto(inviteUrl);
  await expect(page.getByRole('heading', { name: 'Join Studio' })).toBeVisible();
  await expect(page.getByLabel('Invite token')).toHaveValue('share-token');
});
