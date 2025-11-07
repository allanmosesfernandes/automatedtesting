import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';

test.describe.serial('Sign Out Flow', () => {
  // Set timeout for this suite - sign in/out can be slow
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // First, sign in before testing sign out
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.TEST_USER_EMAIL || 'testingplaywright@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || 'testingplaywright@gmail.com';

    await loginPage.signIn(email, password);
    await loginPage.waitForSuccessfulLogin();
  });

  test.afterEach(async ({ page, context }) => {
    // Clear all browser state to prevent test interference
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Small delay to ensure cleanup completes
    await page.waitForTimeout(500);
  });

  test('should sign out successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Dismiss Klaviyo popup if it appears
    await dismissKlaviyoPopup(page);

    // Hover over user greeting to show menu
    await loginPage.hoverUserGreeting();

    // Verify sign out menu item is visible
    await expect(loginPage.signOutMenuItem).toBeVisible();

    // Click sign out
    await loginPage.clickSignOut();

    // Verify user is redirected to homepage
    await page.waitForURL(/\/$/, { timeout: 10000 });

    // Dismiss popup again after sign-out (it may reappear)
    await dismissKlaviyoPopup(page);

    // Verify "Hi, firstName" is no longer visible
    await expect(loginPage.userGreeting).not.toBeVisible();

    // Verify "Sign in" link is now visible instead
    const isLoggedOut = await loginPage.isLoggedOut();
    expect(isLoggedOut).toBeTruthy();
  });

  test('should not access protected pages after sign out', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Dismiss Klaviyo popup if it appears
    await dismissKlaviyoPopup(page);

    // Sign out using hover menu
    await loginPage.clickSignOut();
    await page.waitForURL(/\/$/, { timeout: 10000 });

    // Dismiss popup again after sign-out (it may reappear)
    await dismissKlaviyoPopup(page);

    // Try to access account edit page (protected route)
    await page.goto('/account/edit');

    // Should be redirected to login/register page
    await page.waitForURL(/\/(login|signin|register)/, { timeout: 10000 });
  });

  test('should be able to sign in again after sign out', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Dismiss Klaviyo popup if it appears
    await dismissKlaviyoPopup(page);

    // Sign out using hover menu
    await loginPage.clickSignOut();
    await page.waitForURL(/\/$/, { timeout: 10000 });

    // Dismiss popup again after sign-out (it may reappear)
    await dismissKlaviyoPopup(page);

    // Sign in again
    await loginPage.goto();

    const email = process.env.TEST_USER_EMAIL || 'testingplaywright@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || 'testingplaywright@gmail.com';

    await loginPage.signIn(email, password);
    await loginPage.waitForSuccessfulLogin();

    // Verify user is logged in again
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });
});
