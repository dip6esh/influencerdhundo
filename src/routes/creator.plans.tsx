import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import {
  PLANS,
  PROMO_CODE_3DAYS,
  formatPrice,
  getActiveSubscription,
  getQueuedSubscriptions,
  getSubscriptionExpiry,
  isSubscriptionActive,
} from "@/lib/directory-data";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Gift,
  Layers,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import {
  createRazorpayOrderFn,
  verifyRazorpayPaymentFn,
  openRazorpayCheckout,
} from "@/lib/razorpay";
import { supabaseDb } from "@/lib/supabase";

export const Route = createFileRoute("/creator/plans")({
  head: () => ({
    meta: [
      { title: "Creator subscription & payment — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Activate your creator profile to get discovered by local businesses. Choose a subscription plan or use promo code TRYFREE3DAYS for a 3-day free trial.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Plans,
});

type PaymentMethod = "upi" | "card" | "netbanking";

function Plans() {
  const navigate = useNavigate();
  const { myCreatorId, creators, subscriptions, activateSubscription, hasUsedTrial } = useAppState();
  const mine = creators.find((c) => c.id === myCreatorId);

  // Check active and queued subscriptions
  const activeSub = myCreatorId ? getActiveSubscription(subscriptions, myCreatorId) : undefined;
  const queuedSubs = myCreatorId ? getQueuedSubscriptions(subscriptions, myCreatorId) : [];
  const hasActivePlan = !!activeSub && isSubscriptionActive(activeSub);
  const currentExpiry = activeSub ? getSubscriptionExpiry(activeSub) : null;
  const lastQueued = queuedSubs.length > 0 ? queuedSubs[queuedSubs.length - 1] : undefined;
  const queueStartTime = lastQueued ? getSubscriptionExpiry(lastQueued) : currentExpiry;

  // One-time trial enforcement: Strictly allowed only once per creator
  const trialAlreadyUsed = Boolean(
    mine?.trialStartedAt ||
      (myCreatorId ? hasUsedTrial(myCreatorId) : false) ||
      subscriptions.some(
        (s) =>
          s.creatorId === myCreatorId &&
          (s.planId === "trial-3d" || s.isTrial === true || s.duration?.toLowerCase().includes("3 day")),
      ),
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string>("3m");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
    type: "percentage" | "flat";
    value: number;
    isTrial?: boolean;
    validUntil?: string;
    note?: string;
    applicablePlans?: string[] | undefined;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];
  const isTrialApplied = Boolean(appliedDiscount?.isTrial && !trialAlreadyUsed);

  // Price calculations — 1m and 3m plans have a limited launch offer of 45% OFF
  const LAUNCH_OFFER_1M_PRICE = 439;
  const LAUNCH_OFFER_3M_PRICE = 1099;
  const getBasePlanPrice = (planId: string, price: number) =>
    planId === "1m" ? LAUNCH_OFFER_1M_PRICE : planId === "3m" ? LAUNCH_OFFER_3M_PRICE : price;

  const basePrice = getBasePlanPrice(selectedPlan.id, selectedPlan.price);

  // Dynamic discount calculation across all plans (respects plan-specific restrictions)
  const calculateDiscountForPrice = (price: number, planId: string = selectedPlan.id) => {
    if (isTrialApplied) return price; // 100% off for 3-day trial
    if (!appliedDiscount) return 0;
    if (
      appliedDiscount.applicablePlans &&
      appliedDiscount.applicablePlans.length > 0 &&
      !appliedDiscount.applicablePlans.includes("all") &&
      !appliedDiscount.applicablePlans.includes(planId)
    ) {
      return 0; // Discount not applicable to this plan
    }
    if (appliedDiscount.type === "flat") {
      return Math.min(price, appliedDiscount.value);
    }
    return Math.round((price * appliedDiscount.percent) / 100);
  };

  const discountAmount = calculateDiscountForPrice(basePrice, selectedPlan.id);
  const finalPrice = isTrialApplied ? 0 : Math.max(0, basePrice - discountAmount);

  const handleApplyPromo = async () => {
    setPromoError("");
    setPaymentError("");
    const cleaned = promoCodeInput.trim().toUpperCase();
    if (!cleaned) {
      setPromoError("Please enter a coupon code.");
      return;
    }

    // 1. Check built-in 3-day free trial code
    if (cleaned === PROMO_CODE_3DAYS) {
      if (trialAlreadyUsed) {
        setPromoError(
          "You have already availed the free trial. The trial is strictly available once per creator and cannot be renewed or used again. Please choose a paid plan.",
        );
        return;
      }
      setAppliedDiscount({
        code: PROMO_CODE_3DAYS,
        percent: 100,
        type: "percentage",
        value: 100,
        isTrial: true,
        note: "3 Days Free Trial",
      });
      setPromoCodeInput("");
      return;
    }

    // 2. Validate admin-created discount code from Supabase
    setValidatingPromo(true);
    try {
      const userContext = {
        email: mine?.contact?.email || (mine as any)?.email || "",
        phone: mine?.contact?.phone || (mine as any)?.phone || "",
        planId: selectedPlanId,
      };
      const res = await supabaseDb.validateDiscountCode(cleaned, userContext);
      if (!res.valid) {
        setPromoError(res.error || "Invalid coupon code.");
        return;
      }

      const dc = res.discountCode;
      setAppliedDiscount({
        code: dc.code,
        percent: dc.discountPercent,
        type: dc.discountType,
        value: dc.discountValue,
        validUntil: dc.validUntil,
        applicablePlans: dc.applicablePlans,
        note:
          dc.discountPercent === 100
            ? "100% OFF (Free Pass)"
            : dc.discountType === "flat"
            ? `₹${dc.discountValue} OFF`
            : `${dc.discountPercent}% OFF`,
      });
      setPromoCodeInput("");
    } catch {
      setPromoError("Failed to validate promo code. Please try again.");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoError("");
    setPaymentError("");
  };

  const handleActivate = async () => {
    if (!mine) return;
    setPaymentError("");
    setProcessing(true);

    try {
      if (isTrialApplied && trialAlreadyUsed) {
        setPromoError(
          "You have already used the free trial. Please choose a paid subscription plan.",
        );
        setAppliedDiscount(null);
        setProcessing(false);
        return;
      }

      // 1. FREE PASS (₹0 / 100% Discount / Trial): Instant activation without payment gateway
      if (isTrialApplied || finalPrice === 0) {
        const planIdToActivate = isTrialApplied ? "trial-3d" : selectedPlan.id;
        const durationToActivate = isTrialApplied ? "3 Days Free Trial" : selectedPlan.duration;

        await activateSubscription({
          creatorId: mine.id,
          planId: planIdToActivate,
          duration: durationToActivate,
          price: 0,
        });

        // If a 100% discount code was used, increment usage count
        if (appliedDiscount?.code && !isTrialApplied) {
          await supabaseDb.incrementDiscountCodeUsage(appliedDiscount.code);
        }

        setSuccess(true);
        setTimeout(() => {
          navigate({ to: "/creator/dashboard" });
        }, 1500);
        return;
      }

      // 2. PAID PLAN: Create Razorpay Order securely on server with discount code applied
      const orderRes = await createRazorpayOrderFn({
        data: {
          creatorId: mine.id,
          creatorName: mine.name || mine.displayName,
          creatorEmail: mine.contact?.email,
          creatorContact: mine.contact?.phone,
          planId: selectedPlan.id,
          discountCode: appliedDiscount?.code,
        },
      });

      if (!orderRes || !orderRes.success || !orderRes.orderId) {
        throw new Error(orderRes?.error || "Failed to initialize Razorpay payment order.");
      }

      // 3. Open Razorpay Checkout Modal for the discounted amount
      await openRazorpayCheckout({
        keyId: orderRes.keyId || import.meta.env["VITE_RAZORPAY_KEY_ID"] || "",
        orderId: orderRes.orderId,
        amount: Number(orderRes.amount),
        currency: orderRes.currency || "INR",
        name: "Influencer Dhundo",
        description: `Creator Pass: ${selectedPlan.duration} (${formatPrice(finalPrice)})`,
        prefill: {
          name: mine.name || mine.displayName,
          email: mine.contact?.email || "",
          contact: mine.contact?.phone || "",
        },
        notes: {
          creatorId: mine.id,
          planId: selectedPlan.id,
          duration: selectedPlan.duration,
          discountCode: appliedDiscount?.code || "none",
        },
        onSuccess: async (response) => {
          try {
            // 4. Verify payment digital signature on backend
            const verifyRes = await verifyRazorpayPaymentFn({
              data: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                creatorId: mine.id,
                planId: selectedPlan.id,
                duration: selectedPlan.duration,
                discountCode: appliedDiscount?.code,
                amountPaid: finalPrice,
              },
            });

            if (!verifyRes || !verifyRes.success || !verifyRes.isVerified) {
              setPaymentError(
                verifyRes?.error ||
                  "Payment verification failed. If money was debited, please contact support with Order ID: " +
                    response.razorpay_order_id,
              );
              setProcessing(false);
              return;
            }

            // 5. Activate or queue subscription in application state
            await activateSubscription({
              creatorId: mine.id,
              planId: selectedPlan.id,
              duration: selectedPlan.duration,
              price: finalPrice,
            });

            setSuccess(true);
            setTimeout(() => {
              navigate({ to: "/creator/dashboard" });
            }, 1500);
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr);
            setPaymentError(verifyErr.message || "Payment verification failed. Please contact support.");
            setProcessing(false);
          }
        },
        onDismiss: () => {
          setProcessing(false);
        },
        onError: (err) => {
          setPaymentError(err?.description || "Payment cancelled or failed. Please try again.");
          setProcessing(false);
        },
      });
    } catch (err: any) {
      console.error("Payment activation error:", err);
      setPaymentError(err.message || "Failed to start payment. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50 pb-20">
      {/* HEADER SECTION */}
      <section className="relative overflow-hidden pt-10 pb-8 md:pt-14 md:pb-10">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5">
          <div className="max-w-2xl">
            <SectionEyebrow>Membership &amp; Payment</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              Make your profile visible
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Once active, your profile appears immediately in the public directory so local
              businesses can discover and contact you directly.
            </p>
          </div>

          {/* ACTIVE SUBSCRIPTION QUEUE NOTICE BANNER */}
          {hasActivePlan && queueStartTime ? (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-accent/20 via-primary/15 to-accent/10 p-4 border border-accent/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tealdeep text-white shadow-sm">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>You Have an Active Plan ({activeSub?.duration})</span>
                    <span className="rounded-full bg-accent/25 text-tealdeep px-2 py-0.5 text-[11px] font-bold">
                      Active
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your current plan is valid until{" "}
                    <strong className="text-foreground font-semibold">
                      {currentExpiry?.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                    . Subscribing to a new plan now will place it in your <strong>queue</strong>, and it will <strong>automatically activate</strong> the instant your current plan expires!
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* QUICK PROMO NOTICE BANNER — only shown if trial not yet used and no active plan */}
          {!hasActivePlan && !appliedDiscount && !trialAlreadyUsed ? (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/15 to-primary/10 p-4 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Gift className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Try Influencer Dhundo for free!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use code <span className="font-mono font-bold text-foreground">TRYFREE3DAYS</span> to get 3 days full directory access at ₹0.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedDiscount({
                    code: PROMO_CODE_3DAYS,
                    percent: 100,
                    type: "percentage",
                    value: 100,
                    isTrial: true,
                    note: "3 Days Free Trial",
                  });
                  setPromoError("");
                }}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer"
              >
                <Zap className="size-3.5" />
                Apply 3-Day Free Code
              </button>
            </div>
          ) : null}

          {/* TRIAL ALREADY USED NOTICE — only shown if trial has ended/used AND creator has no active plan */}
          {trialAlreadyUsed && !hasActivePlan ? (
            <div className="mt-6 rounded-2xl bg-secondary/80 border border-border p-4 flex items-start gap-3 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/10 text-muted-foreground">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Free trial already used
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The 3-day free trial can only be used once per creator account. Your profile is
                  safely saved — choose a paid plan below to make it visible in the directory again.
                </p>
              </div>
            </div>
          ) : null}

          {/* MAIN CHECKOUT LAYOUT */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12 items-start">
            
            {/* LEFT COLUMN: PLAN SELECTION & PROMO */}
            <div className="space-y-6 lg:col-span-7">
              
              {/* PLAN CARDS */}
              <div>
                <h2 className="text-lg font-display font-semibold mb-3">1. Select a plan duration</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PLANS.map((p) => {
                    const isSelected = selectedPlanId === p.id && !isTrialApplied;
                    const standardPrice = getBasePlanPrice(p.id, p.price);
                    const planDiscount = calculateDiscountForPrice(standardPrice, p.id);
                    const planFinalPrice = isTrialApplied ? 0 : Math.max(0, standardPrice - planDiscount);
                    const isDiscountApplicableToThisPlan = planDiscount > 0 || isTrialApplied;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          if (isTrialApplied) setAppliedDiscount(null);
                        }}
                        className={`relative rounded-2xl p-5 text-left transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-foreground text-background shadow-lg ring-2 ring-primary scale-[1.01]"
                            : "glass-card hover:border-foreground/40 bg-card text-foreground"
                        }`}
                      >
                        {(p.id === "1m" || p.id === "3m") && !appliedDiscount && (
                          <>
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm whitespace-nowrap">
                              Limited Launch Offer
                            </div>
                            <div className="absolute -top-2.5 -right-2.5 z-10 flex size-10 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-md leading-none">
                              <span className="text-[10px] font-extrabold tracking-tight">45%</span>
                              <span className="text-[7.5px] uppercase font-bold tracking-wider opacity-90">OFF</span>
                            </div>
                          </>
                        )}
                        {appliedDiscount && isDiscountApplicableToThisPlan && (
                          <div className="absolute -top-2.5 -right-2.5 z-10 flex h-6 items-center justify-center rounded-full bg-tealdeep px-2 text-[10px] font-bold text-white shadow-md">
                            {appliedDiscount.percent === 100
                              ? "FREE"
                              : appliedDiscount.type === "flat"
                              ? `-₹${appliedDiscount.value}`
                              : `${appliedDiscount.percent}% OFF`}
                          </div>
                        )}
                        <p
                          className={
                            isSelected
                              ? "text-xs font-semibold uppercase tracking-[0.14em] text-primary"
                              : "label-caps"
                          }
                        >
                          {p.note}
                        </p>
                        <p className="mt-1.5 font-display text-2xl font-semibold">
                          {p.duration}
                        </p>
                        {appliedDiscount && !isTrialApplied && isDiscountApplicableToThisPlan ? (
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-xl font-bold ${isSelected ? "text-primary" : "text-tealdeep"}`}>
                              {formatPrice(planFinalPrice)}
                            </span>
                            <span className={`text-sm line-through ${isSelected ? "text-background/60" : "text-muted-foreground"}`}>
                              {formatPrice(standardPrice)}
                            </span>
                          </div>
                        ) : p.id === "1m" ? (
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-xl font-bold ${isSelected ? "text-primary" : "text-saffrondeep"}`}>
                              ₹439
                            </span>
                            <span className={`text-sm line-through ${isSelected ? "text-background/60" : "text-muted-foreground"}`}>
                              ₹799
                            </span>
                          </div>
                        ) : p.id === "3m" ? (
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-xl font-bold ${isSelected ? "text-primary" : "text-saffrondeep"}`}>
                              ₹1,099
                            </span>
                            <span className={`text-sm line-through ${isSelected ? "text-background/60" : "text-muted-foreground"}`}>
                              ₹1,999
                            </span>
                          </div>
                        ) : (
                          <p
                            className={`mt-2 text-xl font-bold ${
                              isSelected ? "text-primary" : "text-saffrondeep"
                            }`}
                          >
                            {formatPrice(p.price)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PROMO CODE SECTION */}
              <Card className="glass-card rounded-2xl p-6 border border-border/80">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">2. Discount or promo code</h3>
                </div>

                {appliedDiscount ? (
                  <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-tealdeep shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-tealdeep font-mono tracking-wide">
                          {appliedDiscount.code} APPLIED
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {appliedDiscount.note || "Discount applied on all plans"}
                          {appliedDiscount.validUntil && (
                            <span className="block text-[11px] text-muted-foreground/80">
                              Valid until {new Date(appliedDiscount.validUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs text-muted-foreground hover:text-rose underline underline-offset-2 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <TextInput
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder="Enter coupon or promo code"
                        className="font-mono uppercase tracking-wider"
                      />
                      <Button
                        variant="primary"
                        onClick={handleApplyPromo}
                        disabled={validatingPromo}
                        className="shrink-0 px-5 font-semibold"
                      >
                        {validatingPromo ? "Applying..." : "Apply"}
                      </Button>
                    </div>

                    {promoError ? (
                      <p className="text-xs font-medium text-rose">{promoError}</p>
                    ) : !trialAlreadyUsed ? (
                      <p className="text-xs text-muted-foreground">
                        Have a referral or promo code? Enter it above to get instant discounts.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Enter any valid discount code to apply savings across all plans.
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* PAYMENT METHOD (Only if amount > 0) */}
              {finalPrice > 0 ? (
                <Card className="glass-card rounded-2xl p-6 border border-border/80">
                  <h3 className="text-sm font-semibold mb-3">3. Payment method</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "upi", label: "UPI / QR", icon: QrCode },
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "netbanking", label: "NetBanking", icon: ShieldCheck },
                    ].map((pm) => {
                      const Icon = pm.icon;
                      const active = paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                          className={`rounded-xl p-3 text-center border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            active
                              ? "bg-primary/10 border-primary text-foreground font-semibold shadow-xs"
                              : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                          }`}
                        >
                          <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                          <span className="text-xs">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ) : null}
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <div className="lg:col-span-5">
              <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl border border-border/80 sticky top-24">
                <h3 className="text-lg font-display font-semibold tracking-tight">
                  Order summary
                </h3>

                <div className="mt-5 space-y-3.5 border-b border-border pb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator profile</span>
                    <span className="font-semibold text-foreground">
                      {mine?.name || "Your Profile"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan duration</span>
                    <span className="font-semibold text-foreground">
                      {isTrialApplied ? "3 Days Free Trial" : selectedPlan.duration}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Base plan price</span>
                    {selectedPlan.id === "3m" && !appliedDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(selectedPlan.price)}</span>
                        <span className="font-medium text-saffrondeep">{formatPrice(basePrice)}</span>
                        <span className="text-[10px] font-bold text-saffrondeep bg-primary/10 px-1.5 py-0.5 rounded-full">45% off</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {formatPrice(basePrice)}
                      </span>
                    )}
                  </div>

                  {appliedDiscount && discountAmount > 0 ? (
                    <div className="flex justify-between text-tealdeep font-medium">
                      <span className="flex items-center gap-1 text-xs">
                        <Tag className="size-3.5 text-tealdeep" />
                        <span>Promo Discount ({appliedDiscount.code})</span>
                      </span>
                      <span className="font-semibold">
                        - {formatPrice(discountAmount)}
                      </span>
                    </div>
                  ) : null}

                  {hasActivePlan && queueStartTime ? (
                    <div className="flex justify-between items-center text-tealdeep font-medium">
                      <span className="flex items-center gap-1 text-xs">
                        <CalendarClock className="size-3.5 text-tealdeep" /> Activation
                      </span>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-tealdeep">
                        Queued (starts {queueStartTime.toLocaleDateString("en-IN", { month: "short", day: "numeric" })})
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Total Payable
                    </p>
                    {finalPrice === 0 ? (
                      <span className="inline-block mt-0.5 text-[11px] font-semibold text-tealdeep">
                        100% Free · No card required
                      </span>
                    ) : null}
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground">
                    {formatPrice(finalPrice)}
                  </p>
                </div>

                {/* SUCCESS NOTIFICATION */}
                {success ? (
                  <div className="mt-6 rounded-xl bg-accent/15 border border-accent/30 p-4 text-center">
                    <CheckCircle2 className="size-6 text-tealdeep mx-auto" />
                    <p className="mt-2 text-sm font-semibold text-tealdeep">
                      {isTrialApplied
                        ? "🎉 3-Day Free Trial Activated!"
                        : hasActivePlan
                        ? "🎉 Payment Successful & Plan Queued!"
                        : "🎉 Payment Successful & Profile Active!"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasActivePlan
                        ? "Your queued plan will auto-activate when the current one expires."
                        : "Redirecting to your dashboard..."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {paymentError ? (
                      <div className="rounded-xl bg-rose/10 border border-rose/30 p-3.5 flex items-start gap-2.5 text-xs text-rose">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{paymentError}</span>
                      </div>
                    ) : null}

                    <Button
                      variant={isTrialApplied ? "ink" : "primary"}
                      className="w-full justify-center py-4 text-base font-semibold shadow-md gap-2"
                      disabled={processing}
                      onClick={handleActivate}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {isTrialApplied
                            ? "Activating free trial..."
                            : hasActivePlan
                            ? "Queueing plan..."
                            : "Processing payment..."}
                        </>
                      ) : isTrialApplied ? (
                        <>
                          <Zap className="size-4" />
                          Activate 3 Days Free Trial (₹0)
                        </>
                      ) : hasActivePlan ? (
                        `Pay ${formatPrice(finalPrice)} & Queue Plan`
                      ) : (
                        `Pay ${formatPrice(finalPrice)} & Activate`
                      )}
                    </Button>

                    <Link
                      to="/creator/dashboard"
                      className="block text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 pt-1"
                    >
                      Skip for now (remain hidden)
                    </Link>
                  </div>
                )}

                <div className="mt-6 rounded-xl bg-secondary/60 p-3.5 text-xs text-muted-foreground space-y-1.5 border border-border/50">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    Directory guarantee
                  </div>
                  <p>
                    {isTrialApplied
                      ? "Your profile will be active in the directory for 3 days. After 3 days, it automatically becomes inactive unless upgraded."
                      : "Instant directory activation upon payment confirmation. You can edit your details any time."}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
