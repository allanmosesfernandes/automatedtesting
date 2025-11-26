/**
 * Cart Checkout Flow Tests
 *
 * Tests the complete checkout flow: Product -> Cart -> Checkout (stop before payment)
 * This test validates the entire user journey without actually making a payment.
 *
 * Usage:
 *   TEST_REGION=GB npx playwright test cart-checkout/cart-checkout-flow.spec.ts
 *   TEST_REGION=US npx playwright test cart-checkout/cart-checkout-flow.spec.ts
 *
 * Prerequisites:
 *   Run session-setup.spec.ts first to create authenticated session
 */

import { test, expect } from '@playwright/test';
import { ProductPage } from '../../pages/ProductPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { dismissCookieConsent } from '../../helpers/cookie-consent-handler';
import {
  loadProductsForRegion,
  getShippingAddressForRegion,
  buildProductUrl,
  type ProductTestData,
} from '../../helpers/test-data-loader';
import { getCartCheckoutTestConfig, type CartCheckoutTestResult } from '../../config/cart-checkout-test-config';
import { getBaseUrl } from '../../config/environments';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const targetRegion = process.env.TEST_REGION || 'GB';
const config = getCartCheckoutTestConfig();

// Load test data
let products: ProductTestData[] = [];
let testAddress: ReturnType<typeof getShippingAddressForRegion>;

try {
  products = loadProductsForRegion(targetRegion);
  testAddress = getShippingAddressForRegion(targetRegion);
} catch (error) {
  console.error(`Failed to load test data for region ${targetRegion}:`, error);
}

// Use saved session for the target region
const sessionPath = `.auth/cart-session-${targetRegion.toLowerCase()}.json`;

// Check if session exists, if not skip session usage
const sessionExists = fs.existsSync(sessionPath);
if (sessionExists) {
  test.use({ storageState: sessionPath });
} else {
  console.warn(`No session file found at ${sessionPath}. Tests will run without pre-authenticated session.`);
}

// Test results collection
const testResults: CartCheckoutTestResult[] = [];

