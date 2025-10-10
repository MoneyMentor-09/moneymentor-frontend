import { test, expect } from '@playwright/test';

test('navigates from homepage and logs in successfully', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('https://moneymentor-09.vercel.app/');

  // 2. Click the "Log In" button in the header
  // Try using text-based locator or role
  const loginButton = page.locator('header').getByRole('link', { name: /login/i });
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();

  // 3. Wait for navigation to login page
  await page.waitForURL('**/login', { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

  // 4. Fill in login credentials
  await page.getByLabel('Email').fill('akdibkmw6@mozmail.com');
  await page.getByLabel('Password').fill('gmf@4TrKLX@!J7:');

  // 5. Submit the login form
  await page.getByRole('button', { name: 'Log In' }).click();

  // 6. Wait for redirect to the user page (/me)
  await page.waitForURL('**/me', { timeout: 10000 });

  // 7. Verify successful login
  await expect(page).toHaveURL(/\/me/);
  await expect(page.locator('text=MoneyMentor')).toBeVisible();
});