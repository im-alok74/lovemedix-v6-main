"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Building2, CheckCircle2, CreditCard, MapPin, Minus, PackageCheck, Plus, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface CartItemWithSeller {
  id: number
  quantity: number
  medicine_id: number
  name: string
  price: number
  discount_percentage: number
  image_url: string | null
  pharmacy_id: number
  pharmacy_name: string
  stock_quantity?: number
}

export function CheckoutForm({ userId }: { userId: number }) {
  const [cartItems, setCartItems] = useState<CartItemWithSeller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pincode, setPincode] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart-with-sellers")
      const data = await response.json()

      if (response.ok) {
        setCartItems(data.cartItems)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const groupByPharmacy = () => {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.pharmacy_id]) {
        acc[item.pharmacy_id] = { name: item.pharmacy_name, items: [] }
      }
      acc[item.pharmacy_id].items.push(item)
      return acc
    }, {} as Record<string, { name: string; items: CartItemWithSeller[] }>)
  }

  const calculateItemPrice = (item: CartItemWithSeller) => {
    const basePrice = item.price * item.quantity
    const discount = basePrice * (item.discount_percentage / 100)
    return basePrice - discount
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemPrice(item), 0)
  }

  const handlePlaceOrder = async () => {
    const invalid = cartItems.some((it) => it.stock_quantity !== undefined && it.quantity > it.stock_quantity)
    if (invalid) {
      toast({ title: "Quantity exceeds stock", description: "Please adjust item quantities before placing the order.", variant: "destructive" })
      return
    }
    if (!fullName.trim()) {
      toast({ title: "Name Required", description: "Please enter your full name", variant: "destructive" })
      return
    }

    if (!phone.trim()) {
      toast({ title: "Phone Required", description: "Please enter your phone number", variant: "destructive" })
      return
    }

    if (!addressLine1.trim()) {
      toast({ title: "Address Line 1 Required", description: "Please enter your address line 1", variant: "destructive" })
      return
    }

    if (!city.trim()) {
      toast({ title: "City Required", description: "Please enter your city", variant: "destructive" })
      return
    }

    if (!state.trim()) {
      toast({ title: "State Required", description: "Please enter your state", variant: "destructive" })
      return
    }

    if (!pincode.trim()) {
      toast({ title: "Pincode Required", description: "Please enter your pincode", variant: "destructive" })
      return
    }

    setIsPlacingOrder(true)

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          cartItems,
          paymentMethod,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse response as JSON", parseError)
        const text = await response.text()
        console.error("Response text:", text.substring(0, 500))
        toast({ title: "Server Error", description: "The server returned an unexpected response. Please try again.", variant: "destructive" })
        return
      }

      if (response.ok) {
        const orderNumber = Array.isArray(data.orderNumbers) ? data.orderNumbers[0] : data.orderNumbers
        router.push(`/order-success?orderId=${orderNumber}&paymentMethod=${paymentMethod}`)
      } else {
        toast({ title: "Error", description: data.error || "Failed to place order", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error during order creation:", error)
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const updateQuantity = async (cartItemId: number, newQty: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity: newQty }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setCartItems((prev) => prev.map((it) => (it.id === cartItemId ? { ...it, quantity: newQty } : it)))
        return
      }

      toast({ title: "Unable to update quantity", description: data.error || "Please try again.", variant: "destructive" })
    } catch {
      toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" })
    }
  }

  const subtotal = calculateSubtotal()
  const deliveryFee = subtotal >= 500 ? 0 : 40
  const gst = subtotal * 0.05
  const total = subtotal + gst + deliveryFee
  const pharmacyGroups = groupByPharmacy()
  const hasInvalidQuantities = cartItems.some((it) => it.stock_quantity !== undefined && it.quantity > it.stock_quantity)

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <Card key={item} className="border-border/60">
              <CardContent className="space-y-3 p-6">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/60">
          <CardContent className="space-y-3 p-6">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Card className="border-border/60 bg-card/95">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Your cart is ready for pickup</p>
            <p className="mt-2 text-sm text-muted-foreground">Browse medicines and return to this step when you are ready.</p>
          </div>
          <Button onClick={() => router.push("/medicines")}>Browse medicines</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <Card className="border-border/60 bg-card/95 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Delivery details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone number *</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter your phone number" required />
                </div>
              </div>
              <div>
                <Label htmlFor="addressLine1">Address line 1 *</Label>
                <Input id="addressLine1" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} placeholder="House No., building, street" required />
              </div>
              <div>
                <Label htmlFor="addressLine2">Address line 2</Label>
                <Input id="addressLine2" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} placeholder="Landmark, colony, area" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" required />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" value={state} onChange={(event) => setState(event.target.value)} placeholder="State" required />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="Pincode" required />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.05 }}>
          <Card className="border-border/60 bg-card/95 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all" style={{ borderColor: paymentMethod === 'cod' ? 'hsl(var(--primary))' : 'hsl(var(--border))', backgroundColor: paymentMethod === 'cod' ? 'hsl(var(--primary) / 0.06)' : 'transparent' }}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(event) => setPaymentMethod(event.target.value as 'cod' | 'online')} className="mt-1 h-4 w-4" />
                <span>
                  <span className="font-semibold text-foreground">Cash on delivery</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Pay once your medicine arrives at your doorstep.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all" style={{ borderColor: paymentMethod === 'online' ? 'hsl(var(--primary))' : 'hsl(var(--border))', backgroundColor: paymentMethod === 'online' ? 'hsl(var(--primary) / 0.06)' : 'transparent' }}>
                <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={(event) => setPaymentMethod(event.target.value as 'cod' | 'online')} className="mt-1 h-4 w-4" />
                <span>
                  <span className="font-semibold text-foreground">Online payment</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Use cards, UPI, or net banking for instant confirmation.</span>
                </span>
              </label>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4">
          {Object.entries(pharmacyGroups).map(([pharmacyId, group]) => (
            <Card key={pharmacyId} className="border-border/60 bg-card/95 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{group.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background/80 p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image src={item.image_url || "/placeholder.svg?height=64&width=64"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          {item.discount_percentage > 0 && <p className="text-xs text-emerald-600">Save {item.discount_percentage}%</p>}
                        </div>
                        <p className="text-sm font-semibold text-primary">₹{calculateItemPrice(item).toFixed(2)}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center rounded-xl border border-border/60 bg-background">
                          <button type="button" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-2">
                            <Minus className="h-4 w-4" />
                          </button>
                          <input type="number" min={1} value={item.quantity} onChange={(event) => updateQuantity(item.id, Math.max(1, Number(event.target.value) || 1))} className="h-8 w-14 border-0 bg-transparent text-center text-sm shadow-none focus-visible:ring-0" />
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {item.stock_quantity !== undefined && item.quantity > item.stock_quantity && (
                          <p className="text-xs text-destructive">Only {item.stock_quantity} available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4 border-border/60 bg-card/95 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Order summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trusted pharmacy delivery
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Prescription-aware purchases and fast dispatch support.</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (5%)</span>
                <span className="font-medium text-foreground">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-medium text-foreground">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
              </div>
              {subtotal >= 500 && <p className="text-xs text-emerald-600">You saved ₹40 on delivery.</p>}
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="font-semibold text-foreground">Total amount</span>
              <span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span>
            </div>
            <Button className="w-full gap-2" size="lg" onClick={handlePlaceOrder} disabled={isPlacingOrder || hasInvalidQuantities}>
              {isPlacingOrder ? "Placing order..." : "Place order"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">Safe, user-friendly checkout for your healthcare needs.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
