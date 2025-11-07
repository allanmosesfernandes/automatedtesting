/**
 * Environment Configuration for Multi-Environment Testing
 *
 * This file defines environment types (QA, Live) and provides
 * utilities to build URLs based on region and environment.
 */

import type { RegionConfig } from './regions';
import { getRegion } from './regions';

export type Environment = 'qa' | 'live';

/**
 * Get the base URL for a given region and environment
 *
 * @param regionCode - Region code (US, GB, DE, etc.)
 * @param environment - Environment type (qa or live)
 * @returns Full base URL for the region and environment
 *
 * @example
 * getBaseUrl('US', 'qa')    // 'https://qa.printerpix.com'
 * getBaseUrl('GB', 'live')  // 'https://www.printerpix.co.uk'
 * getBaseUrl('DE', 'qa')    // 'https://qa.printerpix.de'
 */
export function getBaseUrl(regionCode: string, environment: Environment = 'qa'): string {
  const region: RegionConfig = getRegion(regionCode);
  const subdomain = environment === 'qa' ? 'qa' : 'www';
  return `https://${subdomain}.${region.domain}`;
}

/**
 * Get the API URL for a given region and environment
 *
 * @param regionCode - Region code (US, GB, DE, etc.)
 * @param environment - Environment type (qa or live)
 * @returns API base URL for the region and environment
 *
 * @example
 * getApiUrl('US', 'qa')    // 'https://qa-api.printerpix.com'
 * getApiUrl('GB', 'live')  // 'https://api.printerpix.co.uk'
 */
export function getApiUrl(regionCode: string, environment: Environment = 'qa'): string {
  const region: RegionConfig = getRegion(regionCode);
  const subdomain = environment === 'qa' ? 'qa-api' : 'api';
  return `https://${subdomain}.${region.domain}`;
}

/**
 * Extract region code from a URL
 *
 * @param url - The URL to parse
 * @returns Region code or null if not found
 */
function extractRegionFromUrl(url: string): string | null {
  // Match domain patterns like printerpix.com, printerpix.de, printerpix.es, etc.
  const match = url.match(/printerpix\.(com|co\.uk|de|fr|it|es|nl)/);
  if (!match) return null;

  const domainMap: Record<string, string> = {
    'com': 'US',
    'co.uk': 'GB',
    'de': 'DE',
    'fr': 'FR',
    'it': 'IT',
    'es': 'ES',
    'nl': 'NL',
  };

  return domainMap[match[1]] || null;
}

/**
 * Get region and environment from environment variables or use defaults
 *
 * @returns Object containing region code and environment
 *
 * @example
 * // With TEST_REGION=DE TEST_ENV=live
 * getTestConfig() // { region: 'DE', environment: 'live' }
 *
 * // With no env vars
 * getTestConfig() // { region: 'US', environment: 'qa' }
 */
export function getTestConfig(): { region: string; environment: Environment } {
  // First check explicit TEST_REGION env var
  let region = process.env.TEST_REGION?.toUpperCase();

  // If not set, try to extract from BASE_URL
  if (!region && process.env.BASE_URL) {
    region = extractRegionFromUrl(process.env.BASE_URL) || undefined;
  }

  // Default to US if still not found
  region = region || 'US';

  const environment = (process.env.TEST_ENV || 'qa').toLowerCase() as Environment;

  if (environment !== 'qa' && environment !== 'live') {
    throw new Error(`Invalid TEST_ENV: ${environment}. Must be 'qa' or 'live'.`);
  }

  return { region, environment };
}

/**
 * Get the current test base URL based on environment variables
 *
 * @returns Base URL for tests
 *
 * @example
 * // With TEST_REGION=FR TEST_ENV=qa
 * getCurrentBaseUrl() // 'https://qa.printerpix.fr'
 */
export function getCurrentBaseUrl(): string {
  // Check if BASE_URL is explicitly set (takes precedence)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  const { region, environment } = getTestConfig();
  return getBaseUrl(region, environment);
}
