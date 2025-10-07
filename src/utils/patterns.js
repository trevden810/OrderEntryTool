/**
 * Extraction Patterns for BOL Data
 * Regex patterns for extracting fields from PDF text
 */

export const EXTRACTION_PATTERNS = {
  // Order numbers (primary identifiers)
  orderNumber: [
    /(?:order|po|purchase\s*order|ref(?:erence)?|job|#)\s*[:\-#]?\s*([A-Z0-9\-]{6,20})/gi,
    /(?:client\s*order|order\s*#)\s*[:\-#]?\s*([A-Z0-9\-]{6,20})/gi,
    /\b\d{6,10}\b/g  // 6-10 digit standalone numbers
  ],
  
  // Tracking/shipment numbers
  trackingNumber: [
    /(?:tracking|shipment|manifest|pro|bill\s*of\s*lading)\s*[:\-#]?\s*([A-Z0-9\-]{6,20})/gi,
    /\b[A-Z]{2,4}\d{8,12}\b/g
  ],
  
  // Serial numbers - improved to avoid "Number" placeholder
  serialNumber: [
    /(?:serial\s*(?:number|#|no)?|s\/n|sn|unit\s*#?)\s*[:\-]?\s*([A-Z]{2,4}\d{6,12}[A-Z0-9]*)/gi,
    /\b[A-Z]{3}\d{5,10}[A-Z0-9]{0,5}\b/g  // Format like ACV70119LLE7
  ],
  
  // Customer/company name - improved to capture business names
  customerName: [
    /(?:company|business|customer|account)\s*[:\-]?\s*([A-Z][A-Za-z0-9\s\.,&\-]{3,60}(?:LLC|Inc|Corp|Ltd|Co)?)/gi,
    /^([A-Z][A-Za-z\s&\-]{3,50}(?:LLC|Inc|Corp|Ltd|Co|Automation|Office|Services|Industries))/gm
  ],
  
  // Contact name (separate from company)
  contactName: [
    /(?:contact|attn|attention|name)\s*[:\-]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi
  ],
  
  // Address - improved to avoid legal text
  address: [
    /^\d{1,6}\s+[A-Z][A-Za-z0-9\s,\.#\-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Blvd|Boulevard|Parkway|Pkwy|Circle|Cir)(?:\s+[A-Za-z]{1,10})?/gmi,
    /\d{1,6}\s+(?:North|South|East|West|N|S|E|W)?\s*[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)/gi
  ],
  
  // Suite/Unit
  suite: [
    /(?:suite|ste|unit|#)\s*([A-Z0-9\-]{1,10})/gi
  ],
  
  // City, State, ZIP together
  cityStateZip: [
    /([A-Z][A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/g,
    /^([A-Z][A-Za-z\s]+),?\s+([A-Z]{2}),?\s+(\d{5}(?:-\d{4})?)$/gm
  ],
  
  // City alone
  city: [
    /(?:city)\s*[:\-]?\s*([A-Z][A-Za-z\s]+)/gi
  ],
  
  // State alone
  state: [
    /(?:state)\s*[:\-]?\s*([A-Z]{2})\b/gi
  ],
  
  // ZIP code standalone
  zipCode: [
    /\b\d{5}(?:-\d{4})?\b/g
  ],
  
  // Phone numbers
  phone: [
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
    /\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})/g
  ],
  
  // Email
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ],
  
  // Dates
  date: [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
    /(?:due|delivery|pickup|scheduled)\s*(?:date)?[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/gi
  ],
  
  // Product description - improved
  productDescription: [
    /(?:description|product|model|equipment|item)\s*[:\-]?\s*([A-Za-z0-9\s\-\/\(\)]{5,100})/gi,
    /\d+\s+(?:PCS|pieces|pcs|PC)/gi
  ],
  
  // Quantity/pieces
  quantity: [
    /(\d+)\s+(?:PCS|pieces|units|pcs|PC)/gi,
    /(?:qty|quantity)\s*[:\-]?\s*(\d+)/gi
  ],
  
  // Weight
  weight: [
    /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/gi,
    /(?:weight)\s*[:\-]?\s*(\d+(?:\.\d+)?)/gi
  ],
  
  // Call ahead requirements
  callAhead: [
    /(\d+\s*(?:hour|hr|minute|min)s?\s*(?:prior|ahead|notice))/gi,
    /(call\s*(?:ahead|before|upon\s*arrival))/gi,
    /(24\s*hr|same\s*day|1\s*hour)\s*(?:call|notice)/gi,
    /(\d+\s+Min\s+Prior)/gi
  ],
  
  // Special instructions
  specialInstructions: [
    /(?:notes?|instructions?|special|requirements?)\s*[:\-]?\s*([A-Za-z0-9\s\-,\.]{10,200})/gi,
    /(?:liftgate|stairs|dock|door|loading|freight\s*elevator)/gi
  ],
  
  // Job type indicators
  jobTypeDelivery: [
    /delivery|deliver|ship\s*to|drop\s*off/gi
  ],
  
  jobTypePickup: [
    /pickup|pick\s*up|collect|retrieve/gi
  ],
  
  // Client identifiers
  clientTTR: [
    /ttr/gi,
    /texas\s*truck\s*rental/gi
  ],
  
  clientValley: [
    /valley/gi
  ],
  
  clientCanon: [
    /canon/gi,
    /imagerunner/gi
  ],
  
  clientRicoh: [
    /ricoh|lanier|savin/gi
  ],
  
  clientPacific: [
    /pacific\s*office/gi
  ]
};

// Filter out legal disclaimer text
const LEGAL_TEXT_PATTERNS = [
  /received.*subject\s+to\s+individually/i,
  /rates\s+or\s+contracts\s+that\s+have\s+been\s+agreed/i,
  /classifications\s+and\s+rules/i,
  /otherwise\s+to\s+the\s+rates/i
];

/**
 * Check if text is legal disclaimer
 */
function isLegalText(text) {
  return LEGAL_TEXT_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Extract data from text using patterns
 */
export function extractField(text, patterns, filterLegal = false) {
  if (!text || !patterns) return null;
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const value = matches[0].trim();
      if (filterLegal && isLegalText(value)) continue;
      return value;
    }
  }
  
  return null;
}

/**
 * Extract all matches for a pattern
 */
export function extractAllMatches(text, patterns, filterLegal = false) {
  if (!text || !patterns) return [];
  
  const allMatches = new Set();
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1] || match[0];
      const trimmed = value.trim();
      
      if (filterLegal && isLegalText(trimmed)) continue;
      if (trimmed.length > 0) {
        allMatches.add(trimmed);
      }
    }
  }
  
  return Array.from(allMatches);
}

/**
 * Detect job type from text
 */
export function detectJobType(text) {
  const deliveryMatches = extractAllMatches(text, EXTRACTION_PATTERNS.jobTypeDelivery);
  const pickupMatches = extractAllMatches(text, EXTRACTION_PATTERNS.jobTypePickup);
  
  if (deliveryMatches.length > pickupMatches.length) return 'Delivery';
  if (pickupMatches.length > deliveryMatches.length) return 'Pickup';
  
  return 'Delivery'; // Default
}

/**
 * Detect client from text
 */
export function detectClient(text) {
  if (extractField(text, EXTRACTION_PATTERNS.clientPacific)) return 'PACIFIC';
  if (extractField(text, EXTRACTION_PATTERNS.clientTTR)) return 'TTR';
  if (extractField(text, EXTRACTION_PATTERNS.clientValley)) return 'VALLEY';
  if (extractField(text, EXTRACTION_PATTERNS.clientCanon)) return 'CANON';
  if (extractField(text, EXTRACTION_PATTERNS.clientRicoh)) return 'RICOH';
  
  return 'GENERIC';
}

/**
 * Calculate confidence score for extraction
 */
export function calculateConfidence(extractedData) {
  let score = 0;
  const weights = {
    orderNumber: 20,
    address: 15,
    zipCode: 10,
    customerName: 10,
    serialNumber: 15,
    productDescription: 10,
    phone: 10,
    email: 5,
    date: 5
  };
  
  for (const [field, weight] of Object.entries(weights)) {
    if (extractedData[field] && 
        extractedData[field] !== 'Not found' && 
        extractedData[field] !== 'Number') {
      score += weight;
    }
  }
  
  return score;
}
