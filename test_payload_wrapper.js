/**
 * Test payload wrapper with correct table layout fields
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

async function testPayloadVariations(token) {
  const today = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  // The actual job data (what we want to store)
  const jobData = {
    job_status: 'Entered',
    job_type: 'Delivery',
    // Dates are auto-enter; omit on create
    client_order_number: `TEST_${Date.now()}`,
    Customer_C1: 'Test Customer',
    address_C1: '123 Test Street',
    zip_C1: '84119',
    _kf_client_code_id: 'TTR-u',
    _kf_client_id: '1247',
    _kf_market_id: 'Utah'
  };

  log('\n=== Testing Payload Wrapper Variations ===\n', 'blue');

  // Test 1: Just payload field
  log('Test 1: payload field only', 'yellow');
  const test1 = {
    fieldData: {
      payload: JSON.stringify(jobData)
    }
  };
  
  let response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test1)
    }
  );
  
  let data = await response.json();
  if (response.ok && data.response?.recordId) {
    log(`✓ SUCCESS - Record ID: ${data.response.recordId}`, 'green');
  } else {
    log(`✗ FAILED - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
  }

  // Test 2: payload + status
  log('\nTest 2: payload + status', 'yellow');
  const test2 = {
    fieldData: {
      payload: JSON.stringify(jobData),
      status: 'pending'
    }
  };
  
  response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test2)
    }
  );
  
  data = await response.json();
  if (response.ok && data.response?.recordId) {
    log(`✓ SUCCESS - Record ID: ${data.response.recordId}`, 'green');
  } else {
    log(`✗ FAILED - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
  }

  // Test 3: payload + status + processed
  log('\nTest 3: payload + status + processed', 'yellow');
  const test3 = {
    fieldData: {
      payload: JSON.stringify(jobData),
      status: 'pending',
      processed: 0
    }
  };
  
  response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test3)
    }
  );
  
  data = await response.json();
  if (response.ok && data.response?.recordId) {
    log(`✓ SUCCESS - Record ID: ${data.response.recordId}`, 'green');
  } else {
    log(`✗ FAILED - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
  }

  // Test 4: payload + status + processed + job_id
  log('\nTest 4: payload + status + processed + job_id', 'yellow');
  const test4 = {
    fieldData: {
      payload: JSON.stringify(jobData),
      status: 'pending',
      processed: 0,
      job_id: `JOB_${Date.now()}`
    }
  };
  
  response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test4)
    }
  );
  
  data = await response.json();
  if (response.ok && data.response?.recordId) {
    log(`✓ SUCCESS - Record ID: ${data.response.recordId}`, 'green');
  } else {
    log(`✗ FAILED - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
  }

  // Test 5: Try different status values
  log('\nTest 5: Testing different status values', 'yellow');
  
  const statusValues = ['new', 'Entered', 'pending', 'unprocessed', ''];
  for (const statusValue of statusValues) {
    const test = {
      fieldData: {
        payload: JSON.stringify(jobData),
        status: statusValue,
        processed: 0
      }
    };
    
    response = await fetch(
      `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(test)
      }
    );
    
    data = await response.json();
    if (response.ok && data.response?.recordId) {
      log(`  ✓ status="${statusValue}" - SUCCESS (Record ${data.response.recordId})`, 'green');
    } else {
      log(`  ✗ status="${statusValue}" - FAILED (${data.messages?.[0]?.code})`, 'red');
    }
  }

  log('\n=== Tests Complete ===\n', 'blue');
}

async function run() {
  try {
    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');
    
    await testPayloadVariations(token);
    
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
