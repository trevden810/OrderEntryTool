/**
 * FileMaker API Service
 */

import FM_CONFIG from '../config/filemaker.js';
import { enrichWithLookups } from './lookupService.js';

export async function authenticate(database = FM_CONFIG.SEARCH_DB.name) {
  const response = await fetch(FM_CONFIG.getAuthUrl(database), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${FM_CONFIG.AUTH.username}:${FM_CONFIG.AUTH.password}`)}`
    }
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.messages?.[0]?.code === '0') {
    return {
      success: true,
      token: data.response.token
    };
  }
  
  throw new Error('Authentication failed');
}

export async function logout(token, database = FM_CONFIG.SEARCH_DB.name) {
  try {
    await fetch(FM_CONFIG.getLogoutUrl(database, token), {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function searchJobs(orderNumber, token) {
  const response = await fetch(
    FM_CONFIG.getSearchUrl(FM_CONFIG.SEARCH_DB.name, FM_CONFIG.SEARCH_DB.layout),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: [{ 'client_order_number': orderNumber }],
        limit: '100'
      })
    }
  );

  const data = await response.json();
  
  if (data.messages?.[0]?.code === '401') {
    return { success: true, data: [], found: false };
  }
  
  if (response.ok && data.response?.data) {
    return { success: true, data: data.response.data, found: true };
  }
  
  throw new Error(`Search failed: ${response.status}`);
}

/**
 * Create a job record in FileMaker
 * Uses DIRECT fieldData format (not payload wrapper)
 * @param {object} jobData - Job data with all fields
 * @param {string} token - Auth token
 * @returns {Promise<object>} Result with recordId
 */
export async function createJob(jobData, token) {
  console.log('Creating job with direct fieldData format');
  console.log('Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
  
  // Enrich job data with resolved foreign keys
  const enrichedData = await enrichWithLookups(jobData, token);
  
  console.log('Enriched data sample:', {
    client_code: enrichedData._kf_client_code_id,
    city: enrichedData._kf_city_id,
    state: enrichedData._kf_state_id,
    order_number: enrichedData.client_order_number
  });

  // Use DIRECT fieldData format (confirmed: payload wrapper creates ghost records)
  const payload = {
    fieldData: enrichedData
  };

  const response = await fetch(
    FM_CONFIG.getCreateUrl(FM_CONFIG.CREATE_DB.name, FM_CONFIG.CREATE_DB.layout),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json();

  if (response.ok && data.response) {
    console.log('✓ Job created successfully:', data.response.recordId);
    return {
      success: true,
      recordId: data.response.recordId,
      modId: data.response.modId
    };
  }

  // Log detailed error for debugging
  console.error('✗ Job creation failed:', {
    status: response.status,
    code: data.messages?.[0]?.code,
    message: data.messages?.[0]?.message,
    response: data
  });

  throw new Error(
    `Job creation failed: ${response.status} - ` +
    `Code ${data.messages?.[0]?.code}: ${data.messages?.[0]?.message || 'Unknown error'}`
  );
}

export async function testConnection() {
  try {
    const auth = await authenticate();
    await logout(auth.token);
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Create a job with automatic authentication and logout
 * @param {object} jobData - Job data to create
 * @returns {Promise<object>} Result with recordId
 */
export async function createJobWithAuth(jobData) {
  let token;
  try {
    // Authenticate
    const auth = await authenticate(FM_CONFIG.CREATE_DB.name);
    token = auth.token;
    
    // Create job
    const result = await createJob(jobData, token);
    
    // Logout
    await logout(token, FM_CONFIG.CREATE_DB.name);
    
    return result;
  } catch (error) {
    if (token) {
      await logout(token, FM_CONFIG.CREATE_DB.name);
    }
    throw error;
  }
}
