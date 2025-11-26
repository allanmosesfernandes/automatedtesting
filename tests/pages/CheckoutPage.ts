import { Page, Locator } from '@playwright/test';
import { getRegion, type RegionConfig } from '../config/regions';
import { getTestConfig } from '../config/environments';
import { getCartCheckoutTestConfig } from '../config/cart-checkout-test-config';
import { dismissKlaviyoPopup } from '../helpers/popup-handler';
import { dismissCookieConsent } from '../helpers/cookie-consent-handler';
import type { ShippingAddress } from '../helpers/test-data-loader';

/**
 * Order summary interface
 */
export interface OrderSummary {
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
}

/**
 * Checkout validation result
 */
export interface CheckoutValidationResult {
  success: boolean;
  formFilled: boolean;
  orderSummaryVisible: boolean;
  paymentSectionReached: boolean;
  errors: string[];
}

/**
 * Page Object for Checkout page interactions
 * Handles checkout form filling - STOPS BEFORE PAYMENT
 */
export class CheckoutPage {
  readonly page: Page;
  readonly region: RegionConfig;
  readonly config = getCartCheckoutTestConfig();

  // Shipping address locators
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly postalCodeInput: Locator;
  readonly countrySelect: Locator;

  // Shipping method locators
  readonly shippingMethodOptions: Locator;
  readonly selectedShippingMethod: Locator;

  // Order summary locators
  readonly orderSummary: Locator;
  readonly orderSubtotal: Locator;
  readonly orderShipping: Locator;
  readonly orderTax: Locator;
  readonly orderTotal: Locator;

  // Action buttons
  readonly continueToPaymentButton: Locator;
  readonly backToCartButton: Locator;
  readonly placeOrderButton: Locator;

  // Payment section (we identify this to know when to STOP)
  readonly paymentSection: Locator;
  readonly paymentForm: Locator;

  // Validation
  readonly formErrors: Locator;
  readonly fieldError: Locator;

  constructor(page: Page, regionCode?: string) {
    this.page = page;

    // Get region configuration
    if (regionCode) {
      this.region = getRegion(regionCode);
    } else {
      const pageUrl = page.url();
      let detectedRegion: string | null = null;

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
          detectedRegion = domainMap[match[1]] || null;
        }
      }

