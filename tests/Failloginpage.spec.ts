import { test, expect } from '@playwright/test';

// Helper functions
function randomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  let username = '';
  for (let i = 0; i < 8; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${username}@example.com`;
}

function randomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

test('fails login multiple times with random credentials', async ({ page }) => {
  const attempts = 10;

  // Go to login page initially
  await page.goto('https://moneymentor-09.vercel.app/login');

  for (let i = 0; i < attempts; i++) {
    console.log(`Attempt ${i + 1}`);

    // Wait for login form
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

    // Random credentials
    const email = randomEmail();
    const password = randomPassword();
    console.log(`Trying email: ${email}, password: ${password}`);

    // Fill form
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);

    // Submit
    await page.getByRole('button', { name: 'Log In' }).click();

    // Wait for the correct error message
    const errorLocator = page.locator('text=Invalid login credentials');
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
    console.log(`Attempt ${i + 1} failed as expected.`);

    // Refresh page for next attempt
    await page.reload();
  }
});
