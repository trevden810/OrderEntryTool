/**
 * Search for test job in main jobs table
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const SEARCH_DB = 'PEP2_1';
const SEARCH_LAYOUT = 'jobs_api';

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
  const response = await fetch(`${BASE_URL}/databases/${SEARCH_DB}/sessions`, {
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

async function searchForJob(token, orderNumber) {
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
        limit: '10'
      })
    }
  );

  const data = await response.json();
  return { response, data };
}

async function run() {
  try {
    log('\n=== Searching for Test Job ===\n', 'blue');
    
    const orderNumber = 'TEST_REAL_1759861637469';
    log(`Searching for order: ${orderNumber}`, 'yellow');
    
    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');
    
    const { response, data } = await searchForJob(token, orderNumber);
    
    if (data.messages?.[0]?.code === '401') {
      log('✗ Job NOT FOUND in main jobs table', 'red');
      log('  This means the payload wrapper created a staging record only', 'yellow');
      log('  The job was NOT automatically processed\n', 'red');
      return false;
    }
    
    if (response.ok && data.response?.data?.[0]) {
      log('✓ JOB FOUND in main jobs table!', 'green');
      log('  This confirms the payload wrapper approach WORKS!\n', 'green');
      
      const job = data.response.data[0].fieldData;
      log('Job Details:', 'blue');
      log(`  Record ID: ${data.response.data[0].recordId}`, 'reset');
      log(`  Order Number: ${job.client_order_number}`, 'reset');
      log(`  Job Status: ${job.job_status}`, 'reset');
      log(`  Job Type: ${job.job_type}`, 'reset');
      log(`  Customer: ${job.Customer_C1}`, 'reset');
      log(`  Address: ${job.address_C1}`, 'reset');
      log(`  Product: ${job.description_product}`, 'reset');
      log('');
      
      log('=== CONFIRMED: Payload Wrapper Works! ===\n', 'green');
      log('Next steps:', 'yellow');
      log('1. Revert filemakerService.js to use payload wrapper', 'reset');
      log('2. Add status="pending" and processed=0 trigger fields', 'reset');
      log('3. Remove lookupService.js (not needed)', 'reset');
      log('4. Continue with MVP Step 2 (extraction pipeline)\n', 'reset');
      
      return true;
    } else {
      log('✗ Search failed with unexpected error', 'red');
      console.log(data);
      return false;
    }
    
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

run();
