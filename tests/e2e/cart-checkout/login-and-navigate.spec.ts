/**
 * Login and Navigate to Photo Books Designer Test
 *
 * Test flow:
 * 1. Navigate to site
 * 2. Dismiss popups (Cookie Consent, Klaviyo)
 * 3. Login with test account
 * 4. Navigate to Photo Books page
 * 5. Navigate to Hardcover Photo Book product
 * 6. Click "Create Your Photo Book" button
 * 7. Verify designer loads (/qdesigner/photobook)
 *
 * Usage:
 *   npm run test:login:gb   # UK site
 *   npm run test:login:us   # US site
 *
 * Results saved to: test-results/photo-books/
 */

import { test, expect } from '@playwright/test';
import { dismissCookieConsent } from '../../helpers/cookie-consent-handler';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { LoginPage } from '../../pages/LoginPage';
import { getBaseUrl } from '../../config/environments';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const targetRegion = process.env.TEST_REGION || 'GB';
const credentials = {
  email: 'allan.fernandes@printerpix.co.uk',
  password: 'All@in1234*',
};

// Photo Books URL is the same path for both regions
const PHOTO_BOOKS_PATH = '/photo-books-q/';

// Results directory
const RESULTS_DIR = 'test-results/photo-books';

test.describe(`Login & Navigate to Photo Books - ${targetRegion}`, () => {
  // Increase timeout for this test as it involves multiple page navigations
  test.setTimeout(120000);

  test.beforeAll(() => {
    // Ensure results directory exists
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
  });

  test(`Should login and navigate to Photo Books page`, async ({ page }) => {
    // Get base URL for the target region (live environment)
    const baseUrl = getBaseUrl(targetRegion, 'live');
    console.log(`Testing ${targetRegion} site: ${baseUrl}`);

    // Step 1: Navigate to homepage
    console.log('Step 1: Navigating to homepage...');
    await page.goto(baseUrl, { timeout: 30000 });
    console.log('  Homepage loaded');

    // Step 2: Dismiss popups
    console.log('Step 2: Dismissing popups...');
    await dismissCookieConsent(page, 5000);
    await dismissKlaviyoPopup(page, 5000);
    console.log('  Popups dismissed');

    // Step 3: Navigate to login page
    console.log('Step 3: Navigating to login page...');
    await page.goto(`${baseUrl}/login/signin/`, { timeout: 30000 });

    // Dismiss popups again after navigation
    await dismissCookieConsent(page, 3000);
    await dismissKlaviyoPopup(page, 3000);
    console.log('  Login page loaded');

    // Step 4: Login
    console.log('Step 4: Logging in...');
    const loginPage = new LoginPage(page, targetRegion);
    await loginPage.signIn(credentials.email, credentials.password);

    // Wait for login to complete
    try {
      await loginPage.waitForSuccessfulLogin();
      console.log('  Login successful (redirected)');
    } catch {
      // Fallback: check if user greeting is visible
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn, 'User should be logged in').toBe(true);
      console.log('  Login successful (greeting visible)');
    }

    // Step 5: Navigate to Photo Books page
    console.log('Step 5: Navigating to Photo Books page...');
    const photoBooksUrl = `${baseUrl}${PHOTO_BOOKS_PATH}`;
    await page.goto(photoBooksUrl, { timeout: 30000 });

    // Dismiss any popups that appear
    await dismissKlaviyoPopup(page, 3000);
    console.log('  Photo Books page loaded');

    // Step 6: Verify we're on the Photo Books page
    console.log('Step 6: Verifying Photo Books page...');

    // Check URL contains photo-books
    expect(page.url()).toContain('photo-books');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take a screenshot for verification
    const screenshotPath = path.join(RESULTS_DIR, `login-photobooks-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`  Screenshot saved: ${screenshotPath}`);

    console.log('  Photo Books page verified');

    // Step 7: Navigate to Hardcover Photo Book product page
    console.log('Step 7: Navigating to Hardcover Photo Book product...');
    const productUrl = `${baseUrl}/photo-books/hardcover-photo-book/`;
    await page.goto(productUrl, { timeout: 30000 });

    // Dismiss any popups that appear
    await dismissKlaviyoPopup(page, 3000);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('  Hardcover Photo Book product page loaded');

    // Step 8: Click "Create Your Photo Book" button
    console.log('Step 8: Clicking "Create Your Photo Book" button...');

    // Wait for the CTA button to be visible (filter for visible ones only)
    const ctaButton = page.locator('#cta-design-button:visible').first();
    await ctaButton.waitFor({ state: 'visible', timeout: 15000 });

    // Scroll to the button and click
    await ctaButton.scrollIntoViewIfNeeded();
    await ctaButton.click();
    console.log('  Create button clicked');

    // Step 9: Handle themes page OR direct designer navigation
    console.log('Step 9: Waiting for next page...');

    // Wait for either themes page OR designer page (US goes directly to designer)
    await page.waitForURL(/.*\/(themes|qdesigner)\/.*/, { timeout: 30000 });

    // Check if we're on themes page or designer
    const currentUrl = page.url();
    if (currentUrl.includes('/themes/')) {
      console.log('  Themes page detected - selecting theme...');
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Dismiss any popups
      await dismissKlaviyoPopup(page, 3000);

      // Click on "Classic Black" theme card to select it
      const classicBlackTheme = page.locator('text=Classic Black').first();
      await classicBlackTheme.waitFor({ state: 'visible', timeout: 15000 });

      // Click the SELECT link next to Classic Black
      const selectLink = page.locator('text=Classic Black').locator('xpath=..').locator('text=SELECT');
      await selectLink.click();
      console.log('  Classic Black theme selected');

      // Wait for navigation to designer
      await page.waitForURL(/.*\/qdesigner\/photobook.*/, { timeout: 90000 });
    } else {
      console.log('  Direct navigation to designer (no themes page)');
    }

    // Step 10: Verify designer loads
    console.log('Step 10: Verifying designer loads...');

    // Ensure we're on the designer page
    await page.waitForURL(/.*\/qdesigner\/photobook.*/, { timeout: 30000 });

    // Verify URL contains the expected path
    expect(page.url()).toContain('/qdesigner/photobook');
    console.log('  Designer URL verified');

    // Take a screenshot of the designer
    const designerScreenshotPath = path.join(RESULTS_DIR, `designer-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({
      path: designerScreenshotPath,
      fullPage: false
    });
    console.log(`  Designer screenshot saved: ${designerScreenshotPath}`);

    console.log(`\nSUCCESS: Completed full flow - Login → Photo Books → Product → Designer for ${targetRegion}`);
  });
});
