import { Page, Locator, expect } from '@playwright/test';
import { getRegion, type RegionConfig } from '../config/regions';
import { getTestConfig } from '../config/environments';

export class RegisterPage {
  readonly page: Page;
  readonly region: RegionConfig;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly registerButton: Locator;
  readonly googleSignUpButton: Locator;
  readonly facebookSignUpButton: Locator;
  readonly signInLink: Locator;
  readonly termsCheckbox: Locator;
  readonly newsletterCheckbox: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly headerGreeting: Locator;
  readonly passwordError: Locator;

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
        const match = pageUrl.match(/printerpix\.(com|co\.uk|de|fr|it|es|nl)/);
        if (match) {
          const domainMap: Record<string, string> = {
            'com': 'US',
            'co.uk': 'GB',
            'de': 'DE',
            'fr': 'FR',
            'it': 'IT',
            'es': 'ES',
            'nl': 'NL',
          };
          detectedRegion = domainMap[match[1]] || null;
        }
      }

      // Fall back to config or default
      const { region } = getTestConfig();
      this.region = getRegion(detectedRegion || region);
    }

    // Update these selectors based on actual page structure
    this.firstNameInput = page.locator('input[name="firstName"], input[name="first_name"], #firstName');
    this.lastNameInput = page.locator('input[name="lastName"], input[name="last_name"], #lastName');
    this.emailInput = page.locator('input[type="email"], input[name="email"], #email');
    this.passwordInput = page.locator('input[type="password"]');
    this.registerButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign up")');
    this.googleSignUpButton = page.locator('div.button_google_login').first();
    this.facebookSignUpButton = page.locator('button.button_facebook_login');
    this.signInLink = page.locator(`a:has-text("${this.region.translations.signIn}"), a:has-text("${this.region.translations.login}")`);
    this.termsCheckbox = page.locator('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="agree"]');
    this.newsletterCheckbox = page.locator('input[type="checkbox"][name*="newsletter"]');
    this.errorMessage = page.locator('.error, [role="alert"], .alert-error');
    this.successMessage = page.locator('.success, [role="status"], .alert-success');

    // Region-aware selector - use region-specific greeting
    this.headerGreeting = page.locator('header p.hidden.lg\\:flex').filter({ hasText: `${this.region.translations.greeting},` });
    this.passwordError = page.locator('#password-error');
  }

  /**
   * Re-detect region from current page URL and update locators if needed
   */
  private updateRegionFromUrl() {
    const pageUrl = this.page.url();
    if (pageUrl && pageUrl !== 'about:blank') {
      const match = pageUrl.match(/printerpix\.(com|co\.uk|de|fr|it|es|nl)/);
      if (match) {
        const domainMap: Record<string, string> = {
          'com': 'US',
          'co.uk': 'GB',
          'de': 'DE',
          'fr': 'FR',
          'it': 'IT',
          'es': 'ES',
          'nl': 'NL',
        };
        const detectedRegion = domainMap[match[1]];
        if (detectedRegion && detectedRegion !== this.region.code) {
          // Region changed, update it and recreate region-specific locators
          this.region = getRegion(detectedRegion);

          // Recreate region-aware locators with new translations
          (this as any).signInLink = this.page.locator(`a:has-text("${this.region.translations.signIn}"), a:has-text("${this.region.translations.login}")`);
          (this as any).headerGreeting = this.page.locator('header p.hidden.lg\\:flex').filter({ hasText: `${this.region.translations.greeting},` });
        }
      }
    }
  }

  async goto() {
    await this.page.goto('/login/register/');
    // Update region after navigation
    this.updateRegionFromUrl();
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptTerms?: boolean;
    subscribeNewsletter?: boolean;
  }) {
    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);

    // Check terms if checkbox exists and acceptTerms is true (default true)
    if (userData.acceptTerms !== false) {
      const termsExists = await this.termsCheckbox.count() > 0;
      if (termsExists) {
        await this.termsCheckbox.check();
      }
    }

    // Check newsletter if specified
    if (userData.subscribeNewsletter) {
      const newsletterExists = await this.newsletterCheckbox.count() > 0;
      if (newsletterExists) {
        await this.newsletterCheckbox.check();
      }
    }

    await this.registerButton.click();
  }

  async clickGoogleSignUp() {
    // Wait for Google sign-up button to load (there's a delay)
    const container = this.page.locator('div.button_google_login');
    await container.waitFor({ state: 'visible', timeout: 10000 });

    // Try to click the container div first, or the iframe if available
    if (await container.isVisible({ timeout: 5000 }).catch(() => false)) {
      await container.click();
    } else {
      // If container click doesn't work, click the iframe
      const iframe = this.page.frameLocator('iframe[title*="Sign in with Google"]');
      await iframe.locator('body').click();
    }
  }

  async clickFacebookSignUp() {
    await this.facebookSignUpButton.click();
  }

  async clickSignIn() {
    await this.signInLink.click();
  }

  async waitForSuccessfulRegistration() {
    // Wait for redirect to account/edit page after successful registration
    await this.page.waitForURL(/\/account\/edit\//, { timeout: 30000 });
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  async isRegistrationSuccessful(): Promise<boolean> {
    try {
      // Check for redirect to account/edit page
      await this.page.waitForURL(/\/account\/edit\//, { timeout: 30000 });
      return true;
    } catch {
      return false;
    }
  }

  async getHeaderGreeting(): Promise<string> {
    await this.headerGreeting.waitFor({ state: 'visible', timeout: 5000 });
    return await this.headerGreeting.textContent() || '';
  }

  async verifyHeaderGreeting(firstName: string): Promise<boolean> {
    try {
      const greeting = await this.getHeaderGreeting();
      // Use region-specific greeting
      return greeting.includes(`${this.region.translations.greeting}, ${firstName}`);
    } catch {
      return false;
    }
  }
}
