/**
 * Photo Calendars Product Module
 *
 * Handles the Photo Calendars designer flow:
 * - Navigate to Photo Calendars page
 * - Select calendar product (different URLs for US vs UK)
 * - Enter designer via themes
 * - Auto-create with images
 * - Complete design and proceed to cart
 */

import { Page, expect } from '@playwright/test';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { getBaseUrl } from '../../config/environments';
import { handleUpsellPages } from '../checkout.module';
import { assertPageHealthy, assertElementVisible } from '../../helpers/health-check';
import * as fs from 'fs';
import * as path from 'path';

export interface PhotoCalendarsResult {
  success: boolean;
  reachedCart: boolean;
  upsellsSkipped: number;
  screenshots: string[];
}

// Product URLs differ by region
const PRODUCT_URLS: Record<string, string> = {
  GB: '/photo-calendars/wedding-personalised-wall-calendar/',
  US: '/photo-calendars/personalized-photo-calendars/',
};

/**
 * Run the complete Photo Calendars flow
 */
export async function runPhotoCalendarFlow(
  page: Page,
  region: string,
  resultsDir = 'test-results/photo-calendars'
): Promise<PhotoCalendarsResult> {
  const baseUrl = getBaseUrl(region, 'live');
  const screenshots: string[] = [];

  console.log(`\n=== PHOTO CALENDARS MODULE ===`);

  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Step 1: Navigate to Photo Calendars category page
  console.log('Calendars Step 1: Navigating to Photo Calendars page...');
  await page.goto(`${baseUrl}/photo-gifts/photo-calendars/`, { timeout: 30000 });
  await assertPageHealthy(page, 'Photo Calendars Category Page');
  await dismissKlaviyoPopup(page, 3000);
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

  const categoryScreenshot = path.join(resultsDir, `calendars-category-${region}-${Date.now()}.png`);
  await page.screenshot({ path: categoryScreenshot, fullPage: true });
  screenshots.push(categoryScreenshot);
  console.log('  Photo Calendars category page loaded');

  // Step 2: Navigate to specific calendar product (different for US vs UK)
  console.log('Calendars Step 2: Navigating to calendar product...');
  const productUrl = PRODUCT_URLS[region] || PRODUCT_URLS.GB;
  await page.goto(`${baseUrl}${productUrl}`, { timeout: 30000 });
  await assertPageHealthy(page, 'Calendar Product Page');
  await dismissKlaviyoPopup(page, 3000);
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

  // Verify CTA button is visible
  await assertElementVisible(page, '#cta-design-button', 'Create Your Calendar button');

  const productScreenshot = path.join(resultsDir, `calendars-product-${region}-${Date.now()}.png`);
  await page.screenshot({ path: productScreenshot, fullPage: true });
  screenshots.push(productScreenshot);
  console.log(`  Calendar product page loaded: ${productUrl}`);

  // Step 3: Click "Start Your Calendar" / "Create NOW" button
  console.log('Calendars Step 3: Clicking Create button...');
  const ctaButton = page.locator('#cta-design-button:visible').first();
  await ctaButton.waitFor({ state: 'visible', timeout: 15000 });
  await ctaButton.scrollIntoViewIfNeeded();
  await ctaButton.click();
  console.log('  Create button clicked');

  // Step 4: Wait for themes page
  console.log('Calendars Step 4: Waiting for themes page...');
  await page.waitForURL(/.*\/themes\/.*/, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await dismissKlaviyoPopup(page, 3000);

  const themesScreenshot = path.join(resultsDir, `calendars-themes-${region}-${Date.now()}.png`);
  await page.screenshot({ path: themesScreenshot, fullPage: true });
  screenshots.push(themesScreenshot);
  console.log('  Themes page loaded');

  // Step 5: Select a theme (first available SELECT link)
  console.log('Calendars Step 5: Selecting theme...');

  // Wait for theme cards to load (look for theme images or cards)
  await page.waitForSelector('img[src*="theme"], .theme-card, [class*="theme"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Scroll down to see theme options
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1000);

  // Click the SELECT button (it's a <p> tag with text "Select")
  // The parent div is clickable
  const selectButton = page.locator('p.text-\\[\\#F02480\\]:has-text("Select")').first();
  await selectButton.waitFor({ state: 'visible', timeout: 15000 });

  // Click the parent div that has the hover effect
  const clickableDiv = selectButton.locator('xpath=..');
  await clickableDiv.click();
  console.log('  Theme Select clicked');

  // Step 6: Wait for designer to load
  console.log('Calendars Step 6: Waiting for designer...');
  await page.waitForURL(/.*\/(qdesigner|designer)\/.*/, { timeout: 90000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const designerScreenshot = path.join(resultsDir, `calendars-designer-${region}-${Date.now()}.png`);
  await page.screenshot({ path: designerScreenshot, fullPage: false });
  screenshots.push(designerScreenshot);
  console.log('  Designer loaded');

  // Step 7: Calendar designer opens with Uploadcare upload panel
  console.log('Calendars Step 7: Waiting for Uploadcare dialog...');
  const designerFrame = page.frameLocator('iframe').first();

  // Wait for designer to fully load
  await page.waitForTimeout(3000);

  // Wait for Uploadcare dialog to appear (it's on the main page, not in iframe)
  const uploadcareDialog = page.locator('.uploadcare--panel, [class*="uploadcare"]').first();
  await uploadcareDialog.waitFor({ state: 'visible', timeout: 15000 });
  console.log('  Uploadcare dialog visible');

  // Step 8: Upload test images using filechooser event
  console.log('Calendars Step 8: Uploading images...');
  const testImagesDir = path.join(__dirname, '../../data/test-images');
  const imageFiles = fs.readdirSync(testImagesDir)
    .filter(f => f.endsWith('.png'))
    .slice(0, 13) // Calendars need ~12-13 images
    .map(f => path.join(testImagesDir, f));

  console.log(`  Found ${imageFiles.length} images`);

  // Use filechooser event - click button and handle the file dialog
  const uploadButton = page.locator('button:has-text("Upload Your Photos"), .uploadcare--tab__action-button').first();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 15000 }),
    uploadButton.click()
  ]);

  await fileChooser.setFiles(imageFiles);
  console.log('  Images selected via file chooser');

  // Wait for upload to process
  await page.waitForTimeout(5000);

  const uploadScreenshot = path.join(resultsDir, `calendars-upload-${region}-${Date.now()}.png`);
  await page.screenshot({ path: uploadScreenshot, fullPage: false });
  screenshots.push(uploadScreenshot);
  console.log('  Images uploaded');

  // Step 9: Click "Add" button to confirm upload (button says "Add" with file count)
  console.log('Calendars Step 9: Clicking Add...');

  // Look for Add button specifically within the Uploadcare dialog
  const addButton = page.locator('.uploadcare--dialog button:has-text("Add"), .uploadcare--panel button:has-text("Add")').first();
  await addButton.waitFor({ state: 'visible', timeout: 15000 });
  await addButton.click();
  console.log('  Add clicked');

  // Step 10: Wait for editor to load and images to be arranged
  console.log('Calendars Step 10: Waiting for editor...');
  await page.waitForTimeout(5000); // Wait for editor transition

  const editorScreenshot = path.join(resultsDir, `calendars-editor-${region}-${Date.now()}.png`);
  await page.screenshot({ path: editorScreenshot, fullPage: false });
  screenshots.push(editorScreenshot);
  console.log('  Editor loaded');

  // Step 11: Click "ADD TO CART" button (it's in the page header, not iframe)
  console.log('Calendars Step 11: Clicking Add to Cart...');
  const addToCartButton = page.locator('button:has-text("ADD TO CART"), #custom-pp-design-btn').first();
  await addToCartButton.waitFor({ state: 'visible', timeout: 15000 });
  await addToCartButton.click();
  console.log('  Add to Cart clicked');

  // Wait a moment for any popups to appear
  await page.waitForTimeout(2000);

  // Step 11b: Handle popups on designer page (upsells + resolution warning)
  console.log('Calendars Step 11b: Handling popups...');
  let popupCount = 0;
  const maxPopups = 10;

  while (popupCount < maxPopups) {
    await page.waitForTimeout(1000);

    // First, check for "Review your project" resolution modal (takes priority)
    const reviewModal = page.locator('.modal.show .modal-dialog:has-text("Review your project")');
    const hasReviewModal = await reviewModal.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasReviewModal) {
      console.log('  Found "Review your project" resolution modal');
      const addToCartInModal = page.locator('.modal.show button.btn.confirm.btn-primary').first();
      await addToCartInModal.click();
      console.log('  Clicked "Add to cart" in resolution modal');
      popupCount++;
      await page.waitForTimeout(2000);
      continue;
    }

    // Check for upsell popup with "No, thank you" button
    const noThanksButton = page.locator('#no-change-prod');
    const hasUpsellPopup = await noThanksButton.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasUpsellPopup) {
      console.log(`  Found upsell popup`);
      await noThanksButton.click();
      console.log(`  Clicked "No, thank you"`);
      popupCount++;
      await page.waitForTimeout(2000);
      continue;
    }

    // No more popups found
    break;
  }

  console.log(`  Handled ${popupCount} popups total`);

  // Step 13: Wait for upsells/extras and handle them
  console.log('Calendars Step 13: Handling upsells...');

  // Wait for page to navigate (extras or cart)
  await page.waitForTimeout(2000);
  await page.waitForURL(/.*\/(extras|cart|upsell)\/.*/, { timeout: 30000 });

  // Handle upsells if not already at cart
  if (!page.url().includes('/cart')) {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);
    const upsellsSkipped = await handleUpsellPages(page);

    console.log(`=== PHOTO CALENDARS COMPLETE ===\n`);

    return {
      success: true,
      reachedCart: page.url().includes('/cart'),
      upsellsSkipped,
      screenshots,
    };
  }

  console.log(`=== PHOTO CALENDARS COMPLETE ===\n`);

  return {
    success: true,
    reachedCart: page.url().includes('/cart'),
    upsellsSkipped: 0,
    screenshots,
  };
}
