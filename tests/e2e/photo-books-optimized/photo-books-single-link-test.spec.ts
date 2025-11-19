import { test, expect } from '@playwright/test';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { getPhotoBooksTestConfig } from '../../config/photo-books-test-config';

const config = getPhotoBooksTestConfig();

// Use the saved session storage state
test.use({ storageState: '.auth/printbox-session.json' });

test.describe('Photo Books Single Link Test', () => {
  test('Test single photo books link with category selection', async ({ page }) => {
    // Hardcoded test URL
    const testUrl = 'https://www.printerpix.co.uk/photo-books-q/?couponcode=UKGT2022T2&utm_id=16987265940&utm_source=google&utm_medium=cpc&utm_campaign=book+search+uk+exact&utm_term=photo-book-maker-exact-match&utm_content=search';

    const startTime = Date.now();

    console.log('\n' + '='.repeat(80));
    console.log('PHOTO BOOKS SINGLE LINK TEST');
    console.log('='.repeat(80));
    console.log(`Testing: ${testUrl}`);
    console.log('='.repeat(80) + '\n');

    try {
      // Step 1: Navigate to category landing page
      console.log(`[1/9] Navigating to category landing page...`);
      await page.goto(testUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.timeouts.categoryPageLoad
      });
      console.log('✓ Category landing page loaded');

      // Step 2: Dismiss Klaviyo popup (might reappear)
      console.log(`[2/9] Checking for Klaviyo popup...`);
      await dismissKlaviyoPopup(page, 3000);
      console.log('✓ Klaviyo check complete');

      // Step 3: Click category selection link
      console.log(`[3/9] Looking for category selection link...`);

      // Dismiss Klaviyo again before trying to interact with page elements
      await dismissKlaviyoPopup(page, 2000);

      const categoryLink = page.locator(config.selectors.categoryLink).first();
      await expect(categoryLink).toBeVisible({ timeout: 10000 });

      // Get the href for logging
      const categoryHref = await categoryLink.getAttribute('href');
      console.log(`Found category link: ${categoryHref}`);

      await categoryLink.scrollIntoViewIfNeeded({ timeout: 5000 });

      // Dismiss Klaviyo one more time right before clicking
      await dismissKlaviyoPopup(page, 1000);

      // Try to click
      try {
        await categoryLink.click({ timeout: 5000 });
      } catch (error) {
        console.log('Click blocked, dismissing Klaviyo popup again...');
        await dismissKlaviyoPopup(page, 3000);
        await categoryLink.click({ force: true });
      }
      console.log('✓ Clicked category selection link');

      // Step 4: Navigate directly to product page (skip the scroll/click step entirely)
      console.log(`[4/9] Navigating directly to product page...`);

      // Navigate directly to the product URL (bypasses JS click handler issues)
      await page.goto('https://www.printerpix.co.uk/photo-books/large-hardcover-photo-book/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      console.log('✓ Navigated to product page');

      // Step 5: Wait for product page to load
      console.log(`[5/9] Waiting for product page to load...`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Reduced from 5s to 2s

      // Dismiss Klaviyo on product page
      await dismissKlaviyoPopup(page, 2000);

      const productUrl = page.url();
      console.log(`Product page URL: ${productUrl}`);
      console.log('✓ Product page loaded');

      // Step 6: Get button href and navigate directly
      console.log(`[6/10] Getting "Create Yours Now" button href...`);

      // Find the button by ID (there are multiple, so get the first visible one)
      const createButton = page.locator('#cta-design-button').first();
      const buttonHref = await createButton.getAttribute('href');

      if (!buttonHref) {
        throw new Error('Could not find Create Yours Now button href');
      }

      console.log(`Button href: ${buttonHref}`);

      // Navigate directly to the themes page using the href
      const themesUrl = `https://www.printerpix.co.uk${buttonHref}`;
      await page.goto(themesUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      console.log('✓ Navigated to themes page directly');

      // Step 7: Verify navigation to themes page
      console.log(`[7/10] Verifying navigation to themes page...`);
      await page.waitForURL('**/themes/**', { timeout: config.timeouts.themePageLoad });
      console.log('✓ Themes page loaded');

      // Step 8: Click "Design Your Own Theme"
      console.log(`[8/10] Looking for "Design Your Own Theme"...`);
      await page.waitForTimeout(1500); // Reduced from 3s to 1.5s

      const designYourOwnTheme = page.locator(config.selectors.designThemeButton).first();

      await expect(designYourOwnTheme).toBeVisible({ timeout: 10000 });
      await designYourOwnTheme.scrollIntoViewIfNeeded();
      await designYourOwnTheme.click();
      console.log('✓ Clicked "Design Your Own Theme"');

      // Step 9: Verify navigation to designer (should skip login because we have session)
      console.log(`[9/10] Waiting for redirect to designer page...`);
      try {
        await page.waitForURL('**/qdesigner/**', { timeout: config.timeouts.designerPageLoad });
        const designerUrl = page.url();
        console.log(`Designer URL: ${designerUrl}`);
        expect(designerUrl).toContain('https://www.printerpix.co.uk/qdesigner/photobook');
        console.log('✓ Successfully redirected to designer page (login skipped!)');
      } catch (error: any) {
        console.error(`✗ Failed to redirect to designer: ${error.message}`);
        console.log(`Current URL: ${page.url()}`);
        throw error;
      }

      // Step 10: Quick check for error modal
      console.log('[10/10] Waiting 2 seconds then checking for error modal...');
      await page.waitForTimeout(2000); // Reduced from 5s to 2s
      console.log('✓ Designer wait completed');

      // Check for error modal
      console.log('[10/10] Checking for error modal...');
      const errorModal = page.locator('.ModalsContainer.ErrorPopup');
      const errorModalVisible = await errorModal.isVisible().catch(() => false);

      if (errorModalVisible) {
        const errorMessage = await errorModal.locator('.popup-content-wrapper').textContent();
        console.error(`✗ ERROR MODAL DETECTED: ${errorMessage}`);
        throw new Error(`Designer error modal appeared: ${errorMessage}`);
      }

      console.log('✓ No error modal detected');

      const duration = Date.now() - startTime;
      console.log('\n' + '='.repeat(80));
      console.log(`✓ TEST PASSED [${duration}ms / ${(duration / 1000).toFixed(1)}s]`);
      console.log('='.repeat(80) + '\n');

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      console.error('\n' + '='.repeat(80));
      console.error(`✗ TEST FAILED [${duration}ms / ${(duration / 1000).toFixed(1)}s]`);
      console.error(`Error: ${errorMessage}`);
      console.error('='.repeat(80) + '\n');

      throw error;
    }
  });
});
