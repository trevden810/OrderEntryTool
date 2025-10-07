/**
 * Reverse Field Diagnostic
 * Start with test-minimal.js payload and remove fields one by one
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

async function testFieldSet(token, fieldSet, description) {
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fieldData: fieldSet })
    }
  );

  const data = await response.json();
  
  if (response.ok && data.response?.recordId) {
    log(`✓ ${description}`, 'green');
    return { success: true, recordId: data.response.recordId };
  } else {
    log(`✗ ${description}`, 'red');
    log(`  Error: ${data.messages?.[0]?.code} - ${data.messages?.[0]?.message}`, 'red');
    return { success: false, code: data.messages?.[0]?.code };
  }
}

async function runDiagnostics() {
  log('\n=== Reverse Field Diagnostics ===', 'blue');
  log('Starting with test-minimal.js payload\n', 'yellow');

  const token = await authenticate();
  log('✓ Authenticated successfully\n', 'green');

  // Start with the known minimal set from test-minimal.js
  const fullMinimal = {
    job_status: 'Entered',
    job_type: 'Pickup',
    _kf_client_code_id: 'TTR-u',
    _kf_disposition: 'Standard',
    _kf_notification_id: 'Yes',
    _kf_client_class_id: '110.1',
    _kf_client_id: '1247',
    _kf_market_id: 'Utah',
    Customer_C1: 'Test',
    address_C1: '123 Test',
    zip_C1: '12345',
    _kf_city_id: 'Test City',
    _kf_state_id: 'UT',
    billing_status: 'Initial',
    Additional_unit: 'NO',
    same_day: 'NO',
    same_day_return: 'NO',
    staging: 'NO',
    named_insurance: 'NO',
    timestamp_create: new Date().toISOString(),
    timestamp_mod: new Date().toISOString(),
    account_create: 'Test',
    account_mod: 'Test'
  };

  log(`Test 1: Full minimal set (${Object.keys(fullMinimal).length} fields)`, 'yellow');
  const baseTest = await testFieldSet(token, fullMinimal, 'Testing full minimal payload');
  
  if (!baseTest.success) {
    log('\n✗ CRITICAL: Even test-minimal.js payload fails!', 'red');
    log('This suggests the layout or authentication has changed.\n', 'red');
    return;
  }
  
  log(`  Record ID: ${baseTest.recordId}`, 'reset');
  log('\n✓ Base payload works! Now testing field removal...\n', 'green');

  // Test removing customer fields
  log('Test 2: Removing Customer Fields', 'yellow');
  
  const noCustomer = { ...fullMinimal };
  delete noCustomer.Customer_C1;
  await testFieldSet(token, noCustomer, 'Without Customer_C1');
  
  const noAddress = { ...fullMinimal };
  delete noAddress.address_C1;
  await testFieldSet(token, noAddress, 'Without address_C1');
  
  const noZip = { ...fullMinimal };
  delete noZip.zip_C1;
  await testFieldSet(token, noZip, 'Without zip_C1');
  
  const noCity = { ...fullMinimal };
  delete noCity._kf_city_id;
  await testFieldSet(token, noCity, 'Without _kf_city_id');
  
  const noState = { ...fullMinimal };
  delete noState._kf_state_id;
  await testFieldSet(token, noState, 'Without _kf_state_id');
  
  log('');

  // Test removing flags
  log('Test 3: Removing Flag Fields', 'yellow');
  
  const noBilling = { ...fullMinimal };
  delete noBilling.billing_status;
  await testFieldSet(token, noBilling, 'Without billing_status');
  
  const noAdditionalUnit = { ...fullMinimal };
  delete noAdditionalUnit.Additional_unit;
  await testFieldSet(token, noAdditionalUnit, 'Without Additional_unit');
  
  const noSameDay = { ...fullMinimal };
  delete noSameDay.same_day;
  await testFieldSet(token, noSameDay, 'Without same_day');
  
  log('');

  // Test removing FK fields
  log('Test 4: Removing Foreign Key Fields', 'yellow');
  
  const noClientCode = { ...fullMinimal };
  delete noClientCode._kf_client_code_id;
  await testFieldSet(token, noClientCode, 'Without _kf_client_code_id');
  
  const noClientId = { ...fullMinimal };
  delete noClientId._kf_client_id;
  await testFieldSet(token, noClientId, 'Without _kf_client_id');
  
  const noDisposition = { ...fullMinimal };
  delete noDisposition._kf_disposition;
  await testFieldSet(token, noDisposition, 'Without _kf_disposition');
  
  log('');

  // Test removing metadata
  log('Test 5: Removing Metadata Fields', 'yellow');
  
  const noTimestampCreate = { ...fullMinimal };
  delete noTimestampCreate.timestamp_create;
  await testFieldSet(token, noTimestampCreate, 'Without timestamp_create');
  
  const noAccountCreate = { ...fullMinimal };
  delete noAccountCreate.account_create;
  await testFieldSet(token, noAccountCreate, 'Without account_create');
  
  log('\n=== Diagnostics Complete ===\n', 'blue');
}

runDiagnostics().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
