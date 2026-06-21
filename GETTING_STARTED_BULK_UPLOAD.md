# Getting Started with Bulk Medicine Upload

## Quick Start (5 Minutes)

### For Distributors

1. **Log in to your Distributor Dashboard**
   - Go to: `/distributor/dashboard`

2. **Navigate to Inventory Management**
   - Click "Manage Inventory" or go to `/distributor/inventory`

3. **Click "Bulk Upload Medicines"**
   - A dialog will pop up with three tabs

4. **Download the Template**
   - Click the "Template" tab
   - Click "Download Excel Template"
   - This saves a formatted Excel file to your computer

5. **Fill in Your Data**
   - Open the downloaded file in Excel or Google Sheets
   - Replace the example rows with your medicine data
   - Keep the column headers exactly as they are
   - Use DD-MM-YYYY format for all dates

6. **Upload Your File**
   - Return to the "Upload" tab
   - Drag & drop the file OR click to browse
   - Click "Upload File"
   - Wait for processing (usually 5-30 seconds)

7. **Review Results**
   - See summary: Success count, Failed count, Total rows
   - Check the results table for any errors
   - Fix and re-upload if needed

---

## File Format Requirements

### Essential Columns (MUST have at least these):

```
medicine_name,batch_number,expiry_date,mrp,quantity,unit_price
```

- **medicine_name**: Name of the medicine (must exist in database)
- **batch_number**: Batch/Lot number (e.g., B001, LOT-2024-001)
- **expiry_date**: When the medicine expires (DD-MM-YYYY format)
- **mrp**: Maximum Retail Price (e.g., 100, 45.50)
- **quantity**: How many units you have (e.g., 1000, 500)
- **unit_price**: Your cost per unit (e.g., 50, 22.50)

### Optional Columns (Nice to have):

```
medicine_id,generic_name,strength,form,mfg_date,hsn_code,notes
```

- **medicine_id**: If you know the internal ID, can help find medicine faster
- **generic_name**: Scientific/generic name
- **strength**: Dosage (e.g., 500mg, 10ml, 5%)
- **form**: Type (tablet, capsule, syrup, injection, cream, drops, inhaler, other)
- **mfg_date**: Manufacturing date (DD-MM-YYYY)
- **hsn_code**: For GST calculation (e.g., 30051090)
- **notes**: Storage instructions or special handling

---

## Example Files

### Simple Example (Minimal)
```csv
medicine_name,batch_number,expiry_date,mrp,quantity,unit_price
Aspirin,B001,31-12-2026,100,1000,50
Paracetamol,B002,28-02-2027,45,500,22.50
Ibuprofen,B003,30-06-2027,80,500,40
```

### Complete Example (All columns)
```csv
medicine_id,medicine_name,generic_name,strength,form,batch_number,mfg_date,expiry_date,mrp,quantity,unit_price,hsn_code,notes
,Aspirin,Acetylsalicylic acid,500mg,tablet,B001,01-01-2024,31-12-2026,100,1000,50,30051090,
,Paracetamol,Acetaminophen,650mg,tablet,B002,15-02-2024,14-02-2027,45,500,22.50,29413000,Keep in cool place
123,Ibuprofen,Ibuprofen,200mg,tablet,B003,20-03-2024,19-03-2027,80,500,40,29143090,Store below 25°C
```

### Mixed with IDs
```csv
medicine_id,medicine_name,batch_number,expiry_date,mrp,quantity,unit_price
123,Aspirin,B001,31-12-2026,100,1000,50
,Paracetamol,B002,28-02-2027,45,500,22.50
456,Ibuprofen,B003,30-06-2027,80,500,40
```

---

## Date Format Guide

**IMPORTANT**: All dates must be in DD-MM-YYYY format

| Format | Example | ✓ Correct | ✗ Wrong |
|--------|---------|-----------|---------|
| DD-MM-YYYY | 25-12-2024 | ✓ | ✗ |
| DD-MM-YYYY | 01-01-2026 | ✓ | ✗ |
| MM-DD-YYYY | 12-25-2024 | ✗ | |
| YYYY-MM-DD | 2024-12-25 | ✗ | |
| 2024-Dec-25 | | ✗ | |

**How to format dates in Excel:**
1. Right-click the column
2. Select "Format Cells"
3. Choose "Custom" category
4. Enter format code: `DD-MM-YYYY`

---

## Common Issues & Solutions

### Issue: "Medicine not found"

**Why**: The medicine name doesn't match exactly what's in the database

**Solution**:
1. Use the "Browse Database" button to search for the exact medicine name
2. Copy the exact name from the database
3. Paste it into your CSV file
4. Alternative: Use the medicine_id if you know it

### Issue: "Invalid date format"

