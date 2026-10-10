import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, SectionEyebrow, StatusPill } from "@/components/ui-kit";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
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
  getCreatorProfileSlug,
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
  Camera,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Eye,
  Gift,
  Globe,
  History,
  IndianRupee,
  Layers,
  Loader2,
  MapPin,
  Printer,
  ReceiptText,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
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
    updateCreatorPhoto,
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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
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
      const code = generateReferralCode(mine.name || mine.displayName);
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

  const referredCreators = creators.filter(
    (c) =>
      c.referredBy === mine?.id ||
      (mine?.referralCode && c.referredBy?.trim().toUpperCase() === mine.referralCode.trim().toUpperCase()),
  );
  const paidReferredCount = referredCreators.filter((c) =>
    subscriptions.some(
      (s) =>
        s.creatorId === c.id &&
        s.planId !== "trial-3d" &&
        !s.isTrial &&
        (s.price ?? 0) > 0,
    ),
  ).length;

  const totalBonusDaysEarned = referralEvents.reduce((acc, ev) => acc + (ev.daysDelta || 0), 0);
  const totalBonusDaysFromReferrals = paidReferredCount * 7;
  const netBonusDays = Math.max(
    0,
    mine?.referralBonusDays && mine.referralBonusDays > 0 ? mine.referralBonusDays : 0,
    totalBonusDaysEarned,
    totalBonusDaysFromReferrals,
  );

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
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-accent/20 via-primary/15 to-accent/10 border border-accent/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tealdeep text-white shadow-sm mt-0.5 sm:mt-0">
                  <CalendarClock className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Upcoming Plan in Queue: {queuedSubs[0].duration}
                    </span>
                    <span className="rounded-full bg-accent/30 text-tealdeep border border-accent/40 px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                      Paid Plan Queued
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
                className="w-full sm:w-auto text-center shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-background px-4 py-2 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-all shadow-xs"
              >
                Manage Plans
              </Link>
            </div>
          ) : null}

          {/* TRIAL BANNER — ONLY SHOWN IF NO PAID PLAN IS IN QUEUE */}
          {sub && isTrial && subActive && subExpiry && queuedSubs.length === 0 ? (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/15 to-primary/10 border border-primary/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm mt-0.5 sm:mt-0">
                  <Sparkles className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">3-Day Free Trial Active</span>
                    <span className="rounded-full bg-accent/20 text-tealdeep border border-accent/30 px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                      {formatTimeRemaining(subExpiry)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
                className="w-full sm:w-auto text-center shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs"
              >
                <IndianRupee className="size-3.5 text-primary" />
                Upgrade Plan
              </Link>
            </div>
          ) : null}

          {sub && !subActive && queuedSubs.length === 0 ? (
            <div className="mb-6 rounded-2xl bg-rose/10 border border-rose/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose text-white shadow-sm mt-0.5 sm:mt-0">
                  <AlertCircle className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-rose">
                    {isTrial ? "3-Day Free Trial Ended" : "Subscription Expired"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isTrial
                      ? "Your free trial has ended. Your profile is safely saved and will not be deleted — activate a paid plan anytime to make it visible again."
                      : "Your subscription has expired. Your profile is safely saved and will not be deleted — renew anytime to restore directory visibility."}
                  </p>
                </div>
              </div>
              <Link
                to="/creator/plans"
                className="w-full sm:w-auto text-center shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose px-4 py-2 text-xs font-semibold text-white hover:bg-rose/90 transition-all shadow-xs"
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
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5">
              <Link
                to="/creators/$creatorId"
                params={{ creatorId: getCreatorProfileSlug(mine) }}
                search={{ preview: true }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-background px-3 py-2.5 text-xs sm:text-sm font-semibold text-foreground ring-1 ring-border/80 hover:bg-secondary hover:ring-border transition-all shadow-xs text-center"
              >
                <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
                <span>View Profile</span>
              </Link>
              <Link
                to="/creator/register"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-3 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs text-center"
              >
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* MAIN PROFILE & SUBSCRIPTION CARDS */}
          <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
            {/* CREATOR PROFILE HERO CARD */}
            <Card className="glass-card md:col-span-2 rounded-2xl sm:rounded-3xl p-4.5 sm:p-7 shadow-xl border border-border/80 flex flex-col justify-between gap-5 sm:gap-6">
              <div className="space-y-5 sm:space-y-6">
                {/* 1. CLEAN IDENTITY HEADER */}
                <div className="flex items-start gap-3.5 sm:gap-5">
                  {/* Avatar */}
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => setShowPhotoModal(true)}
                    title="Click to change or remove photo"
                  >
                    {mine.photo ? (
                      <img
                        src={mine.photo}
                        alt={mine.name}
                        loading="lazy"
                        width={816}
                        height={816}
                        className="size-16 sm:size-20 rounded-2xl object-cover ring-2 ring-primary/20 shadow-md bg-secondary transition-all group-hover:scale-105 group-hover:opacity-90"
                      />
                    ) : (
                      <div className="size-16 sm:size-20 rounded-2xl ring-2 ring-border shadow-md bg-secondary/80 flex items-center justify-center text-muted-foreground/50 transition-all group-hover:bg-secondary group-hover:scale-105">
                        <User className="size-8 sm:size-9" />
                      </div>
                    )}

                    {/* Camera overlay icon */}
                    <span
                      className="absolute -bottom-1 -left-1 size-6 rounded-full bg-background text-foreground ring-1 ring-border shadow-md flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all group-hover:scale-110"
                      title="Manage profile photo"
                    >
                      <Camera className="size-3 text-muted-foreground group-hover:text-white transition-colors" />
                    </span>

                    {/* Status verified indicator */}
                    {mine.status === "Active" && (
                      <span
                        className="absolute -bottom-1 -right-1 size-4 rounded-full bg-tealdeep ring-2 ring-background shadow-xs"
                        title="Verified Active in Directory"
                      />
                    )}
                  </div>

                  {/* Creator Info */}
                  <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
                    {/* Line 1: Name + Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-display font-bold tracking-tight text-foreground truncate max-w-full">
                        {mine.name || mine.displayName}
                      </h2>
                      {mine.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-tealdeep/10 text-tealdeep border border-tealdeep/25 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold shrink-0">
                          <span className="size-1.5 rounded-full bg-tealdeep animate-pulse" />
                          Active Creator
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-secondary text-muted-foreground border border-border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold shrink-0">
                          {mine.status}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Location, Age, Gender */}
                    <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-x-2 gap-y-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-foreground/85 font-medium">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span>{[mine.locality, mine.city, mine.state].filter(Boolean).join(", ") || "Location not set"}</span>
                      </span>
                      {calculateAge(mine.birthDate) !== null && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <span>•</span>
                          <span>{calculateAge(mine.birthDate)} yrs old</span>
                        </span>
                      )}
                      {mine.gender && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <span>•</span>
                          <span>{mine.gender}</span>
                        </span>
                      )}
                    </div>

                    {/* Line 3: Actions & Social Handle */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {mine.instagram && (
                        <a
                          href={getInstagramUrl(mine.instagram)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-xs font-semibold text-foreground/80 hover:text-foreground border border-border/70 transition-all hover:scale-102 shadow-2xs shrink-0"
                          title="Open Instagram profile"
                        >
                          <InstagramIcon className="size-3.5 shrink-0" />
                          <span className="font-mono text-[11px]">{mine.instagram.startsWith("@") ? mine.instagram : `@${mine.instagram}`}</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPhotoModal(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground border border-border/60 transition-all cursor-pointer shadow-2xs shrink-0"
                        title="Change or remove photo"
                      >
                        <Camera className="size-3 text-primary shrink-0" />
                        <span>{mine.photo ? "Edit Photo" : "Add Photo"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. BALANCED METRICS STRIP (4 Columns on Desktop, 2x2 on Mobile) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-3.5 border-t border-border/60">
                  {/* Metric 1: Starting Rate */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-between gap-1 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="size-3 text-saffrondeep shrink-0" />
                      <span>Starting Rate</span>
                    </span>
                    <div className="mt-0.5">
                      <p className="text-base sm:text-xl font-display font-extrabold text-saffrondeep">
                        {formatPrice(mine.startingPrice)}
                      </p>
                      <span className="text-[10px] text-muted-foreground block truncate">per collaboration</span>
                    </div>
                  </div>

                  {/* Metric 2: Audience Size */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-between gap-1 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Users className="size-3 text-primary shrink-0" />
                      <span>Audience</span>
                    </span>
                    <div className="mt-0.5">
                      <p className="text-base sm:text-xl font-display font-extrabold text-foreground">
                        {formatFollowers(mine.followers)}
                      </p>
                      <span className="text-[10px] text-muted-foreground block truncate">followers</span>
                    </div>
                  </div>

                  {/* Metric 3: Categories */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-between gap-1 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Tag className="size-3 text-saffrondeep shrink-0" />
                      <span>Categories</span>
                    </span>
                    <div className="mt-0.5">
                      <div className="flex flex-wrap gap-1">
                        {mine.categories && mine.categories.length > 0 ? (
                          mine.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border/60 truncate max-w-[80px]"
                            >
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground">None</span>
                        )}
                        {mine.categories && mine.categories.length > 2 && (
                          <span className="text-[10px] font-semibold text-muted-foreground self-center">
                            +{mine.categories.length - 2}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">niche focus</span>
                    </div>
                  </div>

                  {/* Metric 4: Directory Listing */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-between gap-1 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Globe className="size-3 text-tealdeep shrink-0" />
                      <span>Directory</span>
                    </span>
                    <div className="mt-0.5">
                      <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 truncate">
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            mine.status === "Active"
                              ? "bg-tealdeep animate-pulse"
                              : mine.status === "Expired"
                                ? "bg-rose"
                                : "bg-muted-foreground"
                          }`}
                        />
                        <span className="truncate">
                          {mine.status === "Active" ? "Public" : mine.status === "Expired" ? "Expired" : "Draft"}
                        </span>
                      </p>
                      <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">
                        {mine.status === "Active" ? "Searchable" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CARD FOOTER ACTION BAR */}
              <div className="pt-3.5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Want to update your collaboration rates, photos, or bio?
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    to="/creator/register"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-semibold text-foreground ring-1 ring-border transition-all shadow-2xs"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    to="/creators/$creatorId"
                    params={{ creatorId: getCreatorProfileSlug(mine) }}
                    search={{ preview: true }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground hover:bg-foreground/90 px-3.5 py-2 text-xs font-semibold text-background transition-all shadow-xs"
                  >
                    <ArrowUpRight className="size-3.5 shrink-0" />
                    <span>Preview</span>
                  </Link>
                </div>
              </div>
            </Card>

            {/* SUBSCRIPTION STATUS CARD */}
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl border border-border/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                    <IndianRupee className="size-4 text-primary shrink-0" />
                    <span>Membership Plan</span>
                  </h2>
                  {subActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-tealdeep shrink-0">
                      <span className="size-1.5 rounded-full bg-tealdeep" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/15 px-2.5 py-0.5 text-[11px] font-bold text-rose shrink-0">
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
                            <Clock className="size-3 text-primary shrink-0" />
                            <span>Time Left</span>
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
                            <CalendarClock className="size-3.5 shrink-0" />
                            <span>Next in Queue</span>
                          </span>
                          <span className="rounded-full bg-accent/20 text-tealdeep px-2 py-0.5 text-[10px] font-bold shrink-0">
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
                  <IndianRupee className="size-3.5 shrink-0" />
                  <span>
                    {queuedSubs.length > 0
                      ? "Manage Subscription"
                      : isTrial && subActive
                        ? "Upgrade to Paid Plan"
                        : subActive
                          ? "Renew / Upgrade Plan"
                          : "Choose a Plan"}
                  </span>
                </Link>
              </div>
            </Card>
          </div>

          {/* ── REFERRAL PROGRAM & REWARDS SECTION ─────────────────────────────────── */}
          <div className="mt-8 sm:mt-10">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-4.5 sm:p-8 shadow-xl border border-border/80 overflow-hidden relative">
              <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-accent/10 blur-3xl" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-border/60">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-tealdeep border border-accent/25 mb-2">
                    <Gift className="size-3.5 text-tealdeep shrink-0" />
                    <span>Referral Program — Earn +7 Days Free</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
                    Invite Creators &amp; Extend Your Subscription
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
                    Share your unique link. When a creator signs up and buys any paid plan, you
                    receive <strong>+7 extra days</strong> added directly to your subscription.
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
              <div className="mt-5 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="rounded-xl sm:rounded-2xl bg-background/60 border border-border/60 p-3 sm:p-4">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="size-3.5 text-primary shrink-0" />
                    <span>Total Invites</span>
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-display font-bold text-foreground">
                    {referredCreators.length}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Creators registered</p>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-background/60 border border-border/60 p-3 sm:p-4">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Zap className="size-3.5 text-primary shrink-0" />
                    <span>Paid Conversions</span>
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-display font-bold text-tealdeep">
                    {paidReferredCount}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">Subscribed creators</p>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-background/60 border border-border/60 p-3 sm:p-4">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Gift className="size-3.5 text-saffrondeep shrink-0" />
                    <span>Bonus Days</span>
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-display font-bold text-saffrondeep">
                    +{netBonusDays} Days
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">+7 days per referral</p>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-background/60 border border-border/60 p-3 sm:p-4 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5 text-primary shrink-0" />
                      <span>Referral Code</span>
                    </span>
                    {/* Hide copy button when locked */}
                    {isReferralUnlocked && (
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        title={copiedCode ? "Copied!" : "Copy referral code"}
                        aria-label="Copy referral code"
                        className="inline-flex size-5 sm:size-6 items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-all cursor-pointer"
                      >
                        {copiedCode ? (
                          <Check className="size-3.5 text-tealdeep stroke-[2.5]" />
                        ) : (
                          <Copy className="size-3.5 text-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-base sm:text-lg font-mono font-bold text-foreground tracking-wider truncate transition-all select-none ${
                      isReferralUnlocked ? "" : "blur-sm opacity-50 pointer-events-none"
                    }`}
                  >
                    {isReferralUnlocked ? referralCode : "DHUNDO-XXXXXX"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                    {isReferralUnlocked ? "Permanent code" : "Unlocks on paid plan"}
                  </p>
                </div>
              </div>

              {/* LINK SHARING BOX */}
              {isReferralUnlocked ? (
                <div className="mt-5 sm:mt-6 rounded-2xl bg-secondary/60 border border-border/80 p-3.5 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                        className="w-full truncate rounded-xl bg-background px-3 py-2.5 text-xs sm:text-sm font-mono text-foreground border border-border focus:outline-none select-all shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full lg:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-foreground px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="size-3.5 sm:size-4 text-tealdeep shrink-0" />
                            <span className="truncate">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 sm:size-4 shrink-0" />
                            <span className="truncate">Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-background px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground ring-1 ring-border hover:bg-secondary transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="size-3.5 sm:size-4 text-tealdeep shrink-0" />
                            <span className="truncate">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 sm:size-4 text-primary shrink-0" />
                            <span className="truncate">Code</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md active:scale-98"
                      >
                        <WhatsAppIcon className="size-3.5 sm:size-4 shrink-0" />
                        <span className="truncate">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* Locked state — trial or expired */
                <div className="mt-5 sm:mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 sm:p-6 text-center">
                  <div className="inline-flex items-center justify-center size-11 rounded-full bg-primary/10 border border-primary/20 mb-2.5">
                    <AlertCircle className="size-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isTrial && subActive
                      ? "Referral Code Locked — Available on Paid Plans"
                      : "Referral Code Inactive — Renew to Reactivate"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {isTrial && subActive
                      ? "Your referral code unlocks once you activate any paid subscription. Trial accounts cannot share referral links."
                      : "Your subscription has expired. Renew any paid plan to reactivate your referral code and start earning bonus days again."}
                  </p>
                  <Link
                    to="/creator/plans"
                    className="inline-flex items-center gap-1.5 mt-3.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <ArrowUpRight className="size-4 shrink-0" />
                    <span>{isTrial && subActive ? "Upgrade to Paid Plan" : "Renew Subscription"}</span>
                  </Link>
                </div>
              )}

              {/* ── UNIFIED REFERRAL ACTIVITY & REWARDS ── */}
              <div className="mt-7 sm:mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-primary shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                      Referral Activity &amp; Bonus Days
                    </h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-mono">
                      {referredCreators.length} invited
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Track creator signups and earned +7 days bonus milestones
                  </span>
                </div>

                {referredCreators.length > 0 || referralEvents.length > 0 ? (
                  <>
                    {/* MOBILE CARD VIEW (block sm:hidden) — Scrollable after 4-5 cards */}
                    <div className="space-y-2.5 block sm:hidden max-h-[340px] overflow-y-auto pr-1">
                      {referredCreators.map((refCreator) => {
                        const refSubs = subscriptions.filter((s) => s.creatorId === refCreator.id);
                        const refEvent = referralEvents.find(
                          (ev) =>
                            ev.referredCreatorId === refCreator.id ||
                            (refCreator.name && ev.note?.toLowerCase().includes(refCreator.name.toLowerCase())) ||
                            ev.note?.toLowerCase().includes(refCreator.id.toLowerCase()),
                        );
                        const hasEarnedReward =
                          Boolean(refEvent && refEvent.daysDelta > 0) ||
                          refSubs.some((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price ?? 0) > 0);
                        const hasFreePass =
                          !hasEarnedReward &&
                          refSubs.some((s) => !s.isTrial && (s.price === 0 || s.price == null));

                        const trialStartMs = refCreator.trialStartedAt
                          ? new Date(refCreator.trialStartedAt).getTime()
                          : refCreator.createdAt
                          ? new Date(refCreator.createdAt).getTime()
                          : 0;
                        const trialExpMs = refCreator.subscriptionExpiresAt
                          ? new Date(refCreator.subscriptionExpiresAt).getTime()
                          : trialStartMs > 0
                          ? trialStartMs + 3 * 24 * 60 * 60 * 1000
                          : 0;
                        const isTrialActive = trialExpMs > Date.now();
                        const isTrialEnded = !isTrialActive;

                        const canNudge = !hasEarnedReward && !hasFreePass && isTrialEnded && isReferralUnlocked;
                        const phoneRaw = refCreator.contact?.whatsapp || refCreator.contact?.phone || "";
                        const phoneClean = phoneRaw.replace(/[^0-9]/g, "");
                        const waPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
                        const firstName = (refCreator.name || refCreator.displayName || "there").split(" ")[0];
                        const nudgeMsg = encodeURIComponent(
                          `Hey ${firstName}! Your free trial on Influencer Dhundo ended. Activate your creator pass so local brands and businesses can start finding and hiring you for collaborations: https://influencerdhundo.com/creator/plans`,
                        );
                        const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${nudgeMsg}` : `https://wa.me/?text=${nudgeMsg}`;
                        const dateStr = refCreator.createdAt || refCreator.trialStartedAt;

                        return (
                          <div
                            key={refCreator.id}
                            className="rounded-xl border border-border/80 bg-background/80 p-3.5 space-y-2.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {refCreator.photo ? (
                                  <img
                                    src={refCreator.photo}
                                    alt={refCreator.name}
                                    className="size-8 rounded-lg object-cover ring-1 ring-border shrink-0"
                                  />
                                ) : (
                                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {(refCreator.name || refCreator.displayName || "C").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground text-xs truncate">
                                    {refCreator.name || refCreator.displayName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {[refCreator.locality, refCreator.city].filter(Boolean).join(", ") || "Active Creator"}
                                  </p>
                                </div>
                              </div>

                              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                {dateStr
                                  ? new Date(dateStr).toLocaleDateString("en-IN", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Recently"}
                              </span>
                            </div>

                            <div className="flex items-center justify-end pt-2 border-t border-border/60">
                              {hasEarnedReward ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 font-bold text-tealdeep border border-accent/40 text-[10px]">
                                  <Check className="size-2.5 text-tealdeep stroke-[2.5]" />
                                  <span>+7 Days Earned</span>
                                </span>
                              ) : hasFreePass ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-medium text-muted-foreground border border-border text-[10px]">
                                  <span>No Reward (Free Pass)</span>
                                </span>
                              ) : isTrialActive ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/25 text-[10px]">
                                  <Clock className="size-2.5" />
                                  <span>Active Trial</span>
                                </span>
                              ) : canNudge ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-medium text-muted-foreground border border-border text-[10px]">
                                    Trial Ended
                                  </span>
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    <WhatsAppIcon className="size-2.5 fill-current" />
                                    <span>Nudge (+7 Days)</span>
                                  </a>
                                </div>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 font-medium text-muted-foreground border border-border text-[10px]">
                                  Trial Ended
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Bonus events on mobile */}
                      {referralEvents
                        .filter((ev) => !referredCreators.some((rc) => ev.note?.includes(rc.name || rc.id)))
                        .map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded-xl border border-border/80 bg-secondary/15 p-3 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Gift className="size-3.5 text-saffrondeep shrink-0" />
                              <span className="font-semibold text-xs text-foreground truncate">
                                {ev.note || "Bonus Reward"}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 font-bold text-saffrondeep text-xs shrink-0">
                              +{ev.daysDelta} Days
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* DESKTOP TABLE VIEW (hidden sm:block) — Scrollable after 4-5 rows with sticky header */}
                    <div className="hidden sm:block overflow-x-auto max-h-[300px] overflow-y-auto rounded-2xl border border-border/80 bg-background/60">
                      <table className="w-full text-left text-xs table-fixed min-w-[560px]">
                        <thead className="sticky top-0 z-10 border-b border-border bg-secondary/95 backdrop-blur-sm font-semibold text-muted-foreground uppercase tracking-wider shadow-2xs">
                          <tr>
                            <th className="w-60 px-4 py-3">Creator Invited</th>
                            <th className="w-32 px-4 py-3">Joined Date</th>
                            <th className="w-56 px-4 py-3 text-right">Referral Reward</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {referredCreators.map((refCreator) => {
                            const refSubs = subscriptions.filter((s) => s.creatorId === refCreator.id);
                            const refEvent = referralEvents.find(
                              (ev) =>
                                ev.referredCreatorId === refCreator.id ||
                                (refCreator.name && ev.note?.toLowerCase().includes(refCreator.name.toLowerCase())) ||
                                ev.note?.toLowerCase().includes(refCreator.id.toLowerCase()),
                            );
                            const hasEarnedReward =
                              Boolean(refEvent && refEvent.daysDelta > 0) ||
                              refSubs.some((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price ?? 0) > 0);
                            const hasFreePass =
                              !hasEarnedReward &&
                              refSubs.some((s) => !s.isTrial && (s.price === 0 || s.price == null));

                            const trialStartMs = refCreator.trialStartedAt
                              ? new Date(refCreator.trialStartedAt).getTime()
                              : refCreator.createdAt
                              ? new Date(refCreator.createdAt).getTime()
                              : 0;
                            const trialExpMs = refCreator.subscriptionExpiresAt
                              ? new Date(refCreator.subscriptionExpiresAt).getTime()
                              : trialStartMs > 0
                              ? trialStartMs + 3 * 24 * 60 * 60 * 1000
                              : 0;
                            const isTrialActive = trialExpMs > Date.now();
                            const isTrialEnded = !isTrialActive;

                            const canNudge = !hasEarnedReward && !hasFreePass && isTrialEnded && isReferralUnlocked;
                            const phoneRaw = refCreator.contact?.whatsapp || refCreator.contact?.phone || "";
                            const phoneClean = phoneRaw.replace(/[^0-9]/g, "");
                            const waPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
                            const firstName = (refCreator.name || refCreator.displayName || "there").split(" ")[0];
                            const nudgeMsg = encodeURIComponent(
                              `Hey ${firstName}! Your free trial on Influencer Dhundo ended. Activate your creator pass so local brands and businesses can start finding and hiring you for collaborations: https://influencerdhundo.com/creator/plans`,
                            );
                            const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${nudgeMsg}` : `https://wa.me/?text=${nudgeMsg}`;
                            const dateStr = refCreator.createdAt || refCreator.trialStartedAt;

                            return (
                              <tr key={refCreator.id} className="hover:bg-secondary/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {refCreator.photo ? (
                                      <img
                                        src={refCreator.photo}
                                        alt={refCreator.name}
                                        className="size-8 rounded-lg object-cover ring-1 ring-border shrink-0"
                                      />
                                    ) : (
                                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                        {(refCreator.name || refCreator.displayName || "C").slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="min-w-0 truncate">
                                      <p className="font-bold text-foreground truncate">
                                        {refCreator.name || refCreator.displayName}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground truncate">
                                        {[refCreator.locality, refCreator.city].filter(Boolean).join(", ") || "Active Creator"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {dateStr
                                    ? new Date(dateStr).toLocaleDateString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "Recently"}
                                </td>

                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  {hasEarnedReward ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 font-bold text-tealdeep border border-accent/40 text-[11px] shadow-2xs">
                                      <Check className="size-3 text-tealdeep stroke-[2.5]" />
                                      +7 Days Earned
                                    </span>
                                  ) : hasFreePass ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium text-muted-foreground border border-border text-[11px]">
                                      No Reward (Free Pass)
                                    </span>
                                  ) : isTrialActive ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-1 font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/25 text-[11px]">
                                      <Clock className="size-3" />
                                      Active Trial
                                    </span>
                                  ) : canNudge ? (
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-medium text-muted-foreground border border-border text-[11px]">
                                        Trial Ended
                                      </span>
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                                        title="Nudge on WhatsApp to upgrade and earn +7 days"
                                      >
                                        <WhatsAppIcon className="size-3 fill-current" />
                                        <span>Nudge on WhatsApp</span>
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 font-medium text-muted-foreground border border-border text-[11px]">
                                      Trial Ended
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* ADDITIONAL SYSTEM / BONUS REWARD EVENTS */}
                          {referralEvents
                            .filter((ev) => !referredCreators.some((rc) => ev.note?.includes(rc.name || rc.id)))
                            .map((ev) => (
                              <tr key={ev.id} className="hover:bg-secondary/30 transition-colors bg-secondary/10">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Gift className="size-4 text-saffrondeep shrink-0" />
                                    <span className="font-semibold text-foreground">
                                      {ev.note || "Bonus Reward Event"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {new Date(ev.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 font-bold text-saffrondeep">
                                    +{ev.daysDelta} Days
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/80 p-5 sm:p-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No referral activity yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share your personal invite link above. When creators sign up and activate passes, they will appear here with +7 day rewards!
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── BILLING & PAYMENT RECEIPTS HISTORY ─────────────────────────────────── */}
          <div className="mt-8 sm:mt-10">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-4.5 sm:p-8 shadow-xl border border-border/80 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-border/60">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-saffrondeep border border-primary/25 mb-2">
                    <ReceiptText className="size-3.5 text-primary shrink-0" />
                    <span>Billing &amp; Payment Receipts</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
                    Payment History &amp; Receipts
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    All your one-time subscription pass payments processed securely via Razorpay.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">
                    <ShieldCheck className="size-3.5 text-tealdeep shrink-0" />
                    <span>100% Secure via Razorpay</span>
                  </span>
                </div>
              </div>

              {loadingPayments ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                  <span>Loading payment history...</span>
                </div>
              ) : payments.length > 0 ? (
                <>
                  {/* MOBILE VIEW FOR PAYMENTS (block sm:hidden) — Scrollable after 4-5 cards */}
                  <div className="mt-5 space-y-3 block sm:hidden max-h-[340px] overflow-y-auto pr-1">
                    {payments.map((p) => {
                      const planLabel =
                        p.planId === "1m"
                          ? "1 Month Pass"
                          : p.planId === "3m"
                            ? "3 Months Pass"
                            : p.planId === "6m"
                              ? "6 Months Pass"
                              : p.planId === "1y"
                                ? "1 Year Pass"
                                : p.planId;

                      const promoCode =
                        p.promoCodeUsed ||
                        p.referralCodeUsed ||
                        userSubs.find(
                          (s) =>
                            s.planId === p.planId &&
                            (s.referralCodeUsed || (s.razorpayPaymentId && s.razorpayPaymentId === p.razorpayPaymentId)),
                        )?.referralCodeUsed;

                      const displayRef = p.razorpayPaymentId || p.razorpayOrderId;
                      const isCopied = copiedPaymentId === displayRef;

                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-border/80 bg-background/80 p-3.5 space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-foreground text-sm">{planLabel}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                {promoCode ? (
                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                                    <Tag className="size-2.5 text-emerald-600 shrink-0" />
                                    <span>{promoCode}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">• Standard</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-saffrondeep">{formatPrice(p.amount)}</p>
                              <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-tealdeep">
                                <Check className="size-2.5" />
                                Paid
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
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
                                  className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                                >
                                  {isCopied ? (
                                    <CheckCheck className="size-3 text-tealdeep" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-foreground/90 transition-all cursor-pointer active:scale-95 shrink-0"
                            >
                              <Eye className="size-3.5 shrink-0" />
                              <span>Receipt</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP VIEW FOR PAYMENTS (hidden sm:block) — Scrollable after 4-5 rows with sticky header */}
                  <div className="hidden sm:block mt-6 overflow-x-auto max-h-[300px] overflow-y-auto rounded-2xl border border-border/80 bg-background/60">
                    <table className="w-full text-left text-xs table-fixed min-w-[760px]">
                      <thead className="sticky top-0 z-10 border-b border-border bg-secondary/95 backdrop-blur-sm font-semibold text-muted-foreground uppercase tracking-wider shadow-2xs">
                        <tr>
                          <th className="w-28 px-4 py-3">Date</th>
                          <th className="w-36 px-4 py-3">Plan</th>
                          <th className="w-36 px-4 py-3">Promo Applied</th>
                          <th className="w-24 px-4 py-3">Amount</th>
                          <th className="w-44 px-4 py-3">Payment Ref ID</th>
                          <th className="w-20 px-4 py-3">Status</th>
                          <th className="w-24 px-4 py-3 text-right">Invoice</th>
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

                          const promoCode =
                            p.promoCodeUsed ||
                            p.referralCodeUsed ||
                            userSubs.find(
                              (s) =>
                                s.planId === p.planId &&
                                (s.referralCodeUsed || (s.razorpayPaymentId && s.razorpayPaymentId === p.razorpayPaymentId)),
                            )?.referralCodeUsed;

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
                              <td className="px-4 py-3.5">
                                {promoCode ? (
                                  <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                                    <Tag className="size-3 text-emerald-600 shrink-0" />
                                    <span>{promoCode}</span>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">Standard</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-saffrondeep whitespace-nowrap">
                                {formatPrice(p.amount)}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[130px]">
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
                </>
              ) : (
                <div className="mt-5 sm:mt-6 rounded-2xl border border-dashed border-border/80 p-6 sm:p-8 text-center bg-background/40">
                  <div className="inline-flex items-center justify-center size-10 rounded-full bg-secondary text-muted-foreground mb-2">
                    <ReceiptText className="size-5" />
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

      {/* ── MANAGE PROFILE PHOTO MODAL ── */}
      {showPhotoModal && mine && (
        <ManagePhotoModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          currentPhoto={mine.photo || ""}
          creatorName={mine.name || mine.displayName || "Creator"}
          onUpdatePhoto={async (newPhotoUrl) => {
            return await updateCreatorPhoto(mine.id, newPhotoUrl);
          }}
          onDeletePhoto={async () => {
            return await updateCreatorPhoto(mine.id, "");
          }}
        />
      )}
    </div>
  );
}

/**
 * Manage Profile Photo Modal (Change or Delete Photo)
 */
function ManagePhotoModal({
  isOpen,
  onClose,
  currentPhoto,
  creatorName,
  onUpdatePhoto,
  onDeletePhoto,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto: string;
  creatorName: string;
  onUpdatePhoto: (newPhotoUrl: string) => Promise<boolean>;
  onDeletePhoto: () => Promise<boolean>;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size must be under 5MB");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const publicUrl = await supabaseDb.uploadCreatorPhoto(selectedFile, creatorName || "creator");
      if (!publicUrl) {
        setErrorMsg("Failed to upload photo to storage. Please try again.");
        return;
      }
      const ok = await onUpdatePhoto(publicUrl);
      if (ok) {
        setSuccessMsg("Profile photo updated successfully!");
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg("Failed to update profile photo.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const ok = await onDeletePhoto();
      if (ok) {
        setSuccessMsg("Profile photo removed.");
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg("Failed to remove photo.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error removing photo");
    } finally {
      setDeleting(false);
    }
  };

  const displayPhoto = previewUrl || currentPhoto;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">
              Manage Profile Photo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative size-28 sm:size-32 rounded-3xl overflow-hidden ring-4 ring-border shadow-lg bg-secondary flex items-center justify-center">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={creatorName}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-14 text-muted-foreground/40" />
              )}
            </div>
            {previewUrl && (
              <span className="mt-2 text-[11px] font-semibold text-saffrondeep">
                New photo selected (Click &quot;Save Photo&quot; to apply)
              </span>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-tealdeep/10 border border-tealdeep/30 text-tealdeep text-xs flex items-center gap-2">
              <Check className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Area */}
          <div className="space-y-3">
            {selectedFile ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleUpload}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving Photo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="rounded-xl bg-secondary px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <label className="group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer text-center">
                <div className="size-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-105 transition-all">
                  <Upload className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {currentPhoto ? "Upload New Photo" : "Upload Photo"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    JPG, PNG or WebP up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

            {currentPhoto && !selectedFile && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2.5 text-xs font-semibold ring-1 ring-destructive/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Removing Photo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Remove Profile Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-secondary/30 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 ring-1 ring-border transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
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
  const promoCode = receipt.promoCodeUsed || receipt.referralCodeUsed;

  const planName =
    receipt.planId === "1m"
      ? "1 Month Creator Pass (Launch Offer)"
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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

    const creatorName = creator?.name || creator?.displayName || "Creator";
    const creatorEmail = creator?.contact?.email || creator?.email || "";
    const creatorPhone = creator?.contact?.phone || creator?.phone || "";
    const creatorLoc = [creator?.locality, creator?.city, creator?.state].filter(Boolean).join(", ") || "India";
    const creatorId = creator?.id || "";

    const discountRow =
      discountAmount > 0
        ? `
        <tr style="background: #f0fdf4;">
          <td style="padding: 10px 14px; font-weight: 600; color: #166534; border-bottom: 1px solid #e2e8f0;">
            Discount / Promotional Savings ${promoCode ? `(Code: ${promoCode})` : ""}
          </td>
          <td style="padding: 10px 14px; text-align: center; color: #166534; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
            ${promoCode ? `Promo (${promoCode})` : "Promo Applied"}
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

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          id="payment-receipt-print-wrapper"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden my-auto"
        >
          {/* MODAL ACTION BAR (Hidden in print) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/80 bg-secondary/40 print-hidden">
            <div className="flex items-center gap-2">
              <ReceiptText className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Official Payment Receipt
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
              title="Close"
            >
              <X className="size-4" />
            </button>
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
                  {creator?.name || creator?.displayName || "Creator"}
                </p>
                {(creator?.contact?.email || creator?.email) && (
                  <p className="text-muted-foreground">Email: {creator?.contact?.email || creator?.email}</p>
                )}
                {(creator?.contact?.phone || creator?.phone) && (
                  <p className="text-muted-foreground">Phone: {creator?.contact?.phone || creator?.phone}</p>
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

              {promoCode && (
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-accent/20">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Tag className="size-3 text-emerald-600" />
                    Promo Code Applied:
                  </span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-xs">
                    {promoCode}
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
                            Discount / Promotional Savings {promoCode ? `(${promoCode})` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-tealdeep font-medium">
                          {promoCode ? `Code: ${promoCode}` : "Promo Applied"}
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


