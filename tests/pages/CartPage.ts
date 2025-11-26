import { Page, Locator } from '@playwright/test';
import { getRegion, type RegionConfig } from '../config/regions';
import { getTestConfig } from '../config/environments';
import { getCartCheckoutTestConfig } from '../config/cart-checkout-test-config';
import { dismissKlaviyoPopup } from '../helpers/popup-handler';
import { dismissCookieConsent } from '../helpers/cookie-consent-handler';

/**
 * Cart item interface
 */
export interface CartItem {
  name: string;
  quantity: number;
  price: string;
  thumbnail?: string;
}

/**
 * Page Object for Cart page interactions
 * Handles cart viewing, updating, and checkout initiation
 */
export class CartPage {
  readonly page: Page;
  readonly region: RegionConfig;
  readonly config = getCartCheckoutTestConfig();

  // Cart item locators
  readonly cartItems: Locator;
  readonly cartItemRow: Locator;
  readonly cartItemName: Locator;
  readonly cartItemPrice: Locator;
  readonly cartItemQuantity: Locator;
  readonly cartItemRemove: Locator;

  // Cart summary locators
  readonly subtotalDisplay: Locator;
  readonly shippingDisplay: Locator;
  readonly taxDisplay: Locator;
  readonly totalDisplay: Locator;

  // Action buttons
  readonly proceedToCheckoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly updateCartButton: Locator;

  // Promo code
  readonly promoCodeInput: Locator;
  readonly applyPromoCodeButton: Locator;

  // Empty cart
  readonly emptyCartMessage: Locator;

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

    // Cart items selectors
    this.cartItems = page.locator([
      '[data-testid="cart-items"]',
      '.cart-items',
      '.cart-item-list',
      '#cart-items',
    ].join(', '));

    this.cartItemRow = page.locator([
      '[data-testid="cart-item"]',
      '.cart-item',
      '.cart-item-row',
      '.cart-product',
    ].join(', '));

    this.cartItemName = page.locator([
      '[data-testid="cart-item-name"]',
      '.cart-item-name',
      '.product-name',
      '.item-name',
    ].join(', '));

    this.cartItemPrice = page.locator([
      '[data-testid="cart-item-price"]',
      '.cart-item-price',
      '.product-price',
      '.item-price',
    ].join(', '));

    this.cartItemQuantity = page.locator([
      'input[name="quantity"]',
      '[data-testid="cart-item-quantity"]',
      '.cart-item-quantity input',
      '.quantity-input',
    ].join(', '));

    this.cartItemRemove = page.locator([
      '[data-testid="remove-item"]',
      '.remove-item',
      'button:has-text("Remove")',
      '.cart-item-remove',
    ].join(', '));

    // Summary selectors
    this.subtotalDisplay = page.locator([
      '[data-testid="cart-subtotal"]',
      '.cart-subtotal',
      '.subtotal',
      ':has-text("Subtotal") + *',
    ].join(', '));

    this.shippingDisplay = page.locator([
      '[data-testid="cart-shipping"]',
      '.cart-shipping',
      '.shipping-cost',
    ].join(', '));

    this.taxDisplay = page.locator([
      '[data-testid="cart-tax"]',
      '.cart-tax',
      '.tax-amount',
    ].join(', '));

    this.totalDisplay = page.locator([
      '[data-testid="cart-total"]',
      '.cart-total',
      '.order-total',
      '.total',
    ].join(', '));

    // Action buttons
    this.proceedToCheckoutButton = page.locator([
      'button:has-text("Checkout")',
      'button:has-text("Proceed to Checkout")',
      'a:has-text("Checkout")',
      'a:has-text("Proceed to Checkout")',
      '[data-testid="checkout-button"]',
      '.checkout-button',
    ].join(', '));

    this.continueShoppingButton = page.locator([
      'a:has-text("Continue Shopping")',
      'button:has-text("Continue Shopping")',
      '[data-testid="continue-shopping"]',
    ].join(', '));