**Why**: Date is not in DD-MM-YYYY format

**Solution**:
1. Change the date format to DD-MM-YYYY
2. Examples:
   - Use: `25-12-2024`
   - Don't use: `12-25-2024` or `2024-12-25`

### Issue: File won't upload

**Possible causes & solutions**:

1. **File is too large** (>10MB)
   - Solution: Split into smaller files

2. **Too many rows** (>2000)
   - Solution: Split into multiple uploads

3. **File format is wrong**
   - Solution: Use .csv or .xlsx (Excel) format
   - Save as CSV: File → Save As → Format: CSV UTF-8

4. **Not logged in or not verified**
   - Solution: Ensure you're logged in and your distributor account is verified

### Issue: Quantities not updating

**Why**: System thinks it's a different batch

**Solution**:
- Batch number must be EXACTLY the same (case-sensitive)
- Correct: `B001` = `B001` (updates quantity)
- Wrong: `B001` ≠ `b001` (creates new entry)
- Wrong: `B001` ≠ `B-001` (creates new entry)

### Issue: "Unauthorized" error

**Why**: You're not logged in as a distributor or not verified yet

**Solution**:
1. Verify you're logged in
2. Check that your account type is "distributor"
3. Wait for admin approval if not yet verified
4. Contact admin if verification is pending

---

## Step-by-Step Walkthrough

### Step 1: Download Template
```
1. Go to /distributor/inventory
2. Click "Bulk Upload Medicines" button
3. Click "Template" tab
4. Click "Download Excel Template"
5. File downloads as: medicines_upload_template_2024-01-15.xlsx
6. Save it somewhere you can find it
```

### Step 2: Open & Prepare Data
```
1. Open the downloaded Excel file
2. Delete the example rows (rows 2-3)
3. Click row 2, first column
4. Enter your first medicine name: Aspirin
5. Tab to next column (batch_number)
6. Enter: B001
7. Continue filling in each column for this medicine
8. Press Enter to go to next row
9. Repeat for all your medicines
```

### Step 3: Format Dates (Important!)
```
1. Select the "expiry_date" column
2. Right-click → Format Cells
3. Choose "Custom" category
4. In "Type:" field, enter: DD-MM-YYYY
5. Click OK
6. Now enter dates as: 25-12-2024
```

### Step 4: Verify Data
```
Before uploading, check:
□ All required columns have data
□ No empty cells in required columns
□ All dates are DD-MM-YYYY format
□ Numbers don't have currency symbols
□ No extra blank rows at bottom
□ Medicine names match database (use Browse Database to verify)
```

### Step 5: Upload
```
1. Go back to /distributor/inventory
2. Click "Bulk Upload Medicines"
3. Click "Upload" tab
4. Drag & drop your Excel file into the area
   OR click to browse and select file
5. Click "Upload File" button
6. Wait for processing...
```

### Step 6: Review Results
```
1. Look at the summary cards:
   - Green: Successfully uploaded
   - Yellow: Skipped (already in inventory)
   - Red: Failed (needs fixing)

2. Scroll down to see detailed results table

3. For failures, read the "Message" column to see what went wrong

4. If there are failures:
   - Fix the rows in your Excel file
   - Save it
   - Upload again
```

---

## Tips for Success

### ✓ DO

- ✓ Use DD-MM-YYYY for ALL dates
- ✓ Match medicine names EXACTLY (copy from Browse Database if needed)
- ✓ Fill ALL required columns
- ✓ Use different batch numbers for different batches
- ✓ Include HSN codes for proper GST calculation
- ✓ Test with a small file first (5-10 medicines)
- ✓ Keep a copy of successful uploads for records
- ✓ Re-upload failed rows after fixing

### ✗ DON'T

- ✗ Use YYYY-MM-DD or MM-DD-YYYY date format
- ✗ Add currency symbols to prices (use just the number)
- ✗ Leave required columns empty
- ✗ Mix different batch numbers for the same medicine+strength
- ✗ Upload files with special characters in filenames
- ✗ Upload more than 2000 rows at once
- ✗ Upload files larger than 10MB
- ✗ Use different batch number on re-upload if updating quantity

---

## Column-by-Column Guide

### medicine_id
- **Required**: No (if medicine_name provided)
- **Type**: Number (e.g., 123)
- **Purpose**: Database ID (speeds up lookup)
- **Leave blank if**: You don't know the ID
- **Example**: `123`

### medicine_name
- **Required**: Yes (or provide medicine_id)
- **Type**: Text
- **Purpose**: Identifies which medicine to add
- **Tips**: Must match database exactly
- **Example**: `Aspirin`, `Paracetamol 650mg`

### generic_name
- **Required**: No
- **Type**: Text
- **Purpose**: Scientific name
- **Tips**: Helps identify the medicine
- **Example**: `Acetylsalicylic acid`, `Acetaminophen`

