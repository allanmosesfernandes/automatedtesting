import { Page, Locator } from '@playwright/test';
import { getRegion, type RegionConfig } from '../config/regions';
import { getTestConfig } from '../config/environments';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly region: RegionConfig;
  readonly modal: Locator;
  readonly modalOverlay: Locator;
  readonly forgotPasswordWrapper: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly returnToSignInLink: Locator;
  readonly successWrapper: Locator;
  readonly returnToSignInButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page, regionCode?: string) {
    this.page = page;

    // Get region configuration - same logic as LoginPage
    if (regionCode) {
      this.region = getRegion(regionCode);
    } else {
      const pageUrl = page.url();
      let detectedRegion: string | null = null;

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
          detectedRegion = domainMap[match[1]] || null;
        }
      }

      const { region } = getTestConfig();
      this.region = getRegion(detectedRegion || region);
    }

    // Modal selectors
    this.modalOverlay = page.locator('div.fixed.flex.items-center.justify-center');
    this.modal = page.locator('#login-modal');

    // Error message selector (for invalid email, empty field, non-existent email)
    this.errorMessage = page.locator('#login-modal p[class*="color-[#b94a48]"]');

    // Forgot password form selectors (initial state)
    this.forgotPasswordWrapper = page.locator('.forgot_password_wrapper');
    this.emailInput = page.locator('#login-modal input[name="email"]');
    this.submitButton = page.locator('button.button_forgot_password--submit');
    // Region-aware selector for return to sign in link
    this.returnToSignInLink = page.locator(`.forgot_password_wrapper :has-text("${this.region.translations.returnToSignIn}")`);

    // Success screen selectors (after submission)
    this.successWrapper = page.locator('.sending_password_link_wrapper');
    this.returnToSignInButton = page.locator('button.button_sending_password_link--submit, div.button_sending_password_link--submit');
    this.successMessage = page.locator('.sending_password_link_wrapper');
  }

  /**
   * Wait for the forgot password modal to appear
   */
  async waitForModalToAppear() {
    await this.modal.waitFor({ state: 'visible', timeout: 5000 });
    await this.forgotPasswordWrapper.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Check if modal is visible
   */
  async isModalVisible(): Promise<boolean> {
    try {
      await this.modal.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if modal is closed
   */
  async isModalClosed(): Promise<boolean> {
    try {
      await this.modal.waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill email in the modal input field
   */
  async fillEmailInModal(email: string) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.emailInput.fill(email);
  }

  /**
   * Click the "SEND PASSWORD LINK" button
   */
  async clickSendPasswordLink() {
    await this.submitButton.click();
  }

  /**
   * Complete flow: fill email and submit
   */
  async requestPasswordReset(email: string) {
    await this.fillEmailInModal(email);
    await this.clickSendPasswordLink();
  }

  /**
   * Wait for success screen to appear after API response
   */
  async waitForSuccessScreen() {
    await this.successWrapper.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if reset request was successful (success screen visible)
   */
  async isResetRequestSuccessful(): Promise<boolean> {
    try {
      await this.successWrapper.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.successMessage.textContent() || '';
  }

  /**
   * Click "Return to Sign In" link (before submission)
   */
  async clickReturnToSignInLink() {
    await this.returnToSignInLink.click();
  }

  /**
   * Click "Return to Sign In" button (on success screen)
   */
  async clickReturnToSignInButton() {
    await this.returnToSignInButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.returnToSignInButton.click();
  }

  /**
   * Get the email input element (for validation testing)
   */
  getEmailInput(): Locator {
    return this.emailInput;
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
