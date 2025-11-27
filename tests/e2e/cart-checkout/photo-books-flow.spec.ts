/**
 * Photo Books - Full E2E Flow Test
 *
 * Uses modular architecture:
 * - auth.module.ts: Login, cookies, popups
 * - photo-books.module.ts: Product-specific designer flow
 * - checkout.module.ts: Cart → Shipping → Payment
 *
 * Usage:
 *   npm run test:photobooks:gb   # UK site
 *   npm run test:photobooks:us   # US site
 *
 * Results saved to: test-results/photo-books/
 */

import { test, expect } from '@playwright/test';
import { authenticateUser } from '../../modules/auth.module';
import { runPhotoBookFlow } from '../../modules/products/photo-books.module';
import { completeCheckoutFlow } from '../../modules/checkout.module';
import * as fs from 'fs';

// Configuration
const targetRegion = process.env.TEST_REGION || 'GB';
const RESULTS_DIR = 'test-results/photo-books';

test.describe(`Photo Books E2E Flow - ${targetRegion}`, () => {
  // 5 minute timeout for full flow
  test.setTimeout(300000);

  test.beforeAll(() => {
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
  });

  test('Complete flow: Login → Designer → Cart → Payment', async ({ page }) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`PHOTO BOOKS E2E TEST - ${targetRegion}`);
    console.log(`${'='.repeat(50)}\n`);

    // ========== PHASE 1: AUTHENTICATION ==========
    const authResult = await authenticateUser(page, targetRegion);
    expect(authResult.success).toBe(true);

    // ========== PHASE 2: PRODUCT FLOW ==========
    const productResult = await runPhotoBookFlow(page, targetRegion, RESULTS_DIR);
    expect(productResult.success).toBe(true);
    expect(productResult.reachedCart).toBe(true);

    // ========== PHASE 3: CHECKOUT ==========
    const checkoutResult = await completeCheckoutFlow(page, targetRegion, RESULTS_DIR);
    expect(checkoutResult.success).toBe(true);
    expect(checkoutResult.reachedPayment).toBe(true);

    // ========== SUCCESS ==========
    console.log(`\n${'='.repeat(50)}`);
    console.log(`SUCCESS: Photo Books E2E Complete for ${targetRegion}`);
    console.log(`  - Upsells skipped: ${productResult.upsellsSkipped}`);
    console.log(`  - Screenshots: ${productResult.screenshots.length + checkoutResult.screenshots.length}`);
    console.log(`${'='.repeat(50)}\n`);
  });
});
