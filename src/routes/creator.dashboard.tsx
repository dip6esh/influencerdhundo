import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Button, Card, SectionEyebrow, StatusPill } from "@/components/ui-kit";
import { InstagramIcon, WhatsAppIcon, FacebookIcon, YouTubeIcon } from "@/components/icons";
import { useAppState } from "@/lib/app-state";
import {
  PLANS,
  calculateAge,
  calculateReferralCashCommission,
  formatFollowers,
  formatPrice,
  formatTimeRemaining,
  generateReferralCode,
  getActiveSubscription,
  getCreatorDisplayName,
  getInstagramUrl,
  getCreatorProfileSlug,
  getQueuedSubscriptions,
  getSubscriptionExpiry,
  isSubscriptionActive,
  isSubscriptionQueued,
  type PayoutDetails,
  type ReferralWithdrawalRequest,
} from "@/lib/directory-data";
import { supabaseDb, type PaymentRecord } from "@/lib/supabase";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Copy,
  CreditCard,
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
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  Wallet,
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

function getCachedPayments(creatorId?: string | null): PaymentRecord[] {
  if (!creatorId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`influencer-dhundo-payments-${creatorId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

function setCachedPayments(creatorId: string, records: PaymentRecord[]) {
  if (!creatorId || typeof window === "undefined") return;
  try {
    localStorage.setItem(`influencer-dhundo-payments-${creatorId}`, JSON.stringify(records));
  } catch {}
}

function Dashboard() {
  const {
    creators,
    myCreatorId,
    subscriptions,
    referralEvents,
    withdrawalRequests,
    fetchReferralEvents,
    applySpecialReferralProgram,
    submitWithdrawalRequest,
    upsertCreator,
    updateCreator,
    updateCreatorPhoto,
    setCreatorStatus,
  } = useAppState();
  const navigate = useNavigate();
  const mine = creators.find((c) => c.id === myCreatorId);
  const [loading, setLoading] = useState(!mine);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    return getCachedPayments(myCreatorId);
  });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [referralFeedback, setReferralFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Special Referral Program states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyUpiId, setApplyUpiId] = useState("");
  const [applyAccountHolder, setApplyAccountHolder] = useState("");
  const [applyAccountNumber, setApplyAccountNumber] = useState("");
  const [applyBankName, setApplyBankName] = useState("");
  const [applyIfsc, setApplyIfsc] = useState("");
  const [applyingSpecial, setApplyingSpecial] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Withdrawal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(200);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // If mine is found in state or hydrated from storage, dismiss loading spinner immediately
  useEffect(() => {
    if (mine) {
      setLoading(false);
    }
  }, [mine]);

  // If not logged in and done loading, redirect to creator login
  useEffect(() => {
    if (!loading && !myCreatorId) {
      navigate({ to: "/creator/login" });
    }
  }, [loading, myCreatorId, navigate]);

  // Subscriptions & Queued plans calculation (memoized to prevent render loops)
  const userSubs = useMemo(
    () => subscriptions.filter((s) => s.creatorId === myCreatorId),
    [subscriptions, myCreatorId],
  );
  const activeSub = useMemo(
    () => (myCreatorId ? getActiveSubscription(subscriptions, myCreatorId) : undefined),
    [subscriptions, myCreatorId],
  );
  const queuedSubs = useMemo(
    () => (myCreatorId ? getQueuedSubscriptions(subscriptions, myCreatorId) : []),
    [subscriptions, myCreatorId],
  );
  const latestSub = userSubs[0];

  // Auto-fetch profile from Supabase & sync latest data in background on mount
  useEffect(() => {
    let mounted = true;
    async function initDashboard() {
      try {
        const uid = await supabaseDb.getCreatorSession();
        if (uid && mounted) {
          const profile = await supabaseDb.getCreatorProfileForAuthUser(uid);
          if (profile && mounted) {
            upsertCreator(profile, true);
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

  // Fetch payments records for this creator with Instant Stale-While-Revalidate caching
  useEffect(() => {
    let isMounted = true;
    if (!mine?.id) return;

    // Immediately load from localStorage cache if state is empty for instant 0ms display
    const cached = getCachedPayments(mine.id);
    if (cached.length > 0) {
      setPayments((prev) => (prev.length === 0 ? cached : prev));
      setLoadingPayments(false);
    } else {
      // Only show spinner if there is no cached data to display
      setPayments((prev) => (prev.length === 0 ? [] : prev));
      setLoadingPayments(true);
    }

    async function loadPayments() {
      try {
        const records = await supabaseDb.fetchPaymentsForCreator(mine!.id);

        // Also synthesize any 100% promo activations from subscriptions so historical free passes have receipts
        const promoSubs = subscriptions.filter(
          (s) => s.creatorId === mine!.id && !s.isTrial && s.planId !== "trial-3d" && (s.price === 0 || s.price == null),
        );
        const mergedRecords: PaymentRecord[] = [...records];
        for (const sub of promoSubs) {
          const alreadyRecorded = records.some(
            (r) =>
              (r.planId === sub.planId && r.amount === 0) ||
              (sub.referralCodeUsed && r.promoCodeUsed === sub.referralCodeUsed),
          );
          if (!alreadyRecorded) {
            const codeUpper = (sub.referralCodeUsed || "PROMO").toUpperCase();
            const cleanId = (sub.id || "PASS").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
            mergedRecords.push({
              id: `promo-${sub.id || sub.planId}`,
              creatorId: mine!.id,
              razorpayOrderId: `PROMO-${codeUpper}-${cleanId}`,
              razorpayPaymentId: `PASS-${codeUpper}-${cleanId}`,
              razorpaySignature: "PROMO_DISCOUNT_100_VERIFIED",
              amount: 0,
              currency: "INR",
              planId: sub.planId,
              status: "captured",
              createdAt: sub.startedAt || new Date().toISOString(),
              promoCodeUsed: sub.referralCodeUsed || undefined,
              referralCodeUsed: sub.referralCodeUsed || undefined,
            });
          }
        }
        mergedRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (isMounted) {
          setPayments(mergedRecords);
          setCachedPayments(mine!.id, mergedRecords);
        }
      } finally {
        if (isMounted) setLoadingPayments(false);
      }
    }
    loadPayments();
    return () => {
      isMounted = false;
    };
  }, [mine?.id, subscriptions.length]);

  // Fetch referral events when creator ID is ready
  useEffect(() => {
    if (mine?.id) {
      fetchReferralEvents(mine.id);
    }
  }, [mine?.id]);

  // Only generate/save referral code for paid subscribers (not trial-only users)
  useEffect(() => {
    if (!mine?.id) return;
    const hasPaidPlan = userSubs.some(
      (s) => s.planId !== "trial-3d" && !s.duration?.toLowerCase().includes("3 day"),
    );
    if (!mine.referralCode && hasPaidPlan) {
      const code = generateReferralCode(getCreatorDisplayName(mine));
      supabaseDb.setReferralCode(mine.id, code);
      upsertCreator({ ...mine, referralCode: code });
    }
  }, [mine?.id, mine?.referralCode, userSubs, upsertCreator]);

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
  const isDraft = Boolean(mine && (mine.status === "Draft" || !mine.instagram));
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
      c.id !== mine?.id &&
      (c.referredBy === mine?.id ||
        (mine?.referralCode && c.referredBy?.trim().toUpperCase() === mine.referralCode.trim().toUpperCase())),
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

  const isSpecialActiveCreator = mine?.specialReferralProgram?.status === "active";
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

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mine?.id || !inputReferralCode.trim()) return;
    const clean = inputReferralCode.trim().toUpperCase();
    setApplyingReferral(true);
    setReferralFeedback(null);
    try {
      const local = creators.find(
        (c) => c.referralCode && c.referralCode.toUpperCase() === clean,
      );
      const remote = local
        ? { id: local.id, name: local.name || local.displayName }
        : await supabaseDb.lookupReferralCode(clean);

      if (!remote) {
        setReferralFeedback({
          type: "error",
          message: "Referral code not found. Please verify the code and try again.",
        });
        return;
      }

      if (remote.id === mine.id) {
        setReferralFeedback({
          type: "error",
          message: "You cannot use your own referral code.",
        });
        return;
      }

      const updated = { ...mine, referredBy: remote.id };
      await updateCreator(updated);
      setReferralFeedback({
        type: "success",
        message: `✓ Connected with ${remote.name || "inviting creator"}! When you subscribe to a paid plan, they'll receive +7 bonus days.`,
      });
      setInputReferralCode("");
    } catch {
      setReferralFeedback({
        type: "error",
        message: "Failed to apply referral code. Please try again.",
      });
    } finally {
      setApplyingReferral(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hey! Join Influencer Dhundo using my invite link to get a 3-day free trial and connect with local businesses looking for creators:\n${referralLink}`,
  );

  const specialProg = mine?.specialReferralProgram;
  const isSpecialActive = specialProg?.status === "active";
  const isSpecialPending = specialProg?.status === "pending";
  const isSpecialRejected = specialProg?.status === "rejected";
  const isSpecialClosed = specialProg?.status === "closed";
  const walletBalance = specialProg?.walletBalance || 0;
  const totalEarned = specialProg?.totalEarned || 0;
  const totalWithdrawn = specialProg?.totalWithdrawn || 0;

  const myWithdrawals = useMemo(() => {
    return withdrawalRequests.filter((r) => r.creatorId === mine?.id);
  }, [withdrawalRequests, mine?.id]);

  const hasPendingWithdrawal = myWithdrawals.some((r) => r.status === "pending");

  const monthlyWithdrawalCount = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    return myWithdrawals.filter((r) => {
      if (r.status === "rejected") return false;
      const d = new Date(r.requestedAt);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).length;
  }, [myWithdrawals]);

  const handleOpenApplyModal = () => {
    const p = mine?.specialReferralProgram?.payoutDetails;
    setApplyUpiId(p?.upiId || "");
    setApplyAccountHolder(p?.accountHolderName || mine?.name || mine?.displayName || "");
    setApplyAccountNumber(p?.accountNumber || "");
    setApplyBankName(p?.bankName || "");
    setApplyIfsc(p?.ifscCode || "");
    setApplyError(null);
    setShowApplyModal(true);
  };

  const handleApplySpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    if (!mine) return;
    if (!applyUpiId.trim()) {
      setApplyError("Please enter your UPI ID.");
      return;
    }
    if (
      !applyAccountHolder.trim() ||
      !applyAccountNumber.trim() ||
      !applyBankName.trim() ||
      !applyIfsc.trim()
    ) {
      setApplyError("Please fill in all bank account details.");
      return;
    }

    setApplyingSpecial(true);
    const res = await applySpecialReferralProgram(mine.id, {
      upiId: applyUpiId.trim(),
      accountHolderName: applyAccountHolder.trim(),
      accountNumber: applyAccountNumber.trim(),
      bankName: applyBankName.trim(),
      ifscCode: applyIfsc.trim().toUpperCase(),
    });
    setApplyingSpecial(false);
    if (res.success) {
      setShowApplyModal(false);
    } else {
      setApplyError(res.error || "Failed to submit application");
    }
  };

  const handleOpenWithdrawModal = () => {
    setWithdrawAmount(Math.min(walletBalance, Math.max(200, walletBalance)));
    setWithdrawError(null);
    setWithdrawSuccess(null);
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);
    if (!mine || !mine.specialReferralProgram) return;

    if (withdrawAmount < 200) {
      setWithdrawError("Minimum withdrawal amount is ₹200.");
      return;
    }
    if (withdrawAmount > walletBalance) {
      setWithdrawError(
        `Requested amount ₹${withdrawAmount} exceeds your wallet balance of ₹${walletBalance}.`,
      );
      return;
    }
    if (hasPendingWithdrawal) {
      setWithdrawError(
        "You already have a pending withdrawal request in review. Please wait until it is processed.",
      );
      return;
    }
    if (monthlyWithdrawalCount >= 2) {
      setWithdrawError(
        "You have reached your limit of 2 withdrawal requests for this calendar month.",
      );
      return;
    }

    setSubmittingWithdrawal(true);
    const res = await submitWithdrawalRequest({
      creatorId: mine.id,
      creatorName: mine.name || mine.displayName,
      creatorHandle: mine.instagram,
      amount: withdrawAmount,
      payoutDetails: mine.specialReferralProgram.payoutDetails,
    });
    setSubmittingWithdrawal(false);
    if (res.success) {
      setWithdrawSuccess(
        "Withdrawal request submitted successfully! Funds will be deposited within 7–10 working days.",
      );
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(null);
      }, 2500);
    } else {
      setWithdrawError(res.error || "Failed to submit withdrawal request");
    }
  };

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
              <div className="mt-1 flex flex-wrap items-center gap-3 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground md:text-4xl truncate max-w-full">
                  {getCreatorDisplayName(mine)}
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

          {/* INCOMPLETE PROFILE / DRAFT RESUME BANNER */}
          {mine.status === "Draft" || !mine.instagram ? (
            <div className="mt-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/10 border border-amber-500/30 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Clock className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Complete your profile
                  </h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                    Fill in the remaining details to make your profile live and start getting brand deals.
                  </p>
                </div>
              </div>
              <Link
                to="/creator/register"
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                Complete Profile →
              </Link>
            </div>
          ) : null}

          {/* MAIN PROFILE & SUBSCRIPTION CARDS */}
          <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
            {/* CREATOR PROFILE HERO CARD */}
            <Card className="glass-card md:col-span-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-xl border border-border/80 flex flex-col justify-between gap-5 sm:gap-6">
              <div className="space-y-4 sm:space-y-6">
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

                    {/* Status active indicator */}
                    {mine.status === "Active" && (
                      <span
                        className="absolute -bottom-1 -right-1 size-4 rounded-full bg-tealdeep ring-2 ring-background shadow-xs"
                        title="Active in Directory"
                      />
                    )}
                  </div>

                  {/* Creator Info */}
                  <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
                    {/* Line 1: Name + Status */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h2 className="text-lg sm:text-2xl font-display font-bold tracking-tight text-foreground truncate max-w-full">
                        {getCreatorDisplayName(mine)}
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

                    {/* Line 2: Location, Pincode, Age, Gender */}
                    <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-x-2 gap-y-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-foreground/85 font-medium">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span>
                          {[mine.locality, mine.city, mine.state].filter(Boolean).length > 0
                            ? `${[mine.locality, mine.city, mine.state].filter(Boolean).join(", ")}${mine.pincode ? ` - ${mine.pincode}` : ""}`
                            : (mine.pincode ? `PIN: ${mine.pincode}` : "Location not set")}
                        </span>
                      </span>
                      {calculateAge(mine.birthDate) !== null && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                          <span>•</span>
                          <span>{calculateAge(mine.birthDate)} yrs old</span>
                        </span>
                      )}
                      {mine.gender && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                          <span>•</span>
                          <span>{mine.gender}</span>
                        </span>
                      )}
                    </div>

                    {/* Line 3: Social Icons & Actions */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {mine.instagram && (
                        <a
                          href={getInstagramUrl(mine.instagram)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center size-8 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/70 transition-all hover:scale-105 shadow-2xs shrink-0"
                          title={`Instagram: ${mine.instagram}`}
                          aria-label="Open Instagram profile"
                        >
                          <InstagramIcon className="size-4 shrink-0" />
                        </a>
                      )}
                      {mine.otherSocials?.map((s) => {
                        if (!s.handle || !s.handle.trim()) return null;
                        const platformLower = (s.platform || "").toLowerCase();
                        const cleanHandle = s.handle.trim();
                        const href =
                          platformLower === "facebook" || platformLower === "fb"
                            ? (cleanHandle.startsWith("http")
                                ? cleanHandle
                                : `https://www.facebook.com/${cleanHandle.replace(/^@/, "")}`)
                            : platformLower === "youtube" || platformLower === "yt"
                              ? (cleanHandle.startsWith("http")
                                  ? cleanHandle
                                  : `https://www.youtube.com/${cleanHandle.startsWith("@") ? cleanHandle : `@${cleanHandle}`}`)
                              : null;
                        if (!href) return null;
                        const Icon =
                          platformLower === "facebook" || platformLower === "fb"
                            ? FacebookIcon
                            : YouTubeIcon;
                        return (
                          <a
                            key={s.platform}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center size-8 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/70 transition-all hover:scale-105 shadow-2xs shrink-0"
                            title={`${s.platform}: ${cleanHandle}`}
                            aria-label={`Open ${s.platform} profile`}
                          >
                            <Icon className="size-4 shrink-0" />
                          </a>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowPhotoModal(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground border border-border/60 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
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
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-center gap-0.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="size-3 text-saffrondeep shrink-0" />
                      <span>Starting Rate</span>
                    </span>
                    <p className="text-base sm:text-xl font-display font-extrabold text-saffrondeep leading-tight mt-0.5">
                      {formatPrice(mine.startingPrice)}
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">per collaboration</span>
                  </div>

                  {/* Metric 2: Audience Size */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-center gap-0.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Users className="size-3 text-primary shrink-0" />
                      <span>Audience</span>
                    </span>
                    <p className="text-base sm:text-xl font-display font-extrabold text-foreground leading-tight mt-0.5">
                      {formatFollowers(mine.followers)}
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">followers</span>
                  </div>

                  {/* Metric 3: Categories */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-center gap-0.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Tag className="size-3 text-saffrondeep shrink-0" />
                      <span>Categories</span>
                    </span>
                    <div className="flex items-center gap-1 my-0.5 min-h-[22px]">
                      {mine.categories && mine.categories.length > 0 ? (
                        <>
                          <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border/60 truncate max-w-[90px]">
                            {mine.categories[0]}
                          </span>
                          {mine.categories.length > 1 && (
                            <span className="inline-flex items-center rounded-md bg-secondary/80 px-1 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/50 shrink-0">
                              +{mine.categories.length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">None</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">niche focus</span>
                  </div>

                  {/* Metric 4: Directory Listing */}
                  <div className="rounded-xl sm:rounded-2xl bg-secondary/30 border border-border/70 p-2.5 sm:p-3.5 flex flex-col justify-center gap-0.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Globe className="size-3 text-tealdeep shrink-0" />
                      <span>Directory</span>
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 truncate my-0.5 min-h-[22px]">
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
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {mine.status === "Active" ? "Searchable" : "Hidden"}
                    </span>
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
                      {mine?.status === "Draft"
                        ? "Your profile setup is in progress. Complete your profile to launch your 3-day free trial."
                        : "No active subscription. Activate a plan to list your profile in the directory."}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-border/60">
                {mine?.status === "Draft" ? (
                  <Link
                    to="/creator/register"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <span>Complete Profile to Start Trial →</span>
                  </Link>
                ) : (
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
                )}
              </div>
            </Card>
          </div>

          {/* ── REFERRAL PROGRAM & REWARDS SECTION ─────────────────────────────────── */}
          <div className="mt-8 sm:mt-10">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-4.5 sm:p-8 shadow-xl border border-border/80 overflow-hidden relative">
              <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-accent/10 blur-3xl" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-border/60">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {isSpecialActive ? (
                      <>
                        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                          <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Special Referral Active — Cash Rewards 💸</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border bg-accent/15 text-tealdeep border-accent/25">
                          <Gift className="size-3.5 text-tealdeep shrink-0" />
                          <span>Earn Extra Days &amp; Cash</span>
                        </div>
                      </>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border bg-accent/15 text-tealdeep border-accent/25">
                        <Gift className="size-3.5 text-tealdeep shrink-0" />
                        <span>Referral Program — Earn +7 Days Free</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
                    {isSpecialActive ? "Invite Creators, Earn Cash & Extra Days! 💰⚡" : "Never Let Your Plan Expire! ⚡"}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
                    {isSpecialActive
                      ? "Share your link or referral code with creator friends. When they subscribe, you earn real cash commission (up to ₹100 each) directly into your wallet, while also accumulating bonus days to extend your membership plan!"
                      : "Share your link or referral code with creator friends. Every time someone joins, you get +7 extra days added directly to your active plan — the more you invite, the longer your membership plan stays active!"}
                  </p>
                </div>

                {/* Referral Link Active Status Badge */}
                <div className="shrink-0 flex items-center gap-2">
                  {isSpecialActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Special Referral Active (Cash Mode)
                    </span>
                  ) : isReferralUnlocked ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-tealdeep border border-accent/30">
                      <span className="size-2 rounded-full bg-tealdeep animate-pulse" />
                      Referral Code Active
                    </span>
                  ) : isDraft ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Locked — Complete Profile
                    </span>
                  ) : isTrial && subActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30">
                      <span className="size-2 rounded-full bg-primary" />
                      Locked — Upgrade to Unlock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Inactive — Renew Plan
                    </span>
                  )}
                </div>
              </div>

              {/* SPECIAL REFERRAL PROGRAM BANNER / WALLET SECTION */}
              <div className="mt-5 rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/5 p-4 sm:p-5 relative overflow-hidden">
                {isSpecialActive ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Wallet className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                              Special Referral Cash Wallet
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            You earn real cash commission per paying subscriber directly into your wallet. Min. withdrawal ₹200.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleOpenWithdrawModal}
                        disabled={walletBalance < 200 || hasPendingWithdrawal || monthlyWithdrawalCount >= 2}
                        className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 shadow-sm disabled:opacity-50"
                      >
                        <IndianRupee className="size-4" />
                        <span>Request Payout</span>
                      </Button>
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-background/80 border border-border/60 p-3 sm:p-3.5">
                        <span className="text-xs text-muted-foreground font-medium">Available Balance</span>
                        <p className="text-2xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ₹{walletBalance.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {walletBalance >= 200
                            ? "Eligible for withdrawal"
                            : `Need ₹${200 - walletBalance} more to reach min. ₹200`}
                        </p>
                      </div>

                      <div className="rounded-xl bg-background/80 border border-border/60 p-3 sm:p-3.5">
                        <span className="text-xs text-muted-foreground font-medium">Total Cash Earned</span>
                        <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                          ₹{totalEarned.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Cumulative referral rewards</p>
                      </div>

                      <div className="rounded-xl bg-background/80 border border-border/60 p-3 sm:p-3.5">
                        <span className="text-xs text-muted-foreground font-medium">Total Withdrawn</span>
                        <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                          ₹{totalWithdrawn.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Transferred to UPI / Bank</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-y-1">
                      <span>• SLA: Deposited to your account within 7–10 working days</span>
                      <span>• Max 2 requests/month ({monthlyWithdrawalCount}/2 used)</span>
                      <span>
                        • Payout to: UPI (<strong>{specialProg?.payoutDetails?.upiId}</strong>) •{" "}
                        {specialProg?.payoutDetails?.bankName}
                      </span>
                    </div>

                    {/* EARN EXTRA DAYS & PLAN EXTENSION PERK CARD */}
                    <div className="mt-3.5 pt-3.5 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 rounded-lg bg-accent/20 text-tealdeep flex items-center justify-center shrink-0 mt-0.5">
                          <Gift className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                              Earn Extra Days &amp; Plan Extension
                            </h4>
                            <span className="inline-flex items-center rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-tealdeep border border-accent/25">
                              +7 Days / Referral
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl">
                            Each friend who joins extends your active membership plan. You keep both your real cash earnings and accumulated bonus days!
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 bg-background/80 border border-border/60 rounded-xl px-3 py-1.5">
                        <Sparkles className="size-3.5 text-saffrondeep" />
                        <span className="text-xs font-semibold text-foreground">
                          <strong className="text-saffrondeep font-mono">+{netBonusDays}</strong> Extra Days Earned
                        </span>
                      </div>
                    </div>
                  </div>
                ) : isSpecialPending ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-foreground">
                            Special Referral Program Application Under Review
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Pending
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                          Your application was submitted on{" "}
                          {new Date(specialProg?.appliedAt || Date.now()).toLocaleDateString("en-IN")}. Once
                          approved, your referral code will earn cash commissions up to ₹100 per paid subscriber!
                        </p>
                        <div className="mt-2 text-xs font-mono text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            UPI: <strong className="text-foreground">{specialProg?.payoutDetails?.upiId}</strong>
                          </span>
                          <span>
                            Bank:{" "}
                            <strong className="text-foreground">
                              {specialProg?.payoutDetails?.bankName}{" "}
                              {specialProg?.payoutDetails?.accountNumber?.slice(-4)
                                ? `(••••${specialProg.payoutDetails.accountNumber.slice(-4)})`
                                : ""}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isSpecialRejected ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-foreground">
                            Special Referral Application Not Approved
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            Declined
                          </span>
                        </div>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                          Reason: {specialProg?.rejectionReason || "Details could not be verified."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You can review your payout details and reapply at any time.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleOpenApplyModal}
                      className="shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2"
                    >
                      <span>Re-apply Now</span>
                    </Button>
                  </div>
                ) : isSpecialClosed ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-foreground">
                          Special Referral Program Closed
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          The special referral program was closed by admin. You currently receive standard +7 bonus subscription days for referrals.
                          {walletBalance > 0 && ` You have ₹${walletBalance} remaining in your wallet balance which can still be withdrawn.`}
                        </p>
                      </div>
                    </div>
                    {walletBalance >= 200 && (
                      <Button
                        onClick={handleOpenWithdrawModal}
                        className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2"
                      >
                        <span>Withdraw ₹{walletBalance}</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground">
                        Earn Real Cash with Special Referral Program 💸
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                        Want to earn money instead of subscription days? Apply now with your UPI &amp; Bank details to earn up to <strong>₹100 real cash commission</strong> per paying referral, withdrawable directly to your account (min. ₹200).
                      </p>
                    </div>
                    <Button
                      onClick={handleOpenApplyModal}
                      className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm px-4.5 py-2.5 shadow-sm"
                    >
                      <Wallet className="size-4" />
                      <span>Apply to Earn Cash</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* STATS TILES */}
              <div
                className={`mt-5 sm:mt-6 grid gap-2.5 sm:gap-4 ${
                  isSpecialActive ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-4"
                }`}
              >
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

                {/* CASH WALLET TILE (When special referral active) */}
                {isSpecialActive && (
                  <div className="rounded-xl sm:rounded-2xl bg-background/60 border border-emerald-500/30 p-3 sm:p-4">
                    <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Cash Wallet</span>
                    </span>
                    <p className="mt-1 text-xl sm:text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{walletBalance}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                      ₹{totalEarned} total earned
                    </p>
                  </div>
                )}

                {/* BONUS DAYS TILE (Always visible) */}
                <div className="rounded-xl sm:rounded-2xl bg-background/60 border border-border/60 p-3 sm:p-4">
                  <span className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Gift className="size-3.5 text-saffrondeep shrink-0" />
                    <span>Bonus Days</span>
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-display font-bold text-saffrondeep">
                    +{netBonusDays} Days
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                    +7 days per referral
                  </p>
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
                /* Locked state — draft, trial, or expired */
                <div className="mt-5 sm:mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 sm:p-6 text-center">
                  <div className="inline-flex items-center justify-center size-11 rounded-full bg-primary/10 border border-primary/20 mb-2.5">
                    <AlertCircle className="size-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isDraft
                      ? "Referral Code Locked — Profile Incomplete"
                      : isTrial && subActive
                        ? "Referral Code Unlocks on Paid Plans ⚡"
                        : "Referral Code Inactive — Renew to Reactivate"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {isDraft
                      ? "Referral codes and links are only available on active paid membership plans. Complete your profile setup to get started!"
                      : isTrial && subActive
                        ? "You are currently on the 3-day free trial. Upgrade to any paid plan to unlock your unique referral link and start earning +7 extra days for every friend!"
                        : "Your subscription has expired. Renew any plan to reactivate your referral link and continue earning +7 extra days!"}
                  </p>
                  <Link
                    to={isDraft ? "/creator/register" : "/creator/plans"}
                    className="inline-flex items-center gap-1.5 mt-3.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <span>
                      {isDraft
                        ? "Complete Profile Setup"
                        : isTrial && subActive
                          ? "Upgrade to Unlock Referral Code"
                          : "Renew Plan"}
                    </span>
                    <ArrowUpRight className="size-3.5 shrink-0" />
                  </Link>
                </div>
              )}

              {/* CONNECT INVITATION CODE (If this creator was invited but didn't enter code at registration) */}
              {!mine?.referredBy ? (
                <div className="mt-5 rounded-2xl bg-secondary/40 border border-border/80 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Gift className="size-4 text-primary" />
                        <span>Invited by a fellow creator?</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Enter their referral code here so they automatically receive +7 bonus subscription days when you upgrade.
                      </p>
                    </div>

                    <form onSubmit={handleApplyReferral} className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={inputReferralCode}
                        onChange={(e) => setInputReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g. DHUNDO-XYZ"
                        maxLength={25}
                        className="rounded-xl bg-background border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-36 sm:w-44"
                      />
                      <Button
                        variant="ink"
                        type="submit"
                        disabled={applyingReferral || !inputReferralCode.trim()}
                        className="py-1.5 px-3 text-xs font-semibold"
                      >
                        {applyingReferral ? <Loader2 className="size-3.5 animate-spin" /> : "Connect Code"}
                      </Button>
                    </form>
                  </div>

                  {referralFeedback ? (
                    <div
                      className={`mt-3 rounded-xl p-2.5 text-xs font-medium ${
                        referralFeedback.type === "success"
                          ? "bg-tealdeep/10 text-tealdeep border border-tealdeep/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {referralFeedback.message}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* ── UNIFIED REFERRAL ACTIVITY & REWARDS ── */}
              <div className="mt-7 sm:mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-primary shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                      {isSpecialActive ? "Referral Activity, Cash & Bonus Days" : "Referral Activity & Bonus Days"}
                    </h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-mono">
                      {referredCreators.length} invited
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {isSpecialActive
                      ? "Track creator signups, cash commission earnings, and bonus days extensions"
                      : "Track creator signups and earned +7 days bonus milestones"}
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
                        const refEventCash = Number(refEvent?.cashDelta ?? 0);
                        const earnedCash =
                          refEvent?.eventType === "cash_earned" || refEventCash > 0
                            ? refEventCash
                            : (() => {
                                const paidSub = refSubs.find((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price ?? 0) > 0);
                                if (paidSub) {
                                  const basePlan = PLANS.find((p) => p.id === paidSub.planId);
                                  const basePrice = basePlan ? basePlan.price : (paidSub.price || 0);
                                  const disc = basePrice > 0 ? Math.max(0, Math.min(100, Math.round(((basePrice - paidSub.price) / basePrice) * 100))) : 0;
                                  return calculateReferralCashCommission(disc);
                                }
                                return 0;
                              })();
                        const hasEarnedReward =
                          earnedCash > 0 ||
                          Boolean(
                            refEvent &&
                              (refEvent.daysDelta > 0 || (refEvent.cashDelta && refEvent.cashDelta > 0)),
                          ) ||
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
                              {earnedCash > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px]">
                                  <Check className="size-2.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                  <span>+₹{earnedCash} Cash</span>
                                </span>
                              ) : hasEarnedReward ? (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                                  isSpecialActive
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                                    : "bg-accent/20 text-tealdeep border border-accent/40"
                                }`}>
                                  <Check className={`size-2.5 stroke-[2.5] ${isSpecialActive ? "text-emerald-600 dark:text-emerald-400" : "text-tealdeep"}`} />
                                  <span>{isSpecialActive ? (earnedCash > 0 ? `+₹${earnedCash} Cash` : "Commission Earned") : "+7 Days Earned"}</span>
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
                                    <span>Nudge ({isSpecialActive ? "Cash" : "+7 Days"})</span>
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
                            <span className={`inline-flex items-center gap-1 font-bold text-xs shrink-0 ${
                              ev.eventType === "cash_earned" ? "text-emerald-600 dark:text-emerald-400" : "text-saffrondeep"
                            }`}>
                              {ev.eventType === "cash_earned" ? `+₹${ev.cashDelta || 0} Cash` : `+${ev.daysDelta} Days`}
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
                            const refEventCash = Number(refEvent?.cashDelta ?? 0);
                            const earnedCash =
                              refEvent?.eventType === "cash_earned" || refEventCash > 0
                                ? refEventCash
                                : (() => {
                                    const paidSub = refSubs.find((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price ?? 0) > 0);
                                    if (paidSub) {
                                      const basePlan = PLANS.find((p) => p.id === paidSub.planId);
                                      const basePrice = basePlan ? basePlan.price : (paidSub.price || 0);
                                      const disc = basePrice > 0 ? Math.max(0, Math.min(100, Math.round(((basePrice - paidSub.price) / basePrice) * 100))) : 0;
                                      return calculateReferralCashCommission(disc);
                                    }
                                    return 0;
                                  })();
                            const hasEarnedReward =
                              earnedCash > 0 ||
                              Boolean(
                                refEvent &&
                                  (refEvent.daysDelta > 0 || (refEvent.cashDelta && refEvent.cashDelta > 0)),
                              ) ||
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
                                  {earnedCash > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[11px] shadow-2xs">
                                      <Check className="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                      +₹{earnedCash} Cash
                                    </span>
                                  ) : hasEarnedReward ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold text-[11px] shadow-2xs ${
                                      isSpecialActive
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                                        : "bg-accent/20 text-tealdeep border border-accent/40"
                                    }`}>
                                      <Check className={`size-3 stroke-[2.5] ${isSpecialActive ? "text-emerald-600 dark:text-emerald-400" : "text-tealdeep"}`} />
                                      {isSpecialActive ? (earnedCash > 0 ? `+₹${earnedCash} Cash` : "Commission Earned") : "+7 Days Earned"}
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
                                        title="Nudge on WhatsApp to upgrade and earn rewards"
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
                                  <span className={`inline-flex items-center gap-1 font-bold ${
                                    ev.eventType === "cash_earned" ? "text-emerald-600 dark:text-emerald-400" : "text-saffrondeep"
                                  }`}>
                                    {ev.eventType === "cash_earned" ? `+₹${ev.cashDelta || 0} Cash` : `+${ev.daysDelta} Days`}
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
                      Share your personal invite link above. When creators sign up and activate passes, they will appear here with your rewards!
                    </p>
                  </div>
                )}

                {/* ── WITHDRAWAL REQUESTS HISTORY ──────────────────────── */}
                {myWithdrawals.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border/60">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <History className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Your Withdrawal Requests
                        </h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {myWithdrawals.length} request{myWithdrawals.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-border/80 bg-background/60">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-secondary/80 font-semibold text-muted-foreground uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Requested At</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Destination</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Reference / Admin Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {myWithdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                {new Date(w.requestedAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap font-bold text-foreground">
                                ₹{w.amount.toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                <div>
                                  <span className="font-mono text-foreground font-medium">
                                    {w.payoutDetails.upiId}
                                  </span>
                                  <span className="text-[11px] block text-muted-foreground">
                                    {w.payoutDetails.bankName} (••••{w.payoutDetails.accountNumber.slice(-4)})
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {w.status === "paid" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <Check className="size-3" />
                                    Paid
                                  </span>
                                ) : w.status === "rejected" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                    <X className="size-3" />
                                    Rejected (Refunded)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    <Clock className="size-3" />
                                    Under Review (7–10 days)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {w.status === "paid" ? (
                                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                    UTR: {w.transactionReference || "Completed"}
                                  </span>
                                ) : w.status === "rejected" ? (
                                  <div className="text-right">
                                    <span className="text-xs text-rose-600 dark:text-rose-400 font-medium block">
                                      {w.adminNotes || "Details rejected"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      Amount refunded to balance
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Processing payout
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                              {p.amount === 0 ? (
                                <>
                                  <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">₹0</p>
                                  <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                                    <Tag className="size-2.5" />
                                    100% Free
                                  </span>
                                </>
                              ) : (
                                <>
                                  <p className="text-base font-bold text-saffrondeep">{formatPrice(p.amount)}</p>
                                  <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-tealdeep">
                                    <Check className="size-2.5" />
                                    Paid
                                  </span>
                                </>
                              )}
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
                              <td className="px-4 py-3.5 font-bold whitespace-nowrap">
                                {p.amount === 0 ? (
                                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                                    ₹0
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                                      100% OFF
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-saffrondeep">{formatPrice(p.amount)}</span>
                                )}
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
                                {p.amount === 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 font-bold text-purple-700 dark:text-purple-300 text-[11px]">
                                    <Tag className="size-3" />
                                    Free Pass
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 font-bold text-tealdeep text-[11px]">
                                    <Check className="size-3" />
                                    Paid
                                  </span>
                                )}
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
                  {mine?.status === "Draft" ? (
                    <Link
                      to="/creator/register"
                      className="inline-flex items-center gap-1.5 mt-4 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 transition-all shadow-xs"
                    >
                      <span>Complete Profile Setup</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/creator/plans"
                      className="inline-flex items-center gap-1.5 mt-4 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 transition-all shadow-xs"
                    >
                      <span>View Subscription Plans</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  )}
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
          creatorName={getCreatorDisplayName(mine)}
          onUpdatePhoto={async (newPhotoUrl) => {
            return await updateCreatorPhoto(mine.id, newPhotoUrl);
          }}
          onDeletePhoto={async () => {
            return await updateCreatorPhoto(mine.id, "");
          }}
        />
      )}

      {/* ── APPLY FOR SPECIAL REFERRAL PROGRAM MODAL ── */}
      {showApplyModal && mine && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-background border border-border p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Apply for Special Referral Program 💸
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Earn real cash commissions instead of subscription days
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="size-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleApplySpecial} className="space-y-4">
              <div className="rounded-xl bg-accent/10 border border-accent/25 p-3 text-xs space-y-1">
                <p className="font-semibold text-tealdeep flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  How Cash Referrals Work
                </p>
                <p className="text-muted-foreground">
                  Earn up to <strong>₹100 cash</strong> per referral when an invited creator buys a plan. When your application is approved, extra subscription days will be paused and all earnings will go directly to your cash wallet (minimum withdrawal ₹200).
                </p>
              </div>

              {applyError && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* UPI ID */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  UPI ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                  value={applyUpiId}
                  onChange={(e) => setApplyUpiId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Quick payouts will be directed to this UPI address
                </span>
              </div>

              {/* Bank Details section */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  <span>Bank Account Details (Required for Verification)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Account Holder Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="As per bank passbook"
                      value={applyAccountHolder}
                      onChange={(e) => setApplyAccountHolder(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      value={applyBankName}
                      onChange={(e) => setApplyBankName(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Account Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Account number"
                      value={applyAccountNumber}
                      onChange={(e) => setApplyAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      IFSC Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001234"
                      value={applyIfsc}
                      onChange={(e) => setApplyIfsc(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={applyingSpecial}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-5 py-2"
                >
                  {applyingSpecial ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REQUEST CASH WITHDRAWAL MODAL ── */}
      {showWithdrawModal && mine && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-background border border-border p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    Request Cash Payout 💳
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Available balance: <strong className="text-emerald-600 dark:text-emerald-400">₹{walletBalance}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="size-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {withdrawError && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                  <Check className="size-4 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Withdrawal Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={200}
                    max={walletBalance}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-3.5 py-2.5 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                  <span>Minimum ₹200</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.min(walletBalance, 200))}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Min ₹200
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(walletBalance)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Max (₹{walletBalance})
                    </button>
                  </div>
                </div>
              </div>

              {/* Destination Summary */}
              <div className="rounded-xl bg-secondary/40 border border-border/80 p-3.5 text-xs space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  Payout Destination
                </span>
                <div className="font-mono text-[11px] text-muted-foreground space-y-0.5 pt-1">
                  <p>UPI: <strong className="text-foreground">{specialProg?.payoutDetails?.upiId}</strong></p>
                  <p>Bank: <strong className="text-foreground">{specialProg?.payoutDetails?.bankName} (••••{specialProg?.payoutDetails?.accountNumber?.slice(-4)})</strong></p>
                  <p>Holder: <strong className="text-foreground">{specialProg?.payoutDetails?.accountHolderName}</strong></p>
                </div>
              </div>

              {/* Terms / SLA */}
              <div className="rounded-xl bg-background border border-border/60 p-3 text-[11px] text-muted-foreground space-y-1">
                <p>• Payouts are reviewed and deposited within <strong>7–10 working days</strong>.</p>
                <p>• Maximum <strong>2 withdrawal requests per calendar month</strong> (used: {monthlyWithdrawalCount}/2).</p>
                <p>• Only 1 active pending withdrawal is permitted at a time.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                  className="rounded-xl text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingWithdrawal || withdrawAmount < 200 || withdrawAmount > walletBalance || Boolean(withdrawSuccess)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 disabled:opacity-50"
                >
                  {submittingWithdrawal ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Submitting...
                    </>
                  ) : (
                    `Confirm Payout (₹${withdrawAmount})`
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
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

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <base href="${window.location.origin}/" />
          <title>Receipt_${invoiceNumber}</title>
          <style>
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
              -webkit-font-smoothing: antialiased;
            }
            .mobile-action-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 12px;
            }
            .btn-print {
              background: #ea580c;
              color: #ffffff;
              border: none;
              border-radius: 8px;
              padding: 8px 16px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
            }
            .btn-close {
              background: #e2e8f0;
              color: #334155;
              border: none;
              border-radius: 8px;
              padding: 8px 14px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .invoice-box {
                border: 1px solid #cbd5e1 !important;
                box-shadow: none !important;
                margin: 0 auto !important;
                padding: 20px 24px !important;
              }
            }
            .invoice-box {
              width: 100%;
              max-width: 680px;
              margin: 16px auto;
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
              color: #0f172a;
              letter-spacing: -0.3px;
            }
            .brand-name span {
              color: #d97706;
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
          <div class="mobile-action-bar no-print">
            <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Official Payment Receipt #${invoiceNumber}</span>
            <div style="display: flex; gap: 8px;">
              <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>
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
                <span class="badge-paid">${receipt.amount === 0 ? "✓ 100% PROMO PASS • VERIFIED" : "✓ PAID • RAZORPAY VERIFIED"}</span>
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
                <div class="info-card-label">Merchant &amp; Platform</div>
                <div class="info-card-name">Influencer Dhundo Platform</div>
                <div class="info-card-line">Issuer: Influencer Dhundo Marketplace</div>
                <div class="info-card-line">Payment Method: ${receipt.amount === 0 ? "100% Discount Promotional Code" : "Razorpay Live Gateway (INR)"}</div>
                <div class="info-card-line">Support: influencerdhundo@gmail.com</div>
              </div>
            </div>

            <!-- AUDIT BOX -->
            <div class="audit-card">
              <div class="audit-header">
                <span>🛡️ ${receipt.amount === 0 ? "100% Promotional Pass Verification" : "Razorpay Transaction Verification"}</span>
                <span class="audit-pill">${receipt.amount === 0 ? "Fully Discounted (₹0 Paid)" : "Captured &amp; Settled"}</span>
              </div>
              <div class="audit-grid">
                <div class="audit-item">
                  <span class="audit-item-label">${receipt.amount === 0 ? "Pass ID:" : "Payment ID:"}</span>
                  <span class="audit-item-val">${receipt.razorpayPaymentId || "N/A"}</span>
                </div>
                <div class="audit-item">
                  <span class="audit-item-label">${receipt.amount === 0 ? "Promo Code / Ref:" : "Order ID:"}</span>
                  <span class="audit-item-val">${receipt.amount === 0 ? (promoCode || receipt.razorpayOrderId) : receipt.razorpayOrderId}</span>
                </div>
              </div>
              ${
                receipt.razorpaySignature
                  ? `
                <div style="font-size: 9px; color: #166534; margin-top: 6px; font-family: monospace;">
                  ${receipt.amount === 0 ? "Status: Platform Promotional Code Verified" : "Security Signature: HMAC SHA-256 Verified"}
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
    `;

    const isIOS =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // On iOS / Mobile devices, opening a dedicated printable tab is the only reliable way
    // for AirPrint & Save-as-PDF to render all pixels without clipping or blank pages.
    if (isIOS || isMobile) {
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(receiptHtml);
        printWin.document.close();
        setTimeout(() => {
          try {
            printWin.focus();
            printWin.print();
          } catch {}
        }, 350);
        return;
      }
    }

    // On Desktop, print in-place using a properly sized off-screen iframe
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.left = "-9999px";
    printFrame.style.top = "0";
    printFrame.style.width = "1024px";
    printFrame.style.height = "1400px";
    printFrame.style.border = "none";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(receiptHtml);
    doc.close();

    setTimeout(() => {
      const prevTitle = document.title;
      document.title = `Receipt_${invoiceNumber}`;
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        document.title = prevTitle;
      }, 1000);
      // Safe cleanup timer (60s) so the browser's print spooler is never interrupted
      setTimeout(() => {
        try {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        } catch {
          // ignore
        }
      }, 60000);
    }, 300);
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
                  {receipt.amount === 0 ? "100% PROMO PASS • VERIFIED" : "PAID • RAZORPAY VERIFIED"}
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
                  Support: influencerdhundo@gmail.com
                </p>
              </div>
            </div>

            {/* TRANSACTION AUDIT BOX */}
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-tealdeep flex items-center gap-1.5">
                  <ShieldCheck className="size-4" />
                  {receipt.amount === 0 ? "100% Promotional Pass Verification" : "Razorpay Transaction Verification"}
                </span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-tealdeep">
                  {receipt.amount === 0 ? "Fully Discounted (₹0 Paid)" : "Captured & Settled"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1 border-t border-accent/20">
                <div className="flex items-center justify-between bg-background/60 rounded-lg px-2.5 py-1.5 border border-accent/20">
                  <span className="text-muted-foreground">{receipt.amount === 0 ? "Pass ID:" : "Payment ID:"}</span>
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
                  <span className="text-muted-foreground">{receipt.amount === 0 ? "Promo Code / Ref:" : "Order ID:"}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground font-bold truncate max-w-[130px]">
                      {receipt.amount === 0 ? (promoCode || receipt.razorpayOrderId) : receipt.razorpayOrderId}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(receipt.razorpayOrderId, "orderId")
                      }
                      className="text-muted-foreground hover:text-foreground cursor-pointer print-hidden"
                      title="Copy Reference"
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
                    {receipt.amount === 0 ? "Platform Promotional Waiver Verified" : "HMAC SHA-256 Verified"}
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


