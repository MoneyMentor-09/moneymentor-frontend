import { test, expect } from '@playwright/test';

// Helper: random char from string
function randomCharFrom(str: string) {
  return str.charAt(Math.floor(Math.random() * str.length));
}

// Random first/last name
function randomName(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomCharFrom(chars);
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Random email
function randomEmail() {
  return 'cwokogwu@gmail.com';
  //`${randomName(6).toLowerCase()}@example.com`;
}

// Strong password: at least one lower, upper, digit, special
function randomStrongPassword(length: number = 12) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = `!@#$%^&*()_+-=[]{};':"|<>?,./\`~`;

  let password = [
    randomCharFrom(lower),
    randomCharFrom(upper),
    randomCharFrom(digits),
    randomCharFrom(special),
  ];

  const allChars = lower + upper + digits + special;
  for (let i = password.length; i < length; i++) {
    password.push(randomCharFrom(allChars));
  }

  // Shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

// Random phone number
function randomPhone() {
  const digits = '0123456789';
  let number = '+1';
  for (let i = 0; i < 10; i++) {
    number += randomCharFrom(digits);
  }
  return number;
}

test('sign up and log in successfully with strong credentials', async ({ page }) => {
  const firstName = randomName(6);
  const lastName = randomName(6);
  const email = randomEmail();
  const password = randomStrongPassword(12);
  const phone = randomPhone();

  // 1. Go to homepage
  await page.goto('https://moneymentor-09.vercel.app/');

  // 2. Click on Sign Up in the header
  const signUpLink = page.getByRole('link', { name: /sign up/i });
  await expect(signUpLink).toBeVisible({ timeout: 10000 });
  await signUpLink.click();

  // 3. Wait for first input field to appear
  const firstNameField = page.getByLabel('First Name');
  await expect(firstNameField).toBeVisible({ timeout: 10000 });

  // 4. Fill sign-up form
  await firstNameField.fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Phone').fill(phone);

  // 5. Click Sign Up button
  const signUpButton = page.getByRole('button', { name: /sign up/i });
  await signUpButton.click();

  // 6. Wait for login form (in case redirect doesn't happen)
  const emailField = page.getByLabel('Email');
  await expect(emailField).toBeVisible({ timeout: 10000 });

  // 7. Fill in login credentials
  await emailField.fill(email);
  await page.getByLabel('Password').fill(password);

  // 8. Click Log In
  await page.getByRole('button', { name: 'Log In' }).click();

  // 9. Wait for element that appears only after login
  const dashboardElement = page.locator('text=MoneyMentor');
  await expect(dashboardElement).toBeVisible({ timeout: 15000 });

  console.log(`✅ User signed up and logged in successfully:
  Name: ${firstName} ${lastName}
  Email: ${email}
  Password: ${password}
  Phone: ${phone}`);
});
