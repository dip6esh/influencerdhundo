import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import {
  PLANS,
  PROMO_CODE_3DAYS,
  formatPrice,
} from "@/lib/directory-data";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Gift,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/creator/plans")({
  head: () => ({
    meta: [
      { title: "Creator subscription & payment — influencer Dhundo" },
      {
        name: "description",
        content:
          "Activate your creator profile to get discovered by local businesses. Choose a subscription plan or use promo code TRYFREE3DAYS for a 3-day free trial.",
      },
      { property: "og:title", content: "Creator subscription & payment" },
      {
        property: "og:description",
        content: "Make your creator profile live in the directory with transparent pricing or a free trial.",
      },
    ],
  }),
  component: Plans,
});

type PaymentMethod = "upi" | "card" | "netbanking";

function Plans() {
  const navigate = useNavigate();
  const { myCreatorId, creators, activateSubscription, hasUsedTrial } = useAppState();
  const mine = creators.find((c) => c.id === myCreatorId);

  // One-time trial enforcement
  const trialAlreadyUsed = myCreatorId ? hasUsedTrial(myCreatorId) : false;

  const [selectedPlanId, setSelectedPlanId] = useState<string>("3m");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];
  const isTrialApplied = appliedPromo?.toUpperCase() === PROMO_CODE_3DAYS;

  // Price calculations
  const originalPrice = selectedPlan.price;
  const discountAmount = isTrialApplied ? originalPrice : 0;
  const finalPrice = isTrialApplied ? 0 : originalPrice;

  const handleApplyPromo = () => {
    setPromoError("");
    const cleaned = promoCodeInput.trim().toUpperCase();
    if (!cleaned) {
      setPromoError("Please enter a coupon code.");
      return;
    }

    if (cleaned === PROMO_CODE_3DAYS) {
      if (trialAlreadyUsed) {
        setPromoError(
          "You have already used the TRYFREE3DAYS trial. This code can only be used once per creator account. Please choose a paid plan to continue.",
        );
        return;
      }
      setAppliedPromo(PROMO_CODE_3DAYS);
      setPromoCodeInput("");
    } else {
      setPromoError("Invalid coupon code. Try 'TRYFREE3DAYS' for a 3-day free trial.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const handleActivate = async () => {
    if (!mine) return;
    setProcessing(true);

    try {
      // Simulate payment gateway response
      await new Promise((r) => setTimeout(r, 900));

      if (isTrialApplied) {
        activateSubscription({
          creatorId: mine.id,
          planId: "trial-3d",
          duration: "3 Days Free Trial",
          price: 0,
        });
      } else {
        activateSubscription({
          creatorId: mine.id,
          planId: selectedPlan.id,
          duration: selectedPlan.duration,
          price: selectedPlan.price,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate({ to: "/creator/dashboard" });
      }, 1500);
    } catch {
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

          {/* QUICK PROMO NOTICE BANNER — only shown if trial not yet used */}
          {!appliedPromo && !trialAlreadyUsed ? (
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
                  setAppliedPromo(PROMO_CODE_3DAYS);
                  setPromoError("");
                }}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer"
              >
                <Zap className="size-3.5" />
                Apply 3-Day Free Code
              </button>
            </div>
          ) : null}

          {/* TRIAL ALREADY USED NOTICE */}
          {trialAlreadyUsed ? (
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
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          if (isTrialApplied) setAppliedPromo(null);
                        }}
                        className={`relative rounded-2xl p-5 text-left transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-foreground text-background shadow-lg ring-2 ring-primary scale-[1.01]"
                            : "glass-card hover:border-foreground/40 bg-card text-foreground"
                        }`}
                      >
                        {p.id === "3m" && (
                          <span className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            Popular
                          </span>
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
                        <p
                          className={`mt-2 text-xl font-bold ${
                            isSelected ? "text-primary" : "text-saffrondeep"
                          }`}
                        >
                          {formatPrice(p.price)}
                        </p>
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

                {appliedPromo ? (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono tracking-wide">
                          {appliedPromo} APPLIED
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isTrialApplied
                            ? "3 Days Free Trial (100% Free · ₹0)"
                            : "Discount applied"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-xs text-muted-foreground hover:text-rose underline underline-offset-2"
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
                        placeholder={trialAlreadyUsed ? "Enter promo code" : "e.g. TRYFREE3DAYS"}
                        className="font-mono uppercase tracking-wider"
                      />
                      <Button
                        variant="primary"
                        onClick={handleApplyPromo}
                        className="shrink-0 px-5 font-semibold"
                      >
                        Apply
                      </Button>
                    </div>

                    {promoError ? (
                      <p className="text-xs font-medium text-rose">{promoError}</p>
                    ) : !trialAlreadyUsed ? (
                      <p className="text-xs text-muted-foreground">
                        Try code <button type="button" onClick={() => { setPromoCodeInput("TRYFREE3DAYS"); }} className="font-mono font-semibold text-foreground underline underline-offset-2 hover:text-primary">TRYFREE3DAYS</button> to unlock 3 days free trial.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Enter a valid promo code if you have one.
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

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan price</span>
                    <span className="font-medium">
                      {formatPrice(originalPrice)}
                    </span>
                  </div>

                  {isTrialApplied ? (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Gift className="size-3.5" /> Promo (TRYFREE3DAYS)
                      </span>
                      <span className="font-semibold">
                        - {formatPrice(discountAmount)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Total Payable
                    </p>
                    {isTrialApplied ? (
                      <span className="inline-block mt-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
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
                  <div className="mt-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-center">
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {isTrialApplied
                        ? "🎉 3-Day Free Trial Activated!"
                        : "🎉 Payment Successful & Profile Active!"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Redirecting to your dashboard...
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    <Button
                      variant={isTrialApplied ? "ink" : "primary"}
                      className="w-full justify-center py-4 text-base font-semibold shadow-md gap-2"
                      disabled={processing}
                      onClick={handleActivate}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {isTrialApplied ? "Activating free trial..." : "Processing payment..."}
                        </>
                      ) : isTrialApplied ? (
                        <>
                          <Zap className="size-4" />
                          Activate 3 Days Free Trial (₹0)
                        </>
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
