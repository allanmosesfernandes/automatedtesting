/**
 * Simple Navigation Screenshot Test
 *
 * This test clicks through 3 specific navigation links in sequence:
 * 1. Early Black Friday
 * 2. Calendars
 * 3. Gifts
 *
 * For each page, it:
 * - Navigates to the page
 * - Waits for content to load
 * - Validates content
 * - Takes a screenshot
 */

import { test, expect } from '@playwright/test';
import { NavigationPage } from '../../pages/NavigationPage';
import { isContentLoaded } from '../../helpers/navigation-monitor-helper';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://qa.printerpix.co.uk';

// The 3 links to test
const LINKS_TO_TEST = [
  {
    name: 'Early Black Friday',
    url: '/photo-gifts/black-friday-special/'
  },
  {
    name: 'Calendars',
    url: '/photo-calendars/'
  },
  {
    name: 'Gifts',
    url: '/photo-gifts/personalised-gifts-q/'
  }
];

test.describe('Simple Navigation Screenshot Test', () => {
  test('Click through 3 links and take screenshots', async ({ page }) => {
    const navPage = new NavigationPage(page);
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'simple-screenshots');

    // Ensure screenshots directory exists
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    console.log('\n🔍 Starting Simple Navigation Test');
    console.log(`📂 Screenshots will be saved to: ${screenshotsDir}`);
    console.log('');

    // Navigate to homepage first
    console.log('🏠 Navigating to homepage...');
    await navPage.goToHomepage(BASE_URL);
    console.log('✅ Homepage loaded');
    console.log('');

    // Test each link sequentially
    for (const link of LINKS_TO_TEST) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📍 Testing: ${link.name}`);
      console.log(`🔗 URL: ${link.url}`);

      // Navigate to the link
      console.log(`  ⏳ Navigating...`);
      await navPage.navigateToLink(link, BASE_URL);
      console.log(`  ✅ Navigation complete`);

      // Validate content loaded
      console.log(`  ⏳ Validating content...`);
      const contentResult = await isContentLoaded(page);

      if (contentResult.loaded) {
        console.log(`  ✅ Content validation: PASSED`);
      } else {
        console.log(`  ❌ Content validation: FAILED`);
        console.log(`  📝 Error: ${contentResult.errorDetails}`);
      }

      // Take screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = link.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const screenshotPath = path.join(screenshotsDir, `${sanitizedName}-${timestamp}.png`);

      console.log(`  📸 Taking screenshot...`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`  ✅ Screenshot saved: ${path.basename(screenshotPath)}`);

      // Assert that content loaded
      expect(contentResult.loaded, `${link.name} should load successfully: ${contentResult.errorDetails}`).toBe(true);

      console.log('');

      // Wait a bit between pages
      await page.waitForTimeout(1000);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All 3 pages tested successfully!');
    console.log(`📂 Screenshots location: ${screenshotsDir}`);
    console.log('');
  });
});
