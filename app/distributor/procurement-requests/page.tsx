import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth-server"
import { DistributorPurchaseRequestsTable } from "@/components/distributor/distributor-purchase-requests-table"

export default async function DistributorProcurementRequestsPage() {
  const user = await getCurrentUser()
  if (!user || user.user_type !== "distributor") {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/5 py-8">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Procurement Requests</h1>
            <p className="text-muted-foreground mt-1">
              Approve pharmacy requests and mark COD payment collected.
            </p>
          </div>
          <DistributorPurchaseRequestsTable />
        </div>
      </main>
      <Footer />
    </div>
  )
}

