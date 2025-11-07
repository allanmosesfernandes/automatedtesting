import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

/**
 * This script performs a one-time Facebook OAuth login and saves the authentication state.
 * Run this script manually when you need to refresh the Facebook auth state.
 *
 * Usage: npx playwright test tests/auth-setup/facebook-auth.setup.ts --headed
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'https://qa.printerpix.com';
  const browser = await chromium.launch({ headless: false }); // Use headed mode for OAuth
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Starting Facebook OAuth setup...');
    console.log('📍 Navigating to login page...');

    // Navigate to login page
    await page.goto(`${baseURL}/login/signin/`);

    // Click on "Sign in with Facebook" button
    console.log('🔘 Clicking Facebook sign-in button...');
    await page.click('button:has-text("Facebook"), a:has-text("Facebook")');

    // Wait for Facebook OAuth popup/redirect
    console.log('⏳ Waiting for Facebook login page...');

    // Manual intervention required here - user needs to log in
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('   Please complete the Facebook login in the browser window');
    console.log('   The script will wait for you to complete authentication...\n');

    // Wait for successful redirect back to the site (adjust URL pattern as needed)
    await page.waitForURL(/\/(account|dashboard|home|$)/, { timeout: 120000 }); // 2 minutes timeout

    console.log('✅ Login successful! Saving authentication state...');

    // Save the authentication state
    const authStatePath = path.join(__dirname, '../fixtures/auth-states/facebook-auth.json');
    await context.storageState({ path: authStatePath });

    console.log(`💾 Authentication state saved to: ${authStatePath}`);
    console.log('✨ Facebook OAuth setup complete!');

  } catch (error) {
    console.error('❌ Error during Facebook OAuth setup:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
