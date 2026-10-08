import { createServerFn } from "@tanstack/react-start";
import Razorpay from "razorpay";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Plan price catalog in INR
const PLAN_PRICES: Record<string, { price: number; duration: string }> = {
  "1m": { price: 799, duration: "1 Month" },
  "3m": { price: 1099, duration: "3 Months" }, // Launch offer: ₹1,099
  "6m": { price: 3398, duration: "6 Months" },
  "1y": { price: 7996, duration: "1 Year" },
};

function getRazorpayInstance() {
  const keyId = process.env["VITE_RAZORPAY_KEY_ID"] || process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];

  if (!keyId || !keySecret) {
    throw new Error("Razorpay API credentials (VITE_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing.");
  }

  return {
    razorpay: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret,
  };
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env["VITE_SUPABASE_URL"] || "https://ixfcoilswyagwifaronh.supabase.co";
  const serviceRoleKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmNvaWxzd3lhZ3dpZmFyb25oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDgzOTA5NSwiZXhwIjoyMTA2NDE1MDk1fQ.W8MofXjLgVJ15yXzDP_Cn7Y-lxBSl7RLPFgcuGhArbI";
  return createClient(supabaseUrl, serviceRoleKey);
}

export type CreateOrderInput = {
  creatorId: string;
  creatorName?: string | undefined;
  creatorEmail?: string | undefined;
  creatorContact?: string | undefined;
  planId: string;
  discountCode?: string | undefined;
};

export type VerifyPaymentInput = {
  orderId: string;
  paymentId: string;
  signature: string;
  creatorId: string;
  planId: string;
  duration?: string | undefined;
  discountCode?: string | undefined;
  amountPaid?: number | undefined;
};

/**
 * Server Function: Create a Razorpay Order for one-time checkout (applies discount code if valid)
 */
export const createRazorpayOrderFn = createServerFn({ method: "POST" })
  .validator((data: CreateOrderInput) => data)
  .handler(async ({ data }) => {
    try {
      const { razorpay, keyId } = getRazorpayInstance();
      const planInfo = PLAN_PRICES[data.planId];

      if (!planInfo) {
        throw new Error(`Invalid plan ID: ${data.planId}`);
      }

      let finalPrice = planInfo.price;
      let appliedDiscountPercent = 0;
      let appliedDiscountCode = "";

      // Validate discount code if provided
      if (data.discountCode) {
        const cleanCode = data.discountCode.trim().toUpperCase();
        try {
          const supabase = getSupabaseAdminClient();
          const { data: codeRows } = await supabase
            .from("discount_codes")
            .select("*")
            .eq("code", cleanCode)
            .limit(1);

          if (codeRows && codeRows.length > 0) {
            const row = codeRows[0];
            const now = new Date().getTime();
            const validUntil = new Date(row.valid_until).getTime();
            const validFrom = new Date(row.valid_from).getTime();

            const isExpired = now < validFrom || now > validUntil;
            const isInactive = !row.is_active;
            const isLimitReached =
              row.max_uses != null && Number(row.usage_count) >= Number(row.max_uses);

            if (!isExpired && !isInactive && !isLimitReached) {
              appliedDiscountPercent = Number(row.discount_percent) || 0;
              appliedDiscountCode = row.code;

              if (row.discount_type === "flat") {
                const flatVal = Number(row.discount_value) || 0;
                finalPrice = Math.max(0, finalPrice - flatVal);
              } else {
                const discountAmt = Math.round((finalPrice * appliedDiscountPercent) / 100);
                finalPrice = Math.max(0, finalPrice - discountAmt);
              }
            }
          }
        } catch (dbErr) {
          console.warn("[Razorpay] Could not query discount code:", dbErr);
        }
      }

      // If discounted price is ₹0 (100% free), return early (no Razorpay order needed)
      if (finalPrice <= 0) {
        return {
          success: true,
          orderId: `free_${data.creatorId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}_${Date.now()}`,
          amount: 0,
          currency: "INR",
          keyId,
          planDuration: planInfo.duration,
          planPrice: 0,
          isFree: true,
          appliedDiscountPercent,
          appliedDiscountCode,
        };
      }

      const amountInPaise = Math.round(finalPrice * 100);
      const receipt = `rcpt_${data.creatorId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}_${Date.now()}`;

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          creatorId: data.creatorId,
          creatorName: data.creatorName || "Creator",
          planId: data.planId,
          duration: planInfo.duration,
          discountCode: appliedDiscountCode || "none",
          originalPrice: String(planInfo.price),
          finalPrice: String(finalPrice),
          platform: "Influencer Dhundo",
        },
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        planDuration: planInfo.duration,
        planPrice: finalPrice,
        originalPrice: planInfo.price,
        appliedDiscountPercent,
        appliedDiscountCode,
      };
    } catch (error: any) {
      console.error("[Razorpay] createOrder error:", error);
      return {
        success: false,
        error: error.message || "Failed to create Razorpay order",
      };
    }
  });

