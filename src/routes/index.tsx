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
  Search,
  ChevronDown,
  HelpCircle,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Influencer Dhundo — Where Businesses Find Relevant Creators with 0% Commission" },
      {
        name: "description",
        content:
          "Influencer Dhundo connects local businesses directly with verified Instagram creators. 0% commission, direct WhatsApp contact. Find the best creators for your business today.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Influencer Dhundo — Where Businesses Find Relevant Creators" },
      {
        property: "og:description",
        content:
          "Discover creators around your business. Connect directly with 0% commission. No agency, no middlemen.",
      },
      { property: "og:image", content: "https://www.influencerdhundo.com/logo.png" },
      { property: "og:url", content: "https://www.influencerdhundo.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Influencer Dhundo — Where Businesses Find Relevant Creators" },
      {
        name: "twitter:description",
        content:
          "Discover creators around your business. Connect directly with 0% commission. No agency, no middlemen.",
      },
      { name: "twitter:image", content: "https://www.influencerdhundo.com/logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://www.influencerdhundo.com/" },
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
  variant: "ink" | "glass" | "primary";
}) {
  return (
    <Link
      to={to}
      className={
        variant === "ink"
          ? "flex items-center justify-between gap-3 rounded-xl bg-foreground px-5 py-4 text-left hover:bg-foreground/90 transition-all shadow-sm active:scale-98"
          : variant === "primary"
          ? "flex items-center justify-between gap-3 rounded-xl bg-primary px-5 py-4 text-left hover:bg-primary/90 transition-all shadow-sm active:scale-98"
          : "glass-card flex items-center justify-between gap-3 rounded-xl px-5 py-4 text-left hover:border-foreground/30 transition-all active:scale-98"
      }
    >
      <span
        className={
          variant === "ink"
            ? "font-display text-lg font-semibold text-background"
            : variant === "primary"
            ? "font-display text-lg font-semibold text-primary-foreground"
            : "font-display text-lg font-semibold text-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          variant === "ink"
            ? "text-lg leading-none text-background/70"
            : variant === "primary"
            ? "text-lg leading-none text-primary-foreground/90 font-bold"
            : "text-lg leading-none text-muted-foreground"
        }
      >
        →
      </span>
    </Link>
  );
}

