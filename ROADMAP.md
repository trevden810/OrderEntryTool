# OrderEntryTool - Complete Implementation Roadmap

**Goal**: Minimize manual data entry for FileMaker order processing via intelligent PDF extraction and automated field mapping.

---

## Phase 1: Foundation & Architecture (Days 1-2)

### 1.1 Project Structure
```
OrderEntryTool/
├── docs/
│   ├── ROADMAP.md (this file)
│   ├── API_GUIDE.md (FileMaker API reference)
│   └── FIELD_MAPPING.md (field definitions)
├── src/
│   ├── components/
│   │   ├── PDFProcessor.jsx (upload, OCR, preview)
│   │   ├── DataExtractor.jsx (pattern matching, AI extraction)
│   │   ├── FieldMapper.jsx (map extracted → FileMaker fields)
│   │   ├── ValidationPanel.jsx (review before submit)
│   │   └── FileMakerSync.jsx (API integration)
│   ├── services/
│   │   ├── pdfService.js (PDF.js + Tesseract.js)
│   │   ├── extractionService.js (pattern matching logic)
│   │   ├── filemakerService.js (API wrapper)
│   │   └── lookupService.js (resolve foreign keys)
│   ├── utils/
│   │   ├── patterns.js (regex patterns for extraction)
│   │   ├── validators.js (field validation)
│   │   └── fieldMappings.js (field definitions)
│   ├── config/
│   │   └── filemaker.js (API config from env)
│   └── App.jsx
├── public/
├── tests/
├── .env (credentials - NOT committed)
├── .env.example
├── package.json
└── vite.config.js
```

### 1.2 Technology Stack
- **Frontend**: React 18 + Vite
- **PDF Processing**: PDF.js (text) + Tesseract.js (OCR)
- **Styling**: Tailwind CSS
- **API**: Native fetch with FileMaker Data API
- **State**: React Context for global state
- **Validation**: Zod for schema validation

### 1.3 Environment Setup
```bash
npm create vite@latest . -- --template react
npm install pdfjs-dist tesseract.js lucide-react zod
npm install -D tailwindcss postcss autoprefixer
```

---

## Phase 2: FileMaker Integration (Days 3-4)

### 2.1 API Configuration
**Endpoints**:
- Auth: `POST /fmi/data/vLatest/databases/{db}/sessions`
- Search: `POST /fmi/data/vLatest/databases/{db}/layouts/{layout}/_find`
- Create: `POST /fmi/data/vLatest/databases/{db}/layouts/{layout}/records`
- Upload: `POST /fmi/data/vLatest/databases/{db}/layouts/{layout}/records/{id}/containers/{field}`

**Databases**:
- Search: `PEP2_1` / Layout: `jobs_api`
- Create: `pep-move-api` / Layout: `table`

### 2.2 Field Mapping Strategy

**Core Required Fields**:
```javascript
{
  job_status: 'Entered',           // Always 'Entered' for new jobs
  job_type: 'Delivery|Pickup',     // Extracted from BOL
  _kf_client_code_id: '',          // → lookup from client name
  client_order_number: '',         // Primary identifier from BOL
  client_order_number_2: '',       // Secondary/tracking number
  date_received: '2025-10-06',     // Today's date
  due_date: '',                    // Extracted from BOL
  location_load: '',               // Pickup location
  location_return: '',             // Return carrier
  address_C1: '',                  // Customer 1 address
  zip_C1: '',                      // Customer 1 zip
  _kf_city_id: '',                 // → lookup from city name
  _kf_state_id: '',                // → lookup from state abbr
  contact_C1: '',                  // Contact name/phone/email
  Customer_C1: '',                 // Customer name
  product_serial_number: '',       // Equipment S/N
  description_product: '',         // Product description
  notes_call_ahead: '',            // Call ahead requirements
  notes_driver: '',                // Driver instructions
  notes_job: '',                   // Job notes
  people_required: 2,              // Default 2
  oneway_miles: 0,                 // Calculated or entered
}
```

