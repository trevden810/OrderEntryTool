/**
 * FileMaker Lookup Service
 * Resolves text values (client names, cities, states) to foreign key IDs
 */

import FM_CONFIG from '../config/filemaker.js';

/**
 * Search FileMaker for a matching record
 * @param {string} database - Database name
 * @param {string} layout - Layout name
 * @param {object} query - Search query object
 * @param {string} token - Auth token
 * @returns {Promise<object|null>} First matching record or null
 */
async function searchLookup(database, layout, query, token) {
  try {
    const response = await fetch(
      `${FM_CONFIG.BASE_URL}/databases/${database}/layouts/${layout}/_find`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: [query],
          limit: '1'
        })
      }
    );

    const data = await response.json();
    
    // Code 401 means no records found
    if (data.messages?.[0]?.code === '401') {
      return null;
    }
    
    if (response.ok && data.response?.data?.[0]) {
      return data.response.data[0].fieldData;
    }
    
    return null;
  } catch (error) {
    console.error('Lookup search error:', error);
    return null;
  }
}

/**
 * Resolve client name to client code ID
 * @param {string} clientName - Client name from PDF (e.g., "TTR", "Valley", "Canon")
 * @param {string} token - Auth token
 * @returns {Promise<string>} Client code ID or default
 */
export async function resolveClientCode(clientName, token) {
  if (!clientName) {
    return 'TTR-u'; // Default
  }
  
  // Normalize client name for matching
  const normalized = clientName.toLowerCase();
  
  // Quick pattern matching for common clients
  const clientPatterns = {
    'TTR-u': ['ttr', 'transport', 'utah'],
    'TTR-m': ['mountain', 'montana'],
    'VALLEY': ['valley', 'valley office'],
    'CANON': ['canon', 'imagerunner'],
    'RICOH': ['ricoh', 'lanier', 'savin'],
    'WBT': ['wbt', 'west business']
  };
  
  for (const [code, patterns] of Object.entries(clientPatterns)) {
    if (patterns.some(pattern => normalized.includes(pattern))) {
      return code;
    }
  }
  
  // TODO: If needed, implement actual FileMaker lookup query
  // For now, pattern matching is sufficient based on known clients
  
  return 'TTR-u'; // Default fallback
}

/**
 * Resolve city name to city ID
 * @param {string} cityName - City name from PDF
 * @param {string} stateId - State code (e.g., "UT")
 * @param {string} token - Auth token
 * @returns {Promise<string>} City name (FileMaker accepts text)
 */
export async function resolveCityId(cityName, stateId, token) {
  if (!cityName) {
    return '';
  }
  
  // FileMaker accepts city names as text in _kf_city_id field
  // Clean and standardize the city name
  return cityName.trim();
}

/**
 * Resolve state abbreviation to state ID
 * @param {string} stateAbbr - State abbreviation (e.g., "UT", "CA")
 * @param {string} token - Auth token
 * @returns {Promise<string>} State abbreviation (FileMaker accepts text)
 */
export async function resolveStateId(stateAbbr, token) {
  if (!stateAbbr) {
    return '';
  }
  
  // FileMaker accepts state codes as text in _kf_state_id field
  // Ensure uppercase and 2-letter format
  const normalized = stateAbbr.trim().toUpperCase();
  
  if (normalized.length === 2 && /^[A-Z]{2}$/.test(normalized)) {
    return normalized;
  }
  
  return '';
}

/**
 * Resolve market name to market ID
 * @param {string} marketName - Market name (e.g., "Utah", "Mountain")
 * @param {string} token - Auth token
 * @returns {Promise<string>} Market name (FileMaker accepts text)
 */
export async function resolveMarketId(marketName, token) {
  if (!marketName) {
    return 'Utah'; // Default
  }
  
  // FileMaker accepts market names as text
  // Common markets: Utah, Mountain, Nevada, Idaho
  return marketName.trim();
}

/**
 * Resolve all foreign keys in job data
 * @param {object} jobData - Job data object with text values
 * @param {string} token - Auth token
 * @returns {Promise<object>} Job data with resolved FK IDs
 */
export async function enrichWithLookups(jobData, token) {
  const enriched = { ...jobData };
  
  // Resolve client code
  if (jobData.Customer_C1 || jobData._kf_client_code_id) {
    enriched._kf_client_code_id = await resolveClientCode(
      jobData.Customer_C1 || jobData._kf_client_code_id,
      token
    );
  }
  
  // Resolve city (accepts text)
  if (jobData._kf_city_id) {
    enriched._kf_city_id = await resolveCityId(
      jobData._kf_city_id,
      jobData._kf_state_id,
      token
    );
  }
  
  // Resolve state (accepts text)
  if (jobData._kf_state_id) {
    enriched._kf_state_id = await resolveStateId(
      jobData._kf_state_id,
      token
    );
  }
  
  // Resolve market (accepts text)
  if (jobData._kf_market_id) {
    enriched._kf_market_id = await resolveMarketId(
      jobData._kf_market_id,
      token
    );
  }
  
  return enriched;
}

/**
 * Validate that required foreign keys are present
 * @param {object} jobData - Job data to validate
 * @returns {object} Validation result { isValid, errors }
 */
export function validateForeignKeys(jobData) {
  const errors = [];
  const requiredFKs = [
    '_kf_client_code_id',
    '_kf_client_id',
    '_kf_client_class_id',
    '_kf_disposition',
    '_kf_notification_id',
    '_kf_market_id'
  ];
  
  for (const fk of requiredFKs) {
    if (!jobData[fk] || jobData[fk].trim() === '') {
      errors.push(`Missing required field: ${fk}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