function Landing() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5 pt-10 pb-14 md:pt-16 md:pb-20">
          <h1 className="max-w-[22ch] text-[2.8rem] leading-[0.95] text-balance font-display font-semibold tracking-tight md:text-[4.5rem]">
            Where businesses find relevant Influencers to collaborate
          </h1>
          <p className="mt-5 max-w-[44ch] text-base text-pretty text-muted-foreground md:text-lg">
            Discover creators around your business. Connect directly. Start collaborating.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-1 gap-3 md:max-w-xl md:grid-cols-2">
            <ArrowLink to="/discover" label="Find a Creator" variant="ink" />
            <ArrowLink to="/creator/register" label="I'm a Creator" variant="primary" />
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
            With Influencer Dhundo, Big &amp; Small businesses can find influencers around them with audiences that are relevant, nearby and useful for the business.
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
            <div className="mt-auto pt-6">
              <Link
                to="/discover"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 font-display text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Find a Creator →
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
            <div className="mt-auto pt-6">
              <Link
                to="/creator/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-semibold text-primary-foreground ring-1 ring-saffrondeep/30 hover:bg-primary/90 transition-colors"
              >
                Get Listed →
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

      {/* REGIONAL LOCAL DISCOVERY HUB */}
      <RegionalHubSection />

      {/* PRICING & FREE TRIAL SECTION */}
      <PricingSection />

      {/* FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border bg-foreground">
        <div className="pointer-events-none absolute -top-20 right-0 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-14 md:py-20">
          <h2 className="max-w-[22ch] text-3xl font-display font-semibold leading-tight text-balance text-background md:text-5xl">
            A Business + Relevant Influencers = Big Possibilities.
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
    "1m": "₹439/mo",
    "3m": "₹366/mo",
    "6m": "₹566/mo",
    "1y": "₹666/mo",
  };

  return (
    <section id="pricing" className="border-t border-border bg-secondary/40 py-16 md:py-24 scroll-mt-14">
      <div className="mx-auto max-w-5xl px-5">
        {/* SECTION HEADER */}
        <div className="max-w-3xl">
          <SectionEyebrow>Transparent Pricing &amp; Access</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-display font-semibold leading-tight text-balance md:text-5xl">
            Free for businesses.
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground md:text-lg">
            Searching, filtering, and contacting local influencers is 100% free with zero commission. Charges are only for creators who want to be listed in the public directory.
          </p>
        </div>

        {/* ── FOR BUSINESSES: 100% FREE SECTION ── */}
        <div className="mt-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-background to-secondary/80 p-7 md:p-9 border-2 border-accent/40 shadow-xl">
          <div className="pointer-events-none absolute -top-12 -right-12 size-52 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-primary/15 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3.5 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3.5 py-1 text-xs font-bold text-tealdeep border border-accent/30">
                <Building2 className="size-3.5" />
                <span>FOR BUSINESSES &amp; BRANDS — 100% FREE</span>
              </div>
              <h3 className="text-2xl font-display font-bold md:text-3xl text-foreground">
                Finding &amp; Contacting Influencers Costs ₹0
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Whether you're a cafe, retail shop, boutique, salon, clinic, or growing brand, there are <strong>zero platform fees and 0% commission</strong>. Search creators around your locality, explore their pricing, and reach out directly on WhatsApp or Call.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  "Free unlimited creator search & filters",
                  "Free business account & profile",
                  "Direct WhatsApp & phone numbers",
                  "0% commission or agency markup on deals",
                ].map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Check className="size-4 text-tealdeep shrink-0 font-bold" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Free Tile */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-background/95 rounded-2xl p-6 border border-border/80 shadow-md">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Business Directory Access
                </span>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                    ₹0
                  </span>
                  <span className="text-xs font-bold text-tealdeep bg-accent/20 px-2.5 py-0.5 rounded-full border border-accent/30">
                    Free Forever
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Free to search and join. Charges apply only to creators who want to be listed.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  to="/discover"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3.5 font-display text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-sm active:scale-98"
                >
                  <Search className="size-4" />
                  <span>Search Creators Free</span>
                </Link>
                <Link
                  to="/business/signup"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 font-display text-xs font-semibold text-foreground hover:bg-secondary/80 ring-1 ring-border transition-all"
                >
                  <span>Join as a Business (Free)</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION HEADER FOR CREATOR PRICING ── */}
        <div className="mt-16 md:mt-20 max-w-2xl">
          <h2 className="text-3xl font-display font-semibold leading-tight text-balance md:text-5xl">
            Simple, honest plans for creators.
          </h2>
          <p className="mt-3.5 text-base text-pretty text-muted-foreground md:text-lg">
            Charges are only for creators who want to be listed and verified in the public directory. No commissions on your brand deals — keep 100% of what you earn. Choose a plan or start with our 3-day free trial.
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
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Special Promo Code
                  </span>
                  <span className="text-[11px] font-medium text-tealdeep bg-tealdeep/10 px-2 py-0.5 rounded-full">
                    100% OFF
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/80 px-3.5 py-2 border border-border">
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

        {/* ── PLANS GRID ── */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* ── REFERRAL PROGRAM FEATURE CARD ── */}
        <div className="mt-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background to-accent/15 p-7 md:p-9 border-2 border-primary/30 shadow-xl">
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

            {/* Stacking Multiplier Note */}
            <div className="mt-5 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-tealdeep">
                <Sparkles className="size-4 shrink-0 text-primary" />
                <span>
                  <strong>Rewards stack indefinitely:</strong> 1 referral = +7 days · 2 referrals = +14 days · 3 referrals = +21 days
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                *Referral code remains active while your subscription or trial is active.
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "How does Influencer Dhundo help local businesses find relevant creators?",
    a: "Influencer Dhundo is India's direct local influencer discovery platform. Businesses can search and filter verified Instagram creators by city, locality, niche category (Food, Fashion, Fitness, Tech, etc.), audience size, turnaround time, and budget without having to hire expensive agencies.",
  },
  {
    q: "Why is Influencer Dhundo 0% commission?",
    a: "Traditional agencies often take a 20% to 50% commission cut on every brand deal. Influencer Dhundo operates on zero commission: businesses connect directly with creators via WhatsApp and phone, negotiate their own terms, and keep 100% of the collaboration value between the brand and creator.",
  },
  {
    q: "How do businesses get direct WhatsApp and contact access with creators?",
    a: "Subscribed businesses can instantly unlock direct WhatsApp chat, verified phone numbers, and email IDs for active creators on our platform, enabling fast communication, product gifting, and rapid campaign execution.",
  },
  {
    q: "Can nano and micro-influencers join Influencer Dhundo?",
    a: "Yes! Influencer Dhundo is built specifically to champion nano-creators (1K–10K) and micro-creators (10K–100K) who have strong local audience engagement. Creators can easily register, showcase sample reels/posts, list starting prices, and receive direct brand collaboration inquiries.",
  },
  {
    q: "Which cities across India are supported?",
    a: "We support creators and businesses across major Indian commercial hubs including Surat, Mumbai, Ahmedabad, Delhi NCR, Bangalore, Pune, Hyderabad, Jaipur, Kolkata, Indore, Lucknow, Chandigarh, and 60+ tier-1 and tier-2 cities.",
  },
  {
    q: "How does the Creator Referral Program work?",
    a: "When an active creator invites fellow creators using their unique referral link, the invited creator receives a 3-day free trial. Once the referred creator upgrades to any paid plan, the referring creator automatically receives +7 bonus subscription days added to their plan.",
  },
];

