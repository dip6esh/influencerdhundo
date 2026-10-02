import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CREATORS, type Creator, type CreatorStatus } from "./directory-data";
import { supabaseDb } from "./supabase";

export type BusinessAccount = {
  id?: string;
  authUserId?: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
};

export type Report = {
  id: string;
  creatorId: string;
  reason: string;
  details: string;
  at: string;
};

export type Subscription = {
  creatorId: string;
  planId: string;
  duration: string;
  price: number;
  startedAt: string;
};

type AppState = {
  creators: Creator[];
  business: BusinessAccount | null;
  myCreatorId: string | null;
  reports: Report[];
  subscriptions: Subscription[];
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
  upsertCreatorWithAuth: (
    c: Creator,
    authUserId?: string | null,
  ) => Promise<{ success: boolean; error?: string }>;
  setCreatorStatus: (id: string, status: CreatorStatus) => void;
  removeCreator: (id: string) => void;
  toggleFeatured: (id: string) => void;
  addReport: (r: Omit<Report, "id" | "at">) => void;
  activateSubscription: (s: Omit<Subscription, "startedAt">) => void;
  refreshFromSupabase: () => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

const STORAGE_KEY = "influencer-dhundo-state-v1";

type Persisted = {
  creators: Creator[];
  business: BusinessAccount | null;
  myCreatorId: string | null;
  reports: Report[];
  subscriptions: Subscription[];
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>(CREATORS);
  const [business, setBusiness] = useState<BusinessAccount | null>(null);
  const [myCreatorId, setMyCreatorId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
      const remoteCreators = await supabaseDb.fetchCreators();
      if (isMounted && remoteCreators && remoteCreators.length > 0) {
        setCreators(remoteCreators);
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

          // Fetch this creator's subscriptions from Supabase and merge into state
          const remoteSubs = await supabaseDb.fetchSubscriptionsForCreator(creatorProfile.id);
          if (remoteSubs.length > 0 && isMounted) {
            setSubscriptions((prev) => {
              // Remote is source of truth — drop local dupes and sort newest first
              const localOnly = prev.filter(
                (s) =>
                  s.creatorId === creatorProfile.id
                    ? false // replace all local subs for this creator with remote
                    : true, // keep subs for other creators (e.g. in dev/admin scenarios)
              );
              return [...remoteSubs, ...localOnly].sort(
                (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
              );
            });
          }
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

  // 3. Persist to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ creators, business, myCreatorId, reports, subscriptions }),
      );
    } catch {
      /* storage full or unavailable */
    }
  }, [hydrated, creators, business, myCreatorId, reports, subscriptions]);

  const refreshFromSupabase = async () => {
    const remoteCreators = await supabaseDb.fetchCreators();
    if (remoteCreators && remoteCreators.length > 0) {
      setCreators(remoteCreators);
    }
  };

  const value = useMemo<AppState>(
    () => ({
      creators,
      business,
      myCreatorId,
      reports,
      subscriptions,
      refreshFromSupabase,
      hasUsedTrial: (creatorId: string) =>
        subscriptions.some(
          (s) =>
            s.creatorId === creatorId &&
            (s.planId === "trial-3d" || s.duration?.toLowerCase().includes("3 day")),
        ),
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
      activateSubscription: (s) => {
        const item: Subscription = {
          ...s,
          startedAt: new Date().toISOString(),
        };
        setSubscriptions((prev) => [item, ...prev]);
        setCreators((prev) =>
          prev.map((c) => (c.id === s.creatorId ? { ...c, status: "Active" } : c)),
        );
        supabaseDb.addSubscription(item);
        supabaseDb.updateCreatorStatus(s.creatorId, "Active");
      },
    }),
    [creators, business, myCreatorId, reports, subscriptions],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
