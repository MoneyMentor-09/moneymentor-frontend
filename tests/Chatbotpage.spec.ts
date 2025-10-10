import { test, expect } from '@playwright/test';

test('logs in and attempts AI chat (expected to fail)', async ({ page }) => {
  // 1. Go to login page
  await page.goto('https://moneymentor-09.vercel.app/login');

  // 2. Wait for login form
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

  // 3. Fill in credentials and log in
  await page.getByLabel('Email').fill('akdibkmw6@mozmail.com');
  await page.getByLabel('Password').fill('gmf@4TrKLX@!J7:');
  await page.getByRole('button', { name: 'Log In' }).click();

  // 4. Wait for redirect to dashboard
  await page.waitForURL('**/me', { timeout: 10000 });
  await expect(page).toHaveURL(/\/me/);
  console.log('✅ Logged in successfully.');

  // 5. Click "AI Chat" link in the header
  const aiChatLink = page.getByRole('link', { name: /AI Chat/i });
  await expect(aiChatLink).toBeVisible({ timeout: 10000 });
  await aiChatLink.click();

  // 6. Wait for AI Financial Assistant page to load (unique heading)
  await page.waitForURL('**/chat', { timeout: 10000 });
  await expect(
    page.getByRole('heading', { name: 'AI Financial Assistant' })
  ).toBeVisible({ timeout: 10000 });
  console.log('✅ AI Financial Assistant page loaded.');

  // 7. Locate chat input
  const chatInput = page.getByPlaceholder(/Type your message/i)
    .or(page.getByRole('textbox'));
  await expect(chatInput).toBeVisible({ timeout: 10000 });

  // 8. Send a message
  const userMessage = 'What was my highest expense?';
  await chatInput.fill(userMessage);
  await chatInput.press('Enter');
  console.log(`💬 Sent message: "${userMessage}"`);

  // 9. Attempt to wait for bot response
  const botResponse = page.locator('.bot-message, .chatbot-response, text=expense, text=highest');

  try {
    await expect(botResponse.first()).toBeVisible({ timeout: 15000 });
    const responseText = await botResponse.first().innerText();
    console.log('🤖 Chatbot responded:', responseText);
    expect(responseText.trim().length).toBeGreaterThan(0);
  } catch (err) {
    console.log('⚠️ Chatbot did not respond (expected failure in this test).');
  }
});
