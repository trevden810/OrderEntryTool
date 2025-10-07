/**
 * List All Available Layouts in Database
 */

const BASE_URL = 'https://modd.mainspringhost.com/fmi/data/vLatest';
const USERNAME = 'trevor_api';
const PASSWORD = 'XcScS2yRoTtMo7';
const CREATE_DB = 'pep-move-api';

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

async function listLayouts(token) {
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts`,
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
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${layoutName}`,
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
    log('\n=== FileMaker Database Layout Inspector ===\n', 'blue');
    log(`Database: ${CREATE_DB}\n`, 'magenta');

    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');

    log('Fetching all layouts...', 'yellow');
    const layouts = await listLayouts(token);

    log(`\n✓ Found ${layouts.length} layouts\n`, 'green');

    // Check each layout for field count
    const layoutDetails = [];

    for (const layout of layouts) {
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

    // Sort by field count (descending) - layouts with more fields are likely the ones we want
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
        
        if (jobFields.length > 0) {
          log(`  Sample fields: ${jobFields.slice(0, 5).join(', ')}...`, 'reset');
        }
      }
      log('');
    }

    // Recommend layouts
    log('\n=== RECOMMENDATIONS ===\n', 'blue');
    
    const bestLayouts = layoutDetails
      .filter(l => l.hasJobFields)
      .sort((a, b) => b.fieldCount - a.fieldCount)
      .slice(0, 3);

    if (bestLayouts.length > 0) {
      log('Best candidates for job creation (most job fields):\n', 'green');
      for (let i = 0; i < bestLayouts.length; i++) {
        log(`${i + 1}. ${bestLayouts[i].name} (${bestLayouts[i].fieldCount} fields)`, 'yellow');
      }
      
      log(`\nRecommendation: Try using layout "${bestLayouts[0].name}" instead of "table"`, 'magenta');
      log(`\nUpdate .env file:`, 'yellow');
      log(`VITE_FILEMAKER_CREATE_LAYOUT=${bestLayouts[0].name}`, 'reset');
    } else {
      log('⚠ No layouts found with job-related fields!', 'red');
      log('The "table" layout with payload wrapper may be the only option.\n', 'yellow');
    }

    // Save detailed layout info
    const fs = require('fs');
    fs.writeFileSync(
      'all_layouts.json',
      JSON.stringify(layoutDetails, null, 2)
    );
    log('\n✓ Full layout details saved to all_layouts.json\n', 'green');

    log('=== Inspection Complete ===\n', 'blue');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
