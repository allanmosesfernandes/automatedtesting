import { Page, Locator, expect, BrowserContext } from '@playwright/test';
import { getRegion, type RegionConfig } from '../config/regions';
import { getTestConfig } from '../config/environments';
import { dismissKlaviyoPopup } from '../helpers/popup-handler';

export class LoginPage {
  readonly page: Page;
  readonly region: RegionConfig;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly googleSignInButton: Locator;
  readonly facebookSignInButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly userGreeting: Locator;
  readonly signOutMenuItem: Locator;
  readonly signInLink: Locator;

  constructor(page: Page, regionCode?: string) {
    this.page = page;

    // Get region configuration - use provided regionCode or derive from page URL
    if (regionCode) {
      this.region = getRegion(regionCode);
    } else {
      // Try to extract region from page URL
      const pageUrl = page.url();
      let detectedRegion: string | null = null;

      if (pageUrl && pageUrl !== 'about:blank') {
        // Extract region from URL domain
        const match = pageUrl.match(/printerpix\.(com|co\.uk|de|fr|it|es|nl|in|ae)/);
        if (match) {
          const domainMap: Record<string, string> = {
            'com': 'US',
            'co.uk': 'GB',
            'de': 'DE',
            'fr': 'FR',
            'it': 'IT',
            'es': 'ES',
            'nl': 'NL',
            'in': 'IN',
            'ae': 'AE',
          };
          detectedRegion = domainMap[match[1]] || null;
        }
      }

      // Fall back to config or default
      const { region } = getTestConfig();
      this.region = getRegion(detectedRegion || region);
    }

    // Update these selectors based on actual page structure
    this.emailInput = page.locator('input[type="email"], input[name="email"], #email');
    this.passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    this.signInButton = page.locator('button[type="submit"], button:has-text("Login")');
    this.googleSignInButton = page.locator('div.button_google_login').first();
    this.facebookSignInButton = page.locator('button.button_facebook_login');
    this.forgotPasswordLink = page.locator(`div.cursor-pointer:has-text("${this.region.translations.forgotPassword}")`);
    this.registerLink = page.locator('a:has-text("Looking to create a new account?"), a.link_login_section--register');
    this.errorMessage = page.locator('.error, [role="alert"], .alert-error');
    this.successMessage = page.locator('.success, [role="status"], .alert-success');

    // Region-aware selectors - use region-specific translations
    this.userGreeting = page.locator('header p.hidden.lg\\:flex').filter({ hasText: `${this.region.translations.greeting},` });
    this.signOutMenuItem = page.locator(`a:has-text("${this.region.translations.signOut}"), button:has-text("${this.region.translations.signOut}")`);
    this.signInLink = page.locator(`a:has-text("${this.region.translations.signIn}"), button:has-text("${this.region.translations.signIn}"), a:has-text("${this.region.translations.login}")`);
  }

  /**
   * Re-detect region from current page URL and update locators if needed
   */
  private updateRegionFromUrl() {
    const pageUrl = this.page.url();
    if (pageUrl && pageUrl !== 'about:blank') {
      const match = pageUrl.match(/printerpix\.(com|co\.uk|de|fr|it|es|nl|in|ae)/);
      if (match) {
        const domainMap: Record<string, string> = {
          'com': 'US',
          'co.uk': 'GB',
          'de': 'DE',
          'fr': 'FR',
          'it': 'IT',
          'es': 'ES',
          'nl': 'NL',
          'in': 'IN',
          'ae': 'AE',
        };
        const detectedRegion = domainMap[match[1]];
        if (detectedRegion && detectedRegion !== this.region.code) {
          // Region changed, update it and recreate region-specific locators
          this.region = getRegion(detectedRegion);

          // Recreate region-aware locators with new translations
          (this as any).userGreeting = this.page.locator('header p.hidden.lg\\:flex').filter({ hasText: `${this.region.translations.greeting},` });
          (this as any).signOutMenuItem = this.page.locator(`a:has-text("${this.region.translations.signOut}"), button:has-text("${this.region.translations.signOut}")`);
          (this as any).signInLink = this.page.locator(`a:has-text("${this.region.translations.signIn}"), button:has-text("${this.region.translations.signIn}"), a:has-text("${this.region.translations.login}")`);
          (this as any).forgotPasswordLink = this.page.locator(`div.cursor-pointer:has-text("${this.region.translations.forgotPassword}")`);
        }
      }
    }
  }

