import { test, expect } from '@playwright/test';

test('logs in successfully with valid credentials', async ({ page }) => {
  // 1. Go directly to the login page
  await page.goto('https://moneymentor-09.vercel.app/login');

  // 2. Wait until the form is visible
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

  // 3. Fill in email and password
  await page.getByLabel('Email').fill('akdibkmw6@mozmail.com');
  await page.getByLabel('Password').fill('gmf@4TrKLX@!J7:');

  // 4. Click the "Log In" submit button
  await page.getByRole('button', { name: 'Log In' }).click();

  // 5. Wait for navigation (after successful login, you redirect to /me)
  await page.waitForURL('**/Profile', { timeout: 10000 });

  // 6. Confirm we landed on the correct page
  await expect(page).toHaveURL(/\/me/);
  await expect(page.locator('text=MoneyMentor')).toBeVisible();
});