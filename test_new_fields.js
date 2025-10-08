/**
 * Test script for new BOL email field extraction
 */

import { extractDataFromText } from './src/services/extractionService.js';
import { mapToFileMakerFields } from './src/utils/fieldMappings.js';

// Sample BOL email text based on the example provided
const sampleBOLText = `
Please see the attached BOL for pickup during the next available Mountain run, this will go on the Lucky transfer.

Origin contacts: Kevin Thompson (970) 753-9885 KThompson@imagenet.com

Origin notes: 24-hour pre-call requested - Please park in back by DOOR B, back up to the double doors - Liftgate needed - No dock - No steps - Hours: Monday-Friday 8AM-5PM

$410.00

All the best,
`;

// Test the extraction
console.log('=== TESTING NEW BOL FIELD EXTRACTION ===\n');

const extractedData = extractDataFromText(sampleBOLText);

console.log('Extracted Data:');
console.log('Scheduling Info:', extractedData.schedulingInfo);
console.log('Origin Contacts:', extractedData.originContacts);
console.log('Origin Notes:', extractedData.originNotes);
console.log('Pricing:', extractedData.pricing);
console.log('Service Requirements:', extractedData.serviceRequirements);
console.log('Location Instructions:', extractedData.locationInstructions);

console.log('\n=== MAPPED TO FILEMAKER FIELDS ===\n');

const mappedData = mapToFileMakerFields(extractedData);

console.log('Mapped Data:');
console.log('Scheduling Info:', mappedData.scheduling_info);
console.log('Origin Contacts:', mappedData.origin_contacts);
console.log('Origin Notes:', mappedData.origin_notes);
console.log('Pricing Amount:', mappedData.pricing_amount);
console.log('Service Requirements:', mappedData.service_requirements);
console.log('Location Instructions:', mappedData.location_instructions);

console.log('\n=== TEST COMPLETE ===');