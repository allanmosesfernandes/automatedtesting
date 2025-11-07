import { Page } from '@playwright/test';

/**
 * Dismisses the Klaviyo marketing popup if it appears.
 * This popup can block UI elements like the sign-out button.
 *
 * The popup doesn't reappear once dismissed, but this function is safe
 * to call multiple times as it will silently continue if popup is not found.
 *
 * @param page - Playwright Page object
 * @param timeout - Maximum time to wait for popup (default: 5000ms)
 */
export async function dismissKlaviyoPopup(page: Page, timeout: number = 5000): Promise<void> {
  try {
    // Wait for the popup dialog to appear - use the actual dialog element that blocks pointer events
    const popupDialog = page.locator('div[role="dialog"][aria-modal="true"][aria-label="POPUP Form"]');

    // Wait for popup with timeout - if it doesn't appear, continue silently
    const isPopupVisible = await popupDialog.isVisible({ timeout }).catch(() => false);

    if (!isPopupVisible) {
      return; // Popup not present, continue silently
    }

    // Try multiple close button selectors in order of preference
    const closeSelectors = [
      'div[role="dialog"][aria-modal="true"] button[aria-label="Close dialog"]',
      'div[role="dialog"][aria-modal="true"] .klaviyo-close-form',
      'button[aria-label="Close dialog"]',
      '.klaviyo-close-form',
      'button.needsclick.go3894874857', // Specific class from HTML
      'form[action*="klaviyo"] button[aria-label="Close dialog"]', // Scoped to Klaviyo form
      '.needsclick.kl-private-reset-css-Xuajs1 button' // From the dialog classes
    ];

    for (const selector of closeSelectors) {
      const closeButton = page.locator(selector).first();
      const isVisible = await closeButton.isVisible({ timeout: 1000 }).catch(() => false);

      if (isVisible) {
        // Use force click to ensure it works even if something is partially covering it
        await closeButton.click({ force: true });

        // Wait for popup to be hidden with longer timeout
        await popupDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

        // Additional delay to ensure DOM is stable and popup is fully gone
        await page.waitForTimeout(1000);
        return;
      }
    }

    // If we reach here, popup was found but no close button worked
    // Try to close by pressing Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

  } catch (error) {
    // Popup didn't appear or already dismissed - this is fine, continue silently
    // No action needed
  }
}
