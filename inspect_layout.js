/**
 * FileMaker Layout Metadata Inspector
 * Fetches field information from the 'table' layout
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

async function getLayoutMetadata(token) {
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get layout metadata: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

async function getRecordById(token, recordId) {
  const response = await fetch(
    `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/records/${recordId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get record: ${response.status}`);
  }

  const data = await response.json();
  return data.response.data[0];
}

async function run() {
  try {
    log('\n=== FileMaker Layout Inspector ===\n', 'blue');

    const token = await authenticate();
    log('✓ Authenticated successfully\n', 'green');

    // Get layout metadata
    log('Fetching layout metadata...', 'yellow');
    const metadata = await getLayoutMetadata(token);

    log(`\nLayout: ${CREATE_LAYOUT}`, 'blue');
    log(`Database: ${CREATE_DB}\n`, 'blue');

    // Analyze field metadata
    const fields = metadata.fieldMetaData;
    
    log(`Total fields in layout: ${fields.length}\n`, 'magenta');

    // Categorize fields
    const requiredFields = [];
    const globalFields = [];
    const calculationFields = [];
    const normalFields = [];

    for (const field of fields) {
      if (field.global === 'yes') {
        globalFields.push(field);
      } else if (field.result === 'calculation') {
        calculationFields.push(field);
      } else if (field.autoEnter === 'yes' || field.notEmpty === 'yes') {
        requiredFields.push(field);
      } else {
        normalFields.push(field);
      }
    }

    // Display required/auto-enter fields
    log('=== REQUIRED / AUTO-ENTER FIELDS ===', 'red');
    if (requiredFields.length > 0) {
      for (const field of requiredFields) {
        log(`\n  ${field.name}`, 'yellow');
        log(`    Type: ${field.result}`, 'reset');
        log(`    Not Empty: ${field.notEmpty || 'no'}`, 'reset');
        log(`    Auto Enter: ${field.autoEnter || 'no'}`, 'reset');
        log(`    Repeats: ${field.maxRepeat || 1}`, 'reset');
      }
    } else {
      log('  No explicitly required fields found', 'reset');
    }

    // Display global fields
    log('\n\n=== GLOBAL FIELDS ===', 'blue');
    if (globalFields.length > 0) {
      for (const field of globalFields) {
        log(`  ${field.name} (${field.result})`, 'reset');
      }
    } else {
      log('  None', 'reset');
    }

    // Display calculation fields
    log('\n=== CALCULATION FIELDS (READ-ONLY) ===', 'blue');
    if (calculationFields.length > 0) {
      for (const field of calculationFields) {
        log(`  ${field.name} (${field.result})`, 'reset');
      }
    } else {
      log('  None', 'reset');
    }

    // Display all normal fields (potential fields to send)
    log('\n=== EDITABLE FIELDS ===', 'green');
    log(`(${normalFields.length} fields)\n`, 'green');
    
    const fieldNames = normalFields.map(f => f.name).sort();
    for (let i = 0; i < fieldNames.length; i += 3) {
      const row = fieldNames.slice(i, i + 3);
      log(`  ${row.join(', ')}`, 'reset');
    }

    // Try to fetch a recent record to see what fields are populated
    log('\n\n=== CHECKING RECENT RECORDS ===', 'yellow');
    try {
      // Search for any record
      const searchResponse = await fetch(
        `${BASE_URL}/databases/${CREATE_DB}/layouts/${CREATE_LAYOUT}/_find`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: [{ job_status: '*' }],
            limit: 1,
            sort: [{ fieldName: 'timestamp_create', sortOrder: 'descend' }]
          })
        }
      );

      const searchData = await searchResponse.json();
      
      if (searchData.response?.data?.[0]) {
        const record = searchData.response.data[0];
        log(`\n✓ Found recent record (ID: ${record.recordId})`, 'green');
        log('\nPopulated fields in this record:', 'blue');
        
        const populatedFields = Object.entries(record.fieldData)
          .filter(([key, value]) => value !== null && value !== '')
          .map(([key]) => key)
          .sort();
        
        log(`\nTotal populated fields: ${populatedFields.length}`, 'magenta');
        for (let i = 0; i < populatedFields.length; i += 3) {
          const row = populatedFields.slice(i, i + 3);
          log(`  ${row.join(', ')}`, 'reset');
        }

        // Save to file for reference
        const fs = require('fs');
        fs.writeFileSync(
          'layout_metadata.json',
          JSON.stringify({ metadata, sampleRecord: record }, null, 2)
        );
        log('\n✓ Full metadata saved to layout_metadata.json', 'green');
      }
    } catch (error) {
      log(`\n✗ Could not fetch sample record: ${error.message}`, 'red');
    }

    log('\n=== Inspection Complete ===\n', 'blue');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

run();