const POPULAR_CITIES = [
  "Surat",
  "Mumbai",
  "Ahmedabad",
  "Delhi",
  "Bangalore",
  "Pune",
  "Jaipur",
  "Hyderabad",
  "Indore",
  "Lucknow",
  "Chandigarh",
  "Kolkata",
];

const POPULAR_CATEGORIES = [
  "Food",
  "Fashion",
  "Beauty",
  "Fitness",
  "Lifestyle",
  "Travel",
  "Technology",
  "Entertainment",
];

function RegionalHubSection() {
  return (
    <section className="border-t border-border bg-secondary/30 py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <SectionEyebrow>Local Discovery</SectionEyebrow>
          <h2 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
            Discover Influencers by City &amp; Category
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore verified local influencers across top Indian cities and high-growth niches.
          </p>
        </div>

        {/* Cities Hub */}
        <div className="mt-8 rounded-2xl bg-card p-5 sm:p-6 border border-border/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <MapPin className="size-4 text-primary shrink-0" />
            <span>Popular Cities in India</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city}
                to="/discover"
                className="rounded-xl bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground hover:text-background transition-all shadow-2xs"
              >
                {city} Influencers
              </Link>
            ))}
          </div>
        </div>

        {/* Categories Hub */}
        <div className="mt-4 rounded-2xl bg-card p-5 sm:p-6 border border-border/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span>Trending Niche Categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to="/discover"
                className="rounded-xl bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-foreground hover:text-background transition-all shadow-2xs"
              >
                {cat} Influencers
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-border bg-background py-14 md:py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="text-center max-w-2xl mx-auto">
          <SectionEyebrow>Frequently Asked Questions</SectionEyebrow>
          <h2 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Got questions about how Influencer Dhundo works for brands and creators? Find answers below.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-card border border-border/80 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-display text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-start gap-3">
                    <HelpCircle className="size-5 text-primary shrink-0 mt-0.5" />
                    <span>{item.q}</span>
                  </span>
                  <ChevronDown
                    className={`size-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed pl-12 border-t border-border/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Callout */}
        <div className="mt-10 rounded-2xl bg-secondary/60 border border-border p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            Still have questions or need help onboarding?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reach out to our team directly on WhatsApp or explore our creator and business guides.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/discover"
              className="inline-flex rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
            >
              Explore Directory
            </Link>
            <Link
              to="/about"
              className="inline-flex rounded-xl bg-background px-4 py-2 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-secondary transition-colors"
            >
              About Our Mission
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