**Foreign Key Resolution** (critical):
- `_kf_client_code_id` → Lookup table: `CLIENTS`
- `_kf_city_id` → Lookup table: `CITIES`
- `_kf_state_id` → Lookup table: `STATES`
- `_kf_product_weight_id` → Lookup table: `PRODUCT_WEIGHTS`
- `_kf_miles_oneway_id` → Lookup table: `MILES`

**Must implement**: Lookup service to resolve text values → IDs before submission

### 2.3 API Payload Format
Based on your CREATE example, the payload wraps data as JSON string:
```javascript
{
  fieldData: {
    payload: JSON.stringify({
      job_status: 'Entered',
      client_order_number: '9970070005',
      // ... all fields
    })
  }
}
```

---

## Phase 3: PDF Processing Pipeline (Days 5-7)

### 3.1 Processing Modes
1. **Text Extraction** (PDF.js) - Fast, for digital PDFs
2. **OCR** (Tesseract.js) - Slower, for scanned/handwritten
3. **Hybrid** - Combine both for mixed documents
4. **Auto-detect** - Analyze text quality, choose method

### 3.2 Extraction Patterns

**Client Detection Patterns**:
```javascript
const clientPatterns = {
  'VALLEY': /valley/i,
  'TTR-U': /ttr.*utah/i,
  'TTR-M': /ttr.*mountain/i,
  'CANON': /canon|imagerunner/i,
  'RICOH': /ricoh|lanier|savin/i,
  // Add more as needed
};
```

**Data Extraction Patterns**:
```javascript
{
  orderNumber: [
    /(?:order|po|ref)[\s#:]*([A-Z0-9\-]+)/gi,
    /\b\d{8,12}\b/g  // 8-12 digit numbers
  ],
  trackingNumber: [
    /(?:tracking|shipment)[\s#:]*([A-Z0-9\-]+)/gi
  ],
  serialNumber: [
    /(?:serial|s\/n|sn)[\s#:]*([A-Z0-9\-]+)/gi,
    /\b[A-Z]{2,4}\d{6,10}\b/g  // Common format
  ],
  address: [
    /\d+\s+[A-Za-z0-9\s,]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|blvd|boulevard)/gi
  ],
  phone: [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\d{3}-\d{3}-\d{4}/g
  ],
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ],
  zipCode: [
    /\b\d{5}(?:-\d{4})?\b/g
  ],
  cityState: [
    /([A-Z\s]+),\s*([A-Z]{2})\s+\d{5}/g
  ],
  date: [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    /\d{4}-\d{2}-\d{2}/g
  ]
}
```

### 3.3 Extraction Confidence Scoring
- **High** (90-100%): Auto-fill, minimal review
- **Medium** (70-89%): Highlight for review
- **Low** (<70%): Require manual entry

---

## Phase 4: Intelligent Field Mapping (Days 8-10)

### 4.1 Smart Mapping Rules
```javascript
// Example mapping logic
const mapExtractedToFileMaker = (extracted) => ({
  // Direct mappings
  client_order_number: extracted.orderNumber?.value,
  client_order_number_2: extracted.trackingNumber?.value,
  product_serial_number: extracted.serialNumber?.value,
  address_C1: extracted.address?.value,
  zip_C1: extracted.zipCode?.value,
  contact_C1: formatContact(extracted.name, extracted.phone, extracted.email),
  
  // Derived fields
  job_status: 'Entered',
  job_type: detectJobType(extracted),
  date_received: new Date().toISOString().split('T')[0],
  
  // Lookups (require resolution)
  _kf_client_code_id: await resolveClientCode(extracted.clientName),
  _kf_city_id: await resolveCityId(extracted.city),
  _kf_state_id: await resolveStateId(extracted.state),
  
  // Defaults
  people_required: 2,
  location_load: 'PEP',
  call_ahead: detectCallAhead(extracted.notes)
});
```

