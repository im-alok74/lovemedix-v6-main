"use client"

import { useState } from "react"
import { Loader2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"

type Result =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "serviceable"; city: string | null; window: string; cod: boolean }
  | { state: "unserviceable" }
  | { state: "error"; message: string }

/**
 * Pincode serviceability check.
 *
 * Both 1mg and Apollo put this above the fold, and for good reason: telling someone up
 * front that you do not deliver to them is far better than letting them build a cart and
 * discover it at checkout.
 */
export function PincodeCheck() {
  const [pincode, setPincode] = useState("")
  const [result, setResult] = useState<Result>({ state: "idle" })

  async function check(event: React.FormEvent) {
    event.preventDefault()

    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setResult({ state: "error", message: "Enter a valid 6-digit pincode." })
      return
    }

    setResult({ state: "checking" })

    try {
      const response = await fetch(`/api/serviceability?pincode=${pincode}`)
      const data = await response.json()

      if (!response.ok) {
        setResult({ state: "error", message: data.error ?? "Could not check right now." })
        return
      }

      setResult(
        data.serviceable
          ? {
              state: "serviceable",
              city: data.city ?? null,
              window: data.deliveryWindow,
              cod: Boolean(data.codAvailable),
            }
          : { state: "unserviceable" },
      )
    } catch {
      setResult({ state: "error", message: "Network error. Please try again." })
    }
  }

  return (
    <div>
      <form onSubmit={check} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={pincode}
            onChange={(event) => {
              setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))
              setResult({ state: "idle" })
            }}
            inputMode="numeric"
            maxLength={6}
            placeholder="Delivery pincode"
            aria-label="Delivery pincode"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm tabular-nums placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Button type="submit" variant="outline" disabled={result.state === "checking"}>
          {result.state === "checking" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Check"}
        </Button>
      </form>

      <div aria-live="polite" className="mt-2 min-h-[1.25rem]">
        {result.state === "serviceable" ? (
          <p className="text-sm text-[color:var(--success)]">
            Delivering{result.city ? ` to ${result.city}` : ""} in {result.window}
            {result.cod ? " · Cash on delivery available" : " · Prepaid orders only"}
          </p>
        ) : result.state === "unserviceable" ? (
          <p className="text-sm text-muted-foreground">
            Not delivering here yet. You can still order — we will contact you if a nearby pharmacy can fulfil it.
          </p>
        ) : result.state === "error" ? (
          <p className="text-sm text-destructive">{result.message}</p>
        ) : null}
      </div>
    </div>
  )
}
