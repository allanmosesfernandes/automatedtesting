/**
 * Session Setup for Cart Checkout Tests
 *
 * Creates authenticated sessions per region for use in checkout flow tests.
 * Run this before running cart-checkout-flow tests.
 *
 * Usage:
 *   TEST_REGION=GB npx playwright test cart-checkout/session-setup.spec.ts
 *   TEST_REGION=US npx playwright test cart-checkout/session-setup.spec.ts
 */

import { test } from '@playwright/test';
import { dismissCookieConsent } from '../../helpers/cookie-consent-handler';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { LoginPage } from '../../pages/LoginPage';
import { getCartCheckoutTestConfig } from '../../config/cart-checkout-test-config';
import { getBaseUrl } from '../../config/environments';
import { getTestCredentials } from '../../helpers/test-data-loader';

const config = getCartCheckoutTestConfig();
const targetRegion = process.env.TEST_REGION || 'GB';

test.describe(`Cart Checkout Session Setup - ${targetRegion}`, () => {
  test(`Setup authenticated session for ${targetRegion}`, async ({ page, context }) => {
    // Get base URL for the target region (live environment)
    const baseUrl = getBaseUrl(targetRegion, 'live');
    console.log(`Setting up session for ${targetRegion} at ${baseUrl}`);

    // Step 1: Navigate to homepage
    console.log('Step 1: Navigating to homepage...');
    await page.goto(baseUrl, { timeout: config.timeouts.navigationTimeout });

    // Step 2: Dismiss popups
    console.log('Step 2: Dismissing popups...');
    await dismissCookieConsent(page, 5000);
    await dismissKlaviyoPopup(page, 5000);

    // Step 3: Navigate to login page
    console.log('Step 3: Navigating to login page...');
    await page.goto(`${baseUrl}/login/signin/`, { timeout: config.timeouts.navigationTimeout });

    // Dismiss popups again after navigation
    await dismissCookieConsent(page, 3000);
    await dismissKlaviyoPopup(page, 3000);

    // Step 4: Perform login
    console.log('Step 4: Logging in...');
    const loginPage = new LoginPage(page, targetRegion);
    const credentials = getTestCredentials();

    await loginPage.signIn(credentials.email, credentials.password);

    // Step 5: Wait for successful login
    console.log('Step 5: Waiting for successful login...');
    try {
      await loginPage.waitForSuccessfulLogin();
      console.log('Login successful!');
    } catch (error) {
      // Check if we're logged in by looking for user greeting
      const isLoggedIn = await loginPage.isLoggedIn();
      if (!isLoggedIn) {
        throw new Error(`Login failed for ${targetRegion}: ${error}`);
      }
      console.log('Login verified via user greeting');
    }

    // Step 6: Save session state
    const sessionPath = `.auth/cart-session-${targetRegion.toLowerCase()}.json`;
    console.log(`Step 6: Saving session to ${sessionPath}...`);

    await context.storageState({ path: sessionPath });

    console.log(`Session setup complete for ${targetRegion}!`);
    console.log(`Session saved to: ${sessionPath}`);
  });
});

// Export for use in other tests
export const getSessionPath = (regionCode: string): string => {
  return `.auth/cart-session-${regionCode.toLowerCase()}.json`;
};
