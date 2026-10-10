import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CREATORS,
  EMPTY_FILTERS,
  generateReferralCode,
  getSubscriptionDurationMs,
  getSubscriptionExpiry,
  isSubscriptionActive,
  isSubscriptionQueued,
  type Creator,
  type CreatorStatus,
  type Filters,
} from "./directory-data";
import { supabaseDb, type ReferralEvent } from "./supabase";

export type BusinessAccount = {
  id?: string;
  authUserId?: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Report = {
  id: string;
  creatorId: string;
  reason: string;
  details: string;
  at: string;
};

export type Subscription = {
  id?: string | undefined;
  creatorId: string;
  planId: string;
  duration: string;
  price: number;
  startedAt: string;
  expiresAt?: string | undefined;
  isTrial?: boolean | undefined;
  referralCodeUsed?: string | undefined;
  isQueued?: boolean | undefined;
  status?: "active" | "queued" | "expired" | undefined;
  razorpayOrderId?: string | undefined;
  razorpayPaymentId?: string | undefined;
};

type AppState = {
  creators: Creator[];
  business: BusinessAccount | null;
  myCreatorId: string | null;
  reports: Report[];
  subscriptions: Subscription[];
  referralEvents: ReferralEvent[];
  /** Returns true if the creator has ever used the free 3-day trial */
  hasUsedTrial: (creatorId: string) => boolean;
  signUpBusiness: (b: BusinessAccount, authUserId?: string | null) => void;
  setBusiness: (b: BusinessAccount | null) => void;
  signOutBusiness: () => void;
  loginCreator: (id: string) => void;
  signOutCreator: () => void;
  findBusinessByContact: (contact: string) => Promise<BusinessAccount | null>;
  findCreatorByContact: (contact: string) => Promise<Creator | null>;
  upsertCreator: (c: Creator, mine?: boolean) => void;
  updateCreator: (c: Creator) => Promise<boolean>;
  upsertCreatorWithAuth: (
    c: Creator,
    authUserId?: string | null,
  ) => Promise<{ success: boolean; error?: string }>;
  updateCreatorPhoto: (id: string, photoUrl: string) => Promise<boolean>;
  setCreatorStatus: (id: string, status: CreatorStatus) => void;
  removeCreator: (id: string) => void;
  toggleFeatured: (id: string) => void;
  addReport: (r: Omit<Report, "id" | "at">) => void;
  activateSubscription: (
    s: Omit<Subscription, "startedAt">,
    referralCode?: string | undefined,
  ) => Promise<void>;
  startFreeTrial: (creatorId: string) => Promise<boolean>;
  reverseReferralReward: (
    referrerId: string,
    referredCreatorId: string,
    referredSubId?: string,
    reason?: string,
  ) => Promise<void>;
  fetchReferralEvents: (creatorId: string) => Promise<void>;
  refreshFromSupabase: () => Promise<void>;
  discoverFilters: Filters;
  setDiscoverFilters: React.Dispatch<React.SetStateAction<Filters>>;
  discoverHasSearched: boolean;
  setDiscoverHasSearched: (searched: boolean) => void;
  resetDiscoverFilters: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

const STORAGE_KEY = "influencer-dhundo-state-v1";

type Persisted = {
  creators: Creator[];
  business: BusinessAccount | null;
  myCreatorId: string | null;
  reports: Report[];
  subscriptions: Subscription[];
  referralEvents: ReferralEvent[];
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>(CREATORS);
  const [business, setBusiness] = useState<BusinessAccount | null>(null);
  const [myCreatorId, setMyCreatorId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [referralEvents, setReferralEvents] = useState<ReferralEvent[]>([]);
  const [discoverFilters, setDiscoverFilters] = useState<Filters>(EMPTY_FILTERS);
  const [discoverHasSearched, setDiscoverHasSearched] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const resetDiscoverFilters = () => {
    setDiscoverFilters(EMPTY_FILTERS);
    setDiscoverHasSearched(false);
  };

  // 1. Hydrate from localStorage first for instant initial render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        if (p.creators?.length) setCreators(p.creators);
        setBusiness(p.business ?? null);
        setMyCreatorId(p.myCreatorId ?? null);
        setReports(p.reports ?? []);
        setSubscriptions(p.subscriptions ?? []);
        setReferralEvents(p.referralEvents ?? []);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // 2. Fetch live data from Supabase once on mount & sync auth profile
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      const [remoteCreators, remoteSubs] = await Promise.all([
        supabaseDb.fetchCreators(),
        supabaseDb.fetchAllSubscriptions(),
      ]);
      if (isMounted && remoteCreators && remoteCreators.length > 0) {
        setCreators(remoteCreators);
      }
      if (isMounted && remoteSubs && remoteSubs.length > 0) {
        setSubscriptions(remoteSubs);
      }

      // If user has active Supabase session, look up their creator or business profile
      const uid = await supabaseDb.getCreatorSession();
      if (uid && isMounted) {
        const creatorProfile = await supabaseDb.getCreatorProfileForAuthUser(uid);
        if (creatorProfile && isMounted) {
          setCreators((prev) =>
            prev.some((x) => x.id === creatorProfile.id) ? prev : [creatorProfile, ...prev],
          );
          setMyCreatorId(creatorProfile.id);

          // Fetch referral events
          const events = await supabaseDb.fetchReferralEvents(creatorProfile.id);
          if (isMounted) setReferralEvents(events);
        }

        const businessProfile = await supabaseDb.getBusinessProfileForAuthUser(uid);
        if (businessProfile && isMounted) {
          setBusiness(businessProfile);
        }
      }
    }
    loadFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Auto-activate queued subscriptions when their start time arrives
  useEffect(() => {
    if (!hydrated) return;
    const checkAndActivate = async () => {
      const now = Date.now();
      let hasUpdates = false;
      // 1. Auto-activate queued subscriptions
      const nextSubs = await Promise.all(
        subscriptions.map(async (sub) => {
          const startTime = new Date(sub.startedAt).getTime();
          const expiryTime = getSubscriptionExpiry(sub).getTime();
          // If queued and start time has passed, and hasn't fully expired yet
          if (
            (sub.isQueued || sub.status === "queued" || startTime <= now) &&
            startTime <= now &&
            expiryTime > now &&
            (sub.isQueued || sub.status === "queued")
          ) {
            hasUpdates = true;
            if (sub.id) {
              await supabaseDb.updateSubscriptionStatus(sub.id, "active", false);
            }
            return { ...sub, isQueued: false, status: "active" as const };
          }
          return sub;
        }),
      );

      if (hasUpdates) {
        setSubscriptions(nextSubs);
      }

      // 2. Automated Expiration Sweep for Creators whose passes ended
      let creatorsUpdated = false;
      const nextCreators = creators.map((c) => {
        if (c.status === "Draft" || c.id.startsWith("draft-")) return c;
        const creatorExplicitExpTime = c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).getTime() : 0;
        let latestSubExpTime = 0;
        let hasActiveOrQueuedSub = false;

        for (const s of subscriptions) {
          if (s.creatorId !== c.id) continue;
          const sExp = s.expiresAt ? new Date(s.expiresAt).getTime() : 0;
          if (sExp > latestSubExpTime) latestSubExpTime = sExp;
          if (s.isQueued || s.status === "queued" || sExp > now) {
            hasActiveOrQueuedSub = true;
          }
        }

        const expTime = Math.max(creatorExplicitExpTime, latestSubExpTime);

        if (expTime > 0 && expTime <= now && !hasActiveOrQueuedSub && c.status === "Active") {
          creatorsUpdated = true;
          supabaseDb.updateCreatorStatus(c.id, "Expired");
          return { ...c, status: "Expired" as CreatorStatus };
        }
        return c;
      });

      if (creatorsUpdated) {
        setCreators(nextCreators);
      }
    };

    checkAndActivate();
    const interval = setInterval(checkAndActivate, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [hydrated, subscriptions, creators]);

  // 4. Persist to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ creators, business, myCreatorId, reports, subscriptions, referralEvents }),
      );
    } catch {
      /* storage full or unavailable */
    }
  }, [hydrated, creators, business, myCreatorId, reports, subscriptions, referralEvents]);

  const refreshFromSupabase = async () => {
    try {
      const [remoteCreators, remoteSubs] = await Promise.all([
        supabaseDb.fetchCreators(),
        supabaseDb.fetchAllSubscriptions(),
      ]);
      if (remoteCreators && remoteCreators.length > 0) {
        setCreators(remoteCreators);
      }
      if (remoteSubs && remoteSubs.length > 0) {
        setSubscriptions(remoteSubs);
      }
    } catch {
      // ignore
    }
  };

  const value = useMemo<AppState>(
    () => ({
      creators,
      business,
      myCreatorId,
      reports,
      subscriptions,
      referralEvents,
      refreshFromSupabase,
      hasUsedTrial: (creatorId: string) => {
        const creator = creators.find((c) => c.id === creatorId);
        if (creator?.trialStartedAt) return true;
        return subscriptions.some(
          (s) =>
            s.creatorId === creatorId &&
            (s.planId === "trial-3d" || s.isTrial === true || s.duration?.toLowerCase().includes("3 day")),
        );
      },
      signUpBusiness: (b, authUserId) => {
        setBusiness(b);
        supabaseDb.saveBusinessAccount(b, authUserId);
      },
      setBusiness: (b) => setBusiness(b),
      signOutBusiness: () => {
        setBusiness(null);
        supabaseDb.signOutBusiness();
      },
      loginCreator: (id: string) => setMyCreatorId(id),
      signOutCreator: () => {
        setMyCreatorId(null);
        supabaseDb.signOutCreator();
      },
      findBusinessByContact: async (contact: string) => {
        const found = await supabaseDb.findBusinessAccount(contact);
        if (found) {
          setBusiness(found);
          return found;
        }
        return null;
      },
      findCreatorByContact: async (contact: string) => {
        // First check local creators
        const local = creators.find(
          (c) =>
            c.id.toLowerCase() === contact.toLowerCase() ||
            c.instagram.toLowerCase() === contact.toLowerCase() ||
            c.instagram.toLowerCase() === `@${contact.toLowerCase()}` ||
            c.contact.phone.includes(contact) ||
            c.contact.email.toLowerCase() === contact.toLowerCase(),
        );
        if (local) {
          setMyCreatorId(local.id);
          return local;
        }
        // Fallback to Supabase remote lookup
        const remote = await supabaseDb.findCreatorAccount(contact);
        if (remote) {
          setCreators((prev) => (prev.some((x) => x.id === remote.id) ? prev : [remote, ...prev]));
          setMyCreatorId(remote.id);
          return remote;
        }
        return null;
      },
      upsertCreator: (c, mine) => {
        setCreators((prev) => {
          const i = prev.findIndex((x) => x.id === c.id);
          if (i === -1) return [c, ...prev];
          const next = [...prev];
          next[i] = c;
          return next;
        });
        if (mine) setMyCreatorId(c.id);
        supabaseDb.upsertCreator(c);
      },
      updateCreator: async (c: Creator) => {
        setCreators((prev) => {
          const i = prev.findIndex((x) => x.id === c.id);
          if (i === -1) return [c, ...prev];
          const next = [...prev];
          next[i] = c;
          return next;
        });
        return await supabaseDb.upsertCreator(c);
      },
      upsertCreatorWithAuth: async (c, authUserId) => {
        // Update local state first
        setCreators((prev) => {
          const i = prev.findIndex((x) => x.id === c.id);
          if (i === -1) return [c, ...prev];
          const next = [...prev];
          next[i] = c;
          return next;
        });
        setMyCreatorId(c.id);
        // Persist to Supabase
        return await supabaseDb.upsertCreatorWithAuth(c, authUserId);
      },
      updateCreatorPhoto: async (id, photoUrl) => {
        setCreators((prev) =>
          prev.map((c) => (c.id === id ? { ...c, photo: photoUrl } : c)),
        );
        return await supabaseDb.updateCreatorPhoto(id, photoUrl);
      },
      setCreatorStatus: (id, status) => {
        setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        supabaseDb.updateCreatorStatus(id, status);
      },
      removeCreator: (id) => {
        setCreators((prev) => prev.filter((c) => c.id !== id));
        supabaseDb.deleteCreator(id);
      },
      toggleFeatured: (id) => {
        setCreators((prev) => {
          const target = prev.find((c) => c.id === id);
          if (target) {
            supabaseDb.toggleFeatured(id, !target.featured);
          }
          return prev.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c));
        });
      },
      addReport: (r) => {
        const item: Report = {
          ...r,
          id: `${Date.now()}`,
          at: new Date().toISOString(),
        };
        setReports((prev) => [item, ...prev]);
        supabaseDb.addReport(item);
      },

      activateSubscription: async (s, referralCode) => {
        const now = new Date();
        const creator = creators.find((c) => c.id === s.creatorId);
        const creatorExistingSubs = subscriptions.filter((sub) => sub.creatorId === s.creatorId);

        const isTrialPlan = s.planId === "trial-3d" || s.isTrial === true;

        // STRICT CHECK: Trial can be used ONLY once per account
        if (isTrialPlan) {
          const trialAlreadyUsed =
            Boolean(creator?.trialStartedAt) ||
            creatorExistingSubs.some(
              (sub) =>
                sub.planId === "trial-3d" ||
                sub.isTrial === true ||
                sub.duration?.toLowerCase().includes("3 day"),
            );
          if (trialAlreadyUsed) {
            console.warn("Trial renewal rejected: Trial can only be availed once per user.");
            return;
          }
        }

        // Find the latest active or queued expiration for this creator
        let queueStartDate = now;
        if (creator?.subscriptionExpiresAt) {
          const d = new Date(creator.subscriptionExpiresAt);
          if (!isNaN(d.getTime()) && d.getTime() > queueStartDate.getTime()) {
            queueStartDate = d;
          }
        }
        for (const existingSub of creatorExistingSubs) {
          const exp = getSubscriptionExpiry(existingSub);
          if (exp.getTime() > queueStartDate.getTime()) {
            queueStartDate = exp;
          }
        }

        const isQueued = queueStartDate.getTime() > now.getTime();
        const startTime = isQueued ? queueStartDate : now;
        const durationMs = getSubscriptionDurationMs(s.planId, s.duration);
        const expiresAt = new Date(startTime.getTime() + durationMs);

        const item: Subscription = {
          ...s,
          startedAt: startTime.toISOString(),
          expiresAt: expiresAt.toISOString(),
          isTrial: isTrialPlan,
          referralCodeUsed: referralCode,
          isQueued,
          status: isQueued ? "queued" : "active",
        };
        setSubscriptions((prev) => [item, ...prev]);

        // Target expiration date for creator record
        const currentExpTime = creator?.subscriptionExpiresAt
          ? new Date(creator.subscriptionExpiresAt).getTime()
          : 0;
        const targetExp =
          expiresAt.getTime() > currentExpTime
            ? expiresAt.toISOString()
            : creator?.subscriptionExpiresAt;

        // Mark creator Active and update expiry + trial_started_at if trial
        setCreators((prev) =>
          prev.map((c) =>
            c.id === s.creatorId
              ? {
                  ...c,
                  status: "Active" as CreatorStatus,
                  subscriptionExpiresAt: targetExp,
                  ...(isTrialPlan ? { trialStartedAt: startTime.toISOString() } : {}),
                }
              : c,
          ),
        );

        // Persist to Supabase
        await supabaseDb.addSubscription(item);
        if (isTrialPlan) {
          await supabaseDb.startFreeTrial(s.creatorId);
        } else {
          await supabaseDb.updateCreatorStatus(s.creatorId, "Active");
        }
        if (targetExp) {
          await supabaseDb.updateSubscriptionExpiry(
            s.creatorId,
            new Date(targetExp),
            creator?.referralBonusDays ?? 0,
          );
        }

        // If paid/active plan: generate referral code
        if (!isTrialPlan) {
          if (creator && !creator.referralCode) {
            const code = generateReferralCode(creator.name || creator.displayName);
            await supabaseDb.setReferralCode(s.creatorId, code);
            setCreators((prev) =>
              prev.map((c) => (c.id === s.creatorId ? { ...c, referralCode: code } : c)),
            );
          }

          // Reward referrer ONLY if this creator was referred AND paid real money for the plan (price > 0)
          const isRealMoneyPaid = (s.price ?? 0) > 0;
          const thisCreator = creators.find((c) => c.id === s.creatorId);
          const effectiveReferrerId = thisCreator?.referredBy?.trim();

          if (isRealMoneyPaid && effectiveReferrerId) {
            const cleanRef = effectiveReferrerId.toUpperCase();
            const referrer = creators.find(
              (c) =>
                c.id === effectiveReferrerId ||
                (c.referralCode && c.referralCode.toUpperCase() === cleanRef),
            );
            if (referrer) {
              const alreadyRewarded = referralEvents.some(
                (ev) =>
                  ev.referrerId === referrer.id &&
                  ev.referredCreatorId === s.creatorId &&
                  ev.eventType === "earned" &&
                  ev.daysDelta > 0,
              );
              const referrerExpiry = referrer.subscriptionExpiresAt
                ? new Date(referrer.subscriptionExpiresAt)
                : null;
              const referrerActive = referrerExpiry ? referrerExpiry > now : false;
              const referrerSub = subscriptions.find(
                (sub) => sub.creatorId === referrer.id && sub.planId !== "trial-3d" && !sub.isTrial,
              );
              if (!alreadyRewarded && (referrerActive || referrerSub)) {
                const baseExpiry = referrer.subscriptionExpiresAt
                  ? new Date(referrer.subscriptionExpiresAt)
                  : now;
                const newExpiry = new Date(baseExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
                const newBonus = (referrer.referralBonusDays ?? 0) + 7;
                await supabaseDb.updateSubscriptionExpiry(referrer.id, newExpiry, newBonus);
                await supabaseDb.addReferralEvent({
                  referrerId: referrer.id,
                  referredCreatorId: s.creatorId,
                  referredSubId: item.id,
                  daysDelta: 7,
                  eventType: "earned",
                  note: `${thisCreator?.name || thisCreator?.displayName || "Referred creator"} subscribed to ${s.duration} (+7 Days added)`,
                });
                setCreators((prev) =>
                  prev.map((c) =>
                    c.id === referrer.id
                      ? {
                          ...c,
                          subscriptionExpiresAt: newExpiry.toISOString(),
                          referralBonusDays: newBonus,
                        }
                      : c,
                  ),
                );
                setSubscriptions((prev) =>
                  prev.map((sub) =>
                    sub.creatorId === referrer.id && (sub.status === "active" || !sub.isQueued)
                      ? { ...sub, expiresAt: newExpiry.toISOString() }
                      : sub,
                  ),
                );
                if (myCreatorId === referrer.id) {
                  const events = await supabaseDb.fetchReferralEvents(referrer.id);
                  setReferralEvents(events);
                }
              }
            }
          }
        }
      },

      reverseReferralReward: async (
        referrerId: string,
        referredCreatorId: string,
        referredSubId?: string,
        reason?: string,
      ) => {
        const referrer = creators.find((c) => c.id === referrerId);
        if (!referrer) return;

        const baseExpiry = referrer.subscriptionExpiresAt
          ? new Date(referrer.subscriptionExpiresAt)
          : new Date();
        // Subtract 7 days (clamped so it doesn't break)
        const newExpiry = new Date(baseExpiry.getTime() - 7 * 24 * 60 * 60 * 1000);
        const newBonus = Math.max(0, (referrer.referralBonusDays ?? 0) - 7);

        await supabaseDb.updateSubscriptionExpiry(referrer.id, newExpiry, newBonus);
        await supabaseDb.addReferralEvent({
          referrerId: referrer.id,
          referredCreatorId,
          referredSubId,
          daysDelta: -7,
          eventType: "reversed",
          note: reason || `Subscription refunded/reversed (-7 Days)`,
        });

        setCreators((prev) =>
          prev.map((c) =>
            c.id === referrer.id
              ? { ...c, subscriptionExpiresAt: newExpiry.toISOString(), referralBonusDays: newBonus }
              : c,
          ),
        );

        if (myCreatorId === referrer.id) {
          const events = await supabaseDb.fetchReferralEvents(referrer.id);
          setReferralEvents(events);
        }
      },

      startFreeTrial: async (creatorId: string) => {
        const creator = creators.find((c) => c.id === creatorId);
        const alreadyUsed =
          Boolean(creator?.trialStartedAt) ||
          subscriptions.some(
            (sub) =>
              sub.creatorId === creatorId &&
              (sub.planId === "trial-3d" ||
                sub.isTrial === true ||
                sub.duration?.toLowerCase().includes("3 day")),
          );
        if (alreadyUsed) {
          console.warn("Free trial can only be availed once per creator.");
          return false;
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const trialSub: Subscription = {
          creatorId,
          planId: "trial-3d",
          duration: "3 Days Free Trial",
          price: 0,
          startedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          isTrial: true,
          isQueued: false,
          status: "active",
        };
        setSubscriptions((prev) => [trialSub, ...prev]);
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creatorId
              ? {
                  ...c,
                  status: "Active" as CreatorStatus,
                  trialStartedAt: now.toISOString(),
                  subscriptionExpiresAt: expiresAt.toISOString(),
                }
              : c,
          ),
        );
        const ok = await supabaseDb.startFreeTrial(creatorId);
        await supabaseDb.addSubscription(trialSub);
        return ok;
      },

      fetchReferralEvents: async (creatorId: string) => {
        const events = await supabaseDb.fetchReferralEvents(creatorId);
        setReferralEvents(events);
      },

      discoverFilters,
      setDiscoverFilters,
      discoverHasSearched,
      setDiscoverHasSearched,
      resetDiscoverFilters,
    }),
    [
      creators,
      business,
      myCreatorId,
      reports,
      subscriptions,
      referralEvents,
      discoverFilters,
      discoverHasSearched,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