### strength
- **Required**: No
- **Type**: Text
- **Purpose**: Dosage
- **Tips**: Include unit (mg, ml, %)
- **Example**: `500mg`, `10ml`, `2%`

### form
- **Required**: No
- **Type**: Text (from list)
- **Valid values**: tablet, capsule, syrup, injection, cream, drops, inhaler, other
- **Purpose**: Medicine type
- **Example**: `tablet`, `syrup`

### batch_number
- **Required**: Yes
- **Type**: Text
- **Purpose**: Unique batch identifier
- **Tips**: Case-sensitive, use same number for updates
- **Example**: `B001`, `LOT-2024-001`, `BATCH-JAN-2024`

### mfg_date
- **Required**: No
- **Type**: DD-MM-YYYY
- **Purpose**: Manufacturing date
- **Tips**: Optional but recommended
- **Example**: `01-01-2024`, `15-06-2023`

### expiry_date
- **Required**: Yes
- **Type**: DD-MM-YYYY
- **Purpose**: Expiration date
- **Tips**: Must be in future, used for inventory management
- **Example**: `31-12-2026`, `28-02-2027`

### mrp
- **Required**: Yes
- **Type**: Number (decimal OK)
- **Purpose**: Maximum Retail Price
- **Tips**: No currency symbol, use just number
- **Example**: `100`, `45.50`, `2500`

### quantity
- **Required**: Yes
- **Type**: Number (integer)
- **Purpose**: Number of units in stock
- **Tips**: Must be positive
- **Example**: `1000`, `500`, `25`

### unit_price
- **Required**: Yes
- **Type**: Number (decimal OK)
- **Purpose**: Your wholesale cost per unit
- **Tips**: No currency symbol, use just number
- **Example**: `50`, `22.50`, `1250`

### hsn_code
- **Required**: No
- **Type**: Text
- **Purpose**: HSN/SAC code for GST
- **Tips**: Improves tax calculation
- **Example**: `30051090`, `29413000`, `29143090`

### notes
- **Required**: No
- **Type**: Text
- **Purpose**: Storage or handling instructions
- **Tips**: For internal use
- **Example**: `Keep in cool dry place`, `Store below 25°C`, `Refrigerate after opening`

---

## Batch Deduplication Explained

### What happens when you upload the same medicine twice?

If you upload:
```
First upload:
  Aspirin, B001, Quantity: 1000, Unit Price: 50

Second upload (same medicine, same batch):
  Aspirin, B001, Quantity: 500, Unit Price: 50
```

**Result**: 
- NOT two separate entries
- **ONE entry** with Quantity updated to 1500
- Prices and other fields are also updated

### How to upload different batches:

```
Aspirin, B001, Quantity: 1000    ← First batch
Aspirin, B002, Quantity: 500     ← Different batch (different batch_number)
Aspirin, B003, Quantity: 750     ← Third batch
```

**Result**: THREE separate inventory entries (same medicine, different batches)

---

## Keyboard Shortcuts in Excel

- **Tab**: Move to next cell
- **Shift+Tab**: Move to previous cell
- **Enter**: Move to next row
- **Ctrl+D**: Fill down (repeat value above)
- **Ctrl+Shift+End**: Select to end of data
- **Ctrl+Home**: Go to cell A1
- **Ctrl+F**: Find/Replace

---

## Support & Help

### In-App Help
- Click "Guide" tab in the upload dialog for detailed instructions
- Error messages tell you exactly what's wrong and how to fix it

### Documentation
- Full guide: `/BULK_UPLOAD_FEATURE.md`
- Template guide: `/public/medicines_upload_template.md`

### Common Questions

**Q: Can I update prices for existing medicines?**
A: Yes! Upload with the same batch number and updated prices - they'll be updated.

**Q: What if I don't have medicine_id?**
A: Leave it blank, use medicine_name instead. System will find it by name.

**Q: Can I upload different forms of the same medicine?**
A: Yes! Use different batch numbers for different forms/strengths.

**Q: How long does upload take?**
A: Usually 5-30 seconds depending on file size and server load.

**Q: Are there file size limits?**
A: Yes, maximum 10MB per file and 2000 rows per upload.

**Q: Can I schedule automatic uploads?**
A: Not yet, but it's planned for a future version.

---

## Next Steps

1. **Try it now**: Download the template and upload a test batch
2. **Get familiar**: Try uploading 5-10 medicines first
3. **Optimize**: Once comfortable, upload larger batches
4. **Feedback**: Report any issues or suggestions to support

---

**Happy uploading!** 🎉

For support, contact: support@lovemedix.in

---

*Last Updated: January 2025*  
*Version: 1.0*
