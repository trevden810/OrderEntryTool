/**
 * Data Extraction Service - Final cleanup
 */

import {
  EXTRACTION_PATTERNS,
  extractField,
  extractAllMatches,
  detectJobType,
  detectClient,
  calculateConfidence
} from '../utils/patterns.js';

function parseOriginBlock(text) {
  const match = text.match(/DESTINATION:\s+(.*?)\s+Asset/s);
  if (!match) return null;
  
  const block = match[1];
  const originText = block.split(/Pacific Office Automation -AZ|KC KAISER/)[0];
  
  const companyMatch = originText.match(/(Pacific Office Automation[^0-9]+)/);
  const companyName = companyMatch ? companyMatch[1].trim() : '';
  
  // Fixed: stop at Suite to avoid including it in address
  const addressMatch = originText.match(/(\d{3,5}\s+(?:North|South|East|West)\s+\d{3,5}\s+(?:North|South|East|West))/i);
  const address = addressMatch ? addressMatch[1].trim() : '';
  
  const suiteMatch = originText.match(/(Suite\s+[A-Z0-9]+|Ste\s+[A-Z0-9]+)/i);
  const suite = suiteMatch ? suiteMatch[0] : '';
  
  const cityStateMatch = originText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z]{2})\s+(\d{5})/);
  const city = cityStateMatch ? cityStateMatch[1].trim() : '';
  const state = cityStateMatch ? cityStateMatch[2] : '';
  const zip = cityStateMatch ? cityStateMatch[3] : '';
  
  return { companyName, address, suite, city, state, zip };
}

function extractProduct(text) {
  const assetMatch = text.match(/Asset\s+Serial Number.*?(Konica|Canon|Ricoh|HP|Xerox|Sharp)\s+([A-Za-z0-9\s]+?)\s+[A-Z]{3}\d/i);
  return assetMatch ? `${assetMatch[1]} ${assetMatch[2]}`.trim() : '';
}

function detectJobTypeFromDates(text) {
  const loadMatch = text.match(/Load:\s+(\d{1,2})\/(\d{1,2})/);
  if (loadMatch) {
    const loadMonth = parseInt(loadMatch[1]);
    const loadDay = parseInt(loadMatch[2]);
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    
    if (loadMonth > todayMonth || (loadMonth === todayMonth && loadDay >= todayDay)) {
      return 'Pickup';
    }
  }
  return 'Delivery';
}

export function extractDataFromText(text) {
  const data = {};
  
  const origin = parseOriginBlock(text);
  if (origin) {
    data.customerName = origin.companyName;
    data.address = origin.address;
    data.suite = origin.suite;
    data.city = origin.city;
    data.state = origin.state;
    data.zipCode = origin.zip;
  }
  
  const orderMatch = text.match(/Order\s*#:\s+(\d{6})/);
  data.orderNumber = orderMatch ? orderMatch[1] : '';
  
  const trackingMatch = text.match(/Carrier's\s+No\.\s+MC#(\d+)/);
  data.trackingNumber = trackingMatch ? trackingMatch[1] : '';
  
  const serialNumbers = extractAllMatches(text, EXTRACTION_PATTERNS.serialNumber)
    .filter(sn => sn.toLowerCase() !== 'number' && sn.length > 3);
  data.serialNumber = serialNumbers[0] || '';
  data.allSerialNumbers = serialNumbers;
  
  const phones = extractAllMatches(text, EXTRACTION_PATTERNS.phone);
  data.phone = phones[0] || '';
  
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  data.email = emailMatch ? emailMatch[0] : '';
  
  const contactMatch = text.match(/TTR Contact:\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
  data.contactName = contactMatch ? contactMatch[1] : '';
  
  const deliverMatch = text.match(/Deliver:\s+\d{1,2}\/\d{1,2}-(\d{1,2}\/\d{1,2})/);
  data.dueDate = deliverMatch ? deliverMatch[1] : '';
  
  data.productDescription = extractProduct(text);
  
  const qtyMatch = text.match(/Qty\s+(\d+)/i);
  data.quantity = qtyMatch ? qtyMatch[1] : '1';
  
  const weightMatch = text.match(/(\d{2,4})\s+lbs/i);
  data.weight = weightMatch ? weightMatch[1] : '';
  
  const callAheadMatches = extractAllMatches(text, EXTRACTION_PATTERNS.callAhead);
  data.callAhead = callAheadMatches[0] || '';
  
  data.jobType = detectJobTypeFromDates(text);
  data.clientType = detectClient(text);
  data.confidence = calculateConfidence(data);
  
  return data;
}

export function createJobsFromExtraction(extractedData) {
  const serialNumbers = extractedData.allSerialNumbers || [extractedData.serialNumber];
  return serialNumbers.filter(sn => sn && sn.length > 0).map(serialNumber => ({
    ...extractedData,
    serialNumber,
    confidence: extractedData.confidence
  }));
}
