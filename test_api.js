/**
 * FileMaker API Connection Test
 * Run: node test_api.js
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const SEARCH_DB = 'PEP2_1';
const CREATE_DB = 'PEP2_1';  // FIXED: Use same database for create
const SEARCH_LAYOUT = 'jobs_api';
const CREATE_LAYOUT = '2.5-JOB_DETAIL';  // FIXED: Use proper layout with 208 fields

// Colors for console output
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

async function authenticate(database) {
  const response = await fetch(`${BASE_URL}/databases/${database}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`
    }
  });

  const data = await response.json();
  
  if (response.ok && data.messages?.[0]?.code === '0') {
    return { success: true, token: data.response.token };
  }
  
  throw new Error(JSON.stringify(data));
}

async function logout(database, token) {
  await fetch(`${BASE_URL}/databases/${database}/sessions/${token}`, {
    method: 'DELETE'
  });
}

async function searchJob(orderNumber, token) {
  const response = await fetch(
    `${BASE_URL}/databases/${SEARCH_DB}/layouts/${SEARCH_LAYOUT}/_find`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: [{ 'client_order_number': orderNumber }],
        limit: '5'
      })
    }
  );

  const data = await response.json();
  return { response, data };
}

async function createTestJob(token) {
  // UPDATED: Use direct fieldData format (payload wrapper creates ghost records)
  // Use EXACT field set from fieldMappings.js
  const testJob = {
    // Core job fields (CRITICAL: job_date was missing!)
    job_status: 'Entered',
    job_type: 'Delivery',
    // Dates are auto-enter in FileMaker; omit on create
    
    // REQUIRED: Client identification
    _kf_client_code_id: 'TTR-u',
    _kf_client_id: '1247',
    _kf_client_class_id: '110.1',
    
    // REQUIRED: Job classification
    _kf_disposition: 'Standard',
    _kf_notification_id: 'Yes',
    _kf_market_id: 'Utah',
    
    // Order information
    client_order_number: `TEST_${Date.now()}`,
    client_order_number_2: '',
    
    // Location fields
    location_load: 'PEP',
    location_return: '',
    
    // Customer information
    Customer_C1: 'Test Customer',
    address_C1: '123 Test Street',
    address2_C1: '',
    zip_C1: '84119',
    _kf_city_id: 'West Valley City',
    _kf_state_id: 'UT',
    contact_C1: 'Test Contact 801-555-1234',
    phone_C1: '801-555-1234',
    
    // Product information
    product_serial_number: `TEST_SN_${Date.now()}`,
    description_product: 'Test Equipment',
    product_type: '',
    piece_total: 1,
    
    // Notes fields
    notes_call_ahead: '',
    notes_driver: '',
    notes_job: '',
    notes_schedule: '',
    
    // Job details
    people_required: 2,
    
    // Special handling flags
    Additional_unit: 'NO',
    same_day: 'NO',
    same_day_return: 'NO',
    staging: 'NO',
    named_insurance: 'NO',
    billing_status: 'Initial',
    
    // Notes (requested due date stored in schedule notes)
    notes_schedule: ''
  };

  // Use DIRECT fieldData (not payload wrapper)
  const payload = {
    fieldData: testJob
  };
  
  // Debug: Log field count
  console.log(`\n  Sending ${Object.keys(testJob).length} fields:`);
  console.log(`  Fields: ${Object.keys(testJob).join(', ')}`);
  console.log(``);

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
  return { response, data, testJob };
}

async function fetchJobDetails(recordId, token) {
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records/${recordId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (response.ok && data.response?.data?.[0]?.fieldData) {
    return { success: true, fieldData: data.response.data[0].fieldData };
  }

  return {
    success: false,
    error: data.messages?.[0]?.message || `Fetch failed with status ${response.status}`
  };
}

async function runTests() {
  log('\n=== FileMaker API Connection Tests ===\n', 'blue');

  // Test 1: Authentication - Search Database
  log('Test 1: Authenticate to Search Database (PEP2_1)', 'yellow');
  try {
    const auth = await authenticate(SEARCH_DB);
    log(`✓ Authentication successful`, 'green');
    log(`  Token: ${auth.token.substring(0, 20)}...`, 'reset');
    await logout(SEARCH_DB, auth.token);
    log(`✓ Logout successful\n`, 'green');
  } catch (error) {
    log(`✗ Authentication failed: ${error.message}\n`, 'red');
    return;
  }

  // Test 2: Authentication - Create Database
  log('Test 2: Authenticate to Create Database (pep-move-api)', 'yellow');
  try {
    const auth = await authenticate(CREATE_DB);
    log(`✓ Authentication successful`, 'green');
    await logout(CREATE_DB, auth.token);
    log(`✓ Logout successful\n`, 'green');
  } catch (error) {
    log(`✗ Authentication failed: ${error.message}\n`, 'red');
  }

  // Test 3: Search for existing job
  log('Test 3: Search for Job (Order #9970070005)', 'yellow');
  try {
    const auth = await authenticate(SEARCH_DB);
    const { response, data } = await searchJob('9970070005', auth.token);
    
    if (data.messages?.[0]?.code === '401') {
      log(`✓ Search executed (no records found)`, 'green');
    } else if (response.ok && data.response?.data) {
      log(`✓ Search successful`, 'green');
      log(`  Found ${data.response.data.length} record(s)`, 'reset');
      if (data.response.data[0]?.fieldData) {
        const job = data.response.data[0].fieldData;
        log(`  Job Type: ${job.job_type}`, 'reset');
        log(`  Status: ${job.job_status}`, 'reset');
        log(`  Customer: ${job.Customer_C1}\n`, 'reset');
      }
    } else {
      log(`✗ Search failed: ${response.status}`, 'red');
      log(`  ${JSON.stringify(data, null, 2)}\n`, 'red');
    }
    
    await logout(SEARCH_DB, auth.token);
  } catch (error) {
    log(`✗ Search failed: ${error.message}\n`, 'red');
  }

  // Test 4: Create test job
  log('Test 4: Create Test Job', 'yellow');
  try {
    const auth = await authenticate(CREATE_DB);
    const { response, data, testJob } = await createTestJob(auth.token);
    
    if (response.ok && data.response?.recordId) {
      log(`✓ Job created successfully with DIRECT fieldData format`, 'green');
      log(`  Record ID: ${data.response.recordId}`, 'reset');
      log(`  Mod ID: ${data.response.modId}`, 'reset');
      log(`  Test Order #: ${testJob.client_order_number}`, 'reset');
      log(`  Field count: ${Object.keys(testJob).length}`, 'reset');
      log('  This record should be usable (not a ghost record)', 'green');

      const verify = await fetchJobDetails(data.response.recordId, auth.token);
      if (verify.success) {
        log('Verification:', 'yellow');
        log(
          `  FileMaker Job ID (_kp_job_id): ${verify.fieldData._kp_job_id ?? 'N/A'}`,
          'reset'
        );
        log(`  Job Status: ${verify.fieldData.job_status ?? 'N/A'}`, 'reset');
        log(`  Job Type: ${verify.fieldData.job_type ?? 'N/A'}`, 'reset');
      } else {
        log('Verification fetch failed:', 'red');
        log(`  ${verify.error}`, 'red');
      }
    } else {
      log(`✗ Job creation failed: ${response.status}`, 'red');
      log(`  Code: ${data.messages?.[0]?.code}`, 'red');
      log(`  Message: ${data.messages?.[0]?.message}`, 'red');
      log(`  Full Response: ${JSON.stringify(data, null, 2)}\n`, 'red');
    }
    
    await logout(CREATE_DB, auth.token);
  } catch (error) {
    log(`✗ Job creation failed: ${error.message}\n`, 'red');
  }

  log('=== Tests Complete ===\n', 'blue');
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
