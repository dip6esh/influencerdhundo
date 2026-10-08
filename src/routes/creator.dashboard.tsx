import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, SectionEyebrow, StatusPill } from "@/components/ui-kit";
import { InstagramIcon } from "@/components/icons";
import { useAppState } from "@/lib/app-state";
import {
  PLANS,
  calculateAge,
  formatFollowers,
  formatPrice,
  formatTimeRemaining,
  generateReferralCode,
  getActiveSubscription,
  getInstagramUrl,
  getQueuedSubscriptions,
  getSubscriptionExpiry,
  isSubscriptionActive,
  isSubscriptionQueued,
} from "@/lib/directory-data";
import { supabaseDb, type PaymentRecord } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCheck,
  Clock,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Gift,
  History,
  IndianRupee,
  Instagram,
  Layers,
  Loader2,
  MessageCircle,
  Printer,
  Receipt,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/creator/dashboard")({
  head: () => ({
    meta: [
      { title: "Your creator dashboard — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Check your profile status, subscription and public listing visibility as a creator.",
      },
      { name: "robots", content: "noindex, nofollow" },
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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const mine = creators.find((c) => c.id === myCreatorId);

  // Subscriptions & Queued plans calculation
  const userSubs = subscriptions.filter((s) => s.creatorId === myCreatorId);
  const activeSub = myCreatorId ? getActiveSubscription(subscriptions, myCreatorId) : undefined;
  const queuedSubs = myCreatorId ? getQueuedSubscriptions(subscriptions, myCreatorId) : [];
  const latestSub = userSubs[0];

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

  // Fetch payments records for this creator
  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      if (!mine?.id) return;
      setLoadingPayments(true);
      try {
        const records = await supabaseDb.fetchPaymentsForCreator(mine.id);
        if (isMounted) setPayments(records);
      } finally {
        if (isMounted) setLoadingPayments(false);
      }
    }
    loadPayments();
    return () => {
      isMounted = false;
    };
  }, [mine?.id]);

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

  // Subscription expiration calculation (safeguards active trial vs queued plans)
  const currentSub = activeSub || latestSub;
  const currentSubExpiry = currentSub ? getSubscriptionExpiry(currentSub) : null;
  const overallExpiry = mine?.subscriptionExpiresAt
    ? new Date(mine.subscriptionExpiresAt)
    : currentSubExpiry;
  const subActive = currentSubExpiry
    ? currentSubExpiry.getTime() > Date.now()
    : isSubscriptionActive(activeSub);
  const isTrial =
    currentSub?.planId === "trial-3d" ||
    currentSub?.duration?.toLowerCase().includes("3 day");
  const sub = currentSub;
  const subExpiry = currentSubExpiry;

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
                          {mine.displayName || mine.name}
                        </h2>
                        {mine.status === "Active" && (
                          <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-tealdeep">
                            Active Creator
                          </span>
                        )}
                        {mine.instagram && (
                          <a
                            href={getInstagramUrl(mine.instagram)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-6 items-center justify-center rounded-lg hover:opacity-90 shadow-xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
                            title="Open Instagram profile"
                            aria-label="Open Instagram profile"
                          >
                            <InstagramIcon className="size-5 shrink-0" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span>📍 {[mine.locality, mine.city].filter(Boolean).join(", ") || "Location not set"}</span>
                        {calculateAge(mine.birthDate) !== null && (
                          <>
                            <span>•</span>
                            <span>{calculateAge(mine.birthDate)} yrs old</span>
                          </>
                        )}
                        {mine.gender && (
                          <>
                            <span>•</span>
                            <span>{mine.gender}</span>
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

                    {/* NO AUTO-DEBIT BADGE */}
                    <div className="rounded-xl bg-accent/10 border border-accent/25 p-2.5 flex items-start gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-tealdeep shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">
                        <strong className="text-foreground">One-Time Pass:</strong> No recurring auto-debit. You choose when to manually renew.
                      </span>
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

          {/* ── BILLING & PAYMENT RECEIPTS HISTORY ─────────────────────────────────── */}
          <div className="mt-10">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-saffrondeep border border-primary/25 mb-2">
                    <Receipt className="size-3.5 text-primary" />
                    Billing &amp; Payment Receipts
                  </div>
                  <h2 className="text-2xl font-display font-semibold tracking-tight">
                    Payment History &amp; Receipts
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All your one-time subscription pass payments processed securely via Razorpay.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">
                    <ShieldCheck className="size-3.5 text-tealdeep" />
                    100% Secure via Razorpay
                  </span>
                </div>
              </div>

              {loadingPayments ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Loading payment history...
                </div>
              ) : payments.length > 0 ? (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-border/80 bg-background/60">
                  <table className="w-full text-left text-xs table-fixed min-w-[700px]">
                    <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                      <tr>
                        <th className="w-32 px-4 py-3">Date</th>
                        <th className="w-40 px-4 py-3">Plan</th>
                        <th className="w-28 px-4 py-3">Amount</th>
                        <th className="w-48 px-4 py-3">Payment Ref ID</th>
                        <th className="w-24 px-4 py-3">Status</th>
                        <th className="w-28 px-4 py-3 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {payments.map((p) => {
                        const planLabel =
                          p.planId === "1m"
                            ? "1 Month Pass"
                            : p.planId === "3m"
                              ? "3 Months (Launch Offer)"
                              : p.planId === "6m"
                                ? "6 Months Pass"
                                : p.planId === "1y"
                                  ? "1 Year Pass"
                                  : p.planId;

                        const displayRef = p.razorpayPaymentId || p.razorpayOrderId;
                        const isCopied = copiedPaymentId === displayRef;

                        return (
                          <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                              {new Date(p.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-foreground whitespace-nowrap">
                              {planLabel}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-saffrondeep whitespace-nowrap">
                              {formatPrice(p.amount)}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[140px]">
                                  {displayRef}
                                </span>
                                {displayRef && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(displayRef);
                                      setCopiedPaymentId(displayRef);
                                      setTimeout(() => setCopiedPaymentId(null), 2000);
                                    }}
                                    title="Copy transaction ID"
                                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                                  >
                                    {isCopied ? (
                                      <CheckCheck className="size-3 text-tealdeep" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 font-bold text-tealdeep text-[11px]">
                                <Check className="size-3" />
                                Paid
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                title="View / Print Receipt"
                                onClick={() => setSelectedReceipt(p)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-black hover:bg-black/80 text-white px-2.5 py-1.5 transition-all cursor-pointer active:scale-95"
                              >
                                <Eye className="size-3.5" />
                                <Printer className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-border/80 p-8 text-center bg-background/40">
                  <div className="inline-flex items-center justify-center size-10 rounded-full bg-secondary text-muted-foreground mb-2">
                    <Receipt className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No paid transactions yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    When you purchase a subscription pass, your official Razorpay payment receipts,
                    amounts, and transaction references will appear here.
                  </p>
                  <Link
                    to="/creator/plans"
                    className="inline-flex items-center gap-1.5 mt-4 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 transition-all shadow-xs"
                  >
                    <span>View Subscription Plans</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* ── RAZORPAY RECEIPT & TAX INVOICE MODAL ── */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          creator={mine}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

/**
 * Detailed Razorpay Payment Receipt & Tax Invoice Modal
 */
function PaymentReceiptModal({
  receipt,
  creator,
  onClose,
}: {
  receipt: PaymentRecord;
  creator?: any;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const matchedPlan = PLANS.find((p) => p.id === receipt.planId);
  const basePrice = matchedPlan?.price ?? receipt.amount;
  const discountAmount = Math.max(0, basePrice - receipt.amount);

  const planName =
    receipt.planId === "1m"
      ? "1 Month Creator Pass"
      : receipt.planId === "3m"
        ? "3 Months Creator Pass (Launch Offer)"
        : receipt.planId === "6m"
          ? "6 Months Creator Pass"
          : receipt.planId === "1y"
            ? "1 Year Creator Pass"
            : `Subscription Pass (${receipt.planId})`;

  const invoiceNumber = `INV-${receipt.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const formattedDate = new Date(receipt.createdAt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const creatorName = creator?.displayName || creator?.name || "Creator";
    const creatorEmail = creator?.email || "";
    const creatorPhone = creator?.phone || "";
    const creatorLoc = [creator?.locality, creator?.city].filter(Boolean).join(", ") || "India";
    const creatorId = creator?.id || "";

    const discountRow =
      discountAmount > 0
        ? `
        <tr style="background: #f0fdf4;">
          <td style="padding: 10px 14px; font-weight: 600; color: #166534; border-bottom: 1px solid #e2e8f0;">
            Discount / Promotional Savings
          </td>
          <td style="padding: 10px 14px; text-align: center; color: #166534; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
            Promo Applied
          </td>
          <td style="padding: 10px 14px; text-align: right; color: #166534; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
            -${formatPrice(discountAmount)}
          </td>
        </tr>
      `
        : "";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt_${invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff;
              color: #0f172a;
              font-size: 12px;
              line-height: 1.45;
              padding: 0;
              margin: 0;
            }
            .invoice-box {
              width: 100%;
              max-width: 680px;
              margin: 0 auto;
              border: 1px solid #cbd5e1;
              border-radius: 14px;
              padding: 24px 26px;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 16px;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 16px;
            }
            .brand-wrap {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              object-fit: contain;
              border: 1px solid #e2e8f0;
            }
            .brand-name {
              font-size: 19px;
              font-weight: 800;
              font-family: 'Bricolage Grotesque', ui-sans-serif, sans-serif;
              color: #0f172a;
              letter-spacing: -0.3px;
            }
            .brand-name span {
              color: #d97706;
              font-family: 'Bricolage Grotesque', ui-sans-serif, sans-serif;
              font-weight: 800;
            }
            .brand-sub {
              font-size: 11px;
              color: #64748b;
              margin-top: 1px;
            }
            .brand-url {
              font-size: 10px;
              color: #94a3b8;
              font-family: monospace;
            }
            .invoice-badge-wrap {
              text-align: right;
            }
            .badge-paid {
              display: inline-block;
              background: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.5px;
            }
            .inv-id {
              font-size: 12px;
              font-weight: 700;
              font-family: monospace;
              color: #0f172a;
              margin-top: 6px;
            }
            .inv-date {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              padding-bottom: 16px;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 16px;
            }
            .info-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 12px 14px;
            }
            .info-card-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 4px;
            }
            .info-card-name {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 2px;
            }
            .info-card-line {
              font-size: 11px;
              color: #475569;
              margin-top: 2px;
            }
            .audit-card {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 10px;
              padding: 12px 14px;
              margin-bottom: 16px;
            }
            .audit-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
              font-weight: 700;
              color: #166534;
              margin-bottom: 8px;
            }
            .audit-pill {
              background: #dcfce7;
              color: #15803d;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 700;
            }
            .audit-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .audit-item {
              background: #ffffff;
              border: 1px solid #bbf7d0;
              border-radius: 6px;
              padding: 6px 8px;
              font-family: monospace;
              font-size: 10px;
              display: flex;
              justify-content: space-between;
            }
            .audit-item-label {
              color: #64748b;
            }
            .audit-item-val {
              font-weight: 700;
              color: #0f172a;
            }
            .section-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              overflow: hidden;
              margin-bottom: 16px;
            }
            th {
              background: #f8fafc;
              padding: 8px 12px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
            }
            td {
              padding: 10px 12px;
              font-size: 11px;
              border-bottom: 1px solid #f1f5f9;
            }
            .td-total-lbl {
              padding: 10px 12px;
              font-size: 12px;
              font-weight: 700;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .td-total-amt {
              padding: 10px 12px;
              font-size: 14px;
              font-weight: 800;
              color: #ea580c;
              text-align: right;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .terms-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 10px;
              color: #64748b;
              line-height: 1.45;
            }
            .terms-card strong {
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <!-- HEADER -->
            <div class="header">
              <div class="brand-wrap">
                <img src="/logo.png" alt="Influencer Dhundo" class="brand-logo" />
                <div>
                  <div class="brand-name">Influencer <span>Dhundo</span></div>
                  <div class="brand-sub">India's Creator Discovery &amp; Marketplace</div>
                  <div class="brand-url">https://influencerdhundo.com</div>
                </div>
              </div>
              <div class="invoice-badge-wrap">
                <span class="badge-paid">✓ PAID • RAZORPAY VERIFIED</span>
                <div class="inv-id">${invoiceNumber}</div>
                <div class="inv-date">Date: ${formattedDate}</div>
              </div>
            </div>

            <!-- BILLED TO & MERCHANT -->
            <div class="grid-2">
              <div class="info-card">
                <div class="info-card-label">Billed To (Creator)</div>
                <div class="info-card-name">${creatorName}</div>
                ${creatorEmail ? `<div class="info-card-line">Email: ${creatorEmail}</div>` : ""}
                ${creatorPhone ? `<div class="info-card-line">Phone: ${creatorPhone}</div>` : ""}
                <div class="info-card-line">Location: ${creatorLoc}</div>
                ${creatorId ? `<div class="info-card-line" style="font-family: monospace; font-size: 10px;">ID: ${creatorId}</div>` : ""}
              </div>

              <div class="info-card">
                <div class="info-card-label">Merchant &amp; Gateway</div>
                <div class="info-card-name">Influencer Dhundo Platform</div>
                <div class="info-card-line">Processor: Razorpay Software Pvt Ltd</div>
                <div class="info-card-line">Mode: Live Production Gateway (INR)</div>
                <div class="info-card-line">Support: support@influencerdhundo.com</div>
              </div>
            </div>

            <!-- AUDIT BOX -->
            <div class="audit-card">
              <div class="audit-header">
                <span>🛡️ Razorpay Transaction Verification</span>
                <span class="audit-pill">Captured &amp; Settled</span>
              </div>
              <div class="audit-grid">
                <div class="audit-item">
                  <span class="audit-item-label">Payment ID:</span>
                  <span class="audit-item-val">${receipt.razorpayPaymentId || "N/A"}</span>
                </div>
                <div class="audit-item">
                  <span class="audit-item-label">Order ID:</span>
                  <span class="audit-item-val">${receipt.razorpayOrderId}</span>
                </div>
              </div>
              ${
                receipt.razorpaySignature
                  ? `
                <div style="font-size: 9px; color: #166534; margin-top: 6px; font-family: monospace;">
                  Security Signature: HMAC SHA-256 Verified
                </div>
              `
                  : ""
              }
            </div>

            <!-- ITEMS TABLE -->
            <div class="section-label">Itemized Subscription Details</div>
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th style="text-align: center;">Type</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${planName}</strong>
                    <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
                      Public creator profile listing &amp; marketplace discovery access
                    </div>
                  </td>
                  <td style="text-align: center; color: #64748b;">One-Time Pass</td>
                  <td style="text-align: right; font-weight: 600;">${formatPrice(basePrice)}</td>
                </tr>
                ${discountRow}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" class="td-total-lbl">Total Net Paid</td>
                  <td class="td-total-amt">${formatPrice(receipt.amount)}</td>
                </tr>
              </tfoot>
            </table>

            <!-- TERMS -->
            <div class="terms-card">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                100% Manual One-Time Pass Guarantee
              </div>
              <div>
                This purchase is a one-time non-recurring pass. There are <strong>no automatic recurring charges</strong> or auto-debits on your account.
              </div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                Official electronic tax invoice processed via Razorpay. Valid without physical signature.
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      const prevTitle = document.title;
      document.title = `Receipt_${invoiceNumber}`;
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.title = prevTitle;
        try {
          document.body.removeChild(printFrame);
        } catch {
          // ignore
        }
      }, 1500);
    }, 1200);
  };

  return (
    <>
      {/* ISOLATED PRINT STYLES (Enforces pristine 1-page A4 print without background artifacts or page duplication) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #payment-receipt-print-wrapper,
          #payment-receipt-print-wrapper * {
            visibility: visible !important;
          }
          #payment-receipt-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-hidden {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div
          id="payment-receipt-print-wrapper"
          className="relative w-full max-w-2xl bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden my-auto"
        >
          {/* MODAL ACTION BAR (Hidden in print) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/80 bg-secondary/40 print-hidden">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Official Payment Receipt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="size-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* INVOICE CONTENT */}
          <div className="p-6 sm:p-7 space-y-5 text-foreground bg-background">
            {/* HEADER: BRAND LOGO & INVOICE STATUS */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-start gap-3">
                <img
                  src="/logo.png"
                  alt="Influencer Dhundo logo"
                  className="size-11 rounded-full object-contain shrink-0 ring-1 ring-border/80 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-xl font-bold tracking-tight text-foreground">
                      Influencer <span className="text-saffrondeep">Dhundo</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    India&apos;s Creator Discovery &amp; Marketplace
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    https://influencerdhundo.com
                  </p>
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-tealdeep border border-accent/40">
                  <Check className="size-3.5 stroke-[2.5]" />
                  PAID &bull; RAZORPAY VERIFIED
                </span>
                <p className="text-xs font-mono font-bold text-foreground mt-1.5">
                  {invoiceNumber}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Date:{" "}
                  {new Date(receipt.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* BILLED TO & BILLED BY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-5 border-b border-border/70">
              {/* BILLED TO (CREATOR) */}
              <div className="rounded-xl bg-secondary/40 border border-border/70 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Billed To (Creator)
                </span>
                <p className="text-sm font-bold text-foreground">
                  {creator?.displayName || creator?.name || "Creator"}
                </p>
                {creator?.email && (
                  <p className="text-muted-foreground">Email: {creator.email}</p>
                )}
                {creator?.phone && (
                  <p className="text-muted-foreground">Phone: {creator.phone}</p>
                )}
                <p className="text-muted-foreground">
                  Location: {[creator?.locality, creator?.city].filter(Boolean).join(", ") || "India"}
                </p>
                {creator?.id && (
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Profile ID: {creator.id}
                  </p>
                )}
              </div>

              {/* BILLED BY / PLATFORM */}
              <div className="rounded-xl bg-secondary/40 border border-border/70 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Merchant &amp; Gateway
                </span>
                <p className="text-sm font-bold text-foreground">
                  Influencer Dhundo Platform
                </p>
                <p className="text-muted-foreground">
                  Processor: Razorpay Software Pvt Ltd
                </p>
                <p className="text-muted-foreground">
                  Mode: Live Production Gateway (INR)
                </p>
                <p className="text-muted-foreground">
                  Support: support@influencerdhundo.com
                </p>
              </div>
            </div>

            {/* RAZORPAY TRANSACTION AUDIT BOX */}
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-tealdeep flex items-center gap-1.5">
                  <ShieldCheck className="size-4" />
                  Razorpay Transaction Verification
                </span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-tealdeep">
                  Captured &amp; Settled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1 border-t border-accent/20">
                <div className="flex items-center justify-between bg-background/60 rounded-lg px-2.5 py-1.5 border border-accent/20">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground font-bold truncate max-w-[130px]">
                      {receipt.razorpayPaymentId || "N/A"}
                    </span>
                    {receipt.razorpayPaymentId && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(receipt.razorpayPaymentId!, "paymentId")
                        }
                        className="text-muted-foreground hover:text-foreground cursor-pointer print-hidden"
                        title="Copy Payment ID"
                      >
                        {copiedField === "paymentId" ? (
                          <CheckCheck className="size-3 text-tealdeep" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-background/60 rounded-lg px-2.5 py-1.5 border border-accent/20">
                  <span className="text-muted-foreground">Order ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground font-bold truncate max-w-[130px]">
                      {receipt.razorpayOrderId}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(receipt.razorpayOrderId, "orderId")
                      }
                      className="text-muted-foreground hover:text-foreground cursor-pointer print-hidden"
                      title="Copy Order ID"
                    >
                      {copiedField === "orderId" ? (
                        <CheckCheck className="size-3 text-tealdeep" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {receipt.razorpaySignature && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>Security Signature:</span>
                  <span className="font-mono text-tealdeep font-semibold">
                    HMAC SHA-256 Verified
                  </span>
                </div>
              )}
            </div>

            {/* ITEMIZED SERVICES TABLE */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Itemized Subscription Details
              </span>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 border-b border-border font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Item Description</th>
                      <th className="px-4 py-2 text-center">Type</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-foreground">{planName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Public creator profile listing &amp; marketplace discovery
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">
                        One-Time Pass
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-foreground">
                        {formatPrice(basePrice)}
                      </td>
                    </tr>

                    {discountAmount > 0 && (
                      <tr className="bg-accent/5">
                        <td className="px-4 py-2">
                          <span className="font-semibold text-tealdeep">
                            Discount / Promotional Savings
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-tealdeep font-medium">
                          Promo Applied
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-tealdeep">
                          -{formatPrice(discountAmount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-secondary/40 border-t border-border font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-foreground text-xs">
                        Total Net Paid
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-saffrondeep font-display font-bold">
                        {formatPrice(receipt.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* GUARANTEE & ONE-TIME PASS TERMS */}
            <div className="rounded-xl bg-secondary/30 border border-border/70 p-3 text-[11px] text-muted-foreground space-y-0.5 leading-relaxed">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-tealdeep" />
                100% Manual One-Time Pass Guarantee
              </p>
              <p>
                This is a one-time non-recurring pass. There are <strong>no automated recurring charges</strong> or auto-debits on your account.
              </p>
              <p className="text-[10px] text-muted-foreground/80 pt-0.5 border-t border-border/50">
                Official electronic tax invoice for payment processed via Razorpay. Valid without physical signature.
              </p>
            </div>

            {/* FOOTER ACTIONS (Hidden in print) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 print-hidden">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl bg-secondary px-5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 ring-1 ring-border transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
              >
                <Printer className="size-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


