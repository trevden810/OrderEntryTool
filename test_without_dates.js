/**
 * Test creating job without date fields
 * Error 201 suggests dates are auto-enter fields
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const DATABASE = 'PEP2_1';
const LAYOUT = '2.5-JOB_DETAIL';

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
  const response = await fetch(`${BASE_URL}/databases/${DATABASE}/sessions`, {
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

async function testJobCreation(token, description, jobData) {
  log(`\nTest: ${description}`, 'yellow');
  log(`  Fields: ${Object.keys(jobData).join(', ')}`, 'reset');
  
  const response = await fetch(
    `${BASE_URL}/databases/${DATABASE}/layouts/${LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fieldData: jobData })
    }
  );

  const data = await response.json();
  
  if (response.ok && data.response?.recordId) {
    log(`  ✓ SUCCESS - Record ID: ${data.response.recordId}`, 'green');
    return { success: true, recordId: data.response.recordId };
  } else {
    log(`  ✗ FAILED - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
    return { success: false, error: data.messages?.[0] };
  }
}

async function run() {
  try {
    log('\n=== Testing Job Creation Without Date Fields ===\n', 'blue');

    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');

    const testId = Date.now();

    // Test 1: Minimal job - NO date fields
    const test1 = {
      job_status: 'Entered',
      job_type: 'Delivery',
      
      _kf_client_code_id: 'TTR-u',
      _kf_client_id: '1247',
      _kf_client_class_id: '110.1',
      _kf_disposition: 'Standard',
      _kf_notification_id: 'Yes',
      _kf_market_id: 'Utah',
      
      client_order_number: `TEST_NO_DATES_${testId}`,
      
      Customer_C1: 'Test Customer',
      address_C1: '123 Test Street',
      zip_C1: '84119',
      _kf_city_id: 'West Valley City',
      _kf_state_id: 'UT',
      
      location_load: 'PEP',
      people_required: 2,
      
      Additional_unit: 'NO',
      same_day: 'NO',
      same_day_return: 'NO',
      staging: 'NO',
      named_insurance: 'NO',
      billing_status: 'Initial'
    };

    const result1 = await testJobCreation(token, 'WITHOUT any date fields', test1);
    
    if (result1.success) {
      log(`\n${'='.repeat(60)}`, 'green');
      log(`✓ SUCCESS! Job created without date fields`, 'green');
      log(`  Record ID: ${result1.recordId}`, 'green');
      log(`  Order Number: ${test1.client_order_number}`, 'green');
      log(`${'='.repeat(60)}\n`, 'green');
      
      log('Dates are likely AUTO-ENTER fields set by FileMaker', 'yellow');
      log('Solution: Remove date fields from fieldMappings.js\n', 'yellow');
      return;
    }

    // Test 2: Try with timestamp fields instead
    log('\nTrying with timestamp fields...', 'yellow');
    const test2 = {
      ...test1,
      client_order_number: `TEST_TIMESTAMP_${testId}`,
      timestamp_create: new Date().toISOString(),
      timestamp_mod: new Date().toISOString()
    };

    const result2 = await testJobCreation(token, 'WITH timestamp fields', test2);
    
    if (result2.success) {
      log(`\n✓ Timestamps work!`, 'green');
      return;
    }

    // Test 3: Try with account fields
    log('\nTrying with account fields...', 'yellow');
    const test3 = {
      ...test1,
      client_order_number: `TEST_ACCOUNT_${testId}`,
      account_create: 'OrderEntryTool',
      account_mod: 'OrderEntryTool'
    };

    const result3 = await testJobCreation(token, 'WITH account fields', test3);

    if (result3.success) {
      log(`\n✓ Account fields work!`, 'green');
    }

    log('\n=== Test Complete ===\n', 'blue');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
