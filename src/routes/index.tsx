import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionEyebrow } from "@/components/ui-kit";
import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Influencer Dhundo — Where Businesses Find Relevant Creators with 0% Commission" },
      {
        name: "description",
        content:
          "Influencer Dhundo connects local businesses directly with Instagram creators. 0% commission, direct WhatsApp contact. Find the best creators for your business today.",
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
      <section className="bg-secondary/50">
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

      {/* FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-foreground">
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



const FAQ_ITEMS = [
  {
    q: "How does Influencer Dhundo help local businesses find relevant creators?",
    a: "Influencer Dhundo is India's direct local influencer discovery platform. Businesses can search and filter local Instagram creators by city, locality, niche category (Food, Fashion, Fitness, Tech, etc.), audience size, turnaround time, and budget without having to hire expensive agencies.",
  },
  {
    q: "Why is Influencer Dhundo 0% commission?",
    a: "Traditional agencies often take a 20% to 50% commission cut on every brand deal. Influencer Dhundo operates on zero commission: businesses connect directly with creators via WhatsApp and phone, negotiate their own terms, and keep 100% of the collaboration value between the brand and creator.",
  },
  {
    q: "How do businesses get direct WhatsApp and contact access with creators?",
    a: "Subscribed businesses can instantly unlock direct WhatsApp chat, direct phone numbers, and email IDs for active creators on our platform, enabling fast communication, product gifting, and rapid campaign execution.",
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
    <section className="bg-secondary/50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="max-w-3xl">
          <SectionEyebrow>Local Discovery</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-display font-semibold leading-tight text-balance md:text-5xl">
            Discover Influencers by City &amp; Category.
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground md:text-lg">
            Explore local influencers across top Indian cities and high-growth niches. Find the right creator right around your business.
          </p>
        </div>

        {/* Two key hubs as side-by-side cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Cities Hub */}
          <div className="glass-card flex flex-col rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                Popular Cities in India
              </p>
            </div>
            <h3 className="mt-3 text-xl font-display font-semibold leading-snug">
              Find creators around your city
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Filter creators based in specific metropolitan and regional commercial hubs.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 pt-2">
              {POPULAR_CITIES.map((city) => (
                <Link
                  key={city}
                  to="/discover"
                  className="rounded-xl bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground ring-1 ring-border/80 hover:bg-foreground hover:text-background transition-all shadow-2xs active:scale-98"
                >
                  {city} Influencers
                </Link>
              ))}
            </div>
          </div>

          {/* Categories Hub */}
          <div className="glass-card flex flex-col rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                Trending Niche Categories
              </p>
            </div>
            <h3 className="mt-3 text-xl font-display font-semibold leading-snug">
              Creators in every industry
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              From food and cafes to fashion, tech, and fitness, find creators that fit your niche.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 pt-2">
              {POPULAR_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to="/discover"
                  className="rounded-xl bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground ring-1 ring-border/80 hover:bg-foreground hover:text-background transition-all shadow-2xs active:scale-98"
                >
                  {cat} Influencers
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="max-w-3xl">
          <SectionEyebrow>Frequently Asked Questions</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-display font-semibold leading-tight text-balance md:text-5xl">
            Everything you need to know.
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground md:text-lg">
            Got questions about how Influencer Dhundo works for brands and creators? Here are the most common questions answered.
          </p>
        </div>

        <div className="mt-10 space-y-3.5">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="glass-card rounded-2xl border border-border/80 overflow-hidden"
                style={{
                  transition: "box-shadow 0.4s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: isOpen
                    ? "0 4px 32px 0 rgba(0,0,0,0.10)"
                    : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left font-display text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-start gap-3">
                    <HelpCircle className="size-5 text-primary shrink-0 mt-0.5" />
                    <span>{item.q}</span>
                  </span>
                  <ChevronDown
                    style={{
                      transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1), color 0.3s ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: isOpen ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    }}
                    className="size-5 shrink-0"
                  />
                </button>
                {/* Outer wrapper: drives the max-height clip */}
                <div
                  style={{
                    maxHeight: isOpen ? "600px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.5s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  {/* Inner wrapper: slides + fades the content */}
                  <div
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? "translateY(0)" : "translateY(-8px)",
                      transition:
                        "opacity 0.4s cubic-bezier(0.4,0,0.2,1) 0.05s, transform 0.45s cubic-bezier(0.4,0,0.2,1) 0.05s",
                    }}
                    className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm sm:text-base text-muted-foreground leading-relaxed pl-12 sm:pl-14 border-t border-border/40 pt-3"
                  >
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Callout Matching Page Cards */}
        <div className="mt-10 glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-display font-semibold text-foreground">
              Still have questions or need help onboarding?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Reach out to our team directly or explore our directory and guides.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              to="/discover"
              className="inline-flex rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
            >
              Explore Directory
            </Link>
            <Link
              to="/about"
              className="inline-flex rounded-xl bg-background px-4 py-2.5 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-secondary transition-colors"
            >
              About Our Mission
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

