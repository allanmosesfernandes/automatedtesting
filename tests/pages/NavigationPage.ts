/**
 * Navigation Page Object
 * Handles navigation menu interactions and link clicking
 */

import { Page, Locator } from '@playwright/test';
import { NavigationLink, NAVIGATION_SELECTORS } from '../config/navigation-links';
import { openNavigationMenu } from '../helpers/navigation-monitor-helper';

export class NavigationPage {
  readonly page: Page;
  readonly menuBurger: Locator;
  readonly navigationContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuBurger = page.locator(NAVIGATION_SELECTORS.menuBurger);
    this.navigationContainer = page.locator(NAVIGATION_SELECTORS.navigationContainer);
  }

  /**
   * Navigate to the homepage
   */
  async goToHomepage(baseUrl: string): Promise<void> {
    await this.page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait briefly for initial page load
    await this.page.waitForTimeout(500);
  }

  /**
   * Open the navigation menu
   */
  async openMenu(): Promise<boolean> {
    return await openNavigationMenu(this.page);
  }

  /**
   * Click a navigation link by direct URL navigation
   * More reliable than clicking through the menu
   */
  async navigateToLink(link: NavigationLink, baseUrl: string): Promise<void> {
    const fullUrl = `${baseUrl}${link.url}`;

    // Navigate and wait for DOM to be loaded
    await this.page.goto(fullUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to stabilize and content to render
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click a navigation link through the menu UI
   * Alternative method if direct navigation is not desired
   */
  async clickNavigationLink(link: NavigationLink): Promise<void> {
    // Ensure menu is open
    await this.openMenu();

    // Try to find and click the link
    const linkLocator = link.selector
      ? this.page.locator(link.selector).first()
      : this.page.locator(`nav a[href="${link.url}"]`).first();

    await linkLocator.click({ timeout: 5000 });

    // Wait for navigation
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get page viewport size
   */
  async getViewport(): Promise<{ width: number; height: number }> {
    const viewport = this.page.viewportSize();
    return viewport || { width: 1280, height: 720 };
  }

  /**
   * Get page body height
   */
  async getPageHeight(): Promise<number> {
    try {
      return await this.page.evaluate(() => document.body.scrollHeight);
    } catch {
      return 0;
    }
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(timeout: number = 10000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });

    // Wait for any final renders
    await this.page.waitForTimeout(1000);
  }

  /**
   * Handle Klaviyo popup if it appears
   */
  async dismissPopups(): Promise<void> {
    try {
      // Klaviyo popup selectors
      const popupSelectors = [
        'button[aria-label*="Close"]',
        '.klaviyo-close-form',
        '[class*="needsclick"]',
        'button:has-text("Close")',
        'button:has-text("No thanks")'
      ];

      for (const selector of popupSelectors) {
        const popup = this.page.locator(selector).first();
        const isVisible = await popup.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          await popup.click().catch(() => {});
          await this.page.waitForTimeout(500);
          break;
        }
      }
    } catch {
      // Popup handling is non-critical
    }
  }
}