    this.updateCartButton = page.locator([
      'button:has-text("Update")',
      'button:has-text("Update Cart")',
      '[data-testid="update-cart"]',
    ].join(', '));

    // Promo code
    this.promoCodeInput = page.locator([
      'input[name="promo"]',
      'input[name="coupon"]',
      'input[name="promoCode"]',
      '[data-testid="promo-input"]',
      '#promo-code',
    ].join(', '));

    this.applyPromoCodeButton = page.locator([
      'button:has-text("Apply")',
      '[data-testid="apply-promo"]',
    ].join(', '));

    // Empty cart
    this.emptyCartMessage = page.locator([
      '[data-testid="empty-cart"]',
      '.empty-cart',
      ':has-text("Your cart is empty")',
      ':has-text("Your basket is empty")',
    ].join(', '));
  }

  /**
   * Navigate to cart page
   */
  async goto(): Promise<void> {
    await this.page.goto('/cart', { timeout: this.config.timeouts.navigationTimeout });
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
   * Wait for cart page to load
   */
  async waitForCartLoad(): Promise<void> {
    // Wait for either cart items or empty cart message
    await Promise.race([
      this.cartItemRow.first().waitFor({ state: 'visible', timeout: this.config.timeouts.cartPageLoad }).catch(() => {}),
      this.emptyCartMessage.first().waitFor({ state: 'visible', timeout: this.config.timeouts.cartPageLoad }).catch(() => {}),
      this.proceedToCheckoutButton.first().waitFor({ state: 'visible', timeout: this.config.timeouts.cartPageLoad }).catch(() => {}),
    ]);
  }

  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    const emptyVisible = await this.emptyCartMessage.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (emptyVisible) return true;

    const itemCount = await this.getCartItemCount();
    return itemCount === 0;
  }

  /**
   * Get number of items in cart
   */
  async getCartItemCount(): Promise<number> {
    try {
      const count = await this.cartItemRow.count();
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Get cart items details
   */
  async getCartItems(): Promise<CartItem[]> {
    const items: CartItem[] = [];
    const count = await this.getCartItemCount();

    for (let i = 0; i < count; i++) {
      const row = this.cartItemRow.nth(i);
      const name = await row.locator(this.cartItemName.first()).textContent().catch(() => '') || '';
      const price = await row.locator(this.cartItemPrice.first()).textContent().catch(() => '') || '';
      const quantityValue = await row.locator('input[name="quantity"]').inputValue().catch(() => '1');

      items.push({
        name: name.trim(),
        quantity: parseInt(quantityValue, 10) || 1,
        price: price.trim(),
      });
    }

    return items;
  }

  /**
   * Update quantity of a cart item
   */
  async updateQuantity(itemIndex: number, quantity: number): Promise<void> {
    const row = this.cartItemRow.nth(itemIndex);
    const quantityInput = row.locator('input[name="quantity"], .quantity-input');

    await quantityInput.fill(quantity.toString());

    // Click update if button exists
    const updateButton = row.locator('button:has-text("Update")');
    const hasUpdate = await updateButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasUpdate) {
      await updateButton.click();
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemIndex: number): Promise<void> {
    const row = this.cartItemRow.nth(itemIndex);
    const removeButton = row.locator(this.cartItemRemove.first());

    await removeButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Get cart subtotal
   */
  async getSubtotal(): Promise<string> {
    try {
      return await this.subtotalDisplay.first().textContent() || '';
    } catch {
      return '';
    }
  }

  /**
   * Get cart total
   */
  async getTotal(): Promise<string> {
    try {
      return await this.totalDisplay.first().textContent() || '';
    } catch {
      return '';
    }
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(code: string): Promise<void> {
    const hasInput = await this.promoCodeInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasInput) return;

    await this.promoCodeInput.fill(code);
    await this.applyPromoCodeButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.first().click({ timeout: this.config.timeouts.addToCartAction });
    await this.page.waitForURL(/\/(checkout|secure)/, { timeout: this.config.timeouts.navigationTimeout });
  }

  /**
   * Check if on cart page
   */
  async isCartPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/cart');
  }
}
