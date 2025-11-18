import { Page, Locator, expect } from '@playwright/test';
import { dismissKlaviyoPopup } from '../helpers/popup-handler';
import { dismissCookieConsent } from '../helpers/cookie-consent-handler';

/**
 * Page Object for Printbox Designer interactions
 * Handles the flow: Product page -> Theme selection -> Designer
 */
export class PrintboxDesignerPage {
  readonly page: Page;

  // Product page elements
  readonly startMyBookButton: Locator;

  // Theme selection page elements
  readonly designYourOwnThemeCard: Locator;
  readonly firstThemeSelectButton: Locator;

  // Designer page elements
  readonly printboxIframe: Locator;
  readonly errorPopup: Locator;
  readonly errorMessage: Locator;

  // Designer UI elements (inside iframe or main page)
  readonly designerToolbar: Locator;
  readonly designerCanvas: Locator;

  constructor(page: Page) {
    this.page = page;

    // Product page - "Start My Book" button (multiple possible selectors)
    this.startMyBookButton = page.locator('a:has-text("Start My Book"), button:has-text("Start My Book"), a.cta-button:has-text("Start"), #cta-design-button').first();

    // Theme selection page - first theme card
    this.designYourOwnThemeCard = page.locator('div.bg-white.rounded-\\[4px\\].shadow-md').first();
    this.firstThemeSelectButton = page.locator('div.bg-white.rounded-\\[4px\\].shadow-md p.text-\\[\\#F02480\\].uppercase:has-text("Select")').first();

    // Error popup
    this.errorPopup = page.locator('div:has-text("ERROR")').first();
    this.errorMessage = page.locator('text=/It seems that some error has occurred|please save your project|undefined|null/i');

    // Printbox iframe - multiple possible selectors
    this.printboxIframe = page.frameLocator('iframe[src*="printbox"], iframe[src*="getprintbox"]');

    // Designer UI elements (may be in iframe or main page)
    this.designerToolbar = page.locator('[class*="toolbar"], [id*="toolbar"], nav, header').filter({ hasText: /edit|add|text|photo|upload/i });
    this.designerCanvas = page.locator('[class*="canvas"], [class*="designer"], [id*="canvas"]');
  }

  /**
   * Navigate to a product URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Wait for product page to load by checking for "Start My Book" button
   * @param timeout - Timeout in milliseconds (default: 10000ms)
   */
  async waitForProductPageLoad(timeout: number = 10000): Promise<boolean> {
    try {
      // Wait for network to be idle (page fully loaded)
      await this.page.waitForLoadState('networkidle', { timeout: timeout / 2 });

      // Dismiss cookie consent popup first
      await dismissCookieConsent(this.page, 3000);

      // Wait a bit for dynamic content
      await this.page.waitForTimeout(1000);

      // Try to find the button with multiple strategies
      const button = await this.page.locator('a.link_option_panel_design_url, a.cta-button, a:has-text("Start My Book"), button:has-text("Start My Book")').first();
      await button.waitFor({ state: 'visible', timeout: timeout / 2 });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Click "Start My Book" button with Klaviyo popup handling
   */
  async clickStartMyBook(): Promise<void> {
    // Dismiss Klaviyo popup if present
    await dismissKlaviyoPopup(this.page, 6000);

    // Wait a bit for popup to fully disappear
    await this.page.waitForTimeout(500);

    // Find and click the button - use multiple strategies
    const button = await this.page.locator('a.link_option_panel_design_url, a.cta-button, a:has-text("Start My Book"), button:has-text("Start My Book")').first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }

  /**
   * Wait for theme selection page to load
   */
  async waitForThemeSelectionPage(timeout: number = 5000): Promise<boolean> {
    try {
      // Wait for URL to contain /themes/
      await this.page.waitForURL(/\/themes\//, { timeout });

      // Wait for first theme card to be visible
      await this.designYourOwnThemeCard.waitFor({ state: 'visible', timeout: 3000 });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Click "Select" button on the first theme (Design Your Own)
   */
  async selectFirstTheme(): Promise<void> {
    // Dismiss Klaviyo popup again if it reappeared
    await dismissKlaviyoPopup(this.page, 6000);

    await this.page.waitForTimeout(500);

    // Click the select button on the first theme
    await this.firstThemeSelectButton.click();
  }

  /**
   * Wait for designer page to load (qdesigner URL)
   */
  async waitForDesignerPage(timeout: number = 15000): Promise<boolean> {
    try {
      // Wait for URL to contain /qdesigner/
      await this.page.waitForURL(/\/qdesigner\//, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if error popup is visible
   */
  async hasErrorPopup(): Promise<boolean> {
    try {
      // Check for error popup with short timeout
      const errorVisible = await this.errorPopup.isVisible({ timeout: 2000 });
      if (errorVisible) {
        return true;
      }

      // Also check for specific error messages
      const errorMsgVisible = await this.errorMessage.isVisible({ timeout: 1000 });
      return errorMsgVisible;
    } catch (error) {
      // No error popup found
      return false;
    }
  }

  /**
   * Get error popup text if visible
   */
  async getErrorText(): Promise<string | null> {
    try {
      if (await this.errorPopup.isVisible({ timeout: 1000 })) {
        return await this.errorPopup.textContent();
      }
      if (await this.errorMessage.isVisible({ timeout: 1000 })) {
        return await this.errorMessage.textContent();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if Printbox iframe is loaded
   */
  async isPrintboxIframeLoaded(): Promise<boolean> {
    try {
      // Check if iframe element exists in the page
      const iframeElement = this.page.locator('iframe[src*="printbox"], iframe[src*="getprintbox"]');
      await iframeElement.waitFor({ state: 'attached', timeout: 5000 });

      // Verify iframe has a valid src
      const src = await iframeElement.getAttribute('src');
      if (!src || src.trim() === '' || src === 'about:blank') {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate designer UI elements are visible
   * Checks for key elements that indicate the designer is functional
   */
  async isDesignerUIVisible(): Promise<boolean> {
    try {
      // Wait a bit for designer to initialize
      await this.page.waitForTimeout(2000);

      // Check for any designer-related elements
      // These selectors are broad to handle different designer implementations
      const designerElements = await this.page.locator('body').evaluate(() => {
        const bodyHTML = document.body.innerHTML.toLowerCase();

        // Check for common designer keywords in the page
        const hasDesignerKeywords =
          bodyHTML.includes('designer') ||
          bodyHTML.includes('canvas') ||
          bodyHTML.includes('toolbar') ||
          bodyHTML.includes('printbox') ||
          bodyHTML.includes('editor');

        // Check for iframe
        const hasIframe = document.querySelector('iframe') !== null;

        return hasDesignerKeywords || hasIframe;
      });

      return designerElements;
    } catch (error) {
      return false;
    }
  }

  /**
   * Complete validation: no errors + iframe loaded + designer UI visible
   */
  async validateDesigner(): Promise<{
    success: boolean;
    errorPopup: boolean;
    iframeLoaded: boolean;
    designerUIVisible: boolean;
    errorText: string | null;
  }> {
    const errorPopup = await this.hasErrorPopup();
    const iframeLoaded = await this.isPrintboxIframeLoaded();
    const designerUIVisible = await this.isDesignerUIVisible();
    const errorText = errorPopup ? await this.getErrorText() : null;

    const success = !errorPopup && iframeLoaded && designerUIVisible;

    return {
      success,
      errorPopup,
      iframeLoaded,
      designerUIVisible,
      errorText
    };
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