  async goto() {
    await this.page.goto('/login/signin/');
    // Update region after navigation
    this.updateRegionFromUrl();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async clickGoogleSignIn() {
    // Wait for Google sign-in button container to load
    const container = this.page.locator('div.button_google_login');
    await container.waitFor({ state: 'visible', timeout: 10000 });

    // Wait a bit more for the iframe to fully initialize
    await this.page.waitForTimeout(1500);

    // Check if there's an iframe
    const iframes = await this.page.locator('iframe[title*="Sign in with Google"]').count();

    if (iframes > 0) {
      // Method 1: Click inside the iframe (most reliable when iframe exists)
      try {
        const iframe = this.page.frameLocator('iframe[title*="Sign in with Google"]').first();
        const button = iframe.locator('div[role="button"]').first();
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await button.click();
        return;
      } catch (e) {
        console.log('Iframe click failed, trying container click');
      }
    }

    // Method 2: Click the container div
    // This works when the iframe delegates clicks to the container
    await container.click();
  }

  async clickFacebookSignIn() {
    await this.facebookSignInButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickRegister() {
    await this.registerLink.click();
  }

  async hoverUserGreeting() {
    // Dismiss Klaviyo popup if it appears (can block hover action)
    await dismissKlaviyoPopup(this.page, 6000);
    await this.userGreeting.hover();
  }

  async clickSignOut() {
    // Dismiss Klaviyo popup if it appears (can block sign-out button)
    // Use longer timeout for this critical operation
    await dismissKlaviyoPopup(this.page, 8000);

    // Hover first to show the menu, then click sign out
    await this.hoverUserGreeting();
    await this.signOutMenuItem.waitFor({ state: 'visible', timeout: 10000 });

    // Try normal click first, use force click if popup is blocking
    try {
      await this.signOutMenuItem.click({ timeout: 5000 });
    } catch (error) {
      // If blocked by popup, dismiss again and force click
      await dismissKlaviyoPopup(this.page, 3000);
      await this.signOutMenuItem.click({ force: true });
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.userGreeting.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isLoggedOut(): Promise<boolean> {
    try {
      await this.signInLink.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForSuccessfulLogin() {
    // Wait for redirect after successful login - adjust URL pattern as needed
    await this.page.waitForURL(/\/(account|dashboard|home|$)/, { timeout: 30000 });
    // Wait for user greeting to appear (may take a moment to load)
    await this.userGreeting.waitFor({ state: 'visible', timeout: 30000 });
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  async signInWithGoogle(context: BrowserContext, email: string, password: string): Promise<void> {
    // Click Google sign-in button (embedded iframe)
    await this.clickGoogleSignIn();

    // Wait for popup window
    const popupPromise = context.waitForEvent('page');
    const popup = await popupPromise;

    // Wait for Google login page to load
    await popup.waitForLoadState('load');

    // Check if we need to enter credentials (Google may already be signed in)
    const isEmailFieldVisible = await popup.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);

    if (isEmailFieldVisible) {
      // Fill in email
      const emailInput = popup.locator('input[type="email"]');
      await emailInput.fill(email);

      // Click Next button
      const nextButton = popup.locator('button[jsname="LgbsSe"]:has-text("Next")');
      await nextButton.click();

      // Wait for password page
      await popup.waitForLoadState('networkidle');

      // Fill in password
      const passwordInput = popup.locator('input[type="password"]');
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(password);

      // Click Next button (same jsname as email Next button)
      const signInButton = popup.locator('button[jsname="LgbsSe"]:has-text("Next")');
      await signInButton.waitFor({ state: 'visible', timeout: 10000 });
      await signInButton.click();
    }

    // Wait for redirect back to main site
    await this.page.waitForURL(/\/account/, { timeout: 30000 });
  }
}
