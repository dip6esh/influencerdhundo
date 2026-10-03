import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, SectionEyebrow, StatusPill } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import {
  calculateAge,
  formatFollowers,
  formatPrice,
  formatTimeRemaining,
  generateReferralCode,
  getActiveSubscription,
  getQueuedSubscriptions,
  getSubscriptionExpiry,
  isSubscriptionActive,
  isSubscriptionQueued,
} from "@/lib/directory-data";
import { supabaseDb } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Gift,
  History,
  IndianRupee,
  Layers,
  Loader2,
  MessageCircle,
  Share2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

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
  const {
    creators,
    myCreatorId,
    subscriptions,
    referralEvents,
    fetchReferralEvents,
    upsertCreator,
    setCreatorStatus,
    refreshFromSupabase,
  } = useAppState();
  const [loading, setLoading] = useState(!myCreatorId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const mine = creators.find((c) => c.id === myCreatorId);

  // Subscriptions & Queued plans calculation
  const userSubs = subscriptions.filter((s) => s.creatorId === myCreatorId);
  const activeSub = myCreatorId ? getActiveSubscription(subscriptions, myCreatorId) : undefined;
  const queuedSubs = myCreatorId ? getQueuedSubscriptions(subscriptions, myCreatorId) : [];
  const latestSub = userSubs[0];
  const sub = activeSub || latestSub;

  // Auto-fetch profile from Supabase & sync latest data on mount
  useEffect(() => {
    let mounted = true;
    async function initDashboard() {
      try {
        refreshFromSupabase();
        const uid = await supabaseDb.getCreatorSession();
        if (uid && mounted) {
          const profile = await supabaseDb.getCreatorProfileForAuthUser(uid);
          if (profile && mounted) {
            upsertCreator(profile, true);
            fetchReferralEvents(profile.id);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    initDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch referral events when creator ID is ready
  useEffect(() => {
    if (mine?.id) {
      fetchReferralEvents(mine.id);
    }
  }, [mine?.id]);

  // Only generate/save referral code for paid subscribers (not trial-only users)
  useEffect(() => {
    const hasPaidPlan = userSubs.some(
      (s) => s.planId !== "trial-3d" && !s.duration?.toLowerCase().includes("3 day"),
    );
    if (mine && !mine.referralCode && hasPaidPlan) {
      const code = generateReferralCode(mine.displayName || mine.name);
      supabaseDb.setReferralCode(mine.id, code);
      upsertCreator({ ...mine, referralCode: code });
    }
  }, [mine, userSubs, upsertCreator]);

  // Subscription expiration check (incorporating referral bonus days)
  const subExpiry = mine?.subscriptionExpiresAt
    ? new Date(mine.subscriptionExpiresAt)
    : activeSub
    ? getSubscriptionExpiry(activeSub)
    : latestSub
    ? getSubscriptionExpiry(latestSub)
    : null;
  const subActive = subExpiry ? subExpiry.getTime() > Date.now() : isSubscriptionActive(activeSub);
  const isTrial =
    sub?.planId === "trial-3d" || sub?.duration?.toLowerCase().includes("3 day");

  useEffect(() => {
    if (mine && sub) {
      if (!subActive && queuedSubs.length === 0 && mine.status === "Active") {
        // Subscription / trial expired and no active/queued plan: mark as Expired
        setCreatorStatus(mine.id, "Expired");
      } else if (subActive && mine.status !== "Active") {
        setCreatorStatus(mine.id, "Active");
      }
    }
  }, [mine, sub, subActive, queuedSubs.length, setCreatorStatus]);

  // Referral Calculations
  // Referral is unlocked for paid subscribers or creators who have a paid plan in queue
  const hasPaidQueued = queuedSubs.some(
    (s) => s.planId !== "trial-3d" && !s.duration?.toLowerCase().includes("3 day"),
  );
  const isReferralUnlocked = (subActive && !isTrial) || hasPaidQueued;
  const referralCode = mine?.referralCode || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://influencerdhundo.com";
  const referralLink = referralCode ? `${baseUrl}/creator/register?ref=${referralCode}` : "";

  const referredCreators = creators.filter((c) => c.referredBy === mine?.id);
  const paidReferredCount = referredCreators.filter((c) =>
    subscriptions.some((s) => s.creatorId === c.id && s.planId !== "trial-3d"),
  ).length;

  const totalBonusDaysEarned = referralEvents.reduce((acc, ev) => acc + (ev.daysDelta || 0), 0);
  const netBonusDays = Math.max(0, mine?.referralBonusDays ?? totalBonusDaysEarned);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hey! Join Influencer Dhundo using my invite link to get a 3-day free trial and connect with local businesses looking for creators:\n${referralLink}`,
  );

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
          {/* QUEUED PLAN NOTICE BANNER */}
          {queuedSubs.length > 0 && queuedSubs[0] ? (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-accent/20 via-primary/15 to-accent/10 border border-accent/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tealdeep text-white shadow-sm">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>Upcoming Plan in Queue: {queuedSubs[0].duration}</span>
                    <span className="rounded-full bg-accent/30 text-tealdeep px-2 py-0.5 text-[11px] font-bold">
                      Paid Plan Queued
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isTrial && subActive && subExpiry ? (
                      <>
                        You are currently on your 3-Day Free Trial (
                        <strong className="text-foreground">{formatTimeRemaining(subExpiry)} remaining</strong>
                        ). Your upgraded <strong>{queuedSubs[0].duration}</strong> plan is queued and will{" "}
                        <strong>automatically activate</strong> on{" "}
                        {subExpiry.toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        as soon as the trial ends.
                      </>
                    ) : (
                      <>
                        Your <strong>{queuedSubs[0].duration}</strong> plan is queued and will{" "}
                        <strong>automatically activate</strong> on{" "}
                        {new Date(queuedSubs[0].startedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        when your current plan expires.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Link
                to="/creator/plans"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-background px-3.5 py-1.5 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-all"
              >
                Manage Plans
              </Link>
            </div>
          ) : null}

          {/* TRIAL BANNER — ONLY SHOWN IF NO PAID PLAN IS IN QUEUE */}
          {sub && isTrial && subActive && subExpiry && queuedSubs.length === 0 ? (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/15 to-primary/10 border border-primary/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>3-Day Free Trial Active</span>
                    <span className="rounded-full bg-accent/20 text-tealdeep px-2 py-0.5 text-[11px] font-bold">
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
                <IndianRupee className="size-3.5 text-primary" />
                Upgrade Plan
              </Link>
            </div>
          ) : null}

          {sub && !subActive && queuedSubs.length === 0 ? (
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

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <SectionEyebrow>Creator Portal</SectionEyebrow>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground md:text-4xl">
                  {mine.name}
                </h1>
                <StatusPill status={mine.status} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {STATUS_NOTE[mine.status]}
              </p>
            </div>

            {/* QUICK HEADER ACTIONS */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/creators/$creatorId"
                params={{ creatorId: mine.id }}
                search={{ preview: true }}
                className="inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground ring-1 ring-border/80 hover:bg-secondary hover:ring-border transition-all shadow-xs"
              >
                <ArrowUpRight className="size-4 text-muted-foreground" />
                View Public Profile
              </Link>
              <Link
                to="/creator/register"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs"
              >
                <Check className="size-3.5 hidden" />
                Edit Profile
              </Link>
            </div>
          </div>

          {/* MAIN PROFILE & SUBSCRIPTION CARDS */}
          <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
            {/* CREATOR PROFILE HERO CARD */}
            <Card className="glass-card md:col-span-2 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl border border-border/80 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={mine.photo}
                        alt={mine.name}
                        loading="lazy"
                        width={816}
                        height={816}
                        className="size-16 sm:size-20 rounded-2xl object-cover ring-2 ring-border/60 shadow-md bg-secondary"
                      />
                      {mine.status === "Active" && (
                        <span
                          className="absolute -bottom-1 -right-1 size-4 rounded-full bg-tealdeep ring-2 ring-background shadow-xs"
                          title="Directory Live"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
                          {mine.displayName || mine.name}
                        </h2>
                        {mine.status === "Active" && (
                          <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-tealdeep">
                            Verified Creator
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-mono font-medium text-tealdeep mt-0.5">
                        {mine.instagram.startsWith("@") ? mine.instagram : `@${mine.instagram}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span>📍 {[mine.locality, mine.city].filter(Boolean).join(", ") || "Location not set"}</span>
                        {calculateAge(mine.birthDate) !== null && (
                          <>
                            <span>•</span>
                            <span>{calculateAge(mine.birthDate)} yrs old</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-end gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Starting Rate
                    </span>
                    <span className="font-display text-lg sm:text-xl font-bold text-saffrondeep">
                      {formatPrice(mine.startingPrice)}
                    </span>
                  </div>
                </div>

                {/* CATEGORIES & STATS GRID */}
                <div className="py-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-background/70 border border-border/70 p-3">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Audience Size
                    </span>
                    <p className="text-base sm:text-lg font-display font-bold text-foreground mt-0.5">
                      {formatFollowers(mine.followers)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Instagram followers</span>
                  </div>

                  <div className="rounded-xl bg-background/70 border border-border/70 p-3">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Categories & Niche
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mine.categories && mine.categories.length > 0 ? (
                        mine.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">None set</span>
                      )}
                      {mine.categories && mine.categories.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-medium self-center">
                          +{mine.categories.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded-xl bg-background/70 border border-border/70 p-3">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Directory Listing
                    </span>
                    <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${
                          mine.status === "Active"
                            ? "bg-tealdeep animate-pulse"
                            : mine.status === "Expired"
                              ? "bg-rose"
                              : "bg-muted-foreground"
                        }`}
                      />
                      {mine.status === "Active"
                        ? "Public & Searchable"
                        : mine.status === "Expired"
                          ? "Hidden (Expired)"
                          : "Draft Status"}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {mine.status === "Active" ? "Visible to brands" : "Activate plan to show"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD FOOTER ACTION BAR */}
              <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Want to update your collaboration rates, photos, or bio?
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    to="/creator/register"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 ring-1 ring-border transition-all"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    to="/creators/$creatorId"
                    params={{ creatorId: mine.id }}
                    search={{ preview: true }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs"
                  >
                    <ArrowUpRight className="size-3.5" />
                    Preview Listing
                  </Link>
                </div>
              </div>
            </Card>

            {/* SUBSCRIPTION STATUS CARD */}
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl border border-border/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                    <IndianRupee className="size-4 text-primary" />
                    Membership Plan
                  </h2>
                  {subActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-tealdeep">
                      <span className="size-1.5 rounded-full bg-tealdeep" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose/15 px-2.5 py-0.5 text-[11px] font-bold text-rose">
                      Inactive
                    </span>
                  )}
                </div>

                {sub ? (
                  <div className="mt-4 space-y-3.5 text-sm">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Current Plan
                      </span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <p className="text-xl font-display font-bold text-foreground">{sub.duration}</p>
                        <p className="font-semibold text-saffrondeep">
                          {sub.price && sub.price > 0 ? formatPrice(sub.price) : "Free Trial"}
                        </p>
                      </div>
                    </div>

                    {/* Expiry & Timing */}
                    <div className="rounded-xl bg-background/80 border border-border/70 p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium text-foreground">
                          {new Date(sub.startedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {subExpiry && (
                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3 text-primary" /> Time Left
                          </span>
                          <span className="font-bold text-foreground">
                            {subActive ? formatTimeRemaining(subExpiry) : "Expired"}
                          </span>
                        </div>
                      )}
                      {netBonusDays > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-tealdeep font-semibold text-[11px]">
                          <span>🎁 Referral Bonus</span>
                          <span>+{netBonusDays} days added</span>
                        </div>
                      )}
                    </div>

                    {/* QUEUED PLANS SUB-SECTION */}
                    {queuedSubs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-tealdeep mb-2">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="size-3.5" /> Next in Queue
                          </span>
                          <span className="rounded-full bg-accent/20 text-tealdeep px-2 py-0.5 text-[10px] font-bold">
                            Auto-activates
                          </span>
                        </div>
                        {queuedSubs.map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="rounded-xl bg-accent/10 border border-accent/30 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground">{q.duration}</span>
                              <span className="font-semibold text-saffrondeep">
                                {formatPrice(q.price ?? 0)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Starts automatically on expiry of current plan
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      No active subscription. Activate a plan to list your profile in the directory.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border/60">
                <Link
                  to="/creator/plans"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                >
                  <IndianRupee className="size-3.5" />
                  {queuedSubs.length > 0
                    ? "Manage Subscription"
                    : isTrial && subActive
                      ? "Upgrade to Paid Plan"
                      : subActive
                        ? "Renew / Upgrade Plan"
                        : "Choose a Plan"}
                </Link>
              </div>
            </Card>
          </div>

          {/* ── REFERRAL PROGRAM & REWARDS SECTION ─────────────────────────────────── */}
          <div className="mt-10">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 overflow-hidden relative">
              <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-accent/10 blur-3xl" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-tealdeep border border-accent/25 mb-2">
                    <Gift className="size-3.5 text-tealdeep" />
                    Referral Program — Earn +7 Days Free
                  </div>
                  <h2 className="text-2xl font-display font-semibold tracking-tight">
                    Invite Creators & Extend Your Subscription
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                    Share your unique link. When a creator signs up and buys any paid plan, you
                    receive <strong>+7 extra days</strong> added directly to your subscription.
                    Stack unlimited bonus days!
                  </p>
                </div>

                {/* Referral Link Active Status Badge */}
                <div className="shrink-0 flex items-center gap-2">
                  {isReferralUnlocked ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-tealdeep border border-accent/30">
                      <span className="size-2 rounded-full bg-tealdeep animate-pulse" />
                      Referral Code Active
                    </span>
                  ) : isTrial && subActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30">
                      <span className="size-2 rounded-full bg-primary" />
                      Locked — Upgrade to Unlock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Inactive (Renew plan to earn rewards)
                    </span>
                  )}
                </div>
              </div>

              {/* STATS TILES */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-background/60 border border-border/60 p-4">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="size-3.5 text-primary" /> Total Invites
                  </span>
                  <p className="mt-1 text-2xl font-display font-bold text-foreground">
                    {referredCreators.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Creators registered</p>
                </div>

                <div className="rounded-2xl bg-background/60 border border-border/60 p-4">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Zap className="size-3.5 text-primary" /> Paid Conversions
                  </span>
                  <p className="mt-1 text-2xl font-display font-bold text-tealdeep">
                    {paidReferredCount}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Subscribed creators</p>
                </div>

                <div className="rounded-2xl bg-background/60 border border-border/60 p-4">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Gift className="size-3.5 text-saffrondeep" /> Bonus Days Earned
                  </span>
                  <p className="mt-1 text-2xl font-display font-bold text-saffrondeep">
                    +{netBonusDays} Days
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">+7 days per paid referral</p>
                </div>

                <div className="rounded-2xl bg-background/60 border border-border/60 p-4 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" /> Referral Code
                    </span>
                   {/* Hide copy button when locked */}
                    {isReferralUnlocked && (
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        title={copiedCode ? "Copied!" : "Copy referral code"}
                        aria-label="Copy referral code"
                        className="inline-flex size-6 items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-all cursor-pointer"
                      >
                        {copiedCode ? (
                          <Check className="size-3.5 text-foreground stroke-[2.5]" />
                        ) : (
                          <Copy className="size-3.5 text-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-lg font-mono font-bold text-foreground tracking-wider truncate transition-all select-none ${
                      isReferralUnlocked ? "" : "blur-sm opacity-50 pointer-events-none"
                    }`}
                  >
                    {isReferralUnlocked ? referralCode : "DHUNDO-XXXXXX"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isReferralUnlocked ? "Permanent account code" : "Unlocks on paid plan"}
                  </p>
                </div>
              </div>

              {/* LINK SHARING BOX — locked for trial users */}
              {isReferralUnlocked ? (
                <div className="mt-6 rounded-2xl bg-secondary/60 border border-border/80 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Your Unique Referral Link &amp; Code
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Code: <strong className="font-mono text-foreground">{referralCode}</strong>
                    </span>
                  </div>

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="w-full truncate rounded-xl bg-background px-3.5 py-2.5 text-xs sm:text-sm font-mono text-foreground border border-border focus:outline-none select-all shadow-xs"
                      />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="size-4 text-tealdeep" />
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-background px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground ring-1 ring-border hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="size-4 text-tealdeep" />
                            <span>Code Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-4 text-primary" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-xs active:scale-98"
                      >
                        <MessageCircle className="size-4" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* Locked state — trial or expired */
                <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 border border-primary/20 mb-3">
                    <AlertCircle className="size-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isTrial && subActive
                      ? "Referral Code Locked — Available on Paid Plans"
                      : "Referral Code Inactive — Renew to Reactivate"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
                    {isTrial && subActive
                      ? "Your referral code unlocks once you activate any paid subscription. Trial accounts cannot share referral links."
                      : "Your subscription has expired. Renew any paid plan to reactivate your referral code and start earning bonus days again."}
                  </p>
                  <Link
                    to="/creator/plans"
                    className="inline-flex items-center gap-1.5 mt-4 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <ArrowUpRight className="size-4" />
                    {isTrial && subActive ? "Upgrade to Paid Plan" : "Renew Subscription"}
                  </Link>
                </div>
              )}

              {/* REFERRAL HISTORY */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <History className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Referral & Bonus Days History
                  </h3>
                </div>

                {referralEvents.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-border/80 bg-background/60">
                    <table className="w-full text-left text-xs table-fixed min-w-[520px]">
                      <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                        <tr>
                          <th className="w-28 px-4 py-3">Date</th>
                          <th className="w-28 px-4 py-3">Event</th>
                          <th className="w-28 px-4 py-3">Bonus Days</th>
                          <th className="px-4 py-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {referralEvents.map((ev) => (
                          <tr key={ev.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap truncate">
                              {new Date(ev.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {ev.eventType === "earned" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 font-bold text-tealdeep">
                                  + Earned
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose/15 px-2 py-0.5 font-bold text-rose">
                                  - Reversed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                              {ev.daysDelta > 0 ? `+${ev.daysDelta} Days` : `${ev.daysDelta} Days`}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground truncate" title={ev.note}>
                              {ev.note || "Referral conversion"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No referral events yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share your link with fellow creators. When they upgrade to a paid subscription,
                      your history and +7 day rewards will appear here!
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

