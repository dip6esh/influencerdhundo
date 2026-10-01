import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, SectionEyebrow } from "@/components/ui-kit";
import { Building2, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Influencer Dhundo" },
      {
        name: "description",
        content: "Log in to your Influencer Dhundo business account or creator profile.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>Welcome to Influencer Dhundo</SectionEyebrow>
            <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              Choose how you want to log in
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Two separate portals tailored for local businesses and creators.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* FOR BUSINESSES */}
            <Card className="glass-card flex flex-col justify-between rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50">
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="size-7" />
                </div>
                <h2 className="mt-5 text-2xl font-display font-semibold">For Businesses</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Looking for local creators and micro-influencers to promote your store, cafe, brand, or service?
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Search creators by city, locality &amp; category</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Unlock direct WhatsApp, phone &amp; email contacts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>100% free — no commissions or agency fees</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  to="/business/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
                >
                  <span>Business Login</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/business/signup"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-background px-4 py-2.5 text-xs font-semibold ring-1 ring-border transition-colors hover:bg-secondary"
                >
                  Create new business account
                </Link>
              </div>
            </Card>

            {/* FOR CREATORS */}
            <Card className="glass-card flex flex-col justify-between rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 transition-all duration-200 hover:-translate-y-1 hover:border-saffrondeep/50">
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-saffrondeep/10 text-saffrondeep">
                  <Sparkles className="size-7" />
                </div>
                <h2 className="mt-5 text-2xl font-display font-semibold">For Creators</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Want to set up your profile, get discovered by local brands, and land paid collaborations?
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                    <span>Set up &amp; customize your public creator profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                    <span>Get contacted directly by nearby business owners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-saffrondeep shrink-0" />
                    <span>Keep 100% of your earnings — zero commissions</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  to="/creator/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-md transition-all hover:bg-foreground/90"
                >
                  <span>Creator Login</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/creator/register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-background px-4 py-2.5 text-xs font-semibold ring-1 ring-border transition-colors hover:bg-secondary"
                >
                  Set up new creator profile
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
