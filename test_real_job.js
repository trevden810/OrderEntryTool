/**
 * Test payload wrapper with proper trigger fields
 * Testing if status="pending" and processed=0 triggers a FileMaker script
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const CREATE_DB = 'pep-move-api';
const CREATE_LAYOUT = 'table';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function authenticate() {
  const response = await fetch(`${BASE_URL}/databases/${CREATE_DB}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`
    }
  });
  const data = await response.json();
  if (response.ok && data.messages?.[0]?.code === '0') {
    return data.response.token;
  }
  throw new Error(JSON.stringify(data));
}

async function createJobWithPayload(token) {
  const today = new Date().toISOString().split('T')[0];
  const testId = Date.now();
  
  // Complete job data matching fieldMappings.js
  const jobData = {
    // Core job fields
    job_status: 'Entered',
    job_type: 'Delivery',
    // Dates are auto-enter; omit on create
    
    // Client identification
    _kf_client_code_id: 'TTR-u',
    _kf_client_id: '1247',
    _kf_client_class_id: '110.1',
    
    // Job classification
    _kf_disposition: 'Standard',
    _kf_notification_id: 'Yes',
    _kf_market_id: 'Utah',
    
    // Order information
    client_order_number: `TEST_REAL_${testId}`,
    client_order_number_2: `TRACK_${testId}`,
    
    // Location
    location_load: 'PEP',
    location_return: '',
    
    // Customer
    Customer_C1: 'Test Customer LLC',
    address_C1: '123 Test Street',
    address2_C1: 'Suite 100',
    zip_C1: '84119',
    _kf_city_id: 'West Valley City',
    _kf_state_id: 'UT',
    contact_C1: 'John Doe 801-555-1234 john@test.com',
    phone_C1: '801-555-1234',
    
    // Product
    product_serial_number: `SN_${testId}`,
    description_product: 'Konica Bizhub 750i Test Equipment',
    product_type: 'Copier',
    piece_total: 1,
    
    // Notes
    notes_call_ahead: 'Call 30 minutes before arrival',
    notes_driver: 'Use loading dock on west side',
    notes_job: 'Handle with care - sensitive equipment',
    notes_schedule: 'Monday-Friday 8am-5pm only',
    
    // Job details
    people_required: 2,
    oneway_miles: 15,
    detainment: 0,
    Quoted: 0,
    
    // Flags
    Additional_unit: 'NO',
    same_day: 'NO',
    same_day_return: 'NO',
    staging: 'NO',
    named_insurance: 'NO',
    billing_status: 'Initial'
  };

  log('\n=== Creating REAL Job with Payload Wrapper ===\n', 'blue');
  log(`Test Order Number: ${jobData.client_order_number}`, 'yellow');
  log(`Job Data Fields: ${Object.keys(jobData).length}`, 'reset');

  // Create with trigger fields
  const payload = {
    fieldData: {
      payload: JSON.stringify(jobData),
      status: 'pending',      // Likely triggers processing
      processed: 0,           // Indicates not yet processed
      job_id: jobData.client_order_number  // Reference ID
    }
  };

  log('\nSending to FileMaker...', 'yellow');
  
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json();
  
  if (response.ok && data.response?.recordId) {
    log(`\n✓ SUCCESS!`, 'green');
    log(`  Staging Record ID: ${data.response.recordId}`, 'reset');
    log(`  Mod ID: ${data.response.modId}`, 'reset');
    log(`  Order Number: ${jobData.client_order_number}`, 'reset');
    
    log(`\n${'='.repeat(60)}`, 'blue');
    log(`CRITICAL: Ask FileMaker admin to verify:`, 'yellow');
    log(`${'='.repeat(60)}`, 'blue');
    log(`1. Does staging record ${data.response.recordId} exist in 'table' layout?`, 'reset');
    log(`2. Did it trigger creation of a job in the main jobs table?`, 'reset');
    log(`3. Search main jobs for order #: ${jobData.client_order_number}`, 'reset');
    log(`4. If job exists, payload wrapper works! Update filemakerService.js`, 'reset');
    log(`5. If no job exists, ask admin what triggers the processing script`, 'reset');
    log(`${'='.repeat(60)}\n`, 'blue');
    
    return data.response.recordId;
  } else {
    log(`\n✗ FAILED`, 'red');
    log(`  Code: ${data.messages?.[0]?.code}`, 'red');
    log(`  Message: ${data.messages?.[0]?.message}`, 'red');
    return null;
  }
}

async function run() {
  try {
    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');
    
    const recordId = await createJobWithPayload(token);
    
    if (recordId) {
      log('Next Steps:', 'blue');
      log('1. Share record ID with FileMaker admin', 'reset');
      log('2. Admin verifies if job was created in main table', 'reset');
      log('3. If yes: Revert filemakerService.js to payload wrapper', 'reset');
      log('4. If no: Ask admin for correct trigger field/value\n', 'reset');
    }
    
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
