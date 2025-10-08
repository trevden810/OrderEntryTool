/**
 * Test script for new BOL email field extraction patterns only
 */

import { EXTRACTION_PATTERNS, extractAllMatches } from './src/utils/patterns.js';

// Sample BOL email text based on the example provided
const sampleBOLText = `
Please see the attached BOL for pickup during the next available Mountain run, this will go on the Lucky transfer.

Origin contacts: Kevin Thompson (970) 753-9885 KThompson@imagenet.com

Origin notes: 24-hour pre-call requested - Please park in back by DOOR B, back up to the double doors - Liftgate needed - No dock - No steps - Hours: Monday-Friday 8AM-5PM

$410.00

All the best,
`;

// Test the extraction patterns
console.log('=== TESTING NEW BOL FIELD EXTRACTION PATTERNS ===\n');

console.log('Scheduling Info Matches:');
const schedulingMatches = extractAllMatches(sampleBOLText, EXTRACTION_PATTERNS.schedulingInfo);
console.log(schedulingMatches);

console.log('\nOrigin Contacts Matches:');
const originContactsMatches = extractAllMatches(sampleBOLText, EXTRACTION_PATTERNS.originContacts);
console.log(originContactsMatches);

console.log('\nOrigin Notes Matches:');
const originNotesMatches = extractAllMatches(sampleBOLText, EXTRACTION_PATTERNS.originNotes);
console.log(originNotesMatches);

console.log('\nPricing Matches:');
const pricingMatches = extractAllMatches(sampleBOLText, EXTRACTION_PATTERNS.pricing);
console.log(pricingMatches);

console.log('\nService Requirements Matches:');
const serviceReqMatches = extractAllMatches(sampleBOLText, EXTRACTION_PATTERNS.serviceRequirements);
console.log(serviceReqMatches);

console.log('\nLocation Instructions Matches:');
const locationInstrMatches = extractAllMatches(sampleBOLText, EXTRACTION_PATTERNS.locationInstructions);
console.log(locationInstrMatches);

console.log('\n=== TEST COMPLETE ===');