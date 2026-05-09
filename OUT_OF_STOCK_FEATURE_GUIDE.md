# Out-of-Stock Medicine Feature Implementation

## 🎯 What's Been Done

### 1. **Fixed Upload Medicines Error** ✅
- **Issue**: "Upload all medicines" was throwing "something went wrong" error
- **Root Cause**: `medicine_bulk_uploads` table didn't exist in database
- **Solution**: Added missing migrations to `run-migrations.js`
  - Migration 020: Seed common medicines
  - Migration 021: Create out-of-stock request tables
- **Result**: Upload feature will now work correctly

### 2. **Implemented Out-of-Stock Feature** ✅
Complete implementation for pharmacies to see and request out-of-stock medicines from distributors.

#### Database Schema (Migration 021)
```sql
CREATE TABLE medicine_out_of_stock_requests (
  id BIGSERIAL PRIMARY KEY,
  pharmacy_id BIGINT NOT NULL,
  distributor_id BIGINT NOT NULL,
  medicine_id BIGINT NOT NULL,
  distributor_medicine_id BIGINT NOT NULL,
  requested_quantity INT NOT NULL,
  mrp DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TIMESTAMP
);
```

**Status Values**: `pending`, `fulfilled`, `rejected`, `cancelled`

#### API Endpoints

**1. POST `/api/procurement/out-of-stock-requests`** - Create Request
```json
{
  "distributorMedicineId": "123",
  "distributorId": "456",
  "medicineId": "789",
  "requestedQuantity": 10,
  "notes": "Urgent - low stock"
}
```
Response: `{ requestId: "999" }`

**2. GET `/api/procurement/out-of-stock-requests`** - View Requests
```json
[
  {
    "id": "999",
    "medicine_name": "Aspirin",
    "distributor_name": "MedCare Dist",
    "requested_quantity": 10,
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**3. GET `/api/procurement/inventory?includeOutOfStock=true`** - View Marketplace
- Returns both in-stock (`available_quantity > 0`) and out-of-stock items
- Includes new `stock_status` field: `"in_stock"` or `"out_of_stock"`
- Add `?includeOutOfStock=true` to see out-of-stock medicines

#### Pharmacy UI Changes
- **Toggle Button**: "Show Out of Stock" in pharmacy marketplace header
- **Visual Indicators**:
  - Out-of-stock items shown with `opacity-75`
  - "Out of Stock" badge on medicine name
  - Alert icon overlay on medicine image
- **Action Button**: Changes from "Add" to "Request" for out-of-stock items
- **Loading State**: Shows loading spinner while processing request

#### Files Modified
- `run-migrations.js` - Added migrations 020, 021
- `app/api/procurement/inventory/route.ts` - Include out-of-stock items
- `app/api/procurement/out-of-stock-requests/route.ts` - NEW API endpoints
- `app/api/distributor/medicines/upload-from-database/route.ts` - Fixed JSON error
- `components/pharmacy/pharmacy-procurement-marketplace.tsx` - Added out-of-stock UI
- `scripts/021-out-of-stock-requests.sql` - NEW migration script

---

## 🚀 Next Steps

### Step 1: Run Database Migrations
```bash
node run-migrations.js
```
This will:
- Create `medicine_bulk_uploads` table (fixes upload error)
- Create `medicine_out_of_stock_requests` table (enables feature)
- Seed common medicines data

### Step 2: Test Upload Feature
1. Log in as a distributor
2. Go to "Medicines" → "Browse Database"
3. Click "Upload X Medicines"
4. Should complete successfully ✅

### Step 3: Test Out-of-Stock Feature
1. Log in as a pharmacy
2. Go to "Procurement" → "Marketplace"
3. Click "Show Out of Stock" toggle
4. Out-of-stock medicines should appear
5. Click "Request" button on an out-of-stock item
6. Should show success toast ✅

### Step 4: [Optional] Build Distributor-Side View
Create UI for distributors to see received out-of-stock requests and fulfill them:
- New endpoint: `GET /api/distributor/out-of-stock-requests`
- New component: Display received requests with fulfillment options
- Actions: Mark as fulfilled, reject request, send message

---

## 📊 Feature Workflow

```
Pharmacy
  ↓
  └─→ Browse Distributor Medicines
       ├─→ Click "Show Out of Stock" Toggle
       ├─→ See out-of-stock items with badge
       └─→ Click "Request" → Creates request record

Request Record
  ↓
  └─→ Stored in medicine_out_of_stock_requests table
       ├─→ pharmacy_id, distributor_id, medicine_id
       ├─→ status: "pending" (default)
       └─→ timestamps: created_at, updated_at

Distributor [Optional]
  ↓
  └─→ View "Out-of-Stock Requests" Dashboard
       ├─→ See all requests from pharmacies
       ├─→ Click "Fulfill" → status → "fulfilled"
       └─→ Update inventory
```

---

## 🔒 Security & Validation

✅ **Pharmacy ID Verification**: Only authenticated pharmacies can create requests  
✅ **Duplicate Prevention**: Can't create multiple pending requests for same medicine  
✅ **Pricing Snapshot**: MRP and unit_price captured at request time  
✅ **Role-Based Access**: API endpoints check for pharmacy/distributor/admin roles  
✅ **Indexing**: Fast queries on (pharmacy_id, distributor_id, status)

---

## 📝 Database Migration Details

### Migration 020: Seed Common Medicines
- Populates `medicines` table with common pharmaceutical products
- Used when distributors browse and upload medicines
- Status: Already executed if DB had seed data

### Migration 021: Out-of-Stock Requests Table
- New table: `medicine_out_of_stock_requests`
- Tracks all pharmacy requests for out-of-stock items
- Enables request workflow and request history

---

## ✅ Implementation Checklist

- [x] Fix upload medicines error (add migrations)
- [x] Create out-of-stock request database schema
- [x] Implement pharmacy API endpoints (create & view requests)
- [x] Update inventory API (include out-of-stock items)
- [x] Update pharmacy UI (toggle, badge, request button)
- [x] Add loading states and error handling
- [x] Add validation and duplicate check
- [ ] Build distributor request view component (next priority)
- [ ] Add notification system for distributors
- [ ] Build fulfillment workflow
- [ ] Add admin dashboard for monitoring

---

## 🐛 Troubleshooting

**"Upload medicines" still shows error:**
- Run `node run-migrations.js` again
- Check `medicine_bulk_uploads` table exists: `SELECT * FROM medicine_bulk_uploads;`
- Check distributor is verified (not pending)

**Out-of-stock medicines don't appear:**
- Did you search any medicines in pharmacy marketplace?
- Click "Show Out of Stock" toggle (should change color)
- Check browser console for API errors
- Verify any medicines have `available_quantity <= 0`

**Can't click "Request" button:**
- Make sure you're logged in as a pharmacy (not distributor)
- Check browser network tab for API response
- Verify pharmacy_profile exists for your user

---

## 📞 Support

For questions or issues, check:
1. Browser console (F12) for error messages
2. Network tab to see API requests/responses
3. Database directly: 
   ```sql
   SELECT * FROM medicine_out_of_stock_requests;
   SELECT status, COUNT(*) FROM medicine_out_of_stock_requests GROUP BY status;
   ```

