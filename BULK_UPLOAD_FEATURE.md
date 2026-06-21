# Bulk Medicine Upload Feature - Complete Implementation Guide

## Overview

This document describes the complete end-to-end bulk medicine upload feature for distributors. Distributors can now upload medicines in bulk using CSV or XLSX files with a professional, user-friendly interface.

## Features Implemented

### 1. **Template Download System**
- Downloadable Excel template with pre-formatted columns and example data
- Professional formatting with color-coded headers
- Automatic date formatting guidance
- Includes 2 example medicines for reference

### 2. **Modern Upload Component**
- Tab-based interface (Upload, Template, Guide)
- Drag-and-drop file upload support
- File validation (format & size)
- Real-time upload progress
- Detailed success/failure reporting
- Beautiful UI with alerts and guidance

### 3. **Backend Validation & Processing**
- Medicine matching by ID or name
- Fuzzy matching for approximate medicine names
- Batch-wise duplicate detection and quantity updates
- Row-by-row error reporting
- Up to 2000 rows per upload
- Up to 10MB file size

## File Structure

```
components/
├── distributor/
│   ├── bulk-medicine-upload.tsx      (Main upload component)
│   ├── browse-and-upload-medicines.tsx (Browse database feature)
│   └── inventory-management.tsx      (Single medicine addition)
├── ui/
│   ├── progress.tsx                  (New progress bar component)
│   └── alert.tsx                     (New alert component)

app/
├── api/distributor/inventory/
│   ├── download-template/route.ts    (Template download endpoint)
│   ├── bulk-upload/route.ts          (File processing endpoint)
│   └── route.ts                      (Single medicine endpoint)

app/distributor/
└── inventory/page.tsx                (Inventory management page)

public/
└── medicines_upload_template.md      (Template documentation)
```

## Database Schema

### distributor_medicines table
```sql
CREATE TABLE distributor_medicines (
  id SERIAL PRIMARY KEY,
  distributor_id INTEGER REFERENCES distributor_profiles(id),
  medicine_id INTEGER REFERENCES medicines(id),
  hsn_code VARCHAR(20),
  batch_number VARCHAR(100),
  mfg_date DATE,
  expiry_date DATE NOT NULL,
  mrp DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(distributor_id, medicine_id, batch_number)
);
```

## CSV/XLSX Column Specifications

### Required Columns
1. **medicine_id OR medicine_name** (at least one required)
   - Format: medicine_id (numeric) or medicine_name (text)
   - Example: `123` or `Aspirin`
   - Used for identifying which medicine to add

2. **expiry_date** (Required)
   - Format: DD-MM-YYYY
   - Example: `31-12-2026`
   - Must be a future date

3. **batch_number** (Required)
   - Format: Text (any batch identifier)
   - Example: `B001`, `LOT123`
   - Makes each medicine entry unique

4. **mrp** (Required)
   - Format: Decimal number
   - Example: `100`, `45.50`
   - Maximum Retail Price

5. **quantity** (Required)
   - Format: Integer number
   - Example: `1000`, `500`
   - Number of units in stock

6. **unit_price** (Required)
   - Format: Decimal number
   - Example: `50`, `22.50`
   - Distributor's wholesale price per unit

### Optional Columns
- **generic_name**: Generic/IUPAC name (text)
- **strength**: Dosage strength (text) - e.g., "500mg", "10ml"
- **form**: Medicine form (text) - tablet, capsule, syrup, injection, cream, drops, inhaler, other
- **mfg_date**: Manufacturing date (DD-MM-YYYY format)
- **hsn_code**: HSN/SAC code for GST (text)
- **notes**: Storage/handling instructions (text)

## How It Works

### User Journey

1. **Navigate to Distributor Panel**
   ```
   Dashboard → Manage Inventory
   ```

2. **Click "Bulk Upload Medicines"**
   - Opens modal dialog with three tabs

3. **Download Template (First Time)**
   - Click "Template" tab
   - Click "Download Excel Template"
   - Get formatted spreadsheet with columns and examples

4. **Fill in Your Data**
   - Open the downloaded template in Excel/Google Sheets
   - Replace example rows with your medicine data
   - Ensure all required columns are filled correctly
   - Use DD-MM-YYYY for all dates

