import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, SectionEyebrow, IndiaFlag } from "@/components/ui-kit";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Percent,
  ShieldCheck,
  Target,
  User,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Influencer Dhundo" },
      {
        name: "description",
        content:
          "Learn about Influencer Dhundo - India's direct discovery platform connecting local businesses with regional creators with 0% commission.",
      },
      { property: "og:title", content: "About Us | Influencer Dhundo" },
      {
        property: "og:description",
        content:
          "Empowering local businesses and creators with seamless discovery and 100% direct collaborations.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-secondary/40 pb-20">
      {/* ── HERO SECTION ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -left-24 size-80 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-xs px-3.5 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border shadow-xs mb-3">
            <IndiaFlag className="w-4 h-3 rounded-[2px]" />
            <span>India&apos;s Hyperlocal Creator Discovery Platform</span>
          </div>
          <h1 className="mt-2 text-3xl font-display font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
            Connecting Local Businesses with Creators,{" "}
            <span className="text-saffrondeep">Directly &amp; Transparently.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg md:text-xl">
            We are building India’s most accessible hyperlocal creator discovery platform. No agency
            middlemen, zero commission cuts, and complete direct communication.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-98"
            >
              <Compass className="size-4" />
              Explore Creators
            </Link>
            <Link
              to="/creator/register"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3.5 text-sm font-semibold text-foreground ring-1 ring-border hover:bg-secondary transition-all shadow-xs"
            >
              <User className="size-4 text-primary" />
              Join as a Creator
            </Link>
          </div>
        </div>
      </section>

      {/* ── OUR MISSION & THE PROBLEM WE SOLVE ─────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <SectionEyebrow>Our Story</SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              Why We Built Influencer Dhundo
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every city in India is full of vibrant local businesses — cafes, fashion boutiques,
              fitness studios, salons, and regional brands — looking to reach nearby customers. At the
              same time, thousands of talented local influencers and creators produce incredible content
              for engaged audiences in those exact neighborhoods.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Yet, working together has always been broken. Agencies charge heavy management fees, take
              30% to 50% commission cuts, and keep creators and businesses locked behind opaque
              communication.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <strong>Influencer Dhundo was created to change that forever.</strong> We provide a direct,
              searchable directory where businesses discover vetted local creators in their city and
              connect with them directly via Phone, WhatsApp, or Email.
            </p>
          </div>

          <Card className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 space-y-6">
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <Target className="size-5 text-primary" /> The Core Pillars of Influencer Dhundo
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-tealdeep/10 text-tealdeep">
                  <Percent className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">0% Commission on Deals</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    100% of the collaboration fee goes directly to the creator. We never take a cut of
                    your partnerships.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-saffrondeep">
                  <MessageCircle className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Direct, Unfiltered Contact</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verified businesses can call, WhatsApp, or email creators directly to finalize
                    campaign briefs and deliverable details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-tealdeep">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Hyperlocal &amp; City Specific</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Filter by specific city, locality, niche categories, follower size, and content
                    formats to find your exact match.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Vetted &amp; Transparent Profiles</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clear starting rates, turnaround times, and verified Instagram metrics so there are
                    never any hidden surprises.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── HOW WE SERVE BOTH SIDES ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <SectionEyebrow className="justify-center">Who We Serve</SectionEyebrow>
          <h2 className="mt-2 text-3xl font-display font-bold text-foreground">
            A Win-Win Platform for Everyone
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Designed from the ground up to empower both growing local brands and regional content creators.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* For Businesses */}
          <Card className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 flex flex-col justify-between">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Building2 className="size-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">For Local Businesses &amp; Brands</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                Whether you run a local restaurant, an e-commerce brand, or a retail store, find creators
                with genuine engagement in your target city.
              </p>

              <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-foreground/90">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-tealdeep shrink-0" />
                  <span>Search creators by city, locality &amp; niche</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-tealdeep shrink-0" />
                  <span>Direct phone, WhatsApp &amp; email access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-tealdeep shrink-0" />
                  <span>Upfront starting collaboration prices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-tealdeep shrink-0" />
                  <span>100% free account creation for businesses</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-5 border-t border-border/60">
              <Link
                to="/discover"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
              >
                Start browsing creators <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </Card>

          {/* For Creators */}
          <Card className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 flex flex-col justify-between">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-saffrondeep/10 text-saffrondeep mb-4">
                <User className="size-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">For Creators &amp; Influencers</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                Get discovered by businesses looking for your exact niche without relying on agency
                representation or cold outreach.
              </p>

              <ul className="mt-5 space-y-2.5 text-xs sm:text-sm text-foreground/90">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                  <span>3-day free trial on signup with instant public listing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                  <span>Keep 100% of your earnings — 0% commission</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                  <span>Earn +7 bonus days for every creator you invite</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                  <span>Transparent control over your starting collaboration rate</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-5 border-t border-border/60">
              <Link
                to="/creator/register"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-saffrondeep hover:underline"
              >
                Create your creator profile <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* ── GET IN TOUCH & SUPPORT CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pt-8">
        <div className="rounded-3xl bg-gradient-to-r from-foreground via-foreground/95 to-foreground p-8 sm:p-12 text-background shadow-2xl relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <HeartHandshake className="size-3.5" /> Have questions or want to partner?
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-background">
              We’re here to help you grow.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-background/80 leading-relaxed">
              Have feedback, partnership inquiries, or need support? Our team is always ready to assist
              creators and businesses across India.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="mailto:support@influencerdhundo.com"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                Email Support Team
              </a>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-xl bg-background/10 hover:bg-background/20 px-5 py-3 text-xs sm:text-sm font-semibold text-background transition-all border border-background/20"
              >
                Browse Directory
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
