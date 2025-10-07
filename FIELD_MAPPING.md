# FileMaker Field Mapping Reference

**Source**: TestDelete.xlsx export from PEP2_1 database

## Field Categories

### Primary Keys & Foreign Keys

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| `_kp_job_id` | PK | Job unique identifier | Auto-generated |
| `_kf_client_code_id` | FK | Client code lookup | Must resolve from CLIENTS table |
| `_kf_client_id` | FK | Client ID | May be redundant with code |
| `_kf_city_id` | FK | City lookup | Resolve from city name + state |
| `_kf_state_id` | FK | State lookup | Resolve from state abbreviation |
| `_kf_city_id_2` | FK | Secondary city | For multi-stop jobs |
| `_kf_state_id_2` | FK | Secondary state | For multi-stop jobs |
| `_kf_client_class_id` | FK | Client class | Business type classification |
| `_kf_disposition` | FK | Job disposition | Standard/Express/etc. |
| `_kf_notification_id` | FK | Notification status | Done/Pending/etc. |
| `_kf_product_weight_id` | FK | Product weight class | Lookup table |
| `_kf_miles_oneway_id` | FK | Miles class | Lookup table |
| `_kf_make_id` | FK | Equipment make | Brand lookup |
| `_kf_model_id` | FK | Equipment model | Model lookup |
| `_kf_market_id` | FK | Market/region | Geographic market |

### Core Job Fields

| Field Name | Type | Required | Default | Extraction Priority |
|------------|------|----------|---------|-------------------|
| `job_status` | Text | ✓ | "Entered" | Auto |
| `job_type` | Text | ✓ | - | HIGH - Extract from BOL |
| `job_date` | Date | - | Today | Auto |
| `date_received` | Date | ✓ | Today | Auto |
| `due_date` | Date | ✓ | - | HIGH - Extract from BOL |
| `people_required` | Number | - | 2 | Default or extract |
| `oneway_miles` | Number | - | 0 | Calculate or extract |
| `call_ahead` | Text | - | - | Extract from notes |

### Client Order Information

| Field Name | Type | Required | Extraction Source |
|------------|------|----------|------------------|
| `client_order_number` | Text | ✓ | Primary order/PO number from BOL |
| `client_order_number_2` | Text | - | Secondary tracking/manifest number |
| `client_rep_name` | Text | - | Sales rep name |
| `client_rep_phone_num` | Text | - | Sales rep phone |
| `client_rep_email` | Text | - | Sales rep email |

### Location Fields - Customer 1 (Pickup/Delivery)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `Customer_C1` | Text | ✓ | Customer name |
| `address_C1` | Text | ✓ | Street address |
| `address2_C1` | Text | - | Suite/Unit/Floor |
| `zip_C1` | Text | ✓ | ZIP code (5 or 9 digit) |
| `contact_C1` | Text | ✓ | Contact name/phone/email (combined) |
| `contact_C1b` | Text | - | Secondary contact |
| `contact_C1c` | Text | - | Tertiary contact |
| `phone_C1` | Text | - | Primary phone |
| `phone_C1_ext` | Text | - | Phone extension |
| `phone_C1_alt` | Text | - | Alternate phone |
| `phone_C1_alt_ext` | Text | - | Alt phone extension |
| `order_C1` | Text | - | Customer's internal order number |

### Location Fields - Customer 2 (Return/Destination)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `Customer_C2` | Text | - | Second location customer name |
| `address_C2` | Text | - | Second location address |
| `address2_C2` | Text | - | Suite/Unit |
| `zip_C2` | Text | - | Second location ZIP |
| `contact_C2` | Text | - | Contact info |
| `phone_C2` | Text | - | Phone |
| `order_C2` | Text | - | Order reference |
| `oneway_miles_C2` | Number | - | Miles to second location |

### Warehouse/Internal Locations

| Field Name | Type | Description |
|------------|------|-------------|
| `location_load` | Text | Loading location (usually "PEP") |
| `location_return` | Text | Return carrier/location |
| `location_WH` | Text | Warehouse location |
| `pickups_destination` | Text | Pickup destination routing |

