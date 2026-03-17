import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-server"
import { sql } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"

export default async function PharmacyMedicinesPage() {
  const user = await getCurrentUser()

  if (!user || user.user_type !== "pharmacy") {
    redirect("/signin")
  }

  // Get pharmacy profile
  const pharmacyResult = await sql`
    SELECT p.id, p.pharmacy_name, p.verification_status
    FROM pharmacy_profiles p
    WHERE p.user_id = ${user.id}
  ` as any[]

  if (!pharmacyResult || pharmacyResult.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Pharmacy profile not found. Please complete your registration.</p>
        </div>
      </div>
    )
  }

  const pharmacy = pharmacyResult[0]

  if (pharmacy.verification_status !== "verified") {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">Your pharmacy is not yet verified. You can manage medicines once your profile is verified.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Medicines</h1>
        <p className="text-muted-foreground">
          Pharmacies can’t add medicines directly. Please procure stock from distributors.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Go to <span className="font-medium text-foreground">Distributor Procurement</span> to request stock.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            After payment is collected by the distributor, you’ll be able to publish purchased stock to your store.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
