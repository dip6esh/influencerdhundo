import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, SectionEyebrow } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { PLANS, formatPrice } from "@/lib/directory-data";

export const Route = createFileRoute("/creator/plans")({
  head: () => ({
    meta: [
      { title: "Creator subscription plans — influencer Dhundo" },
      {
        name: "description",
        content:
          "Activate a plan to make your creator profile visible in the directory. 1 month ₹799, 3 months ₹1,999, 6 months ₹3,398, 1 year ₹7,996.",
      },
      { property: "og:title", content: "Creator subscription plans" },
      {
        property: "og:description",
        content: "Creating a profile is free. Activate a plan to become visible.",
      },
    ],
  }),
  component: Plans,
});

function Plans() {
  const navigate = useNavigate();
  const { myCreatorId, creators, activateSubscription } = useAppState();
  const mine = creators.find((c) => c.id === myCreatorId);
  const [selected, setSelected] = useState<string>("3m");

  const activate = () => {
    const plan = PLANS.find((p) => p.id === selected);
    if (!plan || !mine) return;
    activateSubscription({
      creatorId: mine.id,
      planId: plan.id,
      duration: plan.duration,
      price: plan.price,
    });
    navigate({ to: "/creator/dashboard" });
  };

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5">
          <div className="max-w-2xl">
            <SectionEyebrow>Creator subscription</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              Make your profile visible
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Creating a profile is free. An unpaid profile stays hidden from the public directory — activate a plan whenever you're ready.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={
                  selected === p.id
                    ? "rounded-2xl bg-foreground p-6 text-left text-background shadow-lg ring-2 ring-primary transition-all scale-[1.02]"
                    : "glass-card rounded-2xl p-6 text-left hover:border-foreground/30 transition-all"
                }
              >
                <p
                  className={
                    selected === p.id
                      ? "text-xs font-semibold uppercase tracking-[0.14em] text-primary"
                      : "label-caps"
                  }
                >
                  {p.note}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold">{p.duration}</p>
                <p
                  className={
                    selected === p.id
                      ? "mt-2 text-xl font-semibold text-primary"
                      : "mt-2 text-xl font-semibold text-saffrondeep"
                  }
                >
                  {formatPrice(p.price)}
                </p>
              </button>
            ))}
          </div>

          <Card className="glass-card mt-8 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
            {mine ? (
              <div className="space-y-4">
                <p className="text-base text-muted-foreground">
                  Activating plan for <span className="font-semibold text-foreground">{mine.name}</span>. Once active, your profile appears in the directory for businesses to discover and contact you.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button variant="primary" className="py-3.5 px-8 text-base font-semibold" onClick={activate}>
                    Activate plan ({PLANS.find(p => p.id === selected)?.duration})
                  </Button>
                  <Link
                    to="/creator/dashboard"
                    className="inline-flex items-center justify-center rounded-xl bg-background px-6 py-3.5 text-sm font-medium ring-1 ring-border hover:bg-secondary transition-colors"
                  >
                    Skip for now
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-base text-muted-foreground">
                  Create your profile first — it only takes a few minutes and costs nothing.
                </p>
                <Link
                  to="/creator/register"
                  className="inline-flex rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground"
                >
                  Create your profile
                </Link>
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