/**
 * Server Function: Verify the HMAC SHA-256 signature returned by Razorpay
 */
export const verifyRazorpayPaymentFn = createServerFn({ method: "POST" })
  .validator((data: VerifyPaymentInput) => data)
  .handler(async ({ data }) => {
    try {
      const { keySecret } = getRazorpayInstance();
      const { orderId, paymentId, signature, creatorId, planId, discountCode, amountPaid } = data;

      // Verify HMAC SHA-256 signature
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body.toString())
        .digest("hex");

      const isSignatureValid = expectedSignature === signature;

      if (!isSignatureValid) {
        console.error("[Razorpay] Signature mismatch!", { orderId, paymentId });
        return {
          success: false,
          isVerified: false,
          error: "Payment verification failed: Invalid digital signature.",
        };
      }

      // Record payment in Supabase and increment discount code usage if applicable
      try {
        const supabase = getSupabaseAdminClient();
        const planInfo = PLAN_PRICES[planId];
        const recordAmount = amountPaid ?? planInfo?.price ?? 0;

        await supabase.from("payments").insert([
          {
            creator_id: creatorId,
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            amount: recordAmount,
            currency: "INR",
            plan_id: planId,
            status: "captured",
          },
        ]);

        if (discountCode) {
          const cleanCode = discountCode.trim().toUpperCase();
          const { data: codeRow } = await supabase
            .from("discount_codes")
            .select("id, usage_count")
            .eq("code", cleanCode)
            .maybeSingle();

          if (codeRow) {
            await supabase
              .from("discount_codes")
              .update({
                usage_count: Number(codeRow.usage_count || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", codeRow.id);
          }
        }
      } catch (dbErr) {
        console.warn("[Razorpay] Note: Logging to payments/discount_codes table skipped:", dbErr);
      }

      return {
        success: true,
        isVerified: true,
        orderId,
        paymentId,
      };
    } catch (error: any) {
      console.error("[Razorpay] verifyPayment error:", error);
      return {
        success: false,
        isVerified: false,
        error: error.message || "Payment verification encountered an unexpected error",
      };
    }
  });

// ── CLIENT-SIDE RAZORPAY CHECKOUT POPUP LOGIC ──

let scriptLoadedPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (scriptLoadedPromise) return scriptLoadedPromise;

  scriptLoadedPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout script");
      scriptLoadedPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadedPromise;
}

export type OpenRazorpayOptions = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
};

export async function openRazorpayCheckout(options: OpenRazorpayOptions) {
  if (typeof window === "undefined") return;

  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    throw new Error("Unable to load Razorpay payment SDK. Please check your internet connection.");
  }

  const rzpOptions = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency || "INR",
    name: "Influencer Dhundo",
    description: options.description,
    order_id: options.orderId,
    image: "/favicon.ico",
    prefill: {
      name: options.prefill?.name || "",
      email: options.prefill?.email || "",
      contact: options.prefill?.contact || "",
    },
    notes: options.notes || {},
    theme: {
      color: "#ff6600", // Brand saffron
    },
    handler: function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
      escape: true,
      backdropclose: false,
    },
  };

  const razorpayInstance = new (window as any).Razorpay(rzpOptions);
  razorpayInstance.on("payment.failed", function (response: any) {
    console.error("[Razorpay] Payment failed:", response.error);
    if (options.onError) {
      options.onError(response.error);
    }
  });

  razorpayInstance.open();
}
