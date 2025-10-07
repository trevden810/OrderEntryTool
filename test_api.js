/**
 * FileMaker API Connection Test
 * Run: node test_api.js
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const SEARCH_DB = 'PEP2_1';
const CREATE_DB = 'pep-move-api';
const SEARCH_LAYOUT = 'jobs_api';
const CREATE_LAYOUT = 'table';

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
  const testJob = {
    // Core required fields
    job_status: 'Entered',
    job_type: 'Delivery',
    client_order_number: `TEST_${Date.now()}`,
    date_received: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    
    // Customer info
    Customer_C1: 'Test Customer',
    address_C1: '123 Test Street',
    zip_C1: '84119',
    phone_C1: '801-555-1234',
    
    // Product info
    product_serial_number: `TEST_SN_${Date.now()}`,
    description_product: 'Test Equipment',
    
    // REQUIRED Foreign Keys
    _kf_client_code_id: 'TTR-u',
    _kf_client_id: '1247',
    _kf_client_class_id: '110.1',
    _kf_disposition: 'Standard',
    _kf_notification_id: 'Yes',
    _kf_market_id: 'Utah',
    _kf_city_id: 'West Valley City',
    _kf_state_id: 'UT',
    
    // Location
    location_load: 'PEP',
    
    // Job details
    people_required: 2,
    oneway_miles: 0,
    piece_total: 1,
    
    // Flags
    Additional_unit: 'NO',
    same_day: 'NO',
    same_day_return: 'NO',
    staging: 'NO',
    named_insurance: 'NO',
    billing_status: 'Initial',
    
    // Metadata
    timestamp_create: new Date().toISOString(),
    timestamp_mod: new Date().toISOString(),
    account_create: 'test_api',
    account_mod: 'test_api'
  };

  // Use DIRECT fieldData (not payload wrapper)
  const payload = {
    fieldData: testJob
  };

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
      log(`  Test Order #: ${testJob.client_order_number}`, 'reset');
      log(`  This record should be usable (not a ghost record)\n`, 'green');
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
