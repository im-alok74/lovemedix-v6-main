import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create workbook with two sheets
    const wb = XLSX.utils.book_new()

    // Sheet 1: Template with example data
    const templateData = [
      {
        medicine_name: "Aspirin",
        generic_name: "Acetylsalicylic acid",
        strength: "500mg",
        form: "Tablet",
        manufacturer: "Bayer",
        category: "Pain Relief",
        description: "For headache and fever relief",
        image_base64: "[Optional: Base64 encoded image data]",
        batch_number: "B001",
        mfg_date: "01-01-2024",
        expiry_date: "31-12-2025",
        mrp: 100,
        quantity: 1000,
        unit_price: 50,
        hsn_code: "30051090",
        notes: "Store in cool, dry place",
      },
      {
        medicine_name: "Paracetamol",
        generic_name: "Acetaminophen",
        strength: "650mg",
        form: "Tablet",
        manufacturer: "GSK",
        category: "Fever Reducer",
        description: "For fever and pain relief",
        image_base64: "",
        batch_number: "B002",
        mfg_date: "15-01-2024",
        expiry_date: "14-01-2026",
        mrp: 45,
        quantity: 500,
        unit_price: 22.5,
        hsn_code: "29413000",
        notes: "Keep dry",
      },
    ]

    const templateSheet = XLSX.utils.json_to_sheet(templateData)
    templateSheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ]

    XLSX.utils.book_append_sheet(wb, templateSheet, "Template with Examples")

    // Sheet 2: Instructions
    const instructionsData = [
      {
        Field: "medicine_name",
        Required: "Yes*",
        Description:
          "Name of the medicine (e.g., Aspirin, Paracetamol). Either medicine_name or medicine_id is required.",
        Example: "Aspirin",
      },
      {
        Field: "medicine_id",
        Required: "Yes*",
        Description: "Numeric ID of existing medicine in database. Either medicine_id or medicine_name is required.",
        Example: "123",
      },
      {
        Field: "generic_name",
        Required: "Optional",
        Description: "Generic name of the medicine. Used for new medicine creation.",
        Example: "Acetylsalicylic acid",
      },
      {
        Field: "strength",
        Required: "Optional",
        Description: "Strength/dosage of the medicine. Used for matching and new medicine creation.",
        Example: "500mg",
      },
      {
        Field: "form",
        Required: "Optional",
        Description: "Dosage form (Tablet, Capsule, Syrup, etc.). Used for new medicine creation.",
        Example: "Tablet",
      },
      {
        Field: "manufacturer",
        Required: "Optional",
        Description: "Medicine manufacturer. Used for new medicine creation.",
        Example: "Bayer",
      },
      {
        Field: "category",
        Required: "Optional",
        Description: "Medicine category (Pain Relief, Fever Reducer, etc.). Used for new medicine creation.",
        Example: "Pain Relief",
      },
      {
        Field: "description",
        Required: "Optional",
        Description: "Brief description of the medicine. Used for new medicine creation.",
        Example: "For headache and fever relief",
      },
      {
        Field: "image_base64",
        Required: "Optional",
        Description:
          "Base64 encoded image data for medicine. System will upload to Cloudinary. Include full data URI if available.",
        Example: "[Base64 image data]",
      },
      {
        Field: "batch_number",
        Required: "Yes",
        Description: "Batch number of the medicine stock.",
        Example: "B001",
      },
      {
        Field: "mfg_date",
        Required: "Optional",
        Description: "Manufacturing date in DD-MM-YYYY format.",
        Example: "01-01-2024",
      },
      {
        Field: "expiry_date",
        Required: "Yes",
        Description: "Expiry date in DD-MM-YYYY format.",
        Example: "31-12-2025",
      },
      {
        Field: "mrp",
        Required: "Yes",
        Description: "Maximum Retail Price (selling price). Numeric value without currency.",
        Example: "100",
      },
      {
        Field: "quantity",
        Required: "Yes",
        Description: "Quantity of medicine in stock. Numeric value.",
        Example: "1000",
      },
      {
        Field: "unit_price",
        Required: "Yes",
        Description: "Cost per unit (wholesale price). Numeric value.",
        Example: "50",
      },
      {
        Field: "hsn_code",
        Required: "Optional",
        Description: "HSN code for GST purposes.",
        Example: "30051090",
      },
      {
        Field: "notes",
        Required: "Optional",
        Description: "Additional notes about storage or handling.",
        Example: "Store in cool, dry place",
      },
    ]

    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData)
    instructionsSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 50 }, { wch: 25 }]

    XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions")

    // Generate Excel file
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="medicines_upload_template_v2.xlsx"',
      },
    })
  } catch (error) {
    console.error("[download-template-v2] Error:", error)
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 })
  }
}
