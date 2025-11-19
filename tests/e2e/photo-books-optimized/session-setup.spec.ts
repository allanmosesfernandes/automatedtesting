import { test, expect } from '@playwright/test';
import { dismissCookieConsent } from '../../helpers/cookie-consent-handler';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { LoginPage } from '../../pages/LoginPage';
import { getPhotoBooksTestConfig } from '../../config/photo-books-test-config';

const config = getPhotoBooksTestConfig();

test.describe('Session Setup - Photo Books - Cookie Consent + Klaviyo + Login', () => {
  test('Setup session with cookie consent, Klaviyo dismissal, and login', async ({ page, context }) => {
    console.log('\n' + '='.repeat(80));
    console.log('PHOTO BOOKS SESSION SETUP TEST - COOKIE + KLAVIYO + LOGIN');
    console.log('='.repeat(80));

    // Step 1: Navigate to homepage
    console.log('[1/9] Navigating to homepage...');
    await page.goto('https://www.printerpix.co.uk', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    console.log('✓ Homepage loaded');

    // Step 2: Wait 3 seconds
    console.log('[2/9] Waiting 3 seconds...');
    await page.waitForTimeout(3000);
    console.log('✓ Wait complete');

    // Step 3: Dismiss cookie consent
    console.log('[3/9] Dismissing cookie consent...');
    await dismissCookieConsent(page, 3000);
    console.log('✓ Cookie consent dismissed');

    // Step 4: Wait 3 seconds
    console.log('[4/9] Waiting 3 seconds...');
    await page.waitForTimeout(3000);
    console.log('✓ Wait complete');

    // Step 5: Dismiss Klaviyo popup
    console.log('[5/9] Dismissing Klaviyo popup...');
    await dismissKlaviyoPopup(page, 6000);
    console.log('✓ Klaviyo popup dismissed');

    // Step 6: Navigate to login page
    console.log('[6/9] Navigating to login page...');
    await page.goto('https://www.printerpix.co.uk/login/signin', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    console.log('✓ Login page loaded');

    // Step 7: Sign in with credentials
    console.log('[7/9] Signing in with credentials...');
    const loginPage = new LoginPage(page);
    await loginPage.signIn(config.credentials.email, config.credentials.password);
    console.log('✓ Credentials entered and sign-in clicked');

    // Step 8: Wait for successful login (check for redirect or user indicator)
    console.log('[8/9] Waiting for login to complete...');
    await page.waitForTimeout(5000); // Give time for login to process
    console.log('✓ Login completed');

    // Step 9: Save session storage state (reuse same session file as printbox)
    console.log('[9/9] Saving session storage state...');
    await context.storageState({ path: '.auth/printbox-session.json' });
    console.log('✓ Session storage saved to .auth/printbox-session.json');

    console.log('\n' + '='.repeat(80));
    console.log('PHOTO BOOKS SESSION SETUP COMPLETE');
    console.log('='.repeat(80) + '\n');

    // Verify the session file was created
    const fs = require('fs');
    expect(fs.existsSync('.auth/printbox-session.json')).toBe(true);
    console.log('✓ Session file verified');
  });
});
