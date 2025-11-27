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
  // Increase timeout for this test as it involves multiple page navigations, uploads, and processing
  test.setTimeout(300000); // 5 minutes

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

    // Step 11: Click "Auto-Create My Book" button
    console.log('Step 11: Clicking Auto-Create My Book...');

    // Wait for designer page to fully load
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(2000); // Extra wait for dynamic content/iframe

    // The designer is inside an iframe - find it
    const designerFrame = page.frameLocator('iframe').first();

    // Find and click the Auto-Create button inside the iframe
    const autoCreateButton = designerFrame.locator('.AddPhotosButton, div[role="button"]:has-text("Auto-Create My Book")').first();
    await autoCreateButton.waitFor({ state: 'visible', timeout: 30000 });
    await autoCreateButton.click();
    console.log('  Auto-Create My Book clicked');

    // Step 12: Click "Computer" to upload from local files
    console.log('Step 12: Clicking Computer for file upload...');

    const computerButton = designerFrame.locator('text=Computer').first();
    await computerButton.waitFor({ state: 'visible', timeout: 15000 });
    await computerButton.click();
    console.log('  Computer option clicked');

    // Step 13: Upload test images
    console.log('Step 13: Uploading 21 test images...');

    // Get all test image paths
    const testImagesDir = path.join(__dirname, '../../data/test-images');
    const imageFiles = fs.readdirSync(testImagesDir)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(testImagesDir, f));

    console.log(`  Found ${imageFiles.length} images to upload`);

    // Wait for file input inside iframe and upload all images
    const fileInput = designerFrame.locator('input[type="file"]');
    await fileInput.setInputFiles(imageFiles);
    console.log('  Images uploaded');

    // Wait for images to be processed
    await page.waitForTimeout(2000);

    // Take a screenshot after upload
    const uploadScreenshotPath = path.join(RESULTS_DIR, `upload-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({
      path: uploadScreenshotPath,
      fullPage: false
    });
    console.log(`  Upload screenshot saved: ${uploadScreenshotPath}`);

    // Step 14: Click "Do the magic" button
    console.log('Step 14: Clicking Do the magic...');

    const doTheMagicButton = designerFrame.locator('.smart-next-step-button, div[role="button"]:has-text("Do the magic")').first();
    await doTheMagicButton.waitFor({ state: 'visible', timeout: 15000 });
    await doTheMagicButton.click();
    console.log('  Do the magic clicked');

    // Step 15: Wait for processing to complete
    console.log('Step 15: Waiting for magic processing...');

    // Wait for the UserPhotoList to appear (indicates editor has loaded)
    const userPhotoList = designerFrame.locator('.UserPhotoList');
    await userPhotoList.waitFor({ state: 'visible', timeout: 120000 }); // 2 min timeout for processing
    console.log('  Magic processing complete');

    // Step 16: Verify editor loaded
    console.log('Step 16: Verifying editor loaded...');

    // Check for the photo list container
    await expect(userPhotoList).toBeVisible();
    console.log('  Editor loaded with photos arranged');

    // Take a screenshot of the editor
    const editorScreenshotPath = path.join(RESULTS_DIR, `editor-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({
      path: editorScreenshotPath,
      fullPage: false
    });
    console.log(`  Editor screenshot saved: ${editorScreenshotPath}`);

    // Step 17: Click "Order" button
    console.log('Step 17: Clicking Order button...');

    const orderButton = designerFrame.locator('div[role="button"]:has-text("Order"), .Button:has-text("Order")').first();
    await orderButton.waitFor({ state: 'visible', timeout: 15000 });
    await orderButton.click();
    console.log('  Order button clicked');

    // Step 18: Handle validation popup
    console.log('Step 18: Handling validation popup...');

    // Wait for first checkbox and click it
    const validationCheckbox = designerFrame.locator('[data-sid="validationPopupCheckBox"]');
    await validationCheckbox.waitFor({ state: 'visible', timeout: 15000 });
    await validationCheckbox.click();
    console.log('  First checkbox clicked');

    // Check if second checkbox exists (sometimes US shows 2 checkboxes)
    const secondCheckbox = designerFrame.locator('text=I am aware that there are serious flaws');
    const hasSecondCheckbox = await secondCheckbox.isVisible().catch(() => false);
    if (hasSecondCheckbox) {
      await secondCheckbox.click();
      console.log('  Second checkbox clicked');
    }

    // Wait a moment for button to enable
    await page.waitForTimeout(500);

    // Click "Proceed anyway" button
    const proceedButton = designerFrame.locator('[data-sid="validationPopupConfirm"]');
    await proceedButton.waitFor({ state: 'visible', timeout: 5000 });
    await proceedButton.click();
    console.log('  Proceed anyway clicked');

    // Wait for upsell page to load (navigates away from designer iframe)
    console.log('  Waiting for upsell page to load...');
    await page.waitForURL(/.*\/extras\/.*/, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000); // Extra wait for dynamic content

    // Step 19: Loop through upsell pages until we reach cart
    console.log('Step 19: Handling upsell pages...');

    let upsellCount = 0;
    const maxUpsells = 15; // Safety limit

    while (!page.url().includes('/cart') && upsellCount < maxUpsells) {
      // Wait for page to fully load
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // Check if we've reached the cart
      const currentUrl = page.url();
      if (currentUrl.includes('/cart')) {
        console.log('  Reached cart page');
        break;
      }

      // Try to find and click "Keep As Is" button using multiple strategies
      try {
        // Try JavaScript click as some frameworks need it
        const clicked = await page.evaluate(() => {
          // Try multiple selectors
          const selectors = [
            'button.button_standard_addon--no',
            'button:contains("Keep As Is")',
            '[class*="button_standard_addon--no"]'
          ];

          // Also try finding by text content
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent?.includes('Keep As Is')) {
              (btn as HTMLElement).click();
              return true;
            }
          }
          return false;
        });

        if (clicked) {
          upsellCount++;
          console.log(`  Skipped upsell ${upsellCount} (via JS click)`);
          await page.waitForTimeout(1500); // Wait for page transition
        } else {
          console.log(`  No Keep As Is button found via JS`);
          break;
        }
      } catch (e) {
        // Button not found, might already be at cart or different page
        console.log(`  Error finding button: ${e}`);
        break;
      }
    }

    console.log(`  Handled ${upsellCount} upsell pages`);

    // Step 20: Verify cart page
    console.log('Step 20: Verifying cart page...');

    // Wait for cart page to load
    await page.waitForURL(/.*\/cart.*/, { timeout: 30000 });
    expect(page.url()).toContain('/cart');
    console.log('  Cart page verified');

    // Take a screenshot of the cart
    const cartScreenshotPath = path.join(RESULTS_DIR, `cart-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({
      path: cartScreenshotPath,
      fullPage: true
    });
    console.log(`  Cart screenshot saved: ${cartScreenshotPath}`);

    // Step 21: Click "Begin Checkout" button
    console.log('Step 21: Clicking Begin Checkout...');
    const beginCheckoutButton = page.locator('.cta_cart--begin-checkout');
    await beginCheckoutButton.waitFor({ state: 'visible', timeout: 15000 });
    await beginCheckoutButton.click();
    console.log('  Begin Checkout clicked');

    // Step 22: Wait for shipping page to load
    console.log('Step 22: Waiting for shipping page...');
    await page.waitForURL(/.*\/cart\/shipping.*/, { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    expect(page.url()).toContain('/cart/shipping');
    console.log('  Shipping page loaded');

    // Take screenshot of shipping page
    const shippingScreenshotPath = path.join(RESULTS_DIR, `shipping-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({ path: shippingScreenshotPath, fullPage: true });
    console.log(`  Shipping screenshot saved: ${shippingScreenshotPath}`);

    // Step 23: Click "Continue to Payment" button
    console.log('Step 23: Clicking Continue to Payment...');
    const continueToPaymentButton = page.locator('.button_shipping--continue-to-payment');
    await continueToPaymentButton.waitFor({ state: 'visible', timeout: 15000 });
    await continueToPaymentButton.click();
    console.log('  Continue to Payment clicked');

    // Step 24: Wait for payment page to load
    console.log('Step 24: Waiting for payment page...');
    await page.waitForURL(/.*\/cart\/payment.*/, { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    expect(page.url()).toContain('/cart/payment');
    console.log('  Payment page loaded');

    // Take screenshot of payment page
    const paymentScreenshotPath = path.join(RESULTS_DIR, `payment-${targetRegion}-${Date.now()}.png`);
    await page.screenshot({ path: paymentScreenshotPath, fullPage: true });
    console.log(`  Payment screenshot saved: ${paymentScreenshotPath}`);

    console.log(`\nSUCCESS: Completed full flow - Login → Photo Books → Designer → Cart → Shipping → Payment for ${targetRegion}`);
  });
});
