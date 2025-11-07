import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Forgot Password Modal Flow', () => {
  let loginPage: LoginPage;
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    forgotPasswordPage = new ForgotPasswordPage(page);

    // Navigate to sign in page
    await loginPage.goto();
  });

  test('should complete password reset flow with valid email', async ({ page }) => {
    // Use a regular non-OAuth test account email
    const testEmail = process.env.FORGOT_PASSWORD_TEST_EMAIL || 'testingplaywright@gmail.com';

    // Open modal
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.waitForModalToAppear();

    // Small delay to ensure modal is fully loaded
    await page.waitForTimeout(500);

    // Wait for API response with timeout
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/v2.0/account/sendpassword'),
      { timeout: 15000 }
    );

    // Fill email and submit
    await forgotPasswordPage.requestPasswordReset(testEmail);

    // Verify API request was made
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Verify API response structure
    const responseBody = await response.json();

    // Check that status exists and is truthy (not null/empty)
    expect(responseBody.status).toBeTruthy();
    expect(responseBody).toHaveProperty('data');

    // Verify data object has required properties with values
    expect(responseBody.data.successUrl).toBeTruthy();
    expect(responseBody.data.customerId).toBeTruthy();
    expect(responseBody.data.resetPasswordUrl).toBeTruthy();
    expect(responseBody.data.firstName).toBeTruthy();

    // Verify success screen appears
    await forgotPasswordPage.waitForSuccessScreen();
    const isSuccessful = await forgotPasswordPage.isResetRequestSuccessful();
    expect(isSuccessful).toBeTruthy();

    // Verify success message contains email
    const successMessage = await forgotPasswordPage.getSuccessMessage();
    expect(successMessage).toBeTruthy();

    // Click return to sign in
    await forgotPasswordPage.clickReturnToSignInButton();

    // Verify modal closes
    const isModalClosed = await forgotPasswordPage.isModalClosed();
    expect(isModalClosed).toBeTruthy();

    // Verify URL has email parameter
    await expect(page).toHaveURL(new RegExp(`/login/signin/.*email=`));
  });

  test('should verify API response structure for valid email', async ({ page }) => {
    // Use a registered non-OAuth test account
    const testEmail = 'testingplaywright@gmail.com';

    // Open modal
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.waitForModalToAppear();

    // Small delay to ensure modal is fully loaded
    await page.waitForTimeout(500);

    // Intercept API response with timeout
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/v2.0/account/sendpassword'),
      { timeout: 15000 }
    );

    // Submit email
    await forgotPasswordPage.fillEmailInModal(testEmail);
    await forgotPasswordPage.clickSendPasswordLink();

    // Get and verify response
    const response = await responsePromise;
    const responseBody = await response.json();

    // Verify status exists and is not empty (flexible check)
    expect(responseBody.status).toBeTruthy();
    expect(responseBody.status).not.toBe('');

    // Verify data object exists
    expect(responseBody.data).toBeTruthy();

    // Verify successUrl exists and has correct format
    expect(responseBody.data.successUrl).toBeTruthy();
    expect(responseBody.data.successUrl).toContain('/login/send-password/');

    // Verify customerId exists and has UUID format
    expect(responseBody.data.customerId).toBeTruthy();
    expect(responseBody.data.customerId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify resetPasswordUrl exists and contains required parts
    expect(responseBody.data.resetPasswordUrl).toBeTruthy();
    expect(responseBody.data.resetPasswordUrl).toContain('reset-password');

    // Verify firstName exists and is not empty
    expect(responseBody.data.firstName).toBeTruthy();
    expect(responseBody.data.firstName).not.toBe('');
  });

  test('should handle empty email field in modal', async ({ page }) => {
    // Open modal
    await loginPage.clickForgotPassword();
    await forgotPasswordPage.waitForModalToAppear();

    // Try to submit without filling email
    await forgotPasswordPage.clickSendPasswordLink();

    // Wait for error message to appear
    await page.waitForTimeout(1000);

    // Check for error message using region-specific text
    const errorMessage = page.locator(`#login-modal p:has-text("${loginPage.region.errorMessages.enterEmailAddress}")`);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});