5. **Upload the File**
   - Return to the dialog
   - Click "Upload" tab
   - Drag & drop file OR click to browse
   - Click "Upload File" button

6. **Review Results**
   - See summary cards (Success, Skipped, Failed)
   - Progress bar shows upload percentage
   - Detailed table shows each row's status
   - Click on failed rows to see error messages

7. **Fix & Re-upload**
   - If failures occur, fix the data
   - Upload another file
   - Process repeats

### Backend Processing Flow

```
POST /api/distributor/inventory/bulk-upload
    ↓
[Authentication Check]
    ↓
[File Validation]
  - Check file type (CSV/XLSX)
  - Check file size (<10MB)
  - Check row count (<2000)
    ↓
[Parse File]
  - Read spreadsheet
  - Normalize column headers
  - Extract data rows
    ↓
[For Each Row]
  - Resolve medicine ID (by ID or name matching)
  - Validate required fields
  - Convert data types
  - Check for duplicates
  - Insert or update database
  - Record status
    ↓
[Return Results]
  - Success count
  - Failure count
  - Detailed row-by-row results
  - Audit log entry
```

## API Endpoints

### 1. Download Template
```
GET /api/distributor/inventory/download-template

Response: Excel file (.xlsx)
Headers:
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Content-Disposition: attachment; filename="medicines_upload_template_2024-01-15.xlsx"

Requirements:
  - Must be authenticated as distributor
```

### 2. Bulk Upload
```
POST /api/distributor/inventory/bulk-upload

Request: multipart/form-data
  - file: File (CSV or XLSX)

Response (Success 200):
{
  "success": true,
  "totalRows": 100,
  "successCount": 95,
  "failureCount": 5,
  "results": [
    {
      "row": 2,
      "medicineId": 123,
      "name": "Aspirin",
      "status": "success",
      "message": "Uploaded"
    },
    {
      "row": 3,
      "medicineId": null,
      "name": null,
      "status": "error",
      "message": "Medicine not found (use medicine_id or exact name)"
    }
  ]
}

Response (Error 400/401/403):
{
  "error": "Error message"
}

Requirements:
  - Must be authenticated as distributor
  - Distributor must be verified
  - File must be CSV/XLSX
  - File size must be <10MB
  - Maximum 2000 rows per upload
```

## Error Handling & Messages

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Medicine not found" | Medicine name doesn't match database | Use exact name or provide medicine_id |
| "Invalid date format" | Date not in DD-MM-YYYY format | Format all dates as DD-MM-YYYY |
| "Missing required values" | Required field is empty | Check that all required fields are filled |
| "File too large" | File exceeds 10MB | Compress file or split into smaller batches |
| "Max rows exceeded" | More than 2000 rows | Split into multiple uploads |
| "Only CSV/XLSX allowed" | Wrong file format | Use .csv, .xls, or .xlsx files |
| "Distributor not verified" | Account not verified yet | Contact admin or wait for verification |

## Validation Rules

### Data Type Conversion
- **Dates**: Parsed as DD-MM-YYYY, converted to ISO format (YYYY-MM-DD)
- **Numbers**: Converted to integers (quantity) or decimals (prices)
- **Text**: Trimmed and normalized

### Batch Deduplication
- If same `distributor_id` + `medicine_id` + `batch_number` exists:
  - Old quantity is updated (not replaced)
  - Prices and other fields are updated
  - New entry is NOT created (maintains uniqueness)

### Medicine Matching Priority
1. **Exact ID match**: `medicine_id` = exact match
2. **Exact name+strength match**: Exact text match
3. **Fuzzy name match**: Uses PostgreSQL trigram similarity
4. **Generic name search**: Searches `generic_name` field
5. **Not found**: Error recorded

## Performance Considerations

### Optimizations
- Bulk operations use single transactions per row
- Trigram indexes for fast fuzzy matching
- Full-text search indexes for medicine lookup
- Batch operations for large uploads

### Limits
- Max 2000 rows per upload (adjustable)
- Max 10MB file size (adjustable)
- Query timeout: 30 seconds per file

## Security Features

### Authorization
- ✓ Distributor-only access
- ✓ Verification status check
- ✓ User ownership validation

### Data Validation
- ✓ File type validation
- ✓ File size limits
- ✓ Column header normalization
- ✓ Data type validation
- ✓ Required field checks

