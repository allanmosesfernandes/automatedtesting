import { Page, Locator } from '@playwright/test';
import { getRegion, type RegionConfig } from '../config/regions';
import { getTestConfig } from '../config/environments';
import { getCartCheckoutTestConfig } from '../config/cart-checkout-test-config';
import { dismissKlaviyoPopup } from '../helpers/popup-handler';
import { dismissCookieConsent } from '../helpers/cookie-consent-handler';

/**
 * Page Object for Product page interactions
 * Handles product viewing and add-to-cart functionality
 */
export class ProductPage {
  readonly page: Page;
  readonly region: RegionConfig;
  readonly config = getCartCheckoutTestConfig();

  // Product page locators
  readonly addToCartButton: Locator;
  readonly buyNowButton: Locator;
  readonly startDesignButton: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly quantityInput: Locator;
  readonly sizeSelector: Locator;

  // Cart interaction locators
  readonly cartIcon: Locator;
  readonly cartCount: Locator;
  readonly miniCartPopup: Locator;
  readonly viewCartButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page, regionCode?: string) {
    this.page = page;

    // Get region configuration - use provided regionCode or derive from page URL
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

    // Product page selectors - multiple fallbacks for different product types
    this.addToCartButton = page.locator([
      'button:has-text("Add to Cart")',
      'button:has-text("Add to Basket")',
      '[data-testid="add-to-cart"]',
      '.add-to-cart-button',
    ].join(', '));

    this.buyNowButton = page.locator([
      'button:has-text("Buy Now")',
      'button:has-text("Buy")',
      '[data-testid="buy-now"]',
    ].join(', '));

    this.startDesignButton = page.locator([
      'button:has-text("Start")',
      'button:has-text("Create Now")',
      'button:has-text("Design Now")',
      'a:has-text("Start")',
      'a:has-text("Create Now")',
      '[data-testid="start-design"]',
    ].join(', '));

    this.productTitle = page.locator('h1, [data-testid="product-title"]');
    this.productPrice = page.locator('.price, [data-testid="product-price"], .product-price');
    this.quantityInput = page.locator('input[name="quantity"], input[type="number"], [data-testid="quantity"]');
    this.sizeSelector = page.locator('select[name="size"], [data-testid="size-selector"]');

    // Cart locators
    this.cartIcon = page.locator('[href="/cart"], [data-testid="cart-icon"], .cart-icon, a[aria-label*="cart"]');
    this.cartCount = page.locator('[data-testid="cart-count"], .cart-count, .cart-badge');
    this.miniCartPopup = page.locator('[data-testid="mini-cart"], .mini-cart, .cart-popup');
    this.viewCartButton = page.locator('a:has-text("View Cart"), button:has-text("View Cart"), [data-testid="view-cart"]');
    this.checkoutButton = page.locator('a:has-text("Checkout"), button:has-text("Checkout"), [data-testid="checkout"]');
  }

  /**
   * Navigate to a product page
   */
  async goto(productUrl: string): Promise<void> {
    // Handle relative vs absolute URLs
    if (productUrl.startsWith('http')) {
      await this.page.goto(productUrl, { timeout: this.config.timeouts.navigationTimeout });
    } else {
      await this.page.goto(productUrl, { timeout: this.config.timeouts.navigationTimeout });
    }

    // Dismiss popups after navigation
    await this.dismissPopups();
  }

  /**
   * Dismiss cookie consent and Klaviyo popups
   */
  async dismissPopups(): Promise<void> {
    await dismissCookieConsent(this.page, 5000);
    await dismissKlaviyoPopup(this.page, 5000);
  }

  /**
   * Wait for product page to load
   */
  async waitForProductPageLoad(): Promise<void> {
    // Wait for either add to cart button or start design button
    await Promise.race([
      this.addToCartButton.first().waitFor({ state: 'visible', timeout: this.config.timeouts.productPageLoad }).catch(() => {}),
      this.startDesignButton.first().waitFor({ state: 'visible', timeout: this.config.timeouts.productPageLoad }).catch(() => {}),
      this.buyNowButton.first().waitFor({ state: 'visible', timeout: this.config.timeouts.productPageLoad }).catch(() => {}),
    ]);
  }

  /**
   * Check if this is a product page with direct add-to-cart
   */
  async hasDirectAddToCart(): Promise<boolean> {
    return await this.addToCartButton.first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Check if this is a designer product (requires going through design flow)
   */
  async hasDesignerFlow(): Promise<boolean> {
    return await this.startDesignButton.first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Add product to cart (for products with direct add-to-cart)
   */
  async addToCart(): Promise<void> {
    await this.addToCartButton.first().click({ timeout: this.config.timeouts.addToCartAction });
    await this.waitForCartUpdate();
  }

  /**
   * Click start design button (for designer products)
   */
  async startDesign(): Promise<void> {
    await this.startDesignButton.first().click({ timeout: this.config.timeouts.addToCartAction });
  }

  /**
   * Set product quantity
   */
  async setQuantity(quantity: number): Promise<void> {
    const isVisible = await this.quantityInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.quantityInput.fill(quantity.toString());
    }
  }

  /**
   * Select product size if available
   */
  async selectSize(size: string): Promise<void> {
    const isVisible = await this.sizeSelector.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await this.sizeSelector.selectOption(size);
    }
  }

  /**
   * Wait for cart to update after adding item
   */
  async waitForCartUpdate(): Promise<void> {
    // Wait for either cart count to update or mini cart to appear
    await Promise.race([
      this.cartCount.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.miniCartPopup.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.page.waitForTimeout(3000),
    ]);
  }

  /**
   * Get current cart count
   */
  async getCartCount(): Promise<number> {
    try {
      const isVisible = await this.cartCount.isVisible({ timeout: 3000 });
      if (isVisible) {
        const text = await this.cartCount.textContent();
        const count = parseInt(text || '0', 10);
        return isNaN(count) ? 0 : count;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Navigate to cart page via cart icon
   */
  async goToCart(): Promise<void> {
    await this.cartIcon.first().click({ timeout: this.config.timeouts.addToCartAction });
    await this.page.waitForURL(/\/cart/, { timeout: this.config.timeouts.navigationTimeout });
  }

  /**
   * Get product title
   */
  async getProductTitle(): Promise<string> {
    return await this.productTitle.first().textContent() || '';
  }

  /**
   * Get product price
   */
  async getProductPrice(): Promise<string> {
    try {
      return await this.productPrice.first().textContent() || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if on a product page
   */
  async isProductPage(): Promise<boolean> {
    const hasAddToCart = await this.hasDirectAddToCart();
    const hasDesigner = await this.hasDesignerFlow();
    const hasBuyNow = await this.buyNowButton.first().isVisible({ timeout: 3000 }).catch(() => false);

    return hasAddToCart || hasDesigner || hasBuyNow;
  }
}
