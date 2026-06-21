# Medicine Bulk Upload Template

This file contains examples of how to format your data for bulk medicine uploads.

## CSV Format Example

```csv
medicine_id,medicine_name,generic_name,strength,form,batch_number,mfg_date,expiry_date,mrp,quantity,unit_price,hsn_code,notes
,Aspirin,Acetylsalicylic acid,500mg,tablet,B001,01-01-2024,31-12-2026,100,1000,50,30051090,No specific storage instructions
,Paracetamol,Acetaminophen,650mg,tablet,B002,15-02-2024,14-02-2027,45,500,22.50,29413000,Keep in cool dry place
123,Ibuprofen,Ibuprofen,200mg,tablet,B003,20-03-2024,19-03-2027,80,750,40,29143090,Store below 25°C
,Metformin,Metformin Hydrochloride,500mg,tablet,B004,10-04-2024,09-04-2026,150,2000,75,29333990,Refrigerate after opening
,Amoxicillin,Amoxicillin Trihydrate,250mg,capsule,B005,05-05-2024,04-05-2026,120,500,60,29418100,Keep away from moisture
```

## Column Details

| Column | Required | Format | Example | Notes |
|--------|----------|--------|---------|-------|
| medicine_id | No | Numeric | 123 | Use if you know the ID; system will search by name otherwise |
| medicine_name | Yes | Text | Aspirin | Must match a medicine in our database |
| generic_name | No | Text | Acetylsalicylic acid | IUPAC/Generic name |
| strength | No | Text | 500mg, 10ml, 5% | Used for matching medicines |
| form | No | Text | tablet, capsule, syrup, injection | Must be valid form |
| batch_number | Yes | Text | B001, LOT123 | Unique identifier for this batch |
| mfg_date | No | DD-MM-YYYY | 01-01-2024 | Manufacturing/Batch date |
| expiry_date | Yes | DD-MM-YYYY | 31-12-2026 | Must be in future |
| mrp | Yes | Decimal | 100, 45.50 | Maximum Retail Price |
| quantity | Yes | Numeric | 1000, 500 | Number of units in stock |
| unit_price | Yes | Decimal | 50, 22.50 | Your wholesale price per unit |
| hsn_code | No | Text | 30051090 | For GST classification |
| notes | No | Text | Keep in cool place | Storage/handling instructions |

## Validation Rules

✓ **Required Fields**: medicine_name (or medicine_id), batch_number, expiry_date, mrp, quantity, unit_price
✓ **Date Format**: All dates must be DD-MM-YYYY (e.g., 25-12-2024)
✓ **Batch Uniqueness**: Same medicine + same batch number = quantity update
✓ **File Size**: Maximum 10MB
✓ **Rows Limit**: Maximum 2000 rows per upload
✓ **Numeric Fields**: mrp, quantity, unit_price must be valid numbers

## Medicine Matching

The system matches medicines using this priority:
1. **Exact ID match**: If medicine_id is provided and valid
2. **Exact name + strength match**: If medicine_name matches exactly
3. **Fuzzy name match**: Searches for similar medicine names
4. **Generic name search**: Searches generic_name field

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Medicine not found" | Check spelling, use exact name, or provide medicine_id |
| "Invalid date format" | Use DD-MM-YYYY (e.g., 25-12-2024) |
| "Duplicate entry merged" | Same medicine_id + batch_number = quantity updated |
| "Upload failed" | Check file size (<10MB) and row count (<2000) |
| "Invalid form" | Use: tablet, capsule, syrup, injection, cream, drops, inhaler, other |

## Upload Steps

1. **Download Template**: Click "Download Excel Template" in the upload dialog
2. **Fill Data**: Replace example rows with your medicines
3. **Remove Example Rows**: Delete the sample data
4. **Verify Format**: Ensure all dates and numbers are correct
5. **Upload File**: Drag and drop or select the file
6. **Review Results**: Check success/failure counts
7. **Fix Errors**: Fix failed rows and re-upload

## Best Practices

- Use medicine names exactly as they appear in our database
- Always include batch numbers (required)
- Set expiry dates to actual expiry dates
- Use realistic wholesale prices
- Include HSN codes for proper taxation
- Add notes for special storage requirements
- Test with small uploads first (5-10 medicines)
- Verify quantities match your physical stock

## Support

For questions about:
- **Column meanings**: See Column Details table above
- **Validation errors**: Check the Upload Guide in the dialog
- **Specific medicines**: Use the "Browse Database" feature first
- **Technical issues**: Contact support with upload logs
