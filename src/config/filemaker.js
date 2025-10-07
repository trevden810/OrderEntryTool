/**
 * FileMaker API Configuration
 * Uses relative URLs to go through Vite proxy
 */

const FM_CONFIG = {
  SEARCH_DB: {
    name: import.meta.env.VITE_FILEMAKER_SEARCH_DB || 'PEP2_1',
    layout: import.meta.env.VITE_FILEMAKER_SEARCH_LAYOUT || 'jobs_api'
  },
  CREATE_DB: {
    name: import.meta.env.VITE_FILEMAKER_CREATE_DB || 'pep-move-api',
    layout: import.meta.env.VITE_FILEMAKER_CREATE_LAYOUT || 'table'
  },
  
  AUTH: {
    username: import.meta.env.VITE_FILEMAKER_USERNAME,
    password: import.meta.env.VITE_FILEMAKER_PASSWORD
  },
  
  // Use relative URL to go through Vite proxy
  BASE_URL: '/fmi/data/vLatest',
  
  getAuthUrl: (database) => 
    `${FM_CONFIG.BASE_URL}/databases/${database}/sessions`,
  getSearchUrl: (database, layout) => 
    `${FM_CONFIG.BASE_URL}/databases/${database}/layouts/${layout}/_find`,
  getCreateUrl: (database, layout) => 
    `${FM_CONFIG.BASE_URL}/databases/${database}/layouts/${layout}/records`,
  getLogoutUrl: (database, token) => 
    `${FM_CONFIG.BASE_URL}/databases/${database}/sessions/${token}`
};

export const APP_DEFAULTS = {
  // Application settings
  peopleRequired: parseInt(import.meta.env.VITE_DEFAULT_PEOPLE_REQUIRED) || 2,
  locationLoad: import.meta.env.VITE_DEFAULT_LOCATION_LOAD || 'PEP',
  maxFileSizeMB: parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 10,
  enableOCR: import.meta.env.VITE_ENABLE_OCR === 'true',
  
  // Job defaults
  jobStatus: 'Entered',
  billingStatus: 'Initial',
  
  // Required foreign keys (based on TestDelete.xlsx analysis)
  clientCode: 'TTR-u',           // _kf_client_code_id - most common value
  clientId: '1247',              // _kf_client_id - string, not number
  clientClassId: '110.1',        // _kf_client_class_id - string, not number
  disposition: 'Standard',       // _kf_disposition - 83/86 records
  notificationId: 'Yes',         // _kf_notification_id - 82/86 records
  marketId: 'Utah',              // _kf_market_id - most common value
  
  // Special handling flags (100% populated in DB)
  additionalUnit: 'NO',
  sameDay: 'NO',
  sameDayReturn: 'NO',
  staging: 'NO',
  namedInsurance: 'NO'
};

export default FM_CONFIG;
