import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Gift,
  Layers,
  Loader2,
  ShieldCheck,
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
  validateSearch: (
    search: Record<string, unknown>,
  ): { plan?: string | undefined; code?: string | undefined; coupon?: string | undefined } => ({
    plan: typeof search["plan"] === "string" ? search["plan"] : undefined,
    code: typeof search["code"] === "string" ? search["code"] : undefined,
    coupon: typeof search["coupon"] === "string" ? search["coupon"] : undefined,
  }),
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

  const isProfileIncomplete = Boolean(!mine || mine.status === "Draft" || !mine.instagram);

  const headerEyebrow = "Creator Membership";

  const headerTitle = isProfileIncomplete
    ? "Activate your creator profile"
    : "Keep your profile active & get discovered";

  const headerSubtitle = isProfileIncomplete
    ? "Complete your profile setup to make your profile active and start getting discovered by local businesses."
    : "Choose a plan below to keep your profile visible to brands and unlock your referral link.";

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

  const search = Route.useSearch();
  const proceedSectionRef = useRef<HTMLDivElement>(null);

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
  const [offerNotice, setOfferNotice] = useState<{
    text: string;
    planName?: string;
    isAutoSwitched?: boolean;
    variant?: "success" | "warning";
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];
  const isTrialApplied = Boolean(appliedDiscount?.isTrial && !trialAlreadyUsed);

  // Smooth scroll helper to direct user attention to the Order Summary / Proceed button
  const scrollToProceed = () => {
    setTimeout(() => {
      proceedSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  };

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

  const handleApplyPromo = async (overrideCode?: string) => {
    setPromoError("");
    setPaymentError("");
    setOfferNotice(null);
    const cleaned = (overrideCode || promoCodeInput).trim().toUpperCase();
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
      setOfferNotice({
        text: "3-Day Free Trial applied",
        planName: "3 Days Free Trial",
        isAutoSwitched: true,
        variant: "success",
      });
      scrollToProceed();
      return;
    }

    // 2. Prevent reusing any promo code already redeemed in past subscriptions
    if (mine?.id) {
      const alreadyRedeemed = subscriptions.some(
        (s) =>
          s.creatorId === mine.id &&
          s.referralCodeUsed?.trim().toUpperCase() === cleaned,
      );
      if (alreadyRedeemed) {
        setPromoError("You have already redeemed this promo code previously. Each discount code can only be used once per creator.");
        return;
      }
    }

    // 3. Validate admin-created discount code from Supabase (skipping strict plan check so we can auto-select the right plan!)
    setValidatingPromo(true);
    try {
      const userContext = {
        creatorId: mine?.id,
        email: mine?.contact?.email || (mine as any)?.email || "",
        phone: mine?.contact?.phone || (mine as any)?.phone || "",
        skipPlanCheck: true,
      };
      const res = await supabaseDb.validateDiscountCode(cleaned, userContext);
      if (!res.valid) {
        setPromoError(res.error || "Invalid coupon code.");
        return;
      }

      const dc = res.discountCode;
      const rawApplicable = dc.applicablePlans || [];
      const specificPlans = rawApplicable.filter((p) => p && p !== "all");

      let noticeText = "";
      let autoSwitched = false;
      let targetPlanName = "";

      // Auto-select the relevant plan if the coupon is plan-specific
      if (specificPlans.length > 0) {
        if (!specificPlans.includes(selectedPlanId)) {
          // Switch to the first applicable plan
          const matchingPlan = PLANS.find((p) => specificPlans.includes(p.id)) || PLANS[0];
          setSelectedPlanId(matchingPlan.id);
          autoSwitched = true;
          targetPlanName = matchingPlan.duration;
          noticeText = `Offer ${dc.code} applied (${matchingPlan.duration} selected)`;
        } else {
          const currentPlan = PLANS.find((p) => p.id === selectedPlanId);
          targetPlanName = currentPlan?.duration || "selected";
          noticeText = `Offer ${dc.code} applied to ${targetPlanName} plan`;
        }
      } else {
        const currentPlan = PLANS.find((p) => p.id === selectedPlanId);
        targetPlanName = currentPlan?.duration || "selected";
        noticeText = `Offer ${dc.code} applied across all plans`;
      }

      setAppliedDiscount({
        code: dc.code,
        percent: dc.discountPercent,
        type: dc.discountType,
        value: dc.discountValue,
        validUntil: dc.validUntil,
        applicablePlans: dc.applicablePlans,
        note:
          dc.discountPercent === 100
            ? "100% OFF"
            : dc.discountType === "flat"
            ? `₹${dc.discountValue} OFF`
            : `${dc.discountPercent}% OFF`,
      });
      setPromoCodeInput("");
      setOfferNotice({
        text: noticeText,
        planName: targetPlanName,
        isAutoSwitched: autoSwitched,
        variant: "success",
      });
      scrollToProceed();
    } catch {
      setPromoError("Failed to validate promo code. Please try again.");
    } finally {
      setValidatingPromo(false);
    }
  };

  // User manually selects a plan
  const handleSelectPlan = (planId: string) => {
    if (appliedDiscount) return;
    setSelectedPlanId(planId);
    if (isTrialApplied) {
      setAppliedDiscount(null);
      setOfferNotice(null);
    }
  };

  // Auto-apply query params on mount
  useEffect(() => {
    if (search.plan && PLANS.some((p) => p.id === search.plan)) {
      setSelectedPlanId(search.plan);
    }
    const incomingCode = search.code || search.coupon;
    if (incomingCode && !appliedDiscount) {
      setPromoCodeInput(incomingCode);
      handleApplyPromo(incomingCode);
    }
  }, [search.plan, search.code, search.coupon]);

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoError("");
    setPaymentError("");
    setOfferNotice(null);
  };

  const handleActivate = async () => {
    if (!mine) return;
    setPaymentError("");

    if (isProfileIncomplete) {
      setPaymentError(
        "Please complete your profile setup first. Your 3-day free trial will start once complete, before you need to choose a paid plan.",
      );
      return;
    }

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

        await activateSubscription(
          {
            creatorId: mine.id,
            planId: planIdToActivate,
            duration: durationToActivate,
            price: 0,
            isTrial: isTrialApplied,
          },
          appliedDiscount?.code,
        );

        // If a 100% discount code was used, increment usage count & record ₹0 invoice
        if (appliedDiscount?.code && !isTrialApplied) {
          await supabaseDb.incrementDiscountCodeUsage(appliedDiscount.code);
          await supabaseDb.recordPromoPayment({
            creatorId: mine.id,
            planId: planIdToActivate,
            promoCode: appliedDiscount.code,
          });
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
            await activateSubscription(
              {
                creatorId: mine.id,
                planId: selectedPlan.id,
                duration: selectedPlan.duration,
                price: finalPrice,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              },
              appliedDiscount?.code,
            );

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
          {/* TOP BACK TO DASHBOARD NAVIGATION */}
          <div className="mb-6">
            <Link
              to="/creator/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-background/90 hover:bg-background border border-border/80 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-2xs hover:scale-102"
            >
              <ArrowLeft className="size-3.5 shrink-0" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="max-w-2xl">
            <SectionEyebrow>{headerEyebrow}</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              {headerTitle}
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              {headerSubtitle}
            </p>
          </div>

          {/* INCOMPLETE PROFILE WARNING BANNER */}
          {isProfileIncomplete ? (
            <div className="mt-6 rounded-2xl sm:rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                  <AlertCircle className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Complete your profile first
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Your profile setup is not complete yet. Complete your profile details to launch your <strong>3-day free trial</strong> and make your profile active before choosing a membership plan.
                  </p>
                </div>
              </div>
              <Link
                to="/creator/register"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                Complete Profile Setup →
              </Link>
            </div>
          ) : null}

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

          {/* QUICK PROMO NOTICE BANNER — only shown if trial not yet used, profile is complete, and no active plan */}
          {!isProfileIncomplete && !hasActivePlan && !appliedDiscount && !trialAlreadyUsed ? (
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
                onClick={() => handleApplyPromo(PROMO_CODE_3DAYS)}
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
                    const isSpecificOfferForPlan =
                      appliedDiscount &&
                      appliedDiscount.applicablePlans &&
                      appliedDiscount.applicablePlans.length > 0 &&
                      !appliedDiscount.applicablePlans.includes("all") &&
                      appliedDiscount.applicablePlans.includes(p.id);
                    const isExcludedFromOffer =
                      appliedDiscount &&
                      appliedDiscount.applicablePlans &&
                      appliedDiscount.applicablePlans.length > 0 &&
                      !appliedDiscount.applicablePlans.includes("all") &&
                      !appliedDiscount.applicablePlans.includes(p.id);
                    const isPlanDisabled = Boolean(appliedDiscount && !isSelected);

                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isPlanDisabled}
                        onClick={() => !isPlanDisabled && handleSelectPlan(p.id)}
                        className={`relative rounded-2xl p-5 text-left transition-all border ${
                          isPlanDisabled
                            ? "opacity-35 cursor-not-allowed border-border/40 bg-card/40 text-muted-foreground select-none"
                            : isSelected
                            ? isDiscountApplicableToThisPlan && appliedDiscount
                              ? "bg-foreground text-background shadow-lg ring-2 ring-tealdeep scale-[1.01] cursor-default"
                              : "bg-foreground text-background shadow-lg ring-2 ring-primary scale-[1.01] cursor-default"
                            : isDiscountApplicableToThisPlan && appliedDiscount
                            ? "glass-card hover:border-tealdeep/60 border-tealdeep/30 bg-card text-foreground cursor-pointer"
                            : "glass-card hover:border-foreground/40 bg-card text-foreground cursor-pointer"
                        }`}
                      >
                        {/* Auto-selected for offer indicator */}
                        {isSelected && isSpecificOfferForPlan && offerNotice?.isAutoSwitched && (
                          <div className="absolute -top-2.5 left-3.5 z-10 rounded-full bg-tealdeep text-white px-2 py-0.5 text-[9px] font-semibold tracking-wide shadow-2xs">
                            Selected
                          </div>
                        )}

                        {/* Standard launch offer banner */}
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

                        {/* Offer discount badge */}
                        {appliedDiscount && isDiscountApplicableToThisPlan && (
                          <div className="absolute -top-2.5 right-3 z-10 flex items-center justify-center rounded-full bg-tealdeep px-2 py-0.5 text-[9.5px] font-semibold text-white shadow-xs">
                            {appliedDiscount.percent === 100
                              ? "100% OFF"
                              : appliedDiscount.type === "flat"
                              ? `-₹${appliedDiscount.value}`
                              : `${appliedDiscount.percent}% OFF`}
                          </div>
                        )}

                        {/* Ineligible tag when code is restricted to another plan */}
                        {isExcludedFromOffer && (
                          <div className="absolute -top-2.5 right-3 z-10 rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[9px] font-medium border border-border">
                            No offer
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-tealdeep/10 border border-tealdeep/25 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-tealdeep uppercase tracking-wider">
                          {appliedDiscount.code}
                        </span>
                        <span className="text-xs text-muted-foreground/60">•</span>
                        <span className="text-xs font-semibold text-foreground">
                          {appliedDiscount.percent === 100
                            ? "100% OFF"
                            : appliedDiscount.type === "flat"
                            ? `₹${appliedDiscount.value} OFF`
                            : `${appliedDiscount.percent}% OFF`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs text-muted-foreground hover:text-rose font-medium cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    {offerNotice?.variant === "warning" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {offerNotice.text}
                      </p>
                    )}
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
                        onClick={() => handleApplyPromo()}
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

            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <div ref={proceedSectionRef} className="lg:col-span-5 scroll-mt-24">
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
                    {(selectedPlan.id === "1m" || selectedPlan.id === "3m") && !appliedDiscount ? (
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
                        : finalPrice === 0
                        ? hasActivePlan
                          ? "🎉 Plan Added to Queue!"
                          : "🎉 Plan Activated Successfully!"
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

                    {offerNotice?.variant === "warning" && !paymentError && (
                      <div className="rounded-xl px-3.5 py-2.5 text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                        {offerNotice.text}
                      </div>
                    )}

                    {isProfileIncomplete ? (
                      <div className="space-y-2">
                        <Link
                          to="/creator/register"
                          className="w-full inline-flex items-center justify-center py-4 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold shadow-md gap-2 transition-all text-center"
                        >
                          Complete Profile to Unlock Plans →
                        </Link>
                        <p className="text-center text-[11px] text-muted-foreground">
                          Your profile must be complete and active before selecting a membership plan.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant={isTrialApplied || finalPrice === 0 ? "ink" : "primary"}
                        className="w-full flex items-center justify-center py-4 text-base font-semibold shadow-md gap-2 active:scale-98 transition-all ring-offset-2 focus:ring-2 focus:ring-primary cursor-pointer"
                        disabled={processing}
                        onClick={handleActivate}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="size-4 animate-spin shrink-0" />
                            <span>
                              {isTrialApplied
                                ? "Activating free trial..."
                                : hasActivePlan
                                ? finalPrice === 0
                                  ? "Queueing plan..."
                                  : "Processing payment..."
                                : finalPrice === 0
                                ? "Activating plan..."
                                : "Processing payment..."}
                            </span>
                          </>
                        ) : isTrialApplied ? (
                          <>
                            <span>Activate Free Trial</span>
                            <ArrowRight className="size-4 shrink-0" />
                          </>
                        ) : finalPrice === 0 ? (
                          <>
                            <span>{hasActivePlan ? "Queue Plan" : "Activate Plan"}</span>
                            <ArrowRight className="size-4 shrink-0" />
                          </>
                        ) : hasActivePlan ? (
                          <>
                            <span>Pay &amp; Queue Plan</span>
                            <ArrowRight className="size-4 shrink-0" />
                          </>
                        ) : (
                          <>
                            <span>Proceed to Pay</span>
                            <ArrowRight className="size-4 shrink-0" />
                          </>
                        )}
                      </Button>
                    )}

                    {/* Razorpay Trust Badge */}
                    {finalPrice > 0 && !isProfileIncomplete && (
                      <div className="pt-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                          <ShieldCheck className="size-3.5 text-tealdeep shrink-0" />
                          <span>100% Secure Checkout via Razorpay</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                          UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking
                        </p>
                      </div>
                    )}

                    {/* Terms & Policies Consent */}
                    <p className="text-[11px] text-muted-foreground text-center pt-2 leading-relaxed">
                      By proceeding{finalPrice > 0 ? " to pay" : ""}, you agree to our{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                      >
                        Terms &amp; Conditions
                      </Link>
                      ,{" "}
                      <Link
                        to="/privacy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      , and{" "}
                      <Link
                        to="/refund-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                      >
                        Refund Policy
                      </Link>
                      .
                    </p>
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
