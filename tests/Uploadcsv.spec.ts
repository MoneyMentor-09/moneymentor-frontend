import { test, expect } from '@playwright/test';
import path from 'path';

test('login and upload transactions CSV', async ({ page }) => {
  // ----------------------
  // 1. Log in
  // ----------------------
  await page.goto('https://moneymentor-09.vercel.app/login');

  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
  await page.getByLabel('Email').fill('1eoibfgcn@mozmail.com');
  await page.getByLabel('Password').fill('gmf@4TrKLX@!J7:');
  await page.getByRole('button', { name: 'Log In' }).click();

  await page.waitForURL('**/me', { timeout: 10000 });
  await expect(page).toHaveURL(/\/me/);

  // ----------------------
  // 2. Navigate to Transactions page
  // ----------------------
  const transactionsLink = page.getByRole('link', { name: /transactions/i });
  await expect(transactionsLink).toBeVisible({ timeout: 10000 });
  await transactionsLink.click();

  await page.waitForURL('**/transactions', { timeout: 10000 });

  // ----------------------
  // 3. Click "Upload CSV" button
  // ----------------------
  const uploadButton = page.getByRole('button', { name: /upload csv/i });
  await expect(uploadButton).toBeVisible({ timeout: 10000 });
  await uploadButton.click();

  // ----------------------
  // 4. Select CSV file
  // ----------------------
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible({ timeout: 10000 });

  const csvFilePath = path.resolve('./test-files/sample-transactions.csv'); // adjust path
  await fileInput.setInputFiles(csvFilePath);

  // ----------------------
  // 5. Click "Upload" to submit CSV
  // ----------------------
  const submitUploadButton = page.getByRole('button', { name: /upload/i });
  await expect(submitUploadButton).toBeVisible();
  await submitUploadButton.click();

  // ----------------------
  // 6. Verify CSV data reflected on page
  // ----------------------
  const successMessage = page.locator('text=Upload successful').first();
  await expect(successMessage).toBeVisible({ timeout: 10000 });

  // Check that the first row from the CSV is displayed in the transactions table
  const groceryRow = page.locator('table >> text=Grocery Store');
  await expect(groceryRow).toBeVisible();

  const salaryRow = page.locator('table >> text=Salary');
  await expect(salaryRow).toBeVisible();

  console.log('✅ CSV upload verified, transactions displayed correctly.');
});
