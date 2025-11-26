/**
 * Test Data Loader - Loads JSON config files per region for cart checkout tests
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Product test data interface
 */
export interface ProductTestData {
  id: string;
  name: string;
  category: string;
  url: string;
  hasDesigner?: boolean;
  expectedPrice?: string;
}

/**
 * Region products data interface
 */
export interface RegionProducts {
  region: string;
  baseUrl: string;
  products: ProductTestData[];
}

/**
 * Shipping address interface
 */
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Checkout test data interface
 */
export interface CheckoutTestData {
  credentials: {
    email: string;
    password: string;
  };
  testAddresses: Record<string, ShippingAddress>;
}

/**
 * Load products for a specific region
 *
 * @param regionCode - Region code (GB, US, DE, etc.)
 * @returns Array of product test data
 * @throws Error if file not found
 */
export function loadProductsForRegion(regionCode: string): ProductTestData[] {
  const filePath = path.join(
    process.cwd(),
    'tests',
    'data',
    'cart-checkout',
    `products-${regionCode.toLowerCase()}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Product data file not found for region: ${regionCode}. Expected path: ${filePath}`);
  }

  const data: RegionProducts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data.products;
}

/**
 * Load full region products data including base URL
 *
 * @param regionCode - Region code (GB, US, DE, etc.)
 * @returns Region products data with base URL
 */
export function loadRegionProductsData(regionCode: string): RegionProducts {
  const filePath = path.join(
    process.cwd(),
    'tests',
    'data',
    'cart-checkout',
    `products-${regionCode.toLowerCase()}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Product data file not found for region: ${regionCode}. Expected path: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Load checkout data (credentials and test addresses)
 *
 * @returns Checkout test data
 */
export function loadCheckoutData(): CheckoutTestData {
  const filePath = path.join(
    process.cwd(),
    'tests',
    'data',
    'cart-checkout',
    'checkout-data.json'
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Checkout data file not found. Expected path: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Get shipping address for a specific region
 *
 * @param regionCode - Region code (GB, US, DE, etc.)
 * @returns Shipping address for the region
 */
export function getShippingAddressForRegion(regionCode: string): ShippingAddress {
  const checkoutData = loadCheckoutData();
  const address = checkoutData.testAddresses[regionCode.toUpperCase()];

  if (!address) {
    throw new Error(`No shipping address configured for region: ${regionCode}`);
  }

  return address;
}

/**
 * Get test credentials
 *
 * @returns Test credentials (email and password)
 */
export function getTestCredentials(): { email: string; password: string } {
  const checkoutData = loadCheckoutData();
  return checkoutData.credentials;
}

/**
 * Get available regions (based on existing product files)
 *
 * @returns Array of available region codes
 */
export function getAvailableRegions(): string[] {
  const dataDir = path.join(process.cwd(), 'tests', 'data', 'cart-checkout');

  if (!fs.existsSync(dataDir)) {
    return [];
  }

  const files = fs.readdirSync(dataDir);
  const regionFiles = files.filter(f => f.startsWith('products-') && f.endsWith('.json'));

  return regionFiles.map(f => {
    const match = f.match(/products-(\w+)\.json/);
    return match ? match[1].toUpperCase() : '';
  }).filter(Boolean);
}

/**
 * Build full product URL for a region
 *
 * @param regionCode - Region code
 * @param productPath - Product path (e.g., /photo-books/large-hardcover-photo-book/)
 * @returns Full product URL
 */
export function buildProductUrl(regionCode: string, productPath: string): string {
  const regionData = loadRegionProductsData(regionCode);
  return `${regionData.baseUrl}${productPath}`;
}