### Product/Equipment Fields

| Field Name | Type | Required | Extraction Priority |
|------------|------|----------|-------------------|
| `product_serial_number` | Text | ✓ | HIGH - Critical identifier |
| `description_product` | Text | ✓ | Product description/model |
| `product_type` | Text | - | Equipment type category |
| `piece_total` | Number | - | Total pieces in shipment |
| `additional_pieces_count` | Number | - | Additional pieces count |
| `Additional_unit` | Text | - | Yes/No for additional units |
| `model_finisher` | Text | - | Finisher model number |
| `piece_finisher_serial` | Text | - | Finisher serial number |
| `model_lct` | Text | - | LCT model |
| `piece_LCT_serial` | Text | - | LCT serial |
| `Dims_of_product` | Text | - | Product dimensions |

### Notes Fields

| Field Name | Type | Max Length | Purpose |
|------------|------|-----------|---------|
| `notes_job` | Text | ~1000 | General job notes |
| `notes_driver` | Text | ~1000 | Driver-specific instructions |
| `notes_call_ahead` | Text | ~500 | Call ahead requirements |
| `notes_schedule` | Text | ~1000 | Scheduling notes |
| `notes_billing` | Text | ~1000 | Billing notes |
| `notes_invoice` | Text | ~500 | Invoice-related notes |
| `notes_all_read_only` | Text | - | Combined read-only notes |

### Time/Schedule Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `time_plan_start` | Time | Planned start time |
| `time_plan_finish` | Time | Planned finish time |
| `hours_eta_start` | Time | ETA window start |
| `hours_eta_end` | Time | ETA window end |
| `time_arival` | DateTime | Actual arrival time |
| `time_complete` | DateTime | Actual completion time |
| `estimated_time` | Text | Estimated duration |
| `time_type` | Text | Time window type |

### Special Handling Flags

| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `same_day` | Text | "NO" | Same-day service flag |
| `same_day_return` | Text | "NO" | Same-day return flag |
| `staging` | Text | "NO" | Staging required |
| `Stairs` | Text | - | Stairs at location |
| `take_crate` | Text | - | Crate handling |
| `pics_required` | Text | - | Photos required |
| `pics_received` | Text | - | Photos received |
| `named_insurance` | Text | "NO" | Named insured required |
| `Quoted` | Number | 0 | Quote provided |
| `locked` | Text | - | Job locked status |

### Billing Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `billing_status` | Text | Initial/Pending/Complete |
| `miles_excess` | Number | Excess miles |
| `miles_excess_billed` | Number | Billed excess miles |
| `charge_finisher` | Number | Finisher charge |
| `charge_lct` | Number | LCT charge |
| `Quoted_amount` | Number | Quoted price |
| `Quoted_by` | Text | Who provided quote |
| `Quoted_notes` | Text | Quote notes |
| `Quoted_pay_by` | Text | Payment terms |
| `TTR_Amount` | Number | TTR-specific amount |

### Tracking/Metadata Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `timestamp_create` | DateTime | Record creation timestamp |
| `timestamp_mod` | DateTime | Last modification timestamp |
| `account_create` | Text | User who created record |
| `account_mod` | Text | User who last modified |
| `job_reference_prior` | Text | Reference to prior job |
| `Recovery_number` | Text | Recovery tracking number |
| `Reference_1` | Text | General reference field |

### EDI Fields (Electronic Data Interchange)

| Field Name | Type | Description |
|------------|------|-------------|
| `edi_business_reference` | Text | EDI business reference |
| `edi_date_204` | Date | EDI 204 date |
| `edi_time_204` | Time | EDI 204 time |
| `edi_job_control` | Text | EDI job control number |
| `edi_originator_code` | Text | EDI originator code |
| `edi_transaction_control` | Text | EDI transaction control |
| `edi_equipment_type_code` | Text | Equipment type code |

### Build/Canon-Specific Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `build_status` | Text | Build status |
| `Build_Date_Built` | Date | Date equipment built |
| `Build_Date_Machine_Recd` | Date | Date machine received |
| `Build_Expected_DEL_Date` | Date | Expected delivery date |
| `Build_Actual_DEL_Date` | Date | Actual delivery date |
| `Canon_build_assign` | Text | Canon build assignment |

