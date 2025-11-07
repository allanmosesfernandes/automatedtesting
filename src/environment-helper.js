/**
 * Environment Helper
 * JavaScript wrapper for building region/environment URLs
 * This avoids the need to require TypeScript files directly
 */

// Region domain mapping
const REGION_DOMAINS = {
  US: 'printerpix.com',
  GB: 'printerpix.co.uk',
  DE: 'printerpix.de',
  FR: 'printerpix.fr',
  IT: 'printerpix.it',
  ES: 'printerpix.es',
  NL: 'printerpix.nl'
};

/**
 * Get the base URL for a given region and environment
 * @param {string} regionCode - Region code (US, GB, DE, etc.)
 * @param {string} environment - Environment type (qa or live)
 * @returns {string} Full base URL for the region and environment
 */
function getBaseUrl(regionCode, environment = 'qa') {
  const domain = REGION_DOMAINS[regionCode.toUpperCase()];

  if (!domain) {
    throw new Error(`Invalid region code: ${regionCode}. Valid regions: ${Object.keys(REGION_DOMAINS).join(', ')}`);
  }

  const subdomain = environment === 'qa' ? 'qa' : 'www';
  return `https://${subdomain}.${domain}`;
}

/**
 * Get all available regions
 * @returns {string[]} Array of region codes
 */
function getAvailableRegions() {
  return Object.keys(REGION_DOMAINS);
}

module.exports = {
  getBaseUrl,
  getAvailableRegions,
  REGION_DOMAINS
};
