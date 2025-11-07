import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';

test.describe.serial('Google OAuth Complete Flow', () => {
  const googleEmail = process.env.GOOGLE_TEST_EMAIL || 'printerpixoauthg@gmail.com';
  const googlePassword = process.env.GOOGLE_TEST_PASSWORD || 'All@in123456*';

  test('should register/sign in with Google and then sign out', async ({ page, context }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Wait for Google iframe to load (it takes a few seconds)
    await page.waitForTimeout(2000);

    // Verify Google sign-in button is visible with longer timeout
    await expect(loginPage.googleSignInButton).toBeVisible({ timeout: 15000 });

    // Set up popup listener BEFORE clicking to avoid race condition
    const popupPromise = context.waitForEvent('page', { timeout: 15000 });

    // Click Google sign-in button to start OAuth flow
    await loginPage.clickGoogleSignIn();

    // Wait for popup window
    const popup = await popupPromise;

    // Wait for Google login page to load
    await popup.waitForLoadState('load');

    // Check if we need to enter credentials (Google may remember user)
    const isEmailFieldVisible = await popup.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);

    if (isEmailFieldVisible) {
      // Fill in email
      const emailInput = popup.locator('input[type="email"]');
      await emailInput.fill(googleEmail);

      // Click Next button
      const nextButton = popup.locator('button[jsname="LgbsSe"]:has-text("Next")');
      await nextButton.click();

      // Wait for password page
      await popup.waitForLoadState('networkidle');

      // Fill in password (use the visible password field, not the hidden one)
      const passwordInput = popup.locator('input[type="password"][name="Passwd"]');
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(googlePassword);

      // Click Next button
      const signInButton = popup.locator('button[jsname="LgbsSe"]:has-text("Next")');
      await signInButton.waitFor({ state: 'visible', timeout: 10000 });
      await signInButton.click();
    }

    // Wait for redirect back to main site (should go to account page)
    await page.waitForURL(/\/account/, { timeout: 30000 });

    // Verify user is logged in by checking for user greeting
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Verify we're on the account page
    await expect(page).toHaveURL(/\/account/);

    // Now test sign-out
    // Navigate to homepage first
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Dismiss Klaviyo popup if it appears
    await dismissKlaviyoPopup(page);

    // Ensure user greeting is visible before trying to hover
    await loginPage.userGreeting.waitFor({ state: 'visible', timeout: 10000 });

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

  test('should not access protected pages after Google OAuth sign out', async ({ page, context }) => {
    const loginPage = new LoginPage(page);

    // First, perform the complete sign-in flow from the first test
    await loginPage.goto();

    // Wait for Google iframe to load
    await page.waitForTimeout(2000);

    // Set up popup listener BEFORE clicking to avoid race condition
    const popupPromise = context.waitForEvent('page', { timeout: 15000 });

    await loginPage.clickGoogleSignIn();

    const popup = await popupPromise;
    await popup.waitForLoadState('load');

    const isEmailFieldVisible = await popup.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);

    if (isEmailFieldVisible) {
      const emailInput = popup.locator('input[type="email"]');
      await emailInput.fill(googleEmail);

      const nextButton = popup.locator('button[jsname="LgbsSe"]:has-text("Next")');
      await nextButton.click();
      await popup.waitForLoadState('networkidle');

      const passwordInput = popup.locator('input[type="password"][name="Passwd"]');
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(googlePassword);

      const signInButton = popup.locator('button[jsname="LgbsSe"]:has-text("Next")');
      await signInButton.waitFor({ state: 'visible', timeout: 10000 });
      await signInButton.click();
    }

    await page.waitForURL(/\/account/, { timeout: 30000 });

    // Now sign out
    await page.goto('/');
    await page.waitForLoadState('load');

    // Give the page time to settle and dismiss any popups
    await page.waitForTimeout(1000);
    await dismissKlaviyoPopup(page);
    await page.waitForTimeout(1000);

    await loginPage.clickSignOut();
    await page.waitForURL(/\/$/, { timeout: 10000 });

    // Dismiss popup again after sign-out (it may reappear)
    await dismissKlaviyoPopup(page);

    // Try to access account edit page (protected route)
    await page.goto('/account/edit');

    // Should be redirected to login/register page
    await page.waitForURL(/\/(login|signin|register)/, { timeout: 10000 });
  });
});
