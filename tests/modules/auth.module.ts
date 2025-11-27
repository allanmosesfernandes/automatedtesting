/**
 * Authentication Module
 *
 * Handles login, cookie consent, and popup dismissal.
 * Reusable across all product test flows.
 */

import { Page, expect } from '@playwright/test';
import { dismissCookieConsent } from '../helpers/cookie-consent-handler';
import { dismissKlaviyoPopup } from '../helpers/popup-handler';
import { LoginPage } from '../pages/LoginPage';
import { getBaseUrl } from '../config/environments';

/**
 * Get credentials from environment variables or use defaults
 * For CI/CD, set TEST_USER_EMAIL and TEST_USER_PASSWORD secrets
 */
function getCredentials() {
  return {
    email: process.env.TEST_USER_EMAIL || 'allan.fernandes@printerpix.co.uk',
    password: process.env.TEST_USER_PASSWORD || 'All@in1234*',
  };
}

// Default credentials (for backward compatibility)
const DEFAULT_CREDENTIALS = getCredentials();

export interface AuthResult {
  success: boolean;
  baseUrl: string;
  region: string;
}

/**
 * Authenticate user - handles full login flow including popups
 */
export async function authenticateUser(
  page: Page,
  region: string,
  credentials = DEFAULT_CREDENTIALS
): Promise<AuthResult> {
  const baseUrl = getBaseUrl(region, 'live');
  console.log(`\n=== AUTH MODULE ===`);
  console.log(`Region: ${region} | Site: ${baseUrl}`);

  // Step 1: Navigate to homepage
  console.log('Auth Step 1: Navigating to homepage...');
  await page.goto(baseUrl, { timeout: 30000 });
  console.log('  Homepage loaded');

  // Step 2: Dismiss popups
  console.log('Auth Step 2: Dismissing popups...');
  await dismissCookieConsent(page, 5000);
  await dismissKlaviyoPopup(page, 5000);
  console.log('  Popups dismissed');

  // Step 3: Navigate to login page
  console.log('Auth Step 3: Navigating to login page...');
  await page.goto(`${baseUrl}/login/signin/`, { timeout: 30000 });

  // Dismiss popups again after navigation
  await dismissCookieConsent(page, 3000);
  await dismissKlaviyoPopup(page, 3000);
  console.log('  Login page loaded');

  // Step 4: Login
  console.log('Auth Step 4: Logging in...');
  const loginPage = new LoginPage(page, region);
  await loginPage.signIn(credentials.email, credentials.password);

  // Wait for login to complete
  try {
    await loginPage.waitForSuccessfulLogin();
    console.log('  Login successful (redirected)');
  } catch {
    // Fallback: check if user greeting is visible
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn, 'User should be logged in').toBe(true);
    console.log('  Login successful (greeting visible)');
  }

  console.log(`=== AUTH COMPLETE ===\n`);

  return {
    success: true,
    baseUrl,
    region,
  };
}

/**
 * Dismiss all popups on current page
 */
export async function dismissPopups(page: Page, timeout = 3000): Promise<void> {
  await dismissCookieConsent(page, timeout);
  await dismissKlaviyoPopup(page, timeout);
}
