import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SectionEyebrow } from "@/components/ui-kit";
import {
  PLANS,
  PROMO_CODE_3DAYS,
  formatPrice,
} from "@/lib/directory-data";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCheck,
  Compass,
  Copy,
  Gift,
  HelpCircle,
  Lock,
  Percent,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & Plans — Influencer Dhundo (0% Commission)" },
      {
        name: "description",
        content:
          "Transparent subscription plans for creators with 0% commission on brand deals. Free 3-day trial available with code TRYFREE3DAYS. Free for businesses to search and connect.",
      },
      { property: "og:title", content: "Influencer Dhundo Pricing — 0% Commission Creator Plans" },
      {
        property: "og:description",
        content:
          "Simple, honest plans for creators. Keep 100% of your earnings. 100% free for local businesses to discover and contact influencers.",
      },
      { property: "og:url", content: "https://www.influencerdhundo.com/pricing" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Influencer Dhundo Pricing & Plans" },
      {
        name: "twitter:description",
        content:
          "Transparent pricing for creators with 0% commission on brand deals. Free 3-day trial available.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://www.influencerdhundo.com/pricing" },
    ],
  }),
  component: PricingPage,
});

const planPerMonth: Record<string, string> = {
  "1m": "₹439/mo",
  "3m": "₹366/mo",
  "6m": "₹466/mo",
  "1y": "₹416/mo",
};

const PRICING_FAQS = [
  {
    q: "Is Influencer Dhundo completely free for businesses?",
    a: "Yes! Local businesses, agency owners, and brands can search, filter by city and locality, review work portfolios, and view direct contact details (WhatsApp, phone, email) of listed influencers with zero platform fees or subscription costs.",
  },
  {
    q: "Do you take any commission on creator earnings or brand collaborations?",
    a: "Zero. 0% commission. All collaboration budgets and deals are negotiated and paid directly between the business and the creator without any middleman cut or platform fees.",
  },
  {
    q: "How does the 3-day free trial work?",
    a: "When registering as a creator, enter promo code TRYFREE3DAYS at checkout. Your profile will be instantly activated in the public directory for 3 days at ₹0 without requiring an upfront credit card.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support all major Indian payment methods through Razorpay, including UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, and Net Banking.",
  },
  {
    q: "Can I renew or upgrade my subscription later?",
    a: "Yes! You can choose a 1-month, 3-month, 6-month, or 1-year plan anytime from your Creator Dashboard. Any new plan purchased will automatically extend your expiration date.",
  },
];

function PricingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PROMO_CODE_3DAYS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HERO HEADER ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background py-16 md:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-5xl px-5 text-center">
          <SectionEyebrow>Simple, Transparent Pricing</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-display font-bold tracking-tight md:text-6xl text-balance">
            Keep 100% of your earnings. <br className="hidden sm:inline" />
            <span className="text-saffrondeep">Zero commission.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground md:text-lg text-pretty">
            Free forever for businesses searching for talent. Affordable, transparent subscription plans for creators who want to be discovered locally.
          </p>

          {/* Key Value Pill Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tealdeep/10 px-3.5 py-1.5 text-tealdeep border border-tealdeep/20">
              <Percent className="size-3.5" /> 0% Commission on Deals
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-1.5 text-foreground border border-primary/30">
              <Sparkles className="size-3.5 text-primary" /> 3-Day Free Trial Available
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-foreground ring-1 ring-border">
              <ShieldCheck className="size-3.5 text-muted-foreground" /> Direct Client Inquiries
            </span>
          </div>
        </div>
      </section>

      {/* ── TWO AUDIENCES SPLIT CARDS ── */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-6 md:grid-cols-2">
            {/* For Creators */}
            <div className="glass-card relative overflow-hidden rounded-3xl p-7 md:p-8 border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-saffrondeep">
                    <Sparkles className="size-3.5" />
                    <span>FOR CREATORS</span>
                  </div>
                  <span className="rounded-full bg-tealdeep/15 px-2.5 py-0.5 text-[11px] font-bold text-tealdeep">
                    TRY FREE FOR 3 DAYS
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Get discovered by local brands
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Build a public media kit, show your previous brand collabs, and receive direct phone &amp; WhatsApp inquiries from local businesses in your city.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-foreground font-medium pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>Public searchable profile with city &amp; category tags</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>Direct WhatsApp, Call &amp; Email leads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>Keep 100% of brand collaboration payments</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Starting from</span>
                  <p className="text-lg font-display font-bold text-foreground">₹366/month</p>
                </div>
                <Link
                  to="/creator/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 font-display text-xs font-semibold text-background hover:bg-foreground/90 transition-all shadow-md active:scale-98"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* For Businesses */}
            <div className="glass-card relative overflow-hidden rounded-3xl p-7 md:p-8 border border-border/80 bg-card flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground">
                    <Building2 className="size-3.5 text-primary" />
                    <span>FOR BUSINESSES &amp; BRANDS</span>
                  </div>
                  <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-bold text-background">
                    100% FREE
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Search &amp; hire creators directly
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Search local Instagram influencers by city, locality, niche, turnaround time, and audience size. Connect directly with no agency markup.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-foreground font-medium pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>Zero search or platform commission fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>Direct access to verified contact numbers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>Filter across 15+ creator categories</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Platform Cost</span>
                  <p className="text-lg font-display font-bold text-foreground">₹0 / Free</p>
                </div>
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 font-display text-xs font-semibold text-foreground ring-1 ring-border hover:bg-secondary/80 transition-all"
                >
                  <Search className="size-4" />
                  <span>Search Creators</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-DAY FREE TRIAL HERO BANNER ── */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-accent/20 p-7 md:p-10 border-2 border-primary/40 shadow-xl">
            <div className="pointer-events-none absolute -top-12 -right-12 size-56 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 -left-12 size-56 rounded-full bg-accent/25 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-3.5 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-bold text-saffrondeep border border-primary/30">
                  <Gift className="size-3.5" />
                  <span>LIMITED TIME LAUNCH OFFER</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground md:text-4xl">
                  Try Influencer Dhundo Free for 3 Days
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Test the directory with zero risk. Get your profile activated immediately so local businesses around you can discover your work and reach out directly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {[
                    "Full directory visibility at ₹0",
                    "Direct contact on WhatsApp & Call",
                    "0% commission on all deals",
                    "No credit card required upfront",
                  ].map((perk) => (
                    <div key={perk} className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo code voucher */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-card rounded-2xl p-6 border border-border/80 shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Promo Coupon Code
                    </span>
                    <span className="text-[11px] font-medium text-tealdeep bg-tealdeep/10 px-2 py-0.5 rounded-full">
                      100% OFF
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/80 px-3.5 py-2.5 border border-border">
                    <span className="font-mono text-base font-bold tracking-widest text-foreground select-all">
                      {PROMO_CODE_3DAYS}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      title="Copy coupon code"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs ring-1 ring-border hover:bg-secondary transition-all active:scale-95 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="size-3.5 text-tealdeep" />
                          <span className="text-tealdeep font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 text-muted-foreground" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <Link
                  to="/creator/register"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3.5 font-display text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-md active:scale-98"
                >
                  <span>Claim 3-Day Free Trial</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANS GRID ── */}
      <section className="py-12 md:py-16 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="max-w-2xl">
            <SectionEyebrow>All Subscription Plans</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-display font-semibold leading-tight text-foreground md:text-4xl">
              Choose the plan that fits your growth.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              No hidden fees, no auto-renewing surprise charges. Pick your duration and unlock direct brand opportunities.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isLaunchOffer = plan.id === "1m" || plan.id === "3m";
              const isPopular = plan.id === "3m";

              return (
                <div
                  key={plan.id}
                  className={`glass-card relative flex flex-col rounded-3xl p-6 transition-all hover:translate-y-[-2px] hover:shadow-lg ${
                    isLaunchOffer
                      ? "border-2 border-primary ring-4 ring-primary/10 shadow-md bg-background"
                      : "border border-border/80"
                  }`}
                >
                  {/* Limited Launch Offer Top Badge */}
                  {isLaunchOffer ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm uppercase tracking-wide whitespace-nowrap">
                      Limited Launch Offer
                    </div>
                  ) : null}

                  {/* 45% OFF Corner Circle */}
                  {isLaunchOffer ? (
                    <div className="absolute -top-3.5 -right-3.5 z-10 flex size-12 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-md">
                      <span className="text-[12px] font-extrabold tracking-tight leading-none">45%</span>
                      <span className="text-[8.5px] uppercase font-bold tracking-wider leading-none mt-0.5 opacity-90">OFF</span>
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {plan.duration}
                      </span>
                      <span className="text-[11px] font-medium text-tealdeep bg-accent/10 px-2 py-0.5 rounded-full">
                        {plan.note}
                      </span>
                    </div>

                    {plan.id === "1m" ? (
                      <>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="font-display text-3xl font-bold tracking-tight text-foreground">₹439</span>
                          <span className="text-base font-semibold text-muted-foreground line-through">₹799</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Effective rate: <span className="font-semibold text-foreground">₹439/mo</span>
                        </p>
                      </>
                    ) : plan.id === "3m" ? (
                      <>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="font-display text-3xl font-bold tracking-tight text-foreground">₹1,099</span>
                          <span className="text-base font-semibold text-muted-foreground line-through">₹1,999</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Effective rate: <span className="font-semibold text-foreground">₹366/mo</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="font-display text-3xl font-bold tracking-tight text-foreground">
                            {formatPrice(plan.price)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Effective rate: <span className="font-semibold text-foreground">{planPerMonth[plan.id]}</span>
                        </p>
                      </>
                    )}
                  </div>

                  <div className="my-5 h-px bg-border/80" />

                  {/* Features list */}
                  <ul className="space-y-2.5 text-xs text-muted-foreground flex-1">
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-tealdeep shrink-0 mt-0.5 font-bold" />
                      <span>Active public directory listing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-tealdeep shrink-0 mt-0.5 font-bold" />
                      <span>Direct WhatsApp &amp; Phone inquiries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-tealdeep shrink-0 mt-0.5 font-bold" />
                      <span>City &amp; locality filter discovery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-tealdeep shrink-0 mt-0.5 font-bold" />
                      <span>0% commission on all earnings</span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-2">
                    <Link
                      to="/creator/register"
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                        isLaunchOffer
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      }`}
                    >
                      <span>Choose {plan.duration}</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── REFERRAL PROGRAM FEATURE CARD ── */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background to-accent/15 p-7 md:p-9 border-2 border-primary/30 shadow-xl">
            <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-primary/20 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 -left-12 size-48 rounded-full bg-accent/20 blur-2xl" />

            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/80">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1 text-xs font-bold text-tealdeep border border-accent/25">
                    <Gift className="size-3.5 text-tealdeep" />
                    <span>CREATOR REFERRAL PROGRAM</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold md:text-3xl text-foreground">
                    Refer Creators. Get +7 Days Added to Your Subscription.
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Every creator gets their own permanent referral code. When a creator joins with your link and subscribes to any paid plan, you instantly get <strong>+7 extra days</strong> added directly to your existing subscription.
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    to="/creator/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 font-display text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-md"
                  >
                    <span>Get Your Referral Link</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* 3 Step Flow */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-card p-4 sm:p-5 border border-border/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      1
                    </span>
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Share Your Link
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Copy your unique referral link from your creator dashboard and share it with fellow influencers.
                  </p>
                </div>

                <div className="rounded-2xl bg-card p-4 sm:p-5 border border-border/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-tealdeep text-xs font-bold text-white">
                      2
                    </span>
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      They Try Free
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Invited creators get a 3-day free trial to set up their profile and test the platform with zero risk.
                  </p>
                </div>

                <div className="rounded-2xl bg-card p-4 sm:p-5 border border-border/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-saffrondeep text-xs font-bold text-white">
                      3
                    </span>
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Earn +7 Days Each
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When they buy any paid subscription, +7 bonus days are immediately added to your active expiration date!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING FAQS ── */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center max-w-2xl mx-auto">
            <SectionEyebrow>Pricing FAQs</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-display font-semibold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Common questions about payments, trials, and subscription plans.
            </p>
          </div>

          <div className="mt-10 space-y-3.5">
            {PRICING_FAQS.map((item, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl border border-border/80 p-5 sm:p-6 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="size-5 text-primary shrink-0 mt-0.5" />
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {item.q}
                  </h3>
                </div>
                <p className="pl-8 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground">
              Have more questions? Read our full{" "}
              <Link to="/refund-policy" className="text-foreground underline hover:text-primary">
                Refund Policy
              </Link>{" "}
              or contact us at{" "}
              <a href="mailto:influencerdhundo@gmail.com" className="text-foreground font-semibold hover:text-primary">
                influencerdhundo@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
