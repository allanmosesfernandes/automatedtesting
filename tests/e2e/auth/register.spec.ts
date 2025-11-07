import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';

test.describe('Registration Flow', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should display registration page correctly', async ({ page }) => {
    await expect(page).toHaveURL(/\/login\/register\//);
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.registerButton).toBeVisible();
  });

  test('should register a new user with valid data', async () => {
    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test.user+${timestamp}@printerpix.com`;
    const testFirstName = 'TestUser';
    const testLastName = 'LastName';

    await registerPage.register({
      firstName: testFirstName,
      lastName: testLastName,
      email: testEmail,
      password: 'TestPass123', // 8+ characters
      acceptTerms: true,
      subscribeNewsletter: false,
    });

    // Verify registration was successful
    await registerPage.waitForSuccessfulRegistration();

    // Verify redirect to account/edit page
    const isSuccessful = await registerPage.isRegistrationSuccessful();
    expect(isSuccessful).toBeTruthy();

    // Wait for header greeting to appear (may take a moment after redirect)
    await registerPage.headerGreeting.waitFor({ state: 'visible', timeout: 5000 });

    // Verify header shows greeting with first name only
    const hasCorrectGreeting = await registerPage.verifyHeaderGreeting(testFirstName);
    expect(hasCorrectGreeting).toBeTruthy();
  });

  test('should show error with invalid email format', async () => {
    await registerPage.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email',
      password: 'TestPass123',
    });

    // Check email validation
    const emailInput = registerPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should show error with empty required fields', async () => {
    // Try to submit with empty fields
    await registerPage.registerButton.click();

    // At least one field should be invalid
    const firstNameInvalid = await registerPage.firstNameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const emailInvalid = await registerPage.emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(firstNameInvalid || emailInvalid).toBeTruthy();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await registerPage.clickSignIn();
    await expect(page).toHaveURL(/\/login\/signin\//);
  });
});

test.describe('Registration - OAuth Providers', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should have Google sign-up button', async () => {
    await expect(registerPage.googleSignUpButton).toBeVisible();
  });

  test('should have Facebook sign-up button', async () => {
    await expect(registerPage.facebookSignUpButton).toBeVisible();
  });
});