### Performance/Status Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `performance_job` | Text | Job performance rating |
| `performance_driver` | Text | Driver performance |
| `performance_ls` | Text | Logistics specialist rating |
| `job_status_driver` | Text | Driver's job status |
| `job_reject_status` | Text | Rejection status |
| `detainment` | Number | Detainment time |

### Geofence/Tracking Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `GEOFENCE_in::ts_display` | DateTime | Geofence entry timestamp |
| `GEOFENCE_out::ts_display` | DateTime | Geofence exit timestamp |
| `signed_by` | Text | Signature name |
| `r_timestamp_delivered` | DateTime | Delivery timestamp |

### Scanning/Inventory Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `box_serial_numbers_scanned_delivered_json` | JSON | Delivered item scan data |
| `box_serial_numbers_scanned_received_json` | JSON | Received item scan data |

---

## Extraction Priority Levels

### CRITICAL (Must extract or will fail)
- `client_order_number` - Primary identifier
- `job_type` - Delivery/Pickup
- `address_C1` - Customer address
- `zip_C1` - ZIP code
- `product_serial_number` - Equipment identifier
- `Customer_C1` - Customer name

### HIGH (Should extract to minimize manual entry)
- `client_order_number_2` - Tracking number
- `description_product` - Product details
- `contact_C1` - Contact information
- `due_date` - Deadline
- `notes_call_ahead` - Call ahead requirements
- `notes_driver` - Driver notes

### MEDIUM (Nice to have)
- `client_rep_name/phone/email` - Rep info
- `phone_C1` - Direct phone
- `piece_total` - Item count
- `notes_job` - Additional notes
- `time_plan_start/finish` - Time windows

### LOW (Usually defaults or manual entry acceptable)
- `people_required` - Default: 2
- `oneway_miles` - Can calculate later
- All performance/tracking fields
- Billing detail fields

---

## Foreign Key Resolution Requirements

**Must implement lookups for:**
1. `_kf_client_code_id` ← Client name/code
2. `_kf_city_id` ← City name + state
3. `_kf_state_id` ← State abbreviation
4. `_kf_make_id` ← Equipment brand
5. `_kf_model_id` ← Equipment model
6. `_kf_market_id` ← Geographic market

**Query layouts needed:**
- `clients_lookup`
- `cities_lookup`
- `states_lookup`
- `makes_lookup`
- `models_lookup`

---

## Default Values for New Jobs

```javascript
const defaultJobValues = {
  job_status: 'Entered',
  job_date: new Date().toISOString().split('T')[0],
  date_received: new Date().toISOString().split('T')[0],
  people_required: 2,
  oneway_miles: 0,
  location_load: 'PEP',
  Additional_unit: 'NO',
  same_day: 'NO',
  same_day_return: 'NO',
  staging: 'NO',
  named_insurance: 'NO',
  Quoted: 0,
  detainment: 0,
  billing_status: 'Initial',
  call_ahead: 'Yes'
};
```

---

## Validation Rules

### Required Field Validation
- Order number must be alphanumeric, 6-15 characters
- ZIP code must be 5 digits or 5+4 format
- Address must be at least 10 characters
- Phone numbers must match (###) ###-#### or ###-###-#### format
- Email must be valid format if provided

### Business Logic Validation
- `due_date` must be >= `date_received`
- If `job_type` = "Pickup", `location_load` should be customer location
- If `job_type` = "Delivery", `location_load` should be warehouse
- Serial numbers should be unique (check for duplicates)

---

## Notes Format Guidelines

### `contact_C1` Format
```
[Name] [Phone] [Email]
Example: "DENISE SCHOPPE 9705960664 cpa@crestedbutte.net"
```

### `notes_call_ahead` Format
```
[Time requirement] [Special instructions]
Example: "1 Hour Prior" or "24hr pre-call required"
```

### `notes_driver` Format
```
[Delivery instructions] [Access notes] [Equipment needs]
Example: "Park at Door B. Liftgate required. Call upon arrival."
```
