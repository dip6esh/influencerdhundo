import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, SectionEyebrow, StatusPill } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import {
  calculateAge,
  formatFollowers,
  formatPrice,
  formatTimeRemaining,
  getSubscriptionExpiry,
  isSubscriptionActive,
} from "@/lib/directory-data";
import { supabaseDb } from "@/lib/supabase";
import { AlertCircle, Clock, Loader2, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/creator/dashboard")({
  head: () => ({
    meta: [
      { title: "Your creator dashboard — influencer Dhundo" },
      {
        name: "description",
        content:
          "Check your profile status, subscription and public listing visibility as a creator.",
      },
      { property: "og:title", content: "Your creator dashboard" },
      {
        property: "og:description",
        content: "Manage your creator profile, plan and visibility.",
      },
    ],
  }),
  component: Dashboard,
});

const STATUS_NOTE: Record<string, string> = {
  Draft: "Your profile is still being created.",
  Inactive: "Profile complete, but not visible to businesses until you activate a plan.",
  Active: "Your profile is live and visible in the public directory.",
  Expired: "Your subscription or trial has ended — your profile is hidden until renewed.",
  Suspended: "Your profile has been temporarily removed by the platform.",
};

function Dashboard() {
  const { creators, myCreatorId, subscriptions, upsertCreator, setCreatorStatus } = useAppState();
  const [loading, setLoading] = useState(!myCreatorId);
  const mine = creators.find((c) => c.id === myCreatorId);
  const sub = subscriptions.find((s) => s.creatorId === myCreatorId);

  // Auto-fetch profile from Supabase on mount
  useEffect(() => {
    let mounted = true;
    async function checkAuthUser() {
      if (!mine) {
        setLoading(true);
        const uid = await supabaseDb.getCreatorSession();
        if (uid && mounted) {
          const profile = await supabaseDb.getCreatorProfileForAuthUser(uid);
          if (profile && mounted) {
            upsertCreator(profile, true);
          }
        }
        if (mounted) setLoading(false);
      } else {
        setLoading(false);
      }
    }
    checkAuthUser();
    return () => {
      mounted = false;
    };
  }, [mine, upsertCreator]);

  // Subscription expiration check
  const subActive = isSubscriptionActive(sub);
  const subExpiry = sub ? getSubscriptionExpiry(sub) : null;
  const isTrial = sub?.planId === "trial-3d" || sub?.duration?.toLowerCase().includes("3 day");

  useEffect(() => {
    if (mine && sub) {
      if (!subActive && mine.status === "Active") {
        // Subscription / trial expired: mark as Expired
        setCreatorStatus(mine.id, "Expired");
      }
    }
  }, [mine, sub, subActive, setCreatorStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="size-5 animate-spin text-primary" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!mine) {
    return (
      <div className="min-h-screen bg-secondary/50 pb-16">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <h1 className="text-3xl font-display font-semibold">No profile yet</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Create your creator profile for free and get discovered by local businesses.
          </p>
          <Link
            to="/creator/register"
            className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3.5 font-display font-semibold text-primary-foreground"
          >
            Create Your Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5">
          {/* TRIAL BANNER / EXPIRED BANNER */}
          {sub && isTrial && subActive && subExpiry ? (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/15 via-emerald-500/15 to-primary/10 border border-primary/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>3-Day Free Trial Active</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-bold">
                      {formatTimeRemaining(subExpiry)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your profile is live in the public directory until{" "}
                    {subExpiry.toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    .
                  </p>
                </div>
              </div>
              <Link
                to="/creator/plans"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all"
              >
                <Zap className="size-3.5 text-primary" />
                Upgrade Plan
              </Link>
            </div>
          ) : null}

          {sub && !subActive ? (
            <div className="mb-6 rounded-2xl bg-rose/10 border border-rose/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose text-white">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose">
                    {isTrial ? "3-Day Free Trial Ended" : "Subscription Expired"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isTrial
                      ? "Your free trial has ended. Your profile is safely saved and will not be deleted — activate a paid plan anytime to make it visible again."
                      : "Your subscription has expired. Your profile is safely saved and will not be deleted — renew anytime to restore directory visibility."}
                  </p>
                </div>
              </div>
              <Link
                to="/creator/plans"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-rose px-4 py-2 text-xs font-semibold text-white hover:bg-rose/90 transition-all"
              >
                {isTrial ? "Upgrade to Paid Plan" : "Renew Plan"}
              </Link>
            </div>
          ) : null}

          <div className="max-w-2xl">
            <SectionEyebrow>Creator dashboard</SectionEyebrow>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
                {mine.name}
              </h1>
              <StatusPill status={mine.status} />
            </div>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              {STATUS_NOTE[mine.status]}
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card className="glass-card md:col-span-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
              <div className="flex flex-col sm:flex-row gap-5">
                <img
                  src={mine.photo}
                  alt={mine.name}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-border shadow-sm"
                />
                <div className="min-w-0 text-sm space-y-1">
                  <p className="font-semibold text-lg">{mine.instagram}</p>
                  <p className="text-tealdeep font-medium">
                    {formatFollowers(mine.followers)} followers · 📍{" "}
                    {[mine.locality, mine.city].filter(Boolean).join(", ")}
                    {calculateAge(mine.birthDate) !== null
                      ? ` · ${calculateAge(mine.birthDate)} yrs old`
                      : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {mine.categories.join(" · ") || "No categories yet"}
                  </p>
                  <p className="pt-1 font-display text-base font-semibold text-saffrondeep">
                    Starting from {formatPrice(mine.startingPrice)}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Link
                  to="/creator/register"
                  className="rounded-xl bg-foreground px-4 py-3 text-center text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
                >
                  Edit profile
                </Link>
                <Link
                  to="/creators/$creatorId"
                  params={{ creatorId: mine.id }}
                  search={{ preview: true }}
                  className="rounded-xl bg-background px-4 py-3 text-center text-sm font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
                >
                  View public profile
                </Link>
                <Link
                  to="/creator/plans"
                  className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {mine.status === "Active" ? "Manage plan" : "Activate plan"}
                </Link>
              </div>
            </Card>

            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
              <h2 className="text-xl font-display font-semibold">Subscription</h2>
              {sub ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Plan
                    </span>
                    <p className="text-lg font-semibold text-foreground">{sub.duration}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </span>
                    <p className="font-medium text-saffrondeep">{formatPrice(sub.price)}</p>
                  </div>
                  <div className="border-t border-border pt-2.5 text-xs text-muted-foreground space-y-1">
                    <p>
                      Started:{" "}
                      {new Date(sub.startedAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {subExpiry ? (
                      <p className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="size-3.5 text-primary" />
                        {subActive
                          ? `Ends: ${subExpiry.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} (${formatTimeRemaining(subExpiry)})`
                          : "Ended"}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No active subscription. Your profile stays hidden from businesses until you
                    activate a plan.
                  </p>
                  <Link
                    to="/creator/plans"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    View plans
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
