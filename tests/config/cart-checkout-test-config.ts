/**
 * Configuration for Cart Checkout flow validation tests
 */

export interface CartCheckoutTestConfig {
  // Batch configuration
  batchStart: number;
  batchSize: number;

  // Timeouts (in milliseconds)
  timeouts: {
    productPageLoad: number;
    addToCartAction: number;
    cartPageLoad: number;
    checkoutPageLoad: number;
    formFillTimeout: number;
    navigationTimeout: number;
  };

  // Credentials
  credentials: {
    email: string;
    password: string;
  };

  // Paths
  paths: {
    productsDir: string;
    checkoutDataFile: string;
    resultsDir: string;
    screenshotsDir: string;
    reportsDir: string;
  };

  // Validation settings
  validation: {
    verifyCartItemAdded: boolean;
    verifyCheckoutFormFilled: boolean;
    captureScreenshotOnFailure: boolean;
    stopBeforePayment: boolean;
  };

  // Selectors (can be overridden per region if needed)
  selectors: {
    // Product page selectors
    addToCartButton: string;
    cartIcon: string;
    cartCount: string;

    // Cart page selectors
    cartItems: string;
    cartItemRow: string;
    proceedToCheckoutButton: string;
    emptyCartMessage: string;

    // Checkout page selectors
    checkoutForm: string;
    firstNameInput: string;
    lastNameInput: string;
    emailInput: string;
    phoneInput: string;
    addressLine1Input: string;
    addressLine2Input: string;
    cityInput: string;
    stateInput: string;
    postalCodeInput: string;
    countrySelect: string;
    shippingMethodOptions: string;
    orderSummary: string;
    paymentSection: string;
  };
}

/**
 * Get test configuration from environment variables with defaults
 */
export function getCartCheckoutTestConfig(): CartCheckoutTestConfig {
  const batchStart = parseInt(process.env.BATCH_START || '1', 10);
  const batchSize = parseInt(process.env.BATCH_SIZE || '5', 10);

  return {
    batchStart,
    batchSize,

    timeouts: {
      productPageLoad: 30000,     // 30 seconds for product page
      addToCartAction: 15000,     // 15 seconds for add to cart
      cartPageLoad: 20000,        // 20 seconds for cart page
      checkoutPageLoad: 30000,    // 30 seconds for checkout page
      formFillTimeout: 10000,     // 10 seconds per form field
      navigationTimeout: 45000,   // 45 seconds default navigation
    },

    credentials: {
      email: process.env.TEST_USER_EMAIL || 'allan.fernandes@printerpix.co.uk',
      password: process.env.TEST_USER_PASSWORD || 'All@in1234*',
    },

    paths: {
      productsDir: 'tests/data/cart-checkout',
      checkoutDataFile: 'tests/data/cart-checkout/checkout-data.json',
      resultsDir: 'test-results/cart-checkout',
      screenshotsDir: 'test-results/cart-checkout/screenshots',
      reportsDir: 'test-results/cart-checkout/reports',
    },

    validation: {
      verifyCartItemAdded: true,
      verifyCheckoutFormFilled: true,
      captureScreenshotOnFailure: true,
      stopBeforePayment: true,  // Critical: never click payment button
    },

    // Default selectors - these may need to be refined based on actual site structure
    // The site uses Qwik framework, so selectors might need data-* attributes
    selectors: {
      // Product page selectors
      addToCartButton: 'button:has-text("Add to Cart"), button:has-text("Add to Basket"), [data-testid="add-to-cart"]',
      cartIcon: '[href="/cart"], [data-testid="cart-icon"], .cart-icon',
      cartCount: '[data-testid="cart-count"], .cart-count, .cart-badge',

      // Cart page selectors
      cartItems: '[data-testid="cart-items"], .cart-items, .cart-item-list',
      cartItemRow: '[data-testid="cart-item"], .cart-item, .cart-item-row',
      proceedToCheckoutButton: 'button:has-text("Checkout"), button:has-text("Proceed to Checkout"), [data-testid="checkout-button"]',
      emptyCartMessage: '[data-testid="empty-cart"], .empty-cart, :has-text("Your cart is empty")',

      // Checkout page selectors
      checkoutForm: 'form[data-testid="checkout-form"], .checkout-form, #checkout-form',
      firstNameInput: 'input[name="firstName"], input[name="first_name"], #firstName',
      lastNameInput: 'input[name="lastName"], input[name="last_name"], #lastName',
      emailInput: 'input[name="email"], input[type="email"], #email',
      phoneInput: 'input[name="phone"], input[name="telephone"], input[type="tel"], #phone',
      addressLine1Input: 'input[name="address1"], input[name="addressLine1"], input[name="street"], #address1',
      addressLine2Input: 'input[name="address2"], input[name="addressLine2"], #address2',
      cityInput: 'input[name="city"], #city',
      stateInput: 'input[name="state"], input[name="region"], select[name="state"], #state',
      postalCodeInput: 'input[name="postcode"], input[name="postalCode"], input[name="zip"], #postcode',
      countrySelect: 'select[name="country"], #country',
      shippingMethodOptions: '[data-testid="shipping-method"], .shipping-method, input[name="shipping_method"]',
      orderSummary: '[data-testid="order-summary"], .order-summary, #order-summary',
      paymentSection: '[data-testid="payment-section"], .payment-section, #payment-section',
    },
  };
}

/**
 * Cart Checkout test result interface
 */
export interface CartCheckoutTestResult {
  productUrl: string;
  productName: string;
  region: string;
  index: number;
  success: boolean;
  timestamp: string;
  duration: number;
  checkpoints: {
    productPageLoaded: boolean;
    addedToCart: boolean;
    cartPageLoaded: boolean;
    checkoutPageLoaded: boolean;
    shippingFormFilled: boolean;
    shippingMethodSelected: boolean;
    stoppedBeforePayment: boolean;
  };
  error?: {
    type: string;
    message: string;
    checkpoint: string;
  };
  screenshotPath?: string;
}

/**
 * Cart Checkout test summary interface
 */
export interface CartCheckoutTestSummary {
  region: string;
  totalTested: number;
  totalPassed: number;
  totalFailed: number;
  successRate: number;
  duration: number;
  timestamp: string;
  errorCategories: {
    [key: string]: number;
  };
}
