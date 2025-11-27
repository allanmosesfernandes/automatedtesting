/**
 * Checkout Module
 *
 * Handles the checkout flow from upsells through to payment page.
 * Reusable across all product test flows.
 */

import { Page, expect } from '@playwright/test';
import * as path from 'path';
import { assertPageHealthy, assertElementVisible } from '../helpers/health-check';

export interface CheckoutResult {
  success: boolean;
  upsellsSkipped: number;
  reachedPayment: boolean;
  screenshots: string[];
}

/**
 * Handle upsell pages - skip all by clicking skip buttons
 * Supports multiple button types:
 * - "Keep As Is" (Photo Books)
 * - "No, thank you" with id="no-change-prod" (Calendars)
 */
export async function handleUpsellPages(page: Page): Promise<number> {
  console.log('Checkout: Handling upsell pages...');

  let upsellCount = 0;
  const maxUpsells = 15; // Safety limit

  while (!page.url().includes('/cart') && upsellCount < maxUpsells) {
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Check if we've reached the cart
    if (page.url().includes('/cart')) {
      console.log('  Reached cart page');
      break;
    }

    // Try to find and click skip button (various types)
    try {
      const clicked = await page.evaluate(() => {
        // Try "No, thank you" button first (Calendars)
        const noThanksBtn = document.getElementById('no-change-prod');
        if (noThanksBtn) {
          (noThanksBtn as HTMLElement).click();
          return 'no-thanks';
        }

        // Try "Keep As Is" button (Photo Books)
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('Keep As Is')) {
            (btn as HTMLElement).click();
            return 'keep-as-is';
          }
        }
        return false;
      });

      if (clicked) {
        upsellCount++;
        console.log(`  Skipped upsell ${upsellCount} (${clicked})`);
        await page.waitForTimeout(1500);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  console.log(`  Handled ${upsellCount} upsell pages`);
  return upsellCount;
}

/**
 * Complete checkout flow from cart to payment page
 */
export async function completeCheckoutFlow(
  page: Page,
  region: string,
  resultsDir = 'test-results/checkout'
): Promise<CheckoutResult> {
  console.log(`\n=== CHECKOUT MODULE ===`);

  const screenshots: string[] = [];
  let upsellsSkipped = 0;

  // Step 1: Verify cart page
  console.log('Checkout Step 1: Verifying cart page...');
  await page.waitForURL(/.*\/cart.*/, { timeout: 30000 });
  await assertPageHealthy(page, 'Cart Page');
  expect(page.url()).toContain('/cart');

  // Verify cart has items
  await assertElementVisible(page, '.cart-item, .cart_item, [data-testid="cart-item"]', 'Cart items');
  console.log('  Cart page verified');

  // Screenshot cart
  const cartScreenshot = path.join(resultsDir, `cart-${region}-${Date.now()}.png`);
  await page.screenshot({ path: cartScreenshot, fullPage: true });
  screenshots.push(cartScreenshot);
  console.log(`  Cart screenshot saved`);

  // Step 2: Click "Begin Checkout"
  console.log('Checkout Step 2: Clicking Begin Checkout...');
  const beginCheckoutButton = page.locator('.cta_cart--begin-checkout');
  await beginCheckoutButton.waitFor({ state: 'visible', timeout: 15000 });
  await beginCheckoutButton.click();
  console.log('  Begin Checkout clicked');

  // Step 3: Wait for shipping page
  console.log('Checkout Step 3: Waiting for shipping page...');
  await page.waitForURL(/.*\/cart\/shipping.*/, { timeout: 20000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await assertPageHealthy(page, 'Shipping Page');
  expect(page.url()).toContain('/cart/shipping');

  // Verify shipping form is visible
  await assertElementVisible(page, '.button_shipping--continue-to-payment', 'Continue to Payment button');
  console.log('  Shipping page loaded');

  // Screenshot shipping
  const shippingScreenshot = path.join(resultsDir, `shipping-${region}-${Date.now()}.png`);
  await page.screenshot({ path: shippingScreenshot, fullPage: true });
  screenshots.push(shippingScreenshot);
  console.log(`  Shipping screenshot saved`);

  // Step 4: Click "Continue to Payment"
  console.log('Checkout Step 4: Clicking Continue to Payment...');
  const continueToPaymentButton = page.locator('.button_shipping--continue-to-payment');
  await continueToPaymentButton.waitFor({ state: 'visible', timeout: 15000 });
  await continueToPaymentButton.click();
  console.log('  Continue to Payment clicked');

  // Step 5: Verify payment page
  console.log('Checkout Step 5: Waiting for payment page...');
  await page.waitForURL(/.*\/cart\/payment.*/, { timeout: 20000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await assertPageHealthy(page, 'Payment Page');
  expect(page.url()).toContain('/cart/payment');
  console.log('  Payment page loaded');

  // Screenshot payment
  const paymentScreenshot = path.join(resultsDir, `payment-${region}-${Date.now()}.png`);
  await page.screenshot({ path: paymentScreenshot, fullPage: true });
  screenshots.push(paymentScreenshot);
  console.log(`  Payment screenshot saved`);

  console.log(`=== CHECKOUT COMPLETE ===\n`);

  return {
    success: true,
    upsellsSkipped,
    reachedPayment: true,
    screenshots,
  };
}