### 4.2 Foreign Key Resolution Service
```javascript
// Must implement lookup functions
async function resolveClientCode(clientName) {
  // Search FileMaker CLIENTS table
  // Return _kp_client_code
}

async function resolveCityId(cityName, stateId) {
  // Search FileMaker CITIES table
  // Match on city + state
  // Return _kp_city_id
}

async function resolveStateId(stateAbbr) {
  // Search FileMaker STATES table
  // Return _kp_state_id
}
```

---

## Phase 5: Validation & Review UI (Days 11-12)

### 5.1 Validation Schema (Zod)
```javascript
const jobSchema = z.object({
  client_order_number: z.string().min(1, 'Order number required'),
  job_type: z.enum(['Delivery', 'Pickup']),
  address_C1: z.string().min(5, 'Valid address required'),
  zip_C1: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP required'),
  product_serial_number: z.string().optional(),
  // ... all required fields
});
```

### 5.2 Review Panel Features
- **Side-by-side view**: PDF preview | Extracted data
- **Confidence indicators**: Color-coded fields (green/yellow/red)
- **Inline editing**: Click to edit any field
- **Field suggestions**: Dropdowns for lookups
- **Validation messages**: Real-time feedback
- **Bulk actions**: Create multiple jobs from multi-item BOLs

---

## Phase 6: Testing & Refinement (Days 13-14)

### 6.1 Test Cases
1. **Client variety**: TTR, Valley, Canon, Ricoh, WBT, etc.
2. **Document types**: 
   - Digital PDFs (clean text)
   - Scanned PDFs (OCR required)
   - Handwritten notes sections
   - Multi-page BOLs
3. **Edge cases**:
   - Missing fields
   - Multiple serial numbers
   - Unclear addresses
   - Non-standard formats

### 6.2 Performance Targets
- Text extraction: < 3 seconds
- OCR processing: < 60 seconds
- Field mapping: < 1 second
- FileMaker submission: < 5 seconds per job
- Overall workflow: < 2 minutes (user review time)

---

## Phase 7: Production Deployment (Day 15)

### 7.1 Security Checklist
- ✅ Credentials in `.env` (not committed)
- ✅ HTTPS for FileMaker API calls
- ✅ Input sanitization for all fields
- ✅ Token management (auto-refresh)
- ✅ Error handling and logging

### 7.2 Deployment Options
1. **Local desktop app** (Electron wrapper)
2. **Internal web app** (deployed to company server)
3. **Docker container** (easy distribution)

---

## Critical Dependencies

### Must Resolve Before Building:
1. **Lookup tables access**: Can we query CLIENTS, CITIES, STATES tables via API?
2. **Field requirements**: Which fields are required vs. optional in FileMaker?
3. **Foreign key resolution**: Does FileMaker auto-resolve or need manual IDs?
4. **Payload format**: Confirm `payload` JSON string vs. direct `fieldData` object
5. **Multiple items**: How to handle BOLs with 5+ equipment items? One job per item?

### Questions for FileMaker Admin:
- [ ] What layouts are available for lookup queries?
- [ ] Can we do wildcard searches on client names, cities, etc.?
- [ ] Are there validation rules on the FileMaker side?
- [ ] Can we batch create jobs, or must we create one at a time?
- [ ] Is there a staging/testing database we can use?

---

## Success Metrics

**Target**: Reduce manual entry time by 80%
- Current manual process: ~10 minutes per order
- Target automated process: ~2 minutes per order (review + submit)

**Accuracy**: 95%+ field extraction accuracy for standard BOLs

**Adoption**: All users comfortable with tool within 2 weeks of deployment

---

## Next Steps

1. ✅ Create project directory structure
2. ✅ Set up FileMaker field mapping reference
3. ⏳ Implement FileMaker API service layer
4. ⏳ Build PDF processing pipeline
5. ⏳ Create extraction pattern library
6. ⏳ Develop lookup/resolution service
7. ⏳ Build React UI components
8. ⏳ Integration testing with real BOLs
9. ⏳ User training and documentation
10. ⏳ Production deployment

**Estimated Timeline**: 15 working days (3 weeks)
**Priority**: High - Direct impact on operational efficiency