      const { region } = getTestConfig();
      this.region = getRegion(detectedRegion || region);
    }

    // Shipping address selectors
    this.firstNameInput = page.locator([
      'input[name="firstName"]',
      'input[name="first_name"]',
      'input[name="firstname"]',
      '#firstName',
      '#first-name',
      '[data-testid="firstName"]',
    ].join(', '));

    this.lastNameInput = page.locator([
      'input[name="lastName"]',
      'input[name="last_name"]',
      'input[name="lastname"]',
      '#lastName',
      '#last-name',
      '[data-testid="lastName"]',
    ].join(', '));

    this.emailInput = page.locator([
      'input[name="email"]',
      'input[type="email"]',
      '#email',
      '[data-testid="email"]',
    ].join(', '));

    this.phoneInput = page.locator([
      'input[name="phone"]',
      'input[name="telephone"]',
      'input[type="tel"]',
      '#phone',
      '#telephone',
      '[data-testid="phone"]',
    ].join(', '));

    this.addressLine1Input = page.locator([
      'input[name="address1"]',
      'input[name="addressLine1"]',
      'input[name="street"]',
      'input[name="address"]',
      '#address1',
      '#street-address',
      '[data-testid="address1"]',
    ].join(', '));

    this.addressLine2Input = page.locator([
      'input[name="address2"]',
      'input[name="addressLine2"]',
      'input[name="apartment"]',
      '#address2',
      '[data-testid="address2"]',
    ].join(', '));

    this.cityInput = page.locator([
      'input[name="city"]',
      '#city',
      '[data-testid="city"]',
    ].join(', '));

    this.stateInput = page.locator([
      'input[name="state"]',
      'input[name="region"]',
      'input[name="province"]',
      'select[name="state"]',
      'select[name="region"]',
      '#state',
      '#region',
      '[data-testid="state"]',
    ].join(', '));

    this.postalCodeInput = page.locator([
      'input[name="postcode"]',
      'input[name="postalCode"]',
      'input[name="zip"]',
      'input[name="zipcode"]',
      '#postcode',
      '#postal-code',
      '#zip',
      '[data-testid="postcode"]',
    ].join(', '));

    this.countrySelect = page.locator([
      'select[name="country"]',
      '#country',
      '[data-testid="country"]',
    ].join(', '));

    // Shipping method selectors
    this.shippingMethodOptions = page.locator([
      '[data-testid="shipping-method"]',
      '.shipping-method',
      'input[name="shipping_method"]',
      '.shipping-option',
    ].join(', '));

    this.selectedShippingMethod = page.locator([
      'input[name="shipping_method"]:checked',
      '.shipping-method.selected',
      '[data-testid="selected-shipping"]',
    ].join(', '));

    // Order summary selectors
    this.orderSummary = page.locator([
      '[data-testid="order-summary"]',
      '.order-summary',
      '#order-summary',
      '.checkout-summary',
    ].join(', '));

    this.orderSubtotal = page.locator([
      '[data-testid="order-subtotal"]',
      '.order-subtotal',
      '.subtotal',
    ].join(', '));

    this.orderShipping = page.locator([
      '[data-testid="order-shipping"]',
      '.order-shipping',
      '.shipping-cost',
    ].join(', '));

    this.orderTax = page.locator([
      '[data-testid="order-tax"]',
      '.order-tax',
      '.tax-amount',
    ].join(', '));

    this.orderTotal = page.locator([
      '[data-testid="order-total"]',
      '.order-total',
      '.total',
      '.grand-total',
    ].join(', '));

    // Action buttons
    this.continueToPaymentButton = page.locator([
      'button:has-text("Continue")',
      'button:has-text("Continue to Payment")',
      'button:has-text("Proceed")',
      '[data-testid="continue-to-payment"]',
    ].join(', '));

    this.backToCartButton = page.locator([
      'a:has-text("Back to Cart")',
      'button:has-text("Back")',
      '[data-testid="back-to-cart"]',
    ].join(', '));

    this.placeOrderButton = page.locator([
      'button:has-text("Place Order")',
      'button:has-text("Complete Order")',
      'button:has-text("Pay Now")',
      '[data-testid="place-order"]',
    ].join(', '));

    // Payment section
    this.paymentSection = page.locator([
      '[data-testid="payment-section"]',
      '.payment-section',
      '#payment-section',
      '.payment-form',
      '#payment',
    ].join(', '));

    this.paymentForm = page.locator([
      'form[data-testid="payment-form"]',
      '.payment-form form',
      '#payment-form',
    ].join(', '));

    // Validation errors
    this.formErrors = page.locator([
      '.form-error',
      '.error-message',
      '.field-error',
      '[role="alert"]',
    ].join(', '));

    this.fieldError = page.locator('.field-error, .input-error, .error');
  }

  /**
   * Navigate to checkout page
   */
  async goto(): Promise<void> {
    await this.page.goto('/checkout', { timeout: this.config.timeouts.navigationTimeout });
    await this.dismissPopups();
  }

  /**
   * Dismiss popups
   */
  async dismissPopups(): Promise<void> {
    await dismissCookieConsent(this.page, 3000);
    await dismissKlaviyoPopup(this.page, 3000);
  }

  /**
   * Wait for checkout page to load
   */
  async waitForCheckoutLoad(): Promise<void> {
    // Wait for checkout form elements to appear
    await Promise.race([
      this.firstNameInput.first().waitFor({ state: 'visible', timeout: this.config.timeouts.checkoutPageLoad }).catch(() => {}),
      this.emailInput.first().waitFor({ state: 'visible', timeout: this.config.timeouts.checkoutPageLoad }).catch(() => {}),
      this.orderSummary.first().waitFor({ state: 'visible', timeout: this.config.timeouts.checkoutPageLoad }).catch(() => {}),
    ]);
  }

  /**
   * Fill shipping address form
   */
  async fillShippingAddress(address: ShippingAddress): Promise<void> {
    const timeout = this.config.timeouts.formFillTimeout;

    // Fill first name
    const hasFirstName = await this.firstNameInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasFirstName) {
      await this.firstNameInput.first().fill(address.firstName, { timeout });
    }

    // Fill last name
    const hasLastName = await this.lastNameInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasLastName) {
      await this.lastNameInput.first().fill(address.lastName, { timeout });
    }

    // Fill email
    const hasEmail = await this.emailInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEmail) {
      await this.emailInput.first().fill(address.email, { timeout });
    }

    // Fill phone
    const hasPhone = await this.phoneInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPhone) {
      await this.phoneInput.first().fill(address.phone, { timeout });
    }

    // Fill address line 1
    const hasAddress1 = await this.addressLine1Input.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasAddress1) {
      await this.addressLine1Input.first().fill(address.addressLine1, { timeout });
    }

    // Fill address line 2 (optional)
    if (address.addressLine2) {
      const hasAddress2 = await this.addressLine2Input.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (hasAddress2) {
        await this.addressLine2Input.first().fill(address.addressLine2, { timeout });
      }
    }

    // Fill city
    const hasCity = await this.cityInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCity) {
      await this.cityInput.first().fill(address.city, { timeout });
    }

    // Fill state/region
    const hasState = await this.stateInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasState) {
      const tagName = await this.stateInput.first().evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await this.stateInput.first().selectOption({ label: address.state }).catch(() => {
          // Try selecting by value if label doesn't match
          return this.stateInput.first().selectOption(address.state);
        });
      } else {
        await this.stateInput.first().fill(address.state, { timeout });
      }
    }

    // Fill postal code
    const hasPostalCode = await this.postalCodeInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPostalCode) {
      await this.postalCodeInput.first().fill(address.postalCode, { timeout });
    }

    // Select country
    const hasCountry = await this.countrySelect.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCountry) {
      await this.countrySelect.first().selectOption({ label: address.country }).catch(() => {
        // Try selecting by value if label doesn't match
        return this.countrySelect.first().selectOption(address.country);
      });
    }
  }

  /**
   * Select shipping method
   */
  async selectShippingMethod(methodIndex: number = 0): Promise<void> {
    const options = await this.shippingMethodOptions.all();
    if (options.length > methodIndex) {
      await options[methodIndex].click();
      await this.page.waitForTimeout(1000); // Wait for price update
    }
  }

  /**
   * Get order summary
   */
  async getOrderSummary(): Promise<OrderSummary> {
    return {
      subtotal: await this.orderSubtotal.first().textContent().catch(() => '') || '',
      shipping: await this.orderShipping.first().textContent().catch(() => '') || '',
      tax: await this.orderTax.first().textContent().catch(() => '') || '',
      total: await this.orderTotal.first().textContent().catch(() => '') || '',
    };
  }

  /**
   * Get form validation errors
   */
  async getFormErrors(): Promise<string[]> {
    const errors: string[] = [];
    const errorElements = await this.formErrors.all();

    for (const element of errorElements) {
      const text = await element.textContent();
      if (text) {
        errors.push(text.trim());
      }
    }

    return errors;
  }

  /**
   * Check if form is filled
   */
  async validateFormIsFilled(): Promise<boolean> {
    try {
      const firstName = await this.firstNameInput.first().inputValue().catch(() => '');
      const lastName = await this.lastNameInput.first().inputValue().catch(() => '');
      const email = await this.emailInput.first().inputValue().catch(() => '');

      // Basic check - at least these fields should be filled
      return firstName.length > 0 && lastName.length > 0 && email.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if order summary is visible
   */
  async isOrderSummaryVisible(): Promise<boolean> {
    return await this.orderSummary.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Check if payment section is visible
   */
  async isPaymentSectionVisible(): Promise<boolean> {
    return await this.paymentSection.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Check if on checkout page
   */
  async isOnCheckoutPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/checkout') || url.includes('/secure');
  }

  /**
   * CRITICAL: Stop before payment - validate state without clicking payment
   *
   * This method validates that we've reached the payment step but DOES NOT
   * click any payment buttons to avoid actual charges.
   */
  async stopBeforePayment(): Promise<CheckoutValidationResult> {
    const errors: string[] = [];

    // Check if form is filled
    const formFilled = await this.validateFormIsFilled();
    if (!formFilled) {
      errors.push('Form not fully filled');
    }

    // Check if order summary is visible
    const orderSummaryVisible = await this.isOrderSummaryVisible();
    if (!orderSummaryVisible) {
      errors.push('Order summary not visible');
    }

    // Check if we can see payment section (but don't interact with it!)
    const paymentSectionReached = await this.isPaymentSectionVisible();

    // Check for form validation errors
    const formErrors = await this.getFormErrors();
    if (formErrors.length > 0) {
      errors.push(...formErrors);
    }

    // Take a screenshot for evidence
    const screenshotPath = `test-results/cart-checkout/screenshots/checkout-state-${Date.now()}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    return {
      success: formFilled && orderSummaryVisible && errors.length === 0,
      formFilled,
      orderSummaryVisible,
      paymentSectionReached,
      errors,
    };
  }
}
