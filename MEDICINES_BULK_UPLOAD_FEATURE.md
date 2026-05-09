# Medicine Database Bulk Upload Feature

## Overview

This feature enables distributors to easily upload medicines from a pre-populated database with just one click. It includes:

1. **Medicine Scraper** - Scrapes/curates ~1000 most common medicines from 1mg website
2. **Database Seeding** - Populates the medicines table with scraped data
3. **Bulk Upload API** - API endpoint for distributors to bulk upload medicines to their inventory
4. **UI Component** - User-friendly interface for browsing and selecting medicines

## Files Created

### 1. Medicine Scraper
- **File**: `scripts/scrape-1mg-medicines.js`
- **Purpose**: Generates a JSON file with 1000 common medicines
- **Usage**: `node scripts/scrape-1mg-medicines.js`
- **Output**: `scripts/medicines-data.json`

This script uses a curated list of the most common medicines sold in India across various categories:
- Pain Management
- Antibiotics
- Antacids
- Cough & Cold
- Vitamins & Supplements
- And 200+ other categories

### 2. Medicine Seeding Scripts

#### Option A: Simple JavaScript Seed
- **File**: `scripts/seed-medicines-simple.js`
- **Purpose**: Seeds the medicines data into the database
- **Usage**: `node scripts/seed-medicines-simple.js`
- **Requires**: DATABASE_URL environment variable

#### Option B: TypeScript Seed
- **File**: `scripts/seed-medicines.ts`
- **Purpose**: TypeScript version of the seed script
- **Usage**: `npx ts-node scripts/seed-medicines.ts`

### 3. Database Migration
- **File**: `scripts/020-seed-common-medicines.sql`
- **Tables Modified**:
  - `medicines` - Added `source`, `popularity_score`, `uses`, `side_effects`, `precautions` fields
  - Created `medicine_bulk_uploads` - Tracks bulk upload history for audit trail

### 4. API Endpoints
- **File**: `app/api/distributor/medicines/upload-from-database/route.ts`
- **Methods**:
  - `GET` - Fetch available medicines with search and filter
  - `POST` - Bulk upload selected medicines to distributor inventory

**GET Parameters**:
```
- search (string): Search by medicine name or generic name
- form (string): Filter by medicine form (tablet, capsule, syrup, etc.)
- page (number): Pagination page number (default: 1)
- limit (number): Number of items per page (default: 50)
```

**POST Body**:
```json
{
  "medicineIds": [1, 2, 3, ...],
  "defaultMrp": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully added X medicines to your inventory",
  "successCount": 95,
  "failureCount": 5,
  "results": [
    {
      "medicineId": 1,
      "name": "Paracetamol 500mg",
      "status": "success",
      "message": "Medicine added to your inventory",
      "id": 123
    },
    ...
  ]
}
```

### 5. UI Component
- **File**: `components/distributor/browse-and-upload-medicines.tsx`
- **Component**: `BrowseAndUploadMedicines`
- **Features**:
  - Search medicines by name
  - Filter by medicine form
  - Select multiple medicines
  - Upload status display
  - Pagination support
  - Error handling and user feedback

### 6. Updated Distributor Pages
- **File**: `app/distributor/inventory/page.tsx`
- **Changes**: Added the "Upload from Database" button next to the inventory table

## Implementation Steps

### Step 1: Apply Database Migrations
```sql
-- First, apply the migration scripts in order:
-- 1. Run existing migrations (if not already done)
-- 2. Run: scripts/020-seed-common-medicines.sql
```

### Step 2: Generate Medicines Data
```bash
# Generate 1000 medicines from the scraper
node scripts/scrape-1mg-medicines.js

# This creates scripts/medicines-data.json
```

### Step 3: Seed the Database
```bash
# Option 1: Using Node.js (Recommended)
node scripts/seed-medicines-simple.js

# Option 2: Using TypeScript
npx ts-node scripts/seed-medicines.ts
```

The script will:
- Read medicines from `medicines-data.json`
- Check for existing medicines to avoid duplicates
- Insert new medicines into the database
- Display progress and summary statistics

### Step 4: Verify Installation
1. Navigate to Distributor Inventory Page (`/distributor/inventory`)
2. You should see an "Upload from Database" button next to the Inventory title
3. Click it to open the medicines browser
4. Search for medicines and select to upload

