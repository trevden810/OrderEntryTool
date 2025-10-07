/**
 * Field Mapping Utilities
 * Maps extracted PDF data to FileMaker fields with proper foreign key handling
 */

import { APP_DEFAULTS } from '../config/filemaker.js';
import { validateForeignKeys } from '../services/lookupService.js';

/**
 * Convert M/D or MM/DD format to YYYY-MM-DD
 */
function convertDateToISO(dateStr) {
  if (!dateStr) return '';
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Handle M/D or MM/DD format
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }
  
  return dateStr;
}

/**
 * Map extracted PDF data to FileMaker field structure
 * @param {object} extracted - Raw extracted data from PDF
 * @returns {object} FileMaker-compatible field data
 */
export function mapToFileMakerFields(extracted) {
  const today = new Date().toISOString().split('T')[0];
  
  const mappedData = {
    // Core job fields
    job_status: APP_DEFAULTS.jobStatus,
    job_type: extracted.jobType || 'Delivery',
    // Dates are auto-entered by FileMaker; omit from create payload
    
    // REQUIRED: Client identification (100% populated in DB)
    _kf_client_code_id: extracted.clientCode || APP_DEFAULTS.clientCode,
    _kf_client_id: APP_DEFAULTS.clientId,
    _kf_client_class_id: APP_DEFAULTS.clientClassId,
    
    // REQUIRED: Job classification (100% populated in DB)
    _kf_disposition: APP_DEFAULTS.disposition,
    _kf_notification_id: APP_DEFAULTS.notificationId,
    _kf_market_id: extracted.market || APP_DEFAULTS.marketId,
    
    // Order information
    client_order_number: extracted.orderNumber || '',
    client_order_number_2: extracted.trackingNumber || '',
    
    // Location fields
    location_load: APP_DEFAULTS.locationLoad,
    location_return: extracted.returnCarrier || '',
    
    // Customer information
    Customer_C1: extracted.customerName || '',
    address_C1: extracted.address || '',
    address2_C1: extracted.suite || '',
    zip_C1: extracted.zipCode || '',
    _kf_city_id: extracted.city || '',
    _kf_state_id: extracted.state || '',
    contact_C1: formatContact(extracted),
    phone_C1: extracted.phone || '',
    
    // Product information
    product_serial_number: extracted.serialNumber || '',
    description_product: extracted.productDescription || '',
    product_type: extracted.productType || '',
    piece_total: extracted.quantity || 1,
    
    // Notes fields
    notes_call_ahead: extracted.callAhead || '',
    notes_driver: extracted.driverNotes || '',
    notes_job: extracted.jobNotes || '',
    notes_schedule: extracted.scheduleNotes || '',
    
    // Job details
    people_required: APP_DEFAULTS.peopleRequired,
    // Miles/quote fields are read-only in FileMaker; exclude from create payload
    
    // Special handling flags (100% populated in DB)
    Additional_unit: APP_DEFAULTS.additionalUnit,
    same_day: APP_DEFAULTS.sameDay,
    same_day_return: APP_DEFAULTS.sameDayReturn,
    staging: APP_DEFAULTS.staging,
    named_insurance: APP_DEFAULTS.namedInsurance,
    billing_status: APP_DEFAULTS.billingStatus,
    
    // Metadata
    // Account metadata is handled by FileMaker
  };
  
  // Validate that all required foreign keys are present
  const validation = validateForeignKeys(mappedData);
  if (!validation.isValid) {
    console.warn('Foreign key validation warnings:', validation.errors);
  }
  
  return mappedData;
}

function formatContact(extracted) {
  const parts = [];
  
  if (extracted.contactName) parts.push(extracted.contactName);
  if (extracted.phone) parts.push(extracted.phone);
  if (extracted.email) parts.push(extracted.email);
  
  return parts.join(' ') || '';
}

export function validateJobData(jobData) {
  const errors = [];
  const requiredFields = [
    'client_order_number',
    'job_type',
    'address_C1',
    'zip_C1',
    'Customer_C1'
  ];
  
  for (const field of requiredFields) {
    if (!jobData[field] || jobData[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }
  
  if (jobData.zip_C1 && !/^\d{5}(-\d{4})?$/.test(jobData.zip_C1)) {
    errors.push('Invalid ZIP code format');
  }
  
  if (jobData.phone_C1 && !/^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(jobData.phone_C1)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function normalizeJobData(jobData) {
  return {
    ...jobData,
    zip_C1: jobData.zip_C1?.replace(/[^\d-]/g, ''),
    phone_C1: jobData.phone_C1?.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
    _kf_state_id: jobData._kf_state_id?.toUpperCase(),
    client_order_number: jobData.client_order_number?.trim(),
    address_C1: jobData.address_C1?.trim(),
    Customer_C1: jobData.Customer_C1?.trim()
  };
}

export function parseCityState(cityStateZip) {
  const match = cityStateZip?.match(/([A-Z][A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  if (match) {
    return {
      city: match[1].trim(),
      state: match[2].trim(),
      zip: match[3].trim()
    };
  }
  return null;
}
