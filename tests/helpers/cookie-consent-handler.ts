import { Page } from '@playwright/test';

/**
 * Dismiss Cookiebot consent popup if present
 * Waits for the dialog to be fully loaded and clickable before attempting to dismiss
 */
export async function dismissCookieConsent(page: Page, timeout: number = 5000): Promise<void> {
  try {
    console.log('Checking for Cookiebot dialog...');

    // First, wait for the main dialog container to appear
    const dialogLocator = page.locator('#CybotCookiebotDialog');

    try {
      // Wait for dialog to exist and be visible
      await dialogLocator.waitFor({ state: 'visible', timeout: 3000 });
      console.log('Cookiebot dialog detected');
    } catch {
      console.log('No Cookiebot dialog found');
      return; // No dialog present
    }

    // Wait a bit for the dialog to fully render
    await page.waitForTimeout(500);

    // The "Allow all" button
    const allowAllButton = page.locator('button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');

    // Wait for button to be visible and enabled
    await allowAllButton.waitFor({ state: 'visible', timeout: 3000 });

    console.log('Clicking "Allow all" button...');

    // Click with force to ensure it works
    await allowAllButton.click({ force: true });

    // Verify dialog is hidden
    try {
      await dialogLocator.waitFor({ state: 'hidden', timeout: 3000 });
      console.log('✓ Cookie consent dismissed successfully');
    } catch {
      console.warn('Warning: Cookie dialog may still be visible after clicking');
    }

    // Additional wait to ensure page is stable
    await page.waitForTimeout(500);

  } catch (error: any) {
    console.log(`Cookie consent handling: ${error.message}`);
    // Continue anyway - don't block the test
  }
}
