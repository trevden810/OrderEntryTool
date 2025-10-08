/**
 * List layouts in PEP2_1 database
 * This is where we search jobs, maybe we should create them here too
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const DATABASE = 'PEP2_1';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
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

async function listLayouts(token) {
  const response = await fetch(
    `${BASE_URL}/databases/${DATABASE}/layouts`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list layouts: ${response.status}`);
  }

  const data = await response.json();
  return data.response.layouts;
}

async function getLayoutMetadata(token, layoutName) {
  const response = await fetch(
    `${BASE_URL}/databases/${DATABASE}/layouts/${layoutName}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.response;
}

async function run() {
  try {
    log('\n=== PEP2_1 Database Layout Inspector ===\n', 'blue');

    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');

    log('Fetching all layouts...', 'yellow');
    const layouts = await listLayouts(token);

    log(`\n✓ Found ${layouts.length} layouts\n`, 'green');

    // Check each layout for field count
    const layoutDetails = [];

    for (const layout of layouts) {
      log(`Checking layout: ${layout.name}...`, 'reset');
      const metadata = await getLayoutMetadata(token, layout.name);
      if (metadata) {
        const fieldCount = metadata.fieldMetaData.length;
        const hasJobFields = metadata.fieldMetaData.some(f => 
          f.name.includes('job_') || 
          f.name.includes('client_') || 
          f.name.includes('Customer_')
        );
        
        layoutDetails.push({
          name: layout.name,
          fieldCount,
          hasJobFields,
          fields: metadata.fieldMetaData.map(f => f.name)
        });
      }
    }

    log('');

    // Sort by field count (descending)
    layoutDetails.sort((a, b) => b.fieldCount - a.fieldCount);

    log('=== LAYOUT ANALYSIS ===\n', 'blue');

    for (const layout of layoutDetails) {
      const marker = layout.hasJobFields ? '✓' : ' ';
      const color = layout.hasJobFields ? 'green' : 'reset';
      
      log(`${marker} ${layout.name}`, color);
      log(`  Fields: ${layout.fieldCount}`, 'reset');
      
      if (layout.hasJobFields) {
        log(`  Contains job-related fields!`, 'yellow');
        
        // Show sample job fields
        const jobFields = layout.fields.filter(f => 
          f.includes('job_') || 
          f.includes('client_') || 
          f.includes('Customer_') ||
          f.includes('address_') ||
          f.includes('product_')
        );
        
        if (jobFields.length > 0 && jobFields.length <= 10) {
          log(`  Job fields: ${jobFields.join(', ')}`, 'reset');
        } else if (jobFields.length > 10) {
          log(`  Job fields (${jobFields.length}): ${jobFields.slice(0, 10).join(', ')}...`, 'reset');
        }
      }
      log('');
    }

    // Find layouts with write capability
    log('\n=== TESTING WRITE ACCESS ===\n', 'blue');
    
    const createCandidates = layoutDetails.filter(l => l.hasJobFields);
    
    for (const layout of createCandidates.slice(0, 3)) {
      log(`Testing: ${layout.name}`, 'yellow');
      
      // Try to create a minimal test record
      const testData = {
        fieldData: {
          client_order_number: `TEST_ACCESS_${Date.now()}`
        }
      };
      
      const response = await fetch(
        `${BASE_URL}/databases/${DATABASE}/layouts/${layout.name}/records`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testData)
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.response?.recordId) {
        log(`  ✓ WRITE ACCESS - Can create records!`, 'green');
        log(`  Record ID: ${data.response.recordId}`, 'reset');
        log(`  ** THIS LAYOUT WORKS FOR CREATING JOBS **\n`, 'magenta');
      } else {
        log(`  ✗ No write access - ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message}`, 'red');
        log('');
      }
    }

    log('\n=== Inspection Complete ===\n', 'blue');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
