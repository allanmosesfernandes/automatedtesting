/**
 * Photo Books Product Module
 *
 * Handles the Photo Books designer flow:
 * - Navigate to Photo Books page
 * - Select Hardcover Photo Book
 * - Enter designer (handle themes for UK)
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

export interface PhotoBooksResult {
  success: boolean;
  reachedCart: boolean;
  upsellsSkipped: number;
  screenshots: string[];
}

/**
 * Run the complete Photo Books flow
 */
export async function runPhotoBookFlow(
  page: Page,
  region: string,
  resultsDir = 'test-results/photo-books'
): Promise<PhotoBooksResult> {
  const baseUrl = getBaseUrl(region, 'live');
  const screenshots: string[] = [];

  console.log(`\n=== PHOTO BOOKS MODULE ===`);

  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Step 1: Navigate to Photo Books page
  console.log('PhotoBooks Step 1: Navigating to Photo Books page...');
  await page.goto(`${baseUrl}/photo-books-q/`, { timeout: 30000 });
  await assertPageHealthy(page, 'Photo Books Category Page');
  await dismissKlaviyoPopup(page, 3000);
  expect(page.url()).toContain('photo-books');
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

  const photoBooksScreenshot = path.join(resultsDir, `photobooks-${region}-${Date.now()}.png`);
  await page.screenshot({ path: photoBooksScreenshot, fullPage: true });
  screenshots.push(photoBooksScreenshot);
  console.log('  Photo Books page loaded');

  // Step 2: Navigate to Hardcover Photo Book product
  console.log('PhotoBooks Step 2: Navigating to Hardcover product...');
  await page.goto(`${baseUrl}/photo-books/hardcover-photo-book/`, { timeout: 30000 });
  await assertPageHealthy(page, 'Hardcover Photo Book Product Page');
  await dismissKlaviyoPopup(page, 3000);
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

  // Verify CTA button is visible
  await assertElementVisible(page, '#cta-design-button', 'Create Your Photo Book button');
  console.log('  Hardcover product page loaded');

  // Step 3: Click "Create Your Photo Book" button
  console.log('PhotoBooks Step 3: Clicking Create button...');
  const ctaButton = page.locator('#cta-design-button:visible').first();
  await ctaButton.waitFor({ state: 'visible', timeout: 15000 });
  await ctaButton.scrollIntoViewIfNeeded();
  await ctaButton.click();
  console.log('  Create button clicked');

  // Step 4: Handle themes page OR direct designer
  console.log('PhotoBooks Step 4: Waiting for next page...');
  await page.waitForURL(/.*\/(themes|qdesigner)\/.*/, { timeout: 30000 });

  if (page.url().includes('/themes/')) {
    console.log('  Themes page detected - selecting theme...');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await dismissKlaviyoPopup(page, 3000);

    const classicBlackTheme = page.locator('text=Classic Black').first();
    await classicBlackTheme.waitFor({ state: 'visible', timeout: 15000 });

    const selectLink = page.locator('text=Classic Black').locator('xpath=..').locator('text=SELECT');
    await selectLink.click();
    console.log('  Classic Black theme selected');

    await page.waitForURL(/.*\/qdesigner\/photobook.*/, { timeout: 90000 });
  } else {
    console.log('  Direct navigation to designer (no themes page)');
  }

  // Step 5: Verify designer loads
  console.log('PhotoBooks Step 5: Verifying designer...');
  await page.waitForURL(/.*\/qdesigner\/photobook.*/, { timeout: 30000 });
  expect(page.url()).toContain('/qdesigner/photobook');

  const designerScreenshot = path.join(resultsDir, `designer-${region}-${Date.now()}.png`);
  await page.screenshot({ path: designerScreenshot, fullPage: false });
  screenshots.push(designerScreenshot);
  console.log('  Designer loaded');

  // Step 6: Click "Auto-Create My Book"
  console.log('PhotoBooks Step 6: Clicking Auto-Create...');
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const designerFrame = page.frameLocator('iframe').first();
  const autoCreateButton = designerFrame.locator('.AddPhotosButton, div[role="button"]:has-text("Auto-Create My Book")').first();
  await autoCreateButton.waitFor({ state: 'visible', timeout: 30000 });
  await autoCreateButton.click();
  console.log('  Auto-Create clicked');

  // Step 7: Click "Computer" for upload
  console.log('PhotoBooks Step 7: Selecting Computer upload...');
  const computerButton = designerFrame.locator('text=Computer').first();
  await computerButton.waitFor({ state: 'visible', timeout: 15000 });
  await computerButton.click();
  console.log('  Computer option clicked');

  // Step 8: Upload test images
  console.log('PhotoBooks Step 8: Uploading images...');
  const testImagesDir = path.join(__dirname, '../../data/test-images');
  const imageFiles = fs.readdirSync(testImagesDir)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(testImagesDir, f));

  console.log(`  Found ${imageFiles.length} images`);

  const fileInput = designerFrame.locator('input[type="file"]');
  await fileInput.setInputFiles(imageFiles);
  await page.waitForTimeout(2000);

  const uploadScreenshot = path.join(resultsDir, `upload-${region}-${Date.now()}.png`);
  await page.screenshot({ path: uploadScreenshot, fullPage: false });
  screenshots.push(uploadScreenshot);
  console.log('  Images uploaded');

  // Step 9: Click "Do the magic"
  console.log('PhotoBooks Step 9: Clicking Do the magic...');
  const doTheMagicButton = designerFrame.locator('.smart-next-step-button, div[role="button"]:has-text("Do the magic")').first();
  await doTheMagicButton.waitFor({ state: 'visible', timeout: 15000 });
  await doTheMagicButton.click();
  console.log('  Do the magic clicked');

  // Step 10: Wait for processing
  console.log('PhotoBooks Step 10: Waiting for magic processing...');
  const userPhotoList = designerFrame.locator('.UserPhotoList');
  await userPhotoList.waitFor({ state: 'visible', timeout: 120000 });
  await expect(userPhotoList).toBeVisible();

  const editorScreenshot = path.join(resultsDir, `editor-${region}-${Date.now()}.png`);
  await page.screenshot({ path: editorScreenshot, fullPage: false });
  screenshots.push(editorScreenshot);
  console.log('  Editor loaded');

  // Step 11: Click "Order"
  console.log('PhotoBooks Step 11: Clicking Order...');
  const orderButton = designerFrame.locator('div[role="button"]:has-text("Order"), .Button:has-text("Order")').first();
  await orderButton.waitFor({ state: 'visible', timeout: 15000 });
  await orderButton.click();
  console.log('  Order clicked');

  // Step 12: Handle validation popup
  console.log('PhotoBooks Step 12: Handling validation popup...');
  const validationCheckbox = designerFrame.locator('[data-sid="validationPopupCheckBox"]');
  await validationCheckbox.waitFor({ state: 'visible', timeout: 15000 });
  await validationCheckbox.click();
  console.log('  First checkbox clicked');

  // Check for second checkbox (US sometimes has 2)
  const secondCheckbox = designerFrame.locator('text=I am aware that there are serious flaws');
  const hasSecondCheckbox = await secondCheckbox.isVisible().catch(() => false);
  if (hasSecondCheckbox) {
    await secondCheckbox.click();
    console.log('  Second checkbox clicked');
  }

  await page.waitForTimeout(500);

  const proceedButton = designerFrame.locator('[data-sid="validationPopupConfirm"]');
  await proceedButton.waitFor({ state: 'visible', timeout: 5000 });
  await proceedButton.click();
  console.log('  Proceed anyway clicked');

  // Step 13: Wait for upsells and handle them
  console.log('PhotoBooks Step 13: Handling upsells...');
  await page.waitForURL(/.*\/extras\/.*/, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page.waitForTimeout(1000);

  const upsellsSkipped = await handleUpsellPages(page);

  console.log(`=== PHOTO BOOKS COMPLETE ===\n`);

  return {
    success: true,
    reachedCart: page.url().includes('/cart'),
    upsellsSkipped,
    screenshots,
  };
}
