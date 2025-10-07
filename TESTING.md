# API Testing Guide

## Two Testing Options

### Option 1: Node.js (Command Line)
```bash
node test_api.js
```

**Tests performed:**
1. Authenticate to PEP2_1 (search database)
2. Authenticate to pep-move-api (create database)
3. Search for existing job by order number
4. Create test job with both payload formats

**Output**: Color-coded console results

---

### Option 2: Browser (Visual Interface)
```bash
# Open in browser:
C:\Projects\OrderEntryTool\test_api.html
```

**Features:**
- Visual test controls
- Run all tests or individual tests
- Search specific order numbers
- Real-time log output
- Tests both payload formats automatically

---

## What The Tests Verify

✓ **Authentication** - Both databases accessible  
✓ **Search** - Can query existing jobs  
✓ **Create** - Identifies correct payload format  
✓ **Credentials** - Working username/password  
✓ **Endpoints** - URLs correctly configured

## Critical Test: Payload Format

Tests **both** formats to determine which FileMaker accepts:

**Format 1: Payload wrapper**
```json
{
  "fieldData": {
    "payload": "{\"job_status\":\"Entered\",...}"
  }
}
```

**Format 2: Direct fieldData**
```json
{
  "fieldData": {
    "job_status": "Entered",
    "job_type": "TEST",
    ...
  }
}
```

The test will identify which format works and log the result.

---

## Running the Tests

**Browser (Recommended for first test):**
1. Double-click `test_api.html`
2. Click "Run All Tests"
3. Review results in log panel

**Node.js:**
```bash
cd C:\Projects\OrderEntryTool
node test_api.js
```

---

## Expected Results

**Success:**
- All authentication tests pass
- Search returns data or "no records found" (both valid)
- Job creation succeeds with one format
- Log shows green checkmarks

**Failure scenarios:**
- 401 on auth: Check credentials
- 404 on search: Layout name incorrect
- 500 on create: Field validation issue or wrong payload format

---

## Next Steps After Testing

Once tests pass, update `src/services/filemakerService.js` to use the correct payload format identified by the tests.
