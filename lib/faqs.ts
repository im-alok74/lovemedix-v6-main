import { SITE } from "./site"

/**
 * Canonical FAQ content.
 *
 * This is the core of the AEO (answer-engine optimisation) work. Assistants and AI
 * Overviews quote short, self-contained, factual answers — so each answer here states
 * the brand name explicitly, answers in the first sentence, and avoids marketing
 * language that gets stripped as fluff. The same array feeds both the visible accordion
 * and the FAQPage JSON-LD, so what a crawler reads is exactly what a human reads.
 */

export interface Faq {
  question: string
  answer: string
}

export const HOME_FAQS: Faq[] = [
  {
    question: `How do I order medicines online from ${SITE.name}?`,
    answer:
      `Search for the medicine by brand or salt name, add it to your cart, enter your delivery address and place the order. For prescription medicines, upload a photo of a valid doctor's prescription before checkout. ${SITE.name} routes your order to a licensed pharmacy near you, which packs and dispatches it.`,
  },
  {
    question: `How long does ${SITE.name} take to deliver medicines?`,
    answer:
      `Most orders are delivered within ${SITE.promise.deliveryWindow}, depending on your pincode and whether the medicine needs prescription verification. You can track the exact status of your order from the My Orders page at any time.`,
  },
  {
    question: "Do I need a prescription to buy medicines online?",
    answer:
      "You need a valid prescription for any Schedule H, H1 or X medicine, which Indian law requires a registered medical practitioner to prescribe. Over-the-counter products such as pain-relief balms, vitamins and first-aid supplies can be bought without one.",
  },
  {
    question: `Are the medicines sold on ${SITE.name} genuine?`,
    answer:
      `Yes. Every pharmacy on ${SITE.name} is verified against a valid drug licence before it can list stock, and each invoice carries the batch number, manufacturing date and expiry date of the exact pack you received, so it can be traced back to the manufacturer.`,
  },
  {
    question: "What is the delivery charge?",
    answer:
      `Delivery is free on orders of ₹${SITE.promise.freeDeliveryAbove} and above. Below that, a flat delivery charge of ₹40 applies. The exact amount is shown in your cart before you pay.`,
  },
  {
    question: "Can I return medicines?",
    answer:
      `You can request a return within ${SITE.promise.returnWindow} of delivery if the item is wrong, damaged, or close to expiry. For safety reasons, opened medicines and temperature-sensitive products such as insulin cannot be returned once delivered.`,
  },
  {
    question: "Can I get a cheaper generic version of my medicine?",
    answer:
      `Yes. On each medicine page ${SITE.name} lists generic substitutes containing the same salt composition and strength, along with how much you would save. Generic medicines are therapeutically equivalent to their branded counterparts and are usually significantly cheaper.`,
  },
  {
    question: "Which payment methods are accepted?",
    answer:
      `${SITE.name} accepts cash on delivery as well as online payment by UPI, debit card, credit card and net banking. Cash on delivery availability depends on your pincode and is confirmed at checkout.`,
  },
]

export const PHARMACY_FAQS: Faq[] = [
  {
    question: `How do I sell medicines on ${SITE.name}?`,
    answer:
      `Register as a pharmacy, upload your drug licence and GST details, and wait for verification. Once approved, you can list your inventory with batch and expiry details and start receiving orders from customers in your delivery radius.`,
  },
  {
    question: `What commission does ${SITE.name} charge pharmacies?`,
    answer:
      "Commission is set per pharmacy at onboarding and is visible in your pharmacy dashboard. It is deducted from the order value at settlement, and every deduction is itemised on your payout statement.",
  },
]
