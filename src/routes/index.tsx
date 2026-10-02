import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionEyebrow } from "@/components/ui-kit";
import { PLANS, PROMO_CODE_3DAYS, formatPrice } from "@/lib/directory-data";
import {
  Check,
  Sparkles,
  Gift,
  Zap,
  ShieldCheck,
  Copy,
  CheckCheck,
  ArrowRight,
  Building2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Influencer Dhundo — Where small influencers meet small businesses" },
      {
        name: "description",
        content:
          "Influencer Dhundo brings local creators and local businesses together. No agency, no commission, no middleman. Just find each other and make it happen.",
      },
      { property: "og:title", content: "Influencer Dhundo — Small creators. Small businesses. Big possibilities." },
      {
        property: "og:description",
        content:
          "Where small influencers meet small businesses to make it big. Discover creators around your business. Connect directly. Start collaborating.",
      },
    ],
  }),
  component: Landing,
});

function ArrowLink({
  to,
  label,
  variant,
}: {
  to: string;
  label: string;
  variant: "ink" | "glass";
}) {
  return (
    <Link
      to={to}
      className={
        variant === "ink"
          ? "flex items-center justify-between gap-3 rounded-xl bg-foreground px-5 py-4 text-left hover:bg-foreground/90 transition-colors"
          : "glass-card flex items-center justify-between gap-3 rounded-xl px-5 py-4 text-left hover:border-foreground/30 transition-colors"
      }
    >
      <span
        className={
          variant === "ink"
            ? "font-display text-lg font-semibold text-background"
            : "font-display text-lg font-semibold text-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          variant === "ink"
            ? "text-lg leading-none text-background/70"
            : "text-lg leading-none text-muted-foreground"
        }
      >
        →
      </span>
    </Link>
  );
}

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5 pt-10 pb-14 md:pt-16 md:pb-20">
          {/* PROMOTIONAL PILL */}
          <div className="mb-6 inline-block">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-semibold text-saffrondeep border border-primary/25 shadow-xs hover:bg-primary/20 transition-all active:scale-98"
            >
              <Gift className="size-3.5 text-saffrondeep" />
              <span>
                3-Day Free Trial available with code{" "}
                <strong className="font-mono underline underline-offset-2">
                  {PROMO_CODE_3DAYS}
                </strong>
              </span>
              <span className="text-muted-foreground ml-1">→</span>
            </a>
          </div>

          <h1 className="max-w-[22ch] text-[2.8rem] leading-[0.95] text-balance font-display font-semibold tracking-tight md:text-[4.5rem]">
            Where small influencers meet small businesses to make it big.
          </h1>
          <p className="mt-5 max-w-[44ch] text-base text-pretty text-muted-foreground md:text-lg">
            Discover creators around your business. Connect directly. Start collaborating.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-1 gap-3 md:max-w-xl md:grid-cols-2">
            <ArrowLink to="/discover" label="Find a Creator" variant="ink" />
            <ArrowLink to="/creator/register" label="I'm a Creator" variant="glass" />
          </div>
        </div>
      </section>

      {/* BIG THINGS START LOCAL */}
      <section className="border-t border-border bg-secondary/50">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
          <h2 className="max-w-[18ch] text-3xl font-display font-semibold leading-tight text-balance md:text-4xl">
            Big things can start local.
          </h2>

          {/* Two key statements as cards */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="glass-card rounded-2xl p-6 sm:p-7">
              <p className="text-xl font-display font-semibold leading-snug text-foreground md:text-2xl">
                You don't always need the biggest creator. You need the right audience.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 sm:p-7">
              <p className="text-xl font-display font-semibold leading-snug text-foreground md:text-2xl">
                And sometimes, the right audience lives just a few kilometres away.
              </p>
            </div>
          </div>

          {/* Supporting copy */}
          <p className="mt-7 max-w-[54ch] text-base text-pretty text-muted-foreground md:text-lg">
            Influencer Dhundo helps local businesses discover influencers around them with audiences that are relevant, nearby and useful for the business.
          </p>

          {/* Badges */}
          <div className="mt-7 flex flex-wrap gap-3">
            {["No agency.", "No commission.", "No middleman."].map((item) => (
              <div
                key={item}
                className="glass-card rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                {item}
              </div>
            ))}
          </div>

          <p className="mt-5 text-base font-medium text-foreground md:text-lg">
            Just find each other and make it happen.
          </p>
        </div>
      </section>

      {/* TWO SIDES */}
      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {/* For Businesses */}
          <div className="glass-card flex flex-col rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-saffrondeep">
              For businesses
            </p>
            <h3 className="mt-3 text-2xl font-display font-semibold leading-tight">
              Your next creator might be closer than you think.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Find creators around your business by location, category, audience size, budget and content type.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-saffrondeep">→</span>
                <span>See their work.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-saffrondeep">→</span>
                <span>Explore their profile.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-saffrondeep">→</span>
                <span>Connect directly.</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 font-display text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Find a Creator →
              </Link>
              <Link
                to="/business/login"
                className="inline-flex items-center justify-center rounded-xl bg-background px-4 py-3 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
              >
                Business Login
              </Link>
            </div>
          </div>

          {/* For Creators */}
          <div className="glass-card flex flex-col rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tealdeep">
              For creators
            </p>
            <h3 className="mt-3 text-2xl font-display font-semibold leading-tight">
              You don't need a million followers to get discovered.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Create your profile, show businesses what you create and get discovered by businesses looking for creators in your area.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-tealdeep">→</span>
                <span>Create your profile.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-tealdeep">→</span>
                <span>Set your collaboration preferences.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-tealdeep">→</span>
                <span>Get discovered by local businesses.</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/creator/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-semibold text-primary-foreground ring-1 ring-saffrondeep/30 hover:bg-primary/90 transition-colors"
              >
                Get Listed →
              </Link>
              <Link
                to="/creator/login"
                className="inline-flex items-center justify-center rounded-xl bg-background px-4 py-3 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
              >
                Creator Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
          <SectionEyebrow>Our philosophy</SectionEyebrow>
          <blockquote className="mt-5 max-w-[36ch] text-3xl font-display font-semibold leading-tight text-balance md:text-4xl">
            We don't decide who should work together.{" "}
            <span className="text-primary">You do.</span>
          </blockquote>
          <div className="mt-7 max-w-[46ch] space-y-3 text-base text-muted-foreground">
            <p>We give businesses a place to discover creators.</p>
            <p>We give creators a place to be discovered.</p>
            <p className="font-medium text-foreground">
              What happens after that is between you.
            </p>
          </div>
          <p className="mt-6 text-base font-semibold text-foreground">
            That's it. That's the point.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <SectionEyebrow>How it works</SectionEyebrow>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Businesses */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-saffrondeep">
              Businesses
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="rounded-lg bg-saffrondeep/10 px-2.5 py-1 text-saffrondeep">DISCOVER</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-lg bg-saffrondeep/10 px-2.5 py-1 text-saffrondeep">EXPLORE</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-lg bg-saffrondeep/10 px-2.5 py-1 text-saffrondeep">CONNECT</span>
            </div>
            <ol className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-saffrondeep/15 font-display text-xs font-bold text-saffrondeep">1</span>
                <span>Find creators</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-saffrondeep/15 font-display text-xs font-bold text-saffrondeep">2</span>
                <span>See their work</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-saffrondeep/15 font-display text-xs font-bold text-saffrondeep">3</span>
                <span>Get their contact details</span>
              </li>
            </ol>
          </div>

          {/* Creators */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tealdeep">
              Creators
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="rounded-lg bg-tealdeep/10 px-2.5 py-1 text-tealdeep">CREATE</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-lg bg-tealdeep/10 px-2.5 py-1 text-tealdeep">ACTIVATE</span>
              <span className="text-muted-foreground">→</span>
              <span className="rounded-lg bg-tealdeep/10 px-2.5 py-1 text-tealdeep">GET DISCOVERED</span>
            </div>
            <ol className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tealdeep/15 font-display text-xs font-bold text-tealdeep">1</span>
                <span>Build your profile</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tealdeep/15 font-display text-xs font-bold text-tealdeep">2</span>
                <span>Activate it</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tealdeep/15 font-display text-xs font-bold text-tealdeep">3</span>
                <span>Get found by businesses</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* PRICING & FREE TRIAL SECTION */}
      <PricingSection />

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border bg-foreground">
        <div className="pointer-events-none absolute -top-20 right-0 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
          <h2 className="max-w-[22ch] text-3xl font-display font-semibold leading-tight text-balance text-background md:text-5xl">
            Small creators. Small businesses. Big possibilities.
          </h2>
          <p className="mt-4 text-base text-background/60 md:text-lg">
            Let's get started.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-base font-semibold text-primary-foreground ring-1 ring-saffrondeep/30 hover:bg-primary/90 transition-colors"
            >
              Find a Creator
            </Link>
            <Link
              to="/creator/register"
              className="inline-flex items-center gap-2 rounded-xl bg-background/10 px-6 py-3.5 font-display text-base font-semibold text-background ring-1 ring-background/20 hover:bg-background/20 transition-colors"
            >
              I'm a Creator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PROMO_CODE_3DAYS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const planPerMonth: Record<string, string> = {
    "1m": "₹799/mo",
    "3m": "₹666/mo",
    "6m": "₹566/mo",
    "1y": "₹666/mo",
  };

  return (
    <section id="pricing" className="border-t border-border bg-secondary/40 py-16 md:py-24 scroll-mt-14">
      <div className="mx-auto max-w-5xl px-5">
        {/* SECTION HEADER */}
        <div className="max-w-2xl">
          <SectionEyebrow>Transparent Pricing &amp; Free Trial</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-display font-semibold leading-tight text-balance md:text-5xl">
            Simple, honest plans for creators.
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground md:text-lg">
            No commissions on your brand deals. Keep 100% of what you earn. Choose a plan or start with our 3-day free trial.
          </p>
        </div>

        {/* ── FEATURED TRIAL BANNER ── */}
        <div className="mt-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-background to-accent/20 p-7 md:p-9 border-2 border-primary/40 shadow-xl">
          <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-primary/25 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 -left-12 size-48 rounded-full bg-accent/25 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-bold text-saffrondeep border border-primary/30">
                <Gift className="size-3.5" />
                <span>LIMITED TIME LAUNCH OFFER</span>
              </div>
              <h3 className="text-2xl font-display font-bold md:text-3xl text-foreground">
                Try Influencer Dhundo Free for 3 Days
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Test the directory with zero risk. Get your profile verified and unlocked immediately so local businesses around you can find and contact you directly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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

            {/* Trial Promo Code & CTA Box */}
            <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 bg-background/80 backdrop-blur-md rounded-2xl p-5 border border-border/80 shadow-md">
              <div className="text-left sm:text-right lg:text-right">
                <span className="text-xs text-muted-foreground block">Special Promo Code</span>
                <div className="mt-1 inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5 border border-border">
                  <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                    {PROMO_CODE_3DAYS}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy coupon code"
                    className="inline-flex items-center gap-1 rounded-lg bg-background px-2 py-1 text-[11px] font-semibold text-primary shadow-xs ring-1 ring-border hover:bg-secondary transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="size-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <Link
                to="/creator/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 font-display text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-md active:scale-98"
              >
                <span>Claim 3-Day Free Trial</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── PLANS GRID ── */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isPopular = plan.id === "3m";
            const isBestValue = plan.id === "1y";

            return (
              <div
                key={plan.id}
                className={`glass-card relative flex flex-col rounded-3xl p-6 transition-all hover:translate-y-[-2px] hover:shadow-lg ${
                  isPopular
                    ? "border-2 border-primary ring-4 ring-primary/10 shadow-md bg-background"
                    : isBestValue
                      ? "border border-tealdeep/40 shadow-sm"
                      : "border border-border/80"
                }`}
              >
                {/* Popular Badge */}
                {isPopular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm uppercase tracking-wide">
                    ★ Most Popular
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

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold tracking-tight text-foreground">
                      {formatPrice(plan.price)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Effective rate: <span className="font-semibold text-foreground">{planPerMonth[plan.id]}</span>
                  </p>
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
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-tealdeep shrink-0 mt-0.5 font-bold" />
                    <span>Unlimited profile &amp; pricing updates</span>
                  </li>
                </ul>

                <div className="mt-6 pt-2">
                  <Link
                    to="/creator/register"
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                      isPopular
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

        {/* ── FOR BUSINESSES CALLOUT ── */}
        <div className="mt-8 rounded-2xl bg-secondary/80 p-5 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Are you a business looking to hire creators?
              </p>
              <p className="text-xs text-muted-foreground">
                Browsing, filtering and contacting creators in your locality is 100% free with no agency commissions.
              </p>
            </div>
          </div>
          <Link
            to="/discover"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-background px-4 py-2 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
          >
            <span>Explore Creators</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

