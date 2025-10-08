/**
 * Test different date formats to find what FileMaker accepts
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

async function testDateFormat(token, formatName, dateFormatter) {
  const today = new Date();
  
  const testJob = {
    job_status: 'Entered',
    job_type: 'Delivery',
    job_date: dateFormatter(today),
    date_received: dateFormatter(today),
    due_date: dateFormatter(today),
    
    _kf_client_code_id: 'TTR-u',
    _kf_client_id: '1247',
    _kf_client_class_id: '110.1',
    _kf_disposition: 'Standard',
    _kf_notification_id: 'Yes',
    _kf_market_id: 'Utah',
    
    client_order_number: `TEST_DATE_${Date.now()}`,
    
    Customer_C1: 'Test Customer',
    address_C1: '123 Test Street',
    zip_C1: '84119',
    _kf_city_id: 'West Valley City',
    _kf_state_id: 'UT',
    
    location_load: 'PEP',
    people_required: 2,
    oneway_miles: 0,
    piece_total: 1,
    
    Additional_unit: 'NO',
    same_day: 'NO',
    same_day_return: 'NO',
    staging: 'NO',
    named_insurance: 'NO',
    billing_status: 'Initial',
    
    account_create: 'test',
    account_mod: 'test'
  };

  log(`\nTesting: ${formatName}`, 'yellow');
  log(`  Sample date: ${testJob.job_date}`, 'reset');
  
  const response = await fetch(
    `${BASE_URL}/databases/${DATABASE}/layouts/${LAYOUT}/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fieldData: testJob })
    }
  );

  const data = await response.json();
  
  if (response.ok && data.response?.recordId) {
    log(`  ✓ SUCCESS - Record ID: ${data.response.recordId}`, 'green');
    return true;
  } else {
    log(`  ✗ FAILED - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
    return false;
  }
}

async function run() {
  try {
    log('\n=== Testing Date Formats for FileMaker ===\n', 'blue');

    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');

    // Test various date formats
    const formats = [
      {
        name: 'MM/DD/YYYY (US format)',
        formatter: (d) => {
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          return `${month}/${day}/${year}`;
        }
      },
      {
        name: 'M/D/YYYY (no padding)',
        formatter: (d) => {
          const month = d.getMonth() + 1;
          const day = d.getDate();
          const year = d.getFullYear();
          return `${month}/${day}/${year}`;
        }
      },
      {
        name: 'YYYY-MM-DD (ISO format)',
        formatter: (d) => d.toISOString().split('T')[0]
      },
      {
        name: 'DD/MM/YYYY (European format)',
        formatter: (d) => {
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        }
      },
      {
        name: 'MM-DD-YYYY (dashes)',
        formatter: (d) => {
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          return `${month}-${day}-${year}`;
        }
      },
      {
        name: 'Empty string',
        formatter: (d) => ''
      }
    ];

    for (const format of formats) {
      const success = await testDateFormat(token, format.name, format.formatter);
      if (success) {
        log(`\n${'='.repeat(60)}`, 'green');
        log(`✓ WORKING FORMAT FOUND: ${format.name}`, 'green');
        log(`${'='.repeat(60)}\n`, 'green');
        break;
      }
    }

    log('\n=== Test Complete ===\n', 'blue');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