test.describe(`Cart Checkout Flow - ${targetRegion}`, () => {
  test.beforeAll(() => {
    // Ensure results directory exists
    const resultsDir = config.paths.resultsDir;
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    if (!fs.existsSync(config.paths.screenshotsDir)) {
      fs.mkdirSync(config.paths.screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Dismiss popups before each test
    await dismissCookieConsent(page, 3000);
    await dismissKlaviyoPopup(page, 3000);
  });

  test.afterAll(() => {
    // Save test results summary
    const summaryPath = path.join(config.paths.reportsDir, `checkout-results-${targetRegion}-${Date.now()}.json`);

    if (!fs.existsSync(config.paths.reportsDir)) {
      fs.mkdirSync(config.paths.reportsDir, { recursive: true });
    }

    const summary = {
      region: targetRegion,
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      passed: testResults.filter(r => r.success).length,
      failed: testResults.filter(r => !r.success).length,
      results: testResults,
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Test results saved to: ${summaryPath}`);
  });

  // Skip all tests if no products loaded
  test.skip(products.length === 0, `No products found for region ${targetRegion}`);

  // Generate tests for each product (limited by batchSize)
  const productsToTest = products.slice(0, config.batchSize);

  for (let index = 0; index < productsToTest.length; index++) {
    const product = productsToTest[index];

    test(`[${index + 1}/${productsToTest.length}] ${product.name} - Full checkout flow`, async ({ page }) => {
      const startTime = Date.now();
      const result: CartCheckoutTestResult = {
        productUrl: product.url,
        productName: product.name,
        region: targetRegion,
        index: index + 1,
        success: false,
        timestamp: new Date().toISOString(),
        duration: 0,
        checkpoints: {
          productPageLoaded: false,
          addedToCart: false,
          cartPageLoaded: false,
          checkoutPageLoaded: false,
          shippingFormFilled: false,
          shippingMethodSelected: false,
          stoppedBeforePayment: false,
        },
      };

      try {
        const baseUrl = getBaseUrl(targetRegion, 'live');
        const fullProductUrl = `${baseUrl}${product.url}`;

        // Initialize page objects
        const productPage = new ProductPage(page, targetRegion);
        const cartPage = new CartPage(page, targetRegion);
        const checkoutPage = new CheckoutPage(page, targetRegion);

        // Step 1: Navigate to product page
        console.log(`Step 1: Navigating to ${product.name}...`);
        await productPage.goto(fullProductUrl);
        await productPage.waitForProductPageLoad();
        result.checkpoints.productPageLoaded = true;
        console.log('  Product page loaded');

        // Check if this is a designer product or direct add-to-cart
        const hasDirectCart = await productPage.hasDirectAddToCart();
        const hasDesigner = await productPage.hasDesignerFlow();

        if (hasDirectCart) {
          // Step 2: Add to cart (direct)
          console.log('Step 2: Adding to cart (direct)...');
          await productPage.addToCart();
          result.checkpoints.addedToCart = true;
          console.log('  Added to cart');
        } else if (hasDesigner) {
          // For designer products, we need to go through the design flow first
          // This is a simplified version - actual implementation may need to handle designer flow
          console.log('Step 2: Product requires designer flow - attempting to navigate to cart...');
          // Try to navigate directly to cart if there's already an item
          // Or mark as needing manual intervention
          result.error = {
            type: 'DESIGNER_FLOW_REQUIRED',
            message: 'This product requires going through the designer flow',
            checkpoint: 'addedToCart',
          };
          // Still try to proceed to cart page
        } else {
          console.log('Step 2: No add-to-cart button found, checking cart...');
        }

        // Step 3: Navigate to cart
        console.log('Step 3: Navigating to cart...');
        await productPage.goToCart();
        await cartPage.waitForCartLoad();
        result.checkpoints.cartPageLoaded = true;
        console.log('  Cart page loaded');

        // Verify cart has items
        const cartItemCount = await cartPage.getCartItemCount();
        const isCartEmpty = await cartPage.isCartEmpty();

        if (isCartEmpty || cartItemCount === 0) {
          console.log('  Cart is empty - skipping checkout steps');
          result.error = {
            type: 'EMPTY_CART',
            message: 'Cart is empty after adding product',
            checkpoint: 'cartPageLoaded',
          };
        } else {
          console.log(`  Cart has ${cartItemCount} item(s)`);
          result.checkpoints.addedToCart = true;

          // Step 4: Proceed to checkout
          console.log('Step 4: Proceeding to checkout...');
          await cartPage.proceedToCheckout();
          await checkoutPage.waitForCheckoutLoad();
          result.checkpoints.checkoutPageLoaded = true;
          console.log('  Checkout page loaded');

          // Step 5: Fill shipping address
          console.log('Step 5: Filling shipping address...');
          await checkoutPage.fillShippingAddress(testAddress);
          result.checkpoints.shippingFormFilled = true;
          console.log('  Shipping address filled');

          // Step 6: Select shipping method
          console.log('Step 6: Selecting shipping method...');
          await checkoutPage.selectShippingMethod(0);
          result.checkpoints.shippingMethodSelected = true;
          console.log('  Shipping method selected');

          // Step 7: STOP before payment and validate
          console.log('Step 7: Validating checkout state (stopping before payment)...');
          const validationResult = await checkoutPage.stopBeforePayment();
          result.checkpoints.stoppedBeforePayment = true;
          console.log('  Checkout validation complete');

          if (validationResult.success) {
            result.success = true;
            console.log('  SUCCESS: Checkout flow completed successfully');
          } else {
            result.error = {
              type: 'VALIDATION_FAILED',
              message: validationResult.errors.join('; '),
              checkpoint: 'stoppedBeforePayment',
            };
            console.log(`  FAILED: ${result.error.message}`);
          }
        }
      } catch (error: any) {
        // Capture error details
        result.error = {
          type: error.name || 'UNKNOWN_ERROR',
          message: error.message || 'Unknown error occurred',
          checkpoint: getLastPassedCheckpoint(result.checkpoints),
        };

        // Take error screenshot
        const screenshotPath = path.join(
          config.paths.screenshotsDir,
          `error-${targetRegion}-${index + 1}-${Date.now()}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        result.screenshotPath = screenshotPath;

        console.error(`Error at checkpoint ${result.error.checkpoint}: ${error.message}`);
      } finally {
        result.duration = Date.now() - startTime;
        testResults.push(result);
      }

      // Assert success
      expect(result.success, `Checkout flow failed: ${result.error?.message || 'Unknown error'}`).toBe(true);
    });
  }
});

/**
 * Helper to get the last passed checkpoint
 */
function getLastPassedCheckpoint(checkpoints: CartCheckoutTestResult['checkpoints']): string {
  const checkpointOrder = [
    'stoppedBeforePayment',
    'shippingMethodSelected',
    'shippingFormFilled',
    'checkoutPageLoaded',
    'cartPageLoaded',
    'addedToCart',
    'productPageLoaded',
  ];

  for (const checkpoint of checkpointOrder) {
    if (checkpoints[checkpoint as keyof typeof checkpoints]) {
      return checkpoint;
    }
  }

  return 'none';
}
