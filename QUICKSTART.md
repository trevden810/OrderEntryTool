# OrderEntryTool - Quick Start Guide

## Setup

1. **Install dependencies**:
```bash
cd C:\Projects\OrderEntryTool
npm install
```

2. **Configure environment**:
```bash
copy .env.example .env
# Edit .env with actual credentials
```

3. **Start development server**:
```bash
npm run dev
```

## Project Structure

```
OrderEntryTool/
├── src/
│   ├── components/     # React UI components
│   ├── services/       # FileMaker API, PDF processing
│   ├── utils/          # Patterns, validators, mappings
│   └── config/         # Configuration
├── ROADMAP.md          # Complete implementation plan
├── FIELD_MAPPING.md    # FileMaker field reference
└── package.json
```

## Key Files Created

- **`ROADMAP.md`** - 15-day implementation plan with phases
- **`FIELD_MAPPING.md`** - Complete FileMaker field reference from TestDelete.xlsx
- **`src/config/filemaker.js`** - API configuration with environment variables
- **`src/services/filemakerService.js`** - API wrapper functions
- **`src/utils/patterns.js`** - Extraction patterns for PDF data
- **`src/utils/fieldMappings.js`** - Mapping and validation utilities

## Next Steps

### Immediate (Phase 1):
1. Run `npm install` to set up dependencies
2. Copy credentials to `.env` file
3. Test FileMaker connection

### Phase 2 (Days 3-4):
- Implement lookup service for foreign key resolution
- Test job creation with minimal data
- Confirm payload format with FileMaker admin

### Phase 3 (Days 5-7):
- Build PDF processing pipeline
- Add OCR support
- Test extraction patterns

### Phase 4 (Days 8-10):
- Create React UI components
- Build field mapping interface
- Add validation panel

## Critical Questions for FileMaker Admin

1. **Lookup tables**: Which layouts can we query for CLIENTS, CITIES, STATES?
2. **Payload format**: Confirm if CREATE endpoint uses `payload` JSON string or direct `fieldData`
3. **Foreign keys**: Do we pass IDs or text values for `_kf_*` fields?
4. **Required fields**: Which fields are mandatory vs optional?
5. **Testing database**: Is there a staging database available?

## File Structure Status

✅ Project directory created  
✅ Documentation complete (ROADMAP, FIELD_MAPPING)  
✅ Configuration files (package.json, .env.example, config)  
✅ Service layer foundation (filemakerService, patterns, fieldMappings)  
⏳ React components (next phase)  
⏳ PDF processing service (next phase)  
⏳ UI implementation (next phase)

## Estimated Timeline

- **Phase 1-2**: Foundation & API (Days 1-4)
- **Phase 3**: PDF Processing (Days 5-7)
- **Phase 4**: Field Mapping & UI (Days 8-10)
- **Phase 5**: Validation (Days 11-12)
- **Phase 6**: Testing (Days 13-14)
- **Phase 7**: Deployment (Day 15)

**Total**: 15 working days (3 weeks)

## Success Metrics

- Reduce manual entry time by 80% (10 min → 2 min per order)
- 95%+ extraction accuracy for standard BOLs
- All users comfortable within 2 weeks of deployment
