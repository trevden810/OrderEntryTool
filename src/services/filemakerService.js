/**
 * FileMaker API Service
 */

import FM_CONFIG from '../config/filemaker.js';

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

export async function createJob(jobData, token) {
  // Use payload wrapper format (test script confirms this works)
  console.log('Creating job with token:', token ? token.substring(0, 20) + '...' : 'MISSING TOKEN');
  
  const payload = {
    fieldData: {
      payload: JSON.stringify(jobData)
    }
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
    return {
      success: true,
      recordId: data.response.recordId,
      modId: data.response.modId
    };
  }

  throw new Error(`Job creation failed: ${response.status} - ${JSON.stringify(data)}`);
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

export async function createJobWithAuth(jobData) {
  let token;
  try {
    const auth = await authenticate(FM_CONFIG.CREATE_DB.name);
    token = auth.token;
    
    const result = await createJob(jobData, token);
    
    await logout(token, FM_CONFIG.CREATE_DB.name);
    
    return result;
  } catch (error) {
    if (token) {
      await logout(token, FM_CONFIG.CREATE_DB.name);
    }
    throw error;
  }
}
