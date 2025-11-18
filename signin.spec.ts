import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Sign In Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login page correctly', async ({ page }) => {
    await expect(page).toHaveURL(/\/login\/signin\//);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('should sign in with valid credentials', async () => {
    const email = process.env.TEST_USER_EMAIL || 'testingplaywright@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || 'testingplaywright@gmail.com';

    await loginPage.signIn(email, password);
    await loginPage.waitForSuccessfulLogin();

    // Verify user is logged in
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.signIn('testingplaywright@gmail.com', 'wrongpassword');

    // Wait for error message to appear
    const passwordError = page.locator('#password-error');
    await expect(passwordError).toBeVisible();

    // Check for localized "Enter your password" message
    await expect(passwordError).toContainText(loginPage.region.errorMessages.enterPassword);
  });

  test('should show error with empty email', async () => {
    await loginPage.signIn('', 'somepassword');

    // The form should validate or show error
    const emailInput = loginPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should show error with empty password', async () => {
    await loginPage.signIn('test@example.com', '');

    // The form should validate or show error
    const passwordInput = loginPage.passwordInput;
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.clickRegister();
    await expect(page).toHaveURL(/\/login\/register\//);
  });
});

test.describe('Sign In - OAuth Providers', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should have Google sign-in button', async () => {
    await expect(loginPage.googleSignInButton).toBeVisible();
  });

  test('should have Facebook sign-in button', async () => {
    await expect(loginPage.facebookSignInButton).toBeVisible();
  });
});
