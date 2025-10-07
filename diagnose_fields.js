/**
 * Field Diagnostic Tool
 * Tests field combinations against PEP2_1 / 2.5-JOB_DETAIL to find read-only fields
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const CREATE_DB = 'PEP2_1';
const CREATE_LAYOUT = '2.5-JOB_DETAIL';

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
    log(`[OK] ${description}: SUCCESS`, 'green');
    log(`  Record ID: ${data.response.recordId}`, 'reset');
    return { success: true, recordId: data.response.recordId };
  }

  log(`[FAIL] ${description}: FAILED`, 'red');
  log(`  Code: ${data.messages?.[0]?.code} - ${data.messages?.[0]?.message}`, 'red');
  return { success: false, code: data.messages?.[0]?.code };
}

async function runDiagnostics() {
  log('\n=== FileMaker Field Diagnostics (PEP2_1 / 2.5-JOB_DETAIL) ===\n', 'blue');

  const token = await authenticate();
  log('[OK] Authenticated successfully\n', 'green');

  const today = new Date().toISOString().split('T')[0];
  const testId = Date.now();

  // Base set mirrors the minimal payload that we know succeeds
  const baseSet = {
    job_status: 'Entered',
    job_type: 'Delivery',
    _kf_client_code_id: 'TTR-u',
    _kf_disposition: 'Standard',
    _kf_notification_id: 'Yes',
    _kf_client_class_id: '110.1',
    _kf_client_id: '1247',
    _kf_market_id: 'Utah',
    client_order_number: `DIAG_BASE_${testId}`,
    Customer_C1: 'Test Customer',
    address_C1: '123 Test St',
    zip_C1: '84119',
    _kf_state_id: 'UT',
    _kf_city_id: 'West Valley City',
    location_load: 'PEP',
    people_required: 2,
    Additional_unit: 'NO',
    same_day: 'NO',
    same_day_return: 'NO',
    staging: 'NO',
    named_insurance: 'NO',
    billing_status: 'Initial'
  };

  log('Test 1: Base field set (known good)', 'yellow');
  const baseResult = await testFieldSet(token, baseSet, `Base set (${Object.keys(baseSet).length} fields)`);
  if (!baseResult.success) {
    log('  Base set failed - investigate minimal payload\n', 'red');
    return;
  }
  log('');

  // Date fields (expected to be auto-enter)
  log('Test 2: Adding Date Fields', 'yellow');
  await testFieldSet(token, { ...baseSet, date_received: today }, 'Base + date_received');
  await testFieldSet(token, { ...baseSet, due_date: today }, 'Base + due_date');
  await testFieldSet(token, { ...baseSet, job_date: today }, 'Base + job_date');
  await testFieldSet(token, { ...baseSet, date_received: today, due_date: today, job_date: today }, 'Base + all date fields');
  log('');

  // Contact info additions
  log('Test 3: Adding Contact Information', 'yellow');
  const withContact = {
    ...baseSet,
    contact_C1: 'Test Contact',
    phone_C1: '801-555-1234'
  };
  await testFieldSet(token, withContact, 'Base + contact_C1 + phone_C1');

  const withContactExtras = {
    ...withContact,
    address2_C1: 'Suite 200',
    client_order_number_2: `TRACK_${testId}`
  };
  await testFieldSet(token, withContactExtras, 'Base + contact extras');
  log('');

  // Return location
  log('Test 4: Adding Return Location', 'yellow');
  const withReturn = {
    ...withContactExtras,
    location_return: 'FedEx'
  };
  await testFieldSet(token, withReturn, 'Base + return location');
  log('');

  // Product information
  log('Test 5: Adding Product Fields', 'yellow');
  const withProduct = {
    ...withReturn,
    product_serial_number: `SN_${testId}`,
    description_product: 'Test Equipment',
    product_type: 'Copier',
    piece_total: 1
  };
  await testFieldSet(token, withProduct, 'Base + product fields');
  log('');

  // Notes
  log('Test 6: Adding Notes Fields', 'yellow');
  const withNotes = {
    ...withProduct,
    notes_call_ahead: 'Call 30 minutes prior',
    notes_driver: 'Use rear dock',
    notes_job: 'Handle with care',
    notes_schedule: `Requested due date: ${today}`
  };
  await testFieldSet(token, withNotes, 'Base + product + notes');
  log('');

  // Additional numeric metrics (oneway_miles, detainment, Quoted)
  log('Test 7: Adding Additional Job Metrics', 'yellow');
  const withMetrics = {
    ...withProduct,
    oneway_miles: 0,
    detainment: 0,
    Quoted: 0
  };
  await testFieldSet(token, withMetrics, 'Base + product + numeric metrics');
  log('');

  log('\n=== Diagnostics Complete ===\n', 'blue');
}

runDiagnostics().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