### Audit Trail
- ✓ Logs all bulk uploads in `medicine_bulk_uploads` table
- ✓ Stores filename, source type, medicine IDs, success count
- ✓ Tracks upload status (completed, partial, failed)

## Component API

### BulkMedicineUpload Component

```tsx
import { BulkMedicineUpload } from "@/components/distributor/bulk-medicine-upload"

export default function InventoryPage() {
  return (
    <div>
      <BulkMedicineUpload />
    </div>
  )
}
```

#### Props
None - component is self-contained

#### Features
- State management with React hooks
- Toast notifications for user feedback
- Drag & drop file handling
- Tab-based interface
- Progress tracking
- Result reporting

## Usage Examples

### Example 1: Simple Tablet Upload
```csv
medicine_id,medicine_name,generic_name,strength,form,batch_number,mfg_date,expiry_date,mrp,quantity,unit_price,hsn_code,notes
,Aspirin,Acetylsalicylic acid,500mg,tablet,B001,01-01-2024,31-12-2026,100,1000,50,30051090,
,Paracetamol,Acetaminophen,650mg,tablet,B002,15-02-2024,14-02-2027,45,500,22.50,29413000,Keep dry
```

### Example 2: Mixed with IDs
```csv
medicine_id,medicine_name,batch_number,expiry_date,mrp,quantity,unit_price
123,Aspirin,B001,31-12-2026,100,1000,50
,Ibuprofen,B002,30-06-2027,80,500,40
456,Amoxicillin,B003,28-02-2026,120,750,60
```

### Example 3: Minimal Required Fields
```csv
medicine_name,batch_number,expiry_date,mrp,quantity,unit_price
Aspirin,B001,31-12-2026,100,1000,50
Paracetamol,B002,14-02-2027,45,500,22.50
Ibuprofen,B003,30-06-2027,80,500,40
```

## Testing

### Manual Testing Checklist

- [ ] Download template from UI
- [ ] Template file opens in Excel/Sheets
- [ ] All columns are present and formatted
- [ ] Try uploading valid CSV with 5 medicines
- [ ] Verify success status shows correctly
- [ ] Try uploading with missing required column
- [ ] Verify error message appears
- [ ] Try duplicate batch upload
- [ ] Verify quantity was updated (not created duplicate)
- [ ] Try invalid date format
- [ ] Verify error is reported for that row
- [ ] Upload >2000 rows file
- [ ] Verify error about row limit

### Automated Testing (Recommended)

```typescript
// Example test with vitest
describe('Bulk Medicine Upload', () => {
  it('should download template file', async () => {
    const response = await fetch('/api/distributor/inventory/download-template')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('spreadsheet')
  })

  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/distributor/inventory/bulk-upload', {
      method: 'POST'
    })
    expect(response.status).toBe(401)
  })
})
```

## Troubleshooting

### Issue: "Medicine not found" for all rows
**Solution**: Verify medicine names exactly match the database. Use "Browse Database" feature to find correct names.

### Issue: File won't upload (>10MB warning)
**Solution**: Compress CSV or split into multiple files. Maximum file size is 10MB.

### Issue: Template download doesn't work
**Solution**: Ensure you're logged in as a verified distributor. Check browser console for errors.

### Issue: Quantities not updating on re-upload
**Solution**: Ensure batch_number is exactly the same (case-sensitive). Different batch = new entry.

## Future Enhancements

1. **Bulk Edit/Update**
   - Update existing medicine prices and quantities
   - Template with existing data

2. **Export Inventory**
   - Download current inventory as CSV/XLSX
   - Format matches upload template

3. **Validation Preview**
   - Parse file before uploading
   - Show validation errors before confirming
   - Suggest corrections

4. **Multi-file Upload**
   - Queue multiple files
   - Process sequentially
   - Combined report

5. **Scheduled Uploads**
   - Upload on a schedule
   - Automatic updates from file

6. **Supplier Integration**
   - Connect to supplier APIs
   - Auto-fetch medicine data
   - Auto-sync pricing

## Support & Contact

For issues or questions:
1. Check the "Guide" tab in the upload dialog
2. Review error messages in upload results
3. Contact support with error details and file sample
4. Check `public/medicines_upload_template.md` for detailed guidance

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Production Ready
