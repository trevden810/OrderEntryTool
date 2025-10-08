/**
 * Minimal field test - determine which field is missing
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const CREATE_DB = 'pep-move-api';
const CREATE_LAYOUT = 'table';

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

async function testMinimal(token) {
  // Start with absolute minimum
  const minimal = {
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

  console.log('\nTesting minimal payload...');
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fieldData: minimal })
    }
  );

  const data = await response.json();
  
  if (response.ok && data.response?.recordId) {
    console.log('✓ SUCCESS - Record created:', data.response.recordId);
    console.log('\nMinimal working payload:', Object.keys(minimal).join(', '));
  } else {
    console.log('✗ FAILED:', JSON.stringify(data, null, 2));
  }
}

async function run() {
  try {
    const token = await authenticate();
    await testMinimal(token);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
