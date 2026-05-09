# Quick Start Guide - Medicines Bulk Upload Feature

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Database is running and accessible via DATABASE_URL
- Node.js is installed

### Step 1: Generate Medicines Data (30 seconds)
```bash
npm run scrape:medicines
```
This creates `scripts/medicines-data.json` with 1000 medicines.

### Step 2: Apply Database Migration
Run this SQL in your database:
```sql
-- Connection: Use your database admin credentials
\i scripts/020-seed-common-medicines.sql
```

Or use your database GUI to run the SQL file.

### Step 3: Seed the Database (1-2 minutes)
```bash
npm run seed:medicines
```

Watch the progress counter. It should show:
```
Progress: 50/1000
Progress: 100/1000
...
Seeding complete!
✓ Successfully added: 1000 medicines
```

### Step 4: Test the Feature
1. Log in as a **verified distributor**
2. Go to: `/distributor/inventory`
3. Look for **"Upload from Database"** button
4. Click it to browse available medicines
5. Search for "Paracetamol" or any other medicine
6. Select a few medicines and click "Upload"

✅ Done! You now have the bulk upload feature working!

## 📊 What You Get

### For Distributors:
- Browse 1000+ commonly used medicines
- Search by name or generic name
- Filter by medicine form (tablet, capsule, syrup, etc.)
- One-click upload to add medicines to inventory
- Real-time upload status
- Default MRP and wholesale pricing

### For Admins:
- Audit trail of all bulk uploads
- Database of common medicines
- Extensible system for adding more medicines

## 🔧 Common Tasks

### Search Medicines by Name
```
Click the search box and type "Aspirin"
Press Enter or click Search button
```

### Filter by Medicine Form
```
Select "Tablet" from the "Medicine Form" dropdown
Results will show only tablets
```

### Upload Multiple Medicines
```
1. Click checkboxes next to medicines
2. Or click the checkbox in the header to select all
3. Click "Upload X Medicines" button
4. Watch the status display
```

### Add More Medicines to Database
1. Edit `scripts/scrape-1mg-medicines.js`
2. Add more medicines to the `commonMedicines` array
3. Run `npm run scrape:medicines`
4. Run `npm run seed:medicines`

## 📱 API Endpoints

### Get Available Medicines
```
GET /api/distributor/medicines/upload-from-database?search=paracetamol&page=1
```

### Upload Selected Medicines
```
POST /api/distributor/medicines/upload-from-database
{
  "medicineIds": [1, 2, 3, 4, 5]
}
```

## ⚡ Performance Tips

- For large uploads (100+ medicines), give it 15-30 seconds
- Search results are cached for 5 seconds
- Database queries are indexed for fast performance

## 🐛 Troubleshooting

### "DATABASE_URL not set"
Make sure `.env.local` has your database URL:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### "Distributor profile not found"
The logged-in user must have a distributor profile and verified status.

### "No medicines found"
Run the seed script: `npm run seed:medicines`
Then check if medicines exist:
```bash
SELECT COUNT(*) FROM medicines WHERE source = 'scraped';
```

### Slow uploads
This is normal for large bulk uploads (100+ medicines). The API is batching inserts for data integrity.

## 📚 Full Documentation

See [MEDICINES_BULK_UPLOAD_FEATURE.md](./MEDICINES_BULK_UPLOAD_FEATURE.md) for complete documentation.

## ✨ Next Steps

1. **Deploy to Production** - Follow your deployment process
2. **Monitor Performance** - Check response times in logs
3. **Gather Feedback** - Ask distributors for feature suggestions
4. **Add More Medicines** - Expand the database as needed

---

Happy uploading! 🎉