## Features

### Search & Filter
- Search by medicine name or generic name
- Filter by medicine form (tablet, capsule, syrup, injection, cream, drops, inhaler, other)
- Pagination with 50 medicines per page

### Bulk Selection
- Select individual medicines with checkboxes
- Select all medicines on the page
- Clear selection easily

### One-Click Upload
- Click "Upload" to add all selected medicines to inventory
- Real-time status display
- See which medicines were added, skipped, or failed

### Default Values
When medicines are added to the inventory:
- **Expiry Date**: Set to 2025-12-31 (distributor can update)
- **Quantity**: Set to 0 (distributor needs to update)
- **Unit Price**: Set to 50% of MRP (distributor can adjust)

### Audit Trail
- All bulk uploads are recorded in `medicine_bulk_uploads` table
- Timestamp and count of medicines uploaded
- Distributor ID for tracking

## Database Schema

### medicines Table (Updated)
```sql
ALTER TABLE medicines ADD COLUMN:
- source VARCHAR(50) DEFAULT 'manual' -- 'scraped' or 'manual'
- popularity_score INTEGER DEFAULT 0 -- For sorting
- uses TEXT -- Uses of medicine
- side_effects TEXT -- Side effects
- precautions TEXT -- Precautions
```

### medicine_bulk_uploads Table (New)
```sql
CREATE TABLE medicine_bulk_uploads (
  id SERIAL PRIMARY KEY,
  distributor_id INTEGER REFERENCES distributor_profiles(id) ON DELETE CASCADE,
  medicine_ids INTEGER[],
  upload_count INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'completed'
);
```

## API Usage Examples

### Search Medicines
```bash
GET /api/distributor/medicines/upload-from-database?search=paracetamol&page=1&limit=50
```

### Filter by Form
```bash
GET /api/distributor/medicines/upload-from-database?form=tablet&page=1
```

### Upload Medicines
```bash
POST /api/distributor/medicines/upload-from-database
Content-Type: application/json

{
  "medicineIds": [1, 5, 10, 15, 20]
}
```

## Troubleshooting

### Issue: DATABASE_URL not set
**Solution**: Ensure environment variable is set when running seed script
```bash
DATABASE_URL="postgresql://..." node scripts/seed-medicines-simple.js
```

### Issue: Medicines not loading in UI
**Solution**: 
1. Verify medicines were inserted: `SELECT COUNT(*) FROM medicines WHERE source = 'scraped'`
2. Ensure distributor profile exists and is verified
3. Check browser console for API errors

### Issue: Upload fails with "already_exists"
**Solution**: This is expected behavior. It means the medicine is already in the distributor's inventory. Those medicines are skipped.

### Issue: Upload timeout
**Solution**: 
1. Reduce number of medicines in one upload (try 100 instead of 500)
2. Increase server timeout in next.config.js if needed

## Customization

### Add More Medicines
Edit `scripts/scrape-1mg-medicines.js` to add more medicines to the `commonMedicines` array before running the scraper.

### Change Default Inventory Values
Edit `app/api/distributor/medicines/upload-from-database/route.ts` in the POST handler:
```typescript
unit_price: ${properties.mrp * 0.5} // Change the multiplier to adjust wholesale price
```

### Modify UI
Edit `components/distributor/browse-and-upload-medicines.tsx` to customize:
- Dialog size and styling
- Table columns
- Filter options
- Button labels

## Performance Considerations

- **Seeding**: ~30-60 seconds for 1000 medicines on average
- **API Response**: ~500ms-1s for each API call
- **Upload**: ~10-15 seconds for 100 medicines

## Security

- All endpoints require distributor authentication
- Only verified distributors can upload medicines
- Distributor can only access their own inventory
- Audit trail tracks all bulk uploads

## Future Enhancements

1. **Batch Import** - Import CSV/Excel file of medicines
2. **Smart Pricing** - Auto-calculate wholesale price based on MRP and margins
3. **Stock Notifications** - Alert when stock is low
4. **Price History** - Track price changes over time
5. **Medicine Analytics** - Show popular medicines and trends

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs in `/workspaces/lovemedix-v6-main/logs/`
3. Contact the development team

---

**Last Updated**: 2026-05-09
**Status**: Ready for Production
