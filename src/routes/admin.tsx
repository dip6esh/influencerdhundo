import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Chip, DatePicker, Field, SectionEyebrow, StatusPill, TextArea, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { AdminStateProvider, useAdminState } from "@/lib/admin-state";
import { supabaseDb, type DiscountCode, type WebsiteVisit } from "@/lib/supabase";
import {
  CATEGORIES,
  CITIES,
  COLLAB_TYPES,
  CONTENT_TYPES,
  formatFollowers,
  formatPrice,
  getCreatorProfileSlug,
  GENDERS,
  LANGUAGES,
  PLANS,
  TRAVEL_RANGES,
  TURNAROUNDS,
  type Creator,
  type CreatorStatus,
} from "@/lib/directory-data";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Tag,
  Plus,
  Copy,
  Check,
  Clock,
  Trash2,
  Calendar,
  Pencil,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  User,
  Users,
  Globe,
  Globe2,
  Mail,
  Phone,
  Layers,
  Camera,
  Upload,
  Search,
  IndianRupee,
  Loader2,
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Activity,
  Share2,
  ArrowUpRight,
  Radio,
  ExternalLink,
  Zap,
  CreditCard,
  MessageSquare,
  PhoneCall,
  Award,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Platform admin view: manage creators, statuses, featured profiles, categories, locations, subscriptions, businesses and reported profiles.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  "Analytics",
  "Creators",
  "Discount Codes",
  "Subscriptions",
  "Businesses",
  "Reports",
  "Taxonomy",
] as const;

const STATUSES: CreatorStatus[] = [
  "Draft",
  "Inactive",
  "Active",
  "Expired",
  "Suspended",
];

const ADMIN_UNLOCKED_STORAGE_KEY = "cc_admin_unlocked_v2";
const ADMIN_MASTER_SECRET_KEY =
  (import.meta.env["VITE_ADMIN_ACCESS_KEY"] as string | undefined)?.trim() ||
  "connectme2infludhund";

function isLocalEnvironment() {
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local")
  );
}

function checkIsAdminAuthorized(): boolean {
  if (typeof window === "undefined") {
    return false; // Always return false during SSR so public HTML is 100% 404
  }

  // 1. Localhost / Local dev is always unlocked
  if (isLocalEnvironment()) {
    return true;
  }

  // 2. Check if URL contains secret master key (?key=... or ?access_key=... or ?secret=... or ?pass=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam =
      urlParams.get("key") ||
      urlParams.get("access_key") ||
      urlParams.get("secret") ||
      urlParams.get("pass");

    if (keyParam && keyParam.trim() === ADMIN_MASTER_SECRET_KEY) {
      // Valid master key provided! Authorize this browser
      sessionStorage.setItem(ADMIN_UNLOCKED_STORAGE_KEY, "true");
      localStorage.setItem(ADMIN_UNLOCKED_STORAGE_KEY, "true");

      // Strip secret key from URL bar
      urlParams.delete("key");
      urlParams.delete("access_key");
      urlParams.delete("secret");
      urlParams.delete("pass");
      const cleanSearch = urlParams.toString();
      const newUrl =
        window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);

      return true;
    }
  } catch {
    // Ignore URL parse errors
  }

  // 3. Check persistent authorization in this browser
  try {
    if (
      sessionStorage.getItem(ADMIN_UNLOCKED_STORAGE_KEY) === "true" ||
      localStorage.getItem(ADMIN_UNLOCKED_STORAGE_KEY) === "true"
    ) {
      return true;
    }
  } catch {
    // Ignore storage errors
  }

  // Unauthorized -> Cloak portal as 404
  return false;
}

function lockAndCloakAdminPortal() {
  try {
    localStorage.removeItem(ADMIN_UNLOCKED_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_UNLOCKED_STORAGE_KEY);
  } catch {
    // ignore
  }
  window.location.href = "/admin";
}

function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    const isAuth = checkIsAdminAuthorized();
    setAuthorized(isAuth);
    setChecked(true);
  }, []);

  // During SSR or if unauthorized -> 100% 404 Page Not Found
  if (!checked || !authorized) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-7xl font-semibold text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-medium">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This page doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminStateProvider>
      <AdminPageContent />
    </AdminStateProvider>
  );
}

function AdminPageContent() {
  const { adminUser, adminLoading } = useAdminState();

  if (adminLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!adminUser) {
    return <AdminAuthBox />;
  }

  return <AdminDashboard />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Auth Box (Sign In Only)
// ─────────────────────────────────────────────────────────────────────────────
function AdminAuthBox() {
  const { loginAdmin } = useAdminState();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your admin email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await supabaseDb.signInAdmin(email.trim(), password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      loginAdmin(result);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-[75vh] bg-secondary/50 pb-16">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed -top-24 -right-24 size-80 rounded-full bg-saffrondeep/10 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 -left-24 size-72 rounded-full bg-accent/10 blur-3xl" />

      <section className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 text-center">
          <div className="max-w-xl w-full">
            <SectionEyebrow>
              <span className="flex items-center justify-center gap-1.5">
                <Lock className="size-3" />
                Restricted Access
              </span>
            </SectionEyebrow>
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/10 text-foreground ring-1 ring-border">
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Admin Sign In
              </h1>
            </div>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              Sign in with your administrator credentials to access the portal.
            </p>
          </div>

          <div className="mt-8 w-full max-w-md">
            <Card className="glass-card rounded-2xl border border-border/80 p-6 text-left shadow-xl sm:rounded-3xl sm:p-8">
              <div className="space-y-4">
                <Field label="Admin Email">
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="admin@influencerdhundo.com"
                    autoFocus
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <TextInput
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Enter admin password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </Field>

                {error ? (
                  <div className="rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                    {error}
                  </div>
                ) : null}

                <Button
                  variant="ink"
                  className="w-full justify-center py-3 font-semibold cursor-pointer"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Signing in..." : "Sign In to Admin"}
                </Button>
              </div>

              <div className="mt-5 border-t border-border pt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Secured · Admin access only
                </span>
                <button
                  type="button"
                  onClick={lockAndCloakAdminPortal}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-rose transition-colors cursor-pointer"
                  title="Remove browser authorization and revert to 404"
                >
                  <Lock className="size-3" />
                  Lock & Cloak
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics & Traffic Footprint View
// ─────────────────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function getSourceStyle(source: string) {
  const s = source.toLowerCase();
  if (s.includes("instagram")) {
    return {
      bg: "bg-gradient-to-r from-pink-500/15 via-rose-500/15 to-amber-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
      dot: "bg-pink-500",
      bar: "bg-gradient-to-r from-pink-500 to-rose-500",
    };
  }
  if (s.includes("whatsapp")) {
    return {
      bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
    };
  }
  if (s.includes("google")) {
    return {
      bg: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      dot: "bg-sky-500",
      bar: "bg-sky-500",
    };
  }
  if (s.includes("facebook")) {
    return {
      bg: "bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      dot: "bg-blue-600",
      bar: "bg-blue-600",
    };
  }
  if (s.includes("youtube")) {
    return {
      bg: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
      dot: "bg-red-500",
      bar: "bg-red-500",
    };
  }
  if (s.includes("twitter") || s.includes("x.com")) {
    return {
      bg: "bg-foreground/10 text-foreground border-border",
      dot: "bg-foreground",
      bar: "bg-foreground",
    };
  }
  return {
    bg: "bg-secondary text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    bar: "bg-primary",
  };
}

function AnalyticsTabContent({
  visits,
  loading,
  range,
  setRange,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  creators,
}: {
  visits: WebsiteVisit[];
  loading: boolean;
  range: "today" | "7d" | "30d" | "all";
  setRange: (r: "today" | "7d" | "30d" | "all") => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  onRefresh: () => void;
  creators: Creator[];
}) {
  const stats = useMemo(() => {
    const totalViews = visits.length;
    const uniqueSessionIds = new Set(visits.map((v) => v.sessionId));
    const uniqueVisitors = uniqueSessionIds.size;

    // Today vs Yesterday Traffic
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const todayVisitsCount = visits.filter(
      (v) => new Date(v.createdAt).getTime() >= startOfToday,
    ).length;
    const yesterdayVisitsCount = visits.filter((v) => {
      const t = new Date(v.createdAt).getTime();
      return t >= startOfYesterday && t < startOfToday;
    }).length;
    const dayTrendDiff = todayVisitsCount - yesterdayVisitsCount;
    const dayTrendPct = yesterdayVisitsCount
      ? Math.round(((todayVisitsCount - yesterdayVisitsCount) / yesterdayVisitsCount) * 100)
      : todayVisitsCount > 0
      ? 100
      : 0;

    // Devices
    const mobileCount = visits.filter((v) => v.deviceType === "Mobile").length;
    const desktopCount = visits.filter((v) => v.deviceType === "Desktop").length;
    const tabletCount = visits.filter((v) => v.deviceType === "Tablet").length;
    const mobilePct = totalViews ? Math.round((mobileCount / totalViews) * 100) : 0;
    const desktopPct = totalViews ? Math.round((desktopCount / totalViews) * 100) : 0;
    const tabletPct = totalViews ? Math.round((tabletCount / totalViews) * 100) : 0;

    // Cities
    const cityMap = new Map<string, { city: string; region: string; country: string; count: number }>();
    visits.forEach((v) => {
      const city = v.city || "Unknown City";
      const region = v.region || "";
      const country = v.country || "India";
      const key = `${city}-${region}`;
      const existing = cityMap.get(key) || { city, region, country, count: 0 };
      existing.count += 1;
      cityMap.set(key, existing);
    });
    const topCities = Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((c) => ({
        ...c,
        percentage: totalViews ? Math.round((c.count / totalViews) * 100) : 0,
      }));

    // States / Regions
    const regionMap = new Map<string, number>();
    visits.forEach((v) => {
      const reg = v.region && v.region !== "Unknown Region" ? v.region : "Other Region";
      regionMap.set(reg, (regionMap.get(reg) || 0) + 1);
    });
    const topRegions = Array.from(regionMap.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: totalViews ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Country (India vs International)
    const indiaCount = visits.filter(
      (v) => (v.country && v.country.toLowerCase() === "india") || v.countryCode === "IN",
    ).length;
    const intlCount = totalViews - indiaCount;
    const indiaPct = totalViews ? Math.round((indiaCount / totalViews) * 100) : 100;
    const intlPct = totalViews ? Math.round((intlCount / totalViews) * 100) : 0;

    // Traffic Sources
    const sourceMap = new Map<string, number>();
    visits.forEach((v) => {
      const src = v.referrerSource || "Direct";
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
    });
    const topSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalViews ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Funnel Specific Counts
    const funnelDiscovery = visits.filter((v) => v.path && v.path.startsWith("/discover")).length;
    const funnelPricing = visits.filter(
      (v) =>
        v.path &&
        (v.path.includes("/creator/plans") ||
          v.path.includes("/business/pricing") ||
          v.path.includes("pricing") ||
          v.path.includes("plans")),
    ).length;
    const funnelCreatorReg = visits.filter(
      (v) => v.path && (v.path.includes("/creator/register") || v.path.includes("/creator/signup")),
    ).length;
    const funnelBusinessReg = visits.filter(
      (v) => v.path && (v.path.includes("/business/signup") || v.path.includes("/business/register")),
    ).length;

    // Top Creators Viewed
    const creatorViewMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    visits.forEach((v) => {
      let cId = v.creatorId;
      let cName = v.creatorName;
      if (!cId && v.path && v.path.startsWith("/creators/")) {
        const rawSlug = (v.path.replace("/creators/", "").split("?")[0] || "").trim();
        if (rawSlug) {
          const matched = creators.find(
            (c) =>
              c.id.toLowerCase() === rawSlug.toLowerCase() ||
              c.displayName.toLowerCase() === rawSlug.toLowerCase() ||
              c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === rawSlug.toLowerCase() ||
              getCreatorProfileSlug(c).toLowerCase() === rawSlug.toLowerCase(),
          );
          if (matched) {
            cId = matched.id;
            cName = matched.displayName || matched.name;
          } else {
            cId = rawSlug;
            cName = rawSlug;
          }
        }
      }

      if (cId) {
        const creatorObj = creators.find((c) => c.id === cId);
        const name = cName || creatorObj?.displayName || creatorObj?.name || cId;
        const slug = creatorObj ? getCreatorProfileSlug(creatorObj) : cId;
        const existing = creatorViewMap.get(cId) || { id: cId, name, slug, count: 0 };
        existing.count += 1;
        creatorViewMap.set(cId, existing);
      }
    });
    const topCreators = Array.from(creatorViewMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Pages
    const pageMap = new Map<string, number>();
    visits.forEach((v) => {
      const cleanPath = v.path.split("?")[0] || "/";
      pageMap.set(cleanPath, (pageMap.get(cleanPath) || 0) + 1);
    });
    const topPages = Array.from(pageMap.entries())
      .map(([path, count]) => ({
        path,
        count,
        percentage: totalViews ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // OS Breakdown
    const osMap = new Map<string, number>();
    visits.forEach((v) => {
      const os = v.os || "Other";
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });
    const topOs = Array.from(osMap.entries())
      .map(([os, count]) => ({
        os,
        count,
        percentage: totalViews ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Browser Breakdown
    const browserMap = new Map<string, number>();
    visits.forEach((v) => {
      const b = v.browser || "Other";
      browserMap.set(b, (browserMap.get(b) || 0) + 1);
    });
    const topBrowsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: totalViews ? Math.round((count / totalViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalViews,
      uniqueVisitors,
      todayVisitsCount,
      yesterdayVisitsCount,
      dayTrendDiff,
      dayTrendPct,
      mobileCount,
      desktopCount,
      tabletCount,
      mobilePct,
      desktopPct,
      tabletPct,
      topCities,
      topRegions,
      indiaCount,
      intlCount,
      indiaPct,
      intlPct,
      topSources,
      topCreators,
      topPages,
      topOs,
      topBrowsers,
      funnelDiscovery,
      funnelPricing,
      funnelCreatorReg,
      funnelBusinessReg,
      topCityName: topCities[0]?.city || "No data yet",
      topSourceChannel: topSources[0]?.source || "Direct",
    };
  }, [visits, creators]);

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL BAR ── */}
      <Card className="p-4 bg-secondary/30 border border-border/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Traffic &amp; Visitor Footprint Engine</span>
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Live tracking of visitor cities, acquisition channels, popular creator profiles &amp; devices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Range Toggle */}
            <div className="flex rounded-xl bg-background p-1 ring-1 ring-border text-xs">
              {(
                [
                  { id: "today", label: "Today" },
                  { id: "7d", label: "Last 7 Days" },
                  { id: "30d", label: "Last 30 Days" },
                  { id: "all", label: "All Time" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    range === r.id
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Auto Refresh Toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                autoRefresh
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-background border-border text-muted-foreground"
              }`}
              title="Auto refresh every 15 seconds"
            >
              <Radio className={`size-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
              <span>{autoRefresh ? "Live (15s)" : "Auto-refresh Off"}</span>
            </button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-2 text-xs flex items-center gap-1.5 bg-background hover:bg-secondary"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ── HERO KPI CARDS (6 METRICS) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Card 1: Total Views */}
        <Card className="p-4 bg-secondary/20 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Page Views</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.totalViews.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
            <Activity className="size-3 text-emerald-500" />
            <span>Recorded hits</span>
          </p>
        </Card>

        {/* Card 2: Unique Visitors */}
        <Card className="p-4 bg-secondary/20 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Unique Visitors</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.uniqueVisitors.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Distinct people / sessions
          </p>
        </Card>

        {/* Card 3: Today's Live Traffic vs Yesterday */}
        <Card className="p-4 bg-secondary/20 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Today's Traffic</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.todayVisitsCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>vs {stats.yesterdayVisitsCount} yesterday</span>
            {stats.dayTrendDiff >= 0
              ? ` (+${stats.dayTrendDiff}, +${stats.dayTrendPct}%)`
              : ` (${stats.dayTrendDiff}, ${stats.dayTrendPct}%)`}
          </p>
        </Card>

        {/* Card 4: Top City */}
        <Card className="p-4 bg-secondary/20 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Top City Lead</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <MapPin className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate" title={stats.topCityName}>
            {stats.topCityName}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.topCities[0] ? `${stats.topCities[0].count} visits (${stats.topCities[0].percentage}%)` : "No visits"}
          </p>
        </Card>

        {/* Card 5: Top Channel */}
        <Card className="p-4 bg-secondary/20 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Top Source</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Share2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate" title={stats.topSourceChannel}>
            {stats.topSourceChannel}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {stats.topSources[0] ? `${stats.topSources[0].percentage}% share` : "No referrals"}
          </p>
        </Card>

        {/* Card 6: Mobile Share */}
        <Card className="p-4 bg-secondary/20 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Mobile Share</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <Smartphone className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            {stats.mobilePct}%
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {stats.mobileCount} mob / {stats.desktopCount} desk
          </p>
        </Card>
      </div>

      {/* ── KEY CONVERSION FUNNEL STATS ── */}
      <Card className="p-4.5 bg-secondary/15 border border-border/80">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Key Discovery &amp; Conversion Funnel Views
              </h3>
              <p className="text-[11px] text-muted-foreground">Traffic across high-intent pages &amp; onboarding flows</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Intent Tracking</span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="p-3 rounded-xl bg-background border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground block">🔍 Search Directory (/discover)</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-foreground">{stats.funnelDiscovery}</span>
              <span className="text-[11px] text-muted-foreground">
                {stats.totalViews ? Math.round((stats.funnelDiscovery / stats.totalViews) * 100) : 0}% traffic
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground block">💳 Plans &amp; Pricing (/plans)</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-foreground">{stats.funnelPricing}</span>
              <span className="text-[11px] text-muted-foreground">
                {stats.totalViews ? Math.round((stats.funnelPricing / stats.totalViews) * 100) : 0}% traffic
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground block">✍️ Creator Signup (/register)</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-foreground">{stats.funnelCreatorReg}</span>
              <span className="text-[11px] text-muted-foreground">
                {stats.totalViews ? Math.round((stats.funnelCreatorReg / stats.totalViews) * 100) : 0}% traffic
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground block">🏢 Business Signup (/business)</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-foreground">{stats.funnelBusinessReg}</span>
              <span className="text-[11px] text-muted-foreground">
                {stats.totalViews ? Math.round((stats.funnelBusinessReg / stats.totalViews) * 100) : 0}% traffic
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── EMPTY STATE IF NO DATA YET ── */}
      {visits.length === 0 && !loading && (
        <Card className="p-8 text-center border-dashed border-2 border-border/80">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Activity className="size-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-foreground">Waiting for First Visitor Footprints</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            The tracking beacon is active across your site. When users or businesses visit from Instagram, WhatsApp, Google or direct links, their city footprints, visited creators, and referral channels will appear here automatically in real time!
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/discover"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-all"
            >
              <span>Test Visit Discovery Page</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      )}

      {/* ── MAIN ANALYTICS GRIDS ── */}
      {visits.length > 0 && (
        <div className="space-y-6">
          {/* Row 1: Geographic Footprints + Traffic Acquisition Channels */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Visitor Cities & State Breakdown */}
            <Card className="p-5 border border-border/80">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Top Visitor Cities &amp; Locations</h3>
                    <p className="text-[11px] text-muted-foreground">Geographic footprints of users browsing your platform</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-bold">
                    🇮🇳 India ({stats.indiaPct}%)
                  </span>
                  {stats.intlCount > 0 && (
                    <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[11px] font-bold">
                      Global ({stats.intlPct}%)
                    </span>
                  )}
                </div>
              </div>

              {/* State Pills */}
              {stats.topRegions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pt-1 pb-2 border-b border-border/40">
                  <span className="text-[11px] font-semibold text-muted-foreground self-center mr-1">Top States:</span>
                  {stats.topRegions.map((r) => (
                    <span
                      key={r.region}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-medium text-foreground"
                    >
                      <span>{r.region}</span>
                      <strong className="text-muted-foreground font-mono">({r.count})</strong>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {stats.topCities.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No city data logged yet.</p>
                ) : (
                  stats.topCities.map((item, idx) => (
                    <div key={`${item.city}-${item.region}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-muted-foreground w-5 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-foreground truncate">
                            {item.city}
                          </span>
                          {item.region && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              · {item.region}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="font-bold text-foreground">{item.count}</span>
                          <span className="text-[11px] text-muted-foreground w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-saffrondeep transition-all duration-500"
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Traffic Sources & Acquisition */}
            <Card className="p-5 border border-border/80">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Share2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Acquisition &amp; Traffic Sources</h3>
                    <p className="text-[11px] text-muted-foreground">Where your website visitors are arriving from</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {stats.topSources.length} Channels
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {stats.topSources.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No referral channels recorded.</p>
                ) : (
                  stats.topSources.map((item, idx) => {
                    const style = getSourceStyle(item.source);
                    return (
                      <div key={item.source} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-muted-foreground w-5 shrink-0">
                              #{idx + 1}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.bg}`}
                            >
                              <span className={`size-1.5 rounded-full ${style.dot}`} />
                              {item.source}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="font-bold text-foreground">{item.count} visits</span>
                            <span className="text-[11px] text-muted-foreground w-10 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Row 2: Top Creators Viewed + Top Site Pages */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Creator Profiles Viewed */}
            <Card className="p-5 border border-border/80">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-tealdeep/10 text-tealdeep">
                    <User className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Most Viewed Creator Profiles</h3>
                    <p className="text-[11px] text-muted-foreground">Profiles attracting the most business views &amp; clicks</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {stats.topCreators.length} Creators
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {stats.topCreators.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No creator profile visits recorded yet in this time frame.
                  </p>
                ) : (
                  stats.topCreators.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-muted-foreground w-5 shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            /creators/{item.slug}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {item.count}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">views</span>
                        </div>
                        <Link
                          to="/creators/$creatorId"
                          params={{ creatorId: item.slug }}
                          search={{ preview: true }}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-background text-muted-foreground hover:text-foreground ring-1 ring-border shadow-xs"
                          title="View public creator profile"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top Site Pages Visited */}
            <Card className="p-5 border border-border/80">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Globe2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Top Site Pages &amp; Sections</h3>
                    <p className="text-[11px] text-muted-foreground">Most popular discovery &amp; landing pages</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {stats.topPages.length} Pages
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {stats.topPages.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No page paths recorded yet.</p>
                ) : (
                  stats.topPages.map((item, idx) => (
                    <div key={item.path} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-muted-foreground w-5 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono font-semibold text-foreground truncate">
                            {item.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="font-bold text-foreground">{item.count}</span>
                          <span className="text-[11px] text-muted-foreground w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Row 3: Devices, OS & Browsers Tech Breakdown */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Device Type */}
            <Card className="p-4.5 border border-border/80">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <Smartphone className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Device Breakdown</h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Smartphone className="size-3.5" /> Mobile
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {stats.mobileCount} ({stats.mobilePct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${stats.mobilePct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Monitor className="size-3.5" /> Desktop
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {stats.desktopCount} ({stats.desktopPct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${stats.desktopPct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Tablet className="size-3.5" /> Tablet
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {stats.tabletCount} ({stats.tabletPct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.tabletPct}%` }} />
                </div>
              </div>
            </Card>

            {/* Operating Systems */}
            <Card className="p-4.5 border border-border/80">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <Layers className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Operating Systems</h3>
              </div>
              <div className="mt-3 space-y-2">
                {stats.topOs.slice(0, 5).map((item) => (
                  <div key={item.os} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="font-medium text-foreground">{item.os}</span>
                    <span className="font-mono text-muted-foreground font-semibold">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Browsers */}
            <Card className="p-4.5 border border-border/80">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <Globe className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Browsers &amp; In-App</h3>
              </div>
              <div className="mt-3 space-y-2">
                {stats.topBrowsers.slice(0, 5).map((item) => (
                  <div key={item.browser} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="font-medium text-foreground">{item.browser}</span>
                    <span className="font-mono text-muted-foreground font-semibold">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 4: Live Real-time Activity Timeline Feed */}
          <Card className="p-5 border border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Activity className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">⚡ Real-Time Live Activity Feed</h3>
                  <p className="text-[11px] text-muted-foreground">Live narrative stream of incoming visitors as they browse</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Showing latest <strong className="text-foreground">{Math.min(visits.length, 30)}</strong> visitor events
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {visits.slice(0, 30).map((v) => {
                const srcStyle = getSourceStyle(v.referrerSource);
                const isCreator = Boolean(v.creatorName || (v.path && v.path.startsWith("/creators/")));
                const isDiscover = v.path && v.path.startsWith("/discover");
                const isPlans = v.path && (v.path.includes("pricing") || v.path.includes("plans"));
                const isReg = v.path && (v.path.includes("/creator/register") || v.path.includes("/creator/signup"));
                const isBiz = v.path && (v.path.includes("/business/signup") || v.path.includes("/business/register"));
                const isHome = v.path === "/" || v.path === "";

                const actionText = isCreator
                  ? `viewed ${v.creatorName ? `${v.creatorName}'s profile` : "a creator profile"}`
                  : isDiscover
                  ? "searched the discovery directory"
                  : isPlans
                  ? "opened subscription pricing & plans"
                  : isReg
                  ? "opened creator registration form"
                  : isBiz
                  ? "opened business signup form"
                  : isHome
                  ? "landed on homepage"
                  : `visited ${v.path}`;

                return (
                  <div
                    key={v.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-all text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] text-muted-foreground font-semibold shrink-0 min-w-[55px]">
                        {formatTimeAgo(v.createdAt)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-foreground">
                          Visitor from <strong className="text-foreground font-bold">{v.city || "Unknown City"}</strong>
                          {v.region && <span className="text-muted-foreground">, {v.region}</span>}{" "}
                          <span className="text-foreground">{actionText}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center pl-16 sm:pl-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${srcStyle.bg}`}
                      >
                        <span className={`size-1.5 rounded-full ${srcStyle.dot}`} />
                        {v.referrerSource}
                      </span>
                      <span className="rounded-md bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
                        {v.deviceType} · {v.os} · {v.browser}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { adminUser, signOutAdmin } = useAdminState();
  const {
    creators,
    business,
    reports,
    subscriptions,
    setCreatorStatus,
    removeCreator,
    toggleFeatured,
    updateCreator,
    activateSubscription,
    startFreeTrial,
    refreshFromSupabase,
  } = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Analytics");

  // Analytics state
  const [analyticsRange, setAnalyticsRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [visits, setVisits] = useState<WebsiteVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [liveAutoRefresh, setLiveAutoRefresh] = useState(true);

  const loadAnalytics = async (range = analyticsRange) => {
    setLoadingVisits(true);
    try {
      const data = await supabaseDb.fetchWebsiteVisits(range, 1000);
      setVisits(data);
    } catch {
      // ignore
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    refreshFromSupabase();
  }, [tab]);

  useEffect(() => {
    if (tab === "Analytics") {
      loadAnalytics(analyticsRange);
    }
  }, [tab, analyticsRange]);

  // Live polling every 15s if auto refresh is enabled and Analytics tab is active
  useEffect(() => {
    if (tab !== "Analytics" || !liveAutoRefresh) return;
    const interval = setInterval(() => {
      supabaseDb.fetchWebsiteVisits(analyticsRange, 1000).then((data) => {
        setVisits(data);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [tab, liveAutoRefresh, analyticsRange]);

  // Creator search & filter state
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorStatusFilter, setCreatorStatusFilter] = useState<string>("All");
  const [creatorCategoryFilter, setCreatorCategoryFilter] = useState<string>("All");
  const [creatorFunnelFilter, setCreatorFunnelFilter] = useState<
    "all" | "paid" | "promo100" | "trial" | "draft" | "expired" | "inactive"
  >("all");
  const [actionFeedback, setActionFeedback] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

  // Subscriptions tab state
  const [subSearch, setSubSearch] = useState("");
  const [subFilter, setSubFilter] = useState<"all" | "paid" | "promo100" | "trial" | "active" | "queued" | "expired">("all");

  const clearActionFeedback = () => {
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Funnel Quick Actions
  const handleGrantTrial = async (creatorId: string) => {
    try {
      await startFreeTrial(creatorId);
      setCreatorStatus(creatorId, "Active");
      setActionFeedback({ id: creatorId, msg: "⚡ 3-Day Free Trial activated successfully!", type: "success" });
      await refreshFromSupabase();
    } catch (err) {
      setActionFeedback({ id: creatorId, msg: `Error: ${String(err)}`, type: "error" });
    }
    clearActionFeedback();
  };

  const handleActivatePass = async (creator: Creator, planId: string, duration: string) => {
    try {
      await activateSubscription({
        creatorId: creator.id,
        planId,
        duration,
        price: 0,
      });
      setCreatorStatus(creator.id, "Active");
      setActionFeedback({ id: creator.id, msg: `💎 ${duration} plan activated successfully!`, type: "success" });
      await refreshFromSupabase();
    } catch (err) {
      setActionFeedback({ id: creator.id, msg: `Error: ${String(err)}`, type: "error" });
    }
    clearActionFeedback();
  };

  const handleExtendExpiry = async (creator: Creator, extraDays: number) => {
    try {
      const now = new Date();
      const base = creator.subscriptionExpiresAt && new Date(creator.subscriptionExpiresAt).getTime() > now.getTime()
        ? new Date(creator.subscriptionExpiresAt)
        : now;
      const newExpiry = new Date(base.getTime() + extraDays * 24 * 60 * 60 * 1000);
      await supabaseDb.updateSubscriptionExpiry(creator.id, newExpiry, creator.referralBonusDays ?? 0);
      await supabaseDb.updateCreatorStatus(creator.id, "Active");
      setCreatorStatus(creator.id, "Active");
      setActionFeedback({
        id: creator.id,
        msg: `⏳ Extended by +${extraDays} days! New expiry: ${newExpiry.toLocaleDateString("en-IN")}`,
        type: "success",
      });
      await refreshFromSupabase();
    } catch (err) {
      setActionFeedback({ id: creator.id, msg: `Error: ${String(err)}`, type: "error" });
    }
    clearActionFeedback();
  };

  // Helper functions for date formatting
  const formatDateToInput = (d: Date | string): string => {
    const date = typeof d === "string" ? new Date(d) : d;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTodayStr = () => formatDateToInput(new Date());
  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToInput(tomorrow);
  };
  const getFutureDateStr = (days: number) => {
    const future = new Date();
    future.setDate(future.getDate() + days);
    return formatDateToInput(future);
  };

  // Discount Codes state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // New code form state
  const [newCodeName, setNewCodeName] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>(getTodayStr());
  const [endDate, setEndDate] = useState<string>(getFutureDateStr(6));
  const [validityDays, setValidityDays] = useState<number>(7);
  const [maxUsesInput, setMaxUsesInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [selectedApplicablePlans, setSelectedApplicablePlans] = useState<string[]>([
    "1m",
    "3m",
    "6m",
    "1y",
  ]);
  const [targetEmailInput, setTargetEmailInput] = useState<string>("");
  const [targetPhoneInput, setTargetPhoneInput] = useState<string>("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit Code Modal State
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [editCodeName, setEditCodeName] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState<number>(30);
  const [editStartDate, setEditStartDate] = useState<string>(getTodayStr());
  const [editEndDate, setEditEndDate] = useState<string>(getFutureDateStr(6));
  const [editValidityDays, setEditValidityDays] = useState<number>(7);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editApplicablePlans, setEditApplicablePlans] = useState<string[]>([]);
  const [editTargetEmail, setEditTargetEmail] = useState<string>("");
  const [editTargetPhone, setEditTargetPhone] = useState<string>("");
  const [editMaxUses, setEditMaxUses] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Campaign Referral Attribution state
  const [selectedAttributionCode, setSelectedAttributionCode] = useState<string>("all");
  const [expandedReferrerId, setExpandedReferrerId] = useState<string | null>(null);
  const [attributionModalCode, setAttributionModalCode] = useState<DiscountCode | null>(null);

  // Load discount codes when tab is opened
  const loadDiscountCodes = async () => {
    setLoadingCodes(true);
    try {
      const data = await supabaseDb.fetchDiscountCodes();
      setDiscountCodes(data);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    if (tab === "Discount Codes") {
      loadDiscountCodes();
    }
  }, [tab]);

  const generateRandomCode = () => {
    const prefixes = ["DEAL", "SAVE", "OFFER", "VIP", "CREATOR", "PROMO"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewCodeName(`${prefix}${num}`);
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedApplicablePlans((prev) =>
      prev.includes(planId) ? prev.filter((p) => p !== planId) : [...prev, planId],
    );
  };

  const selectAllPlans = () => {
    setSelectedApplicablePlans(PLANS.map((p) => p.id));
  };

  const clearAllPlans = () => {
    setSelectedApplicablePlans([]);
  };

  const handleCreateCode = async () => {
    setCreateError("");
    setCreateSuccess("");

    const codeToCreate = newCodeName.trim().toUpperCase();
    if (!codeToCreate) {
      setCreateError("Please enter a code name or click generate.");
      return;
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      setCreateError("Discount percentage must be between 1% and 100%.");
      return;
    }

    if (selectedApplicablePlans.length === 0) {
      setCreateError("Please select at least one subscription plan this promo applies to.");
      return;
    }

    if (!startDate || !endDate) {
      setCreateError("Please select start and end dates.");
      return;
    }

    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      setCreateError("End date cannot be earlier than start date.");
      return;
    }

    const fromDate = `${startDate}T00:00:00`;
    const untilDate = `${endDate}T23:59:59.999`;
    const diffMs = new Date(untilDate).getTime() - new Date(fromDate).getTime();
    const calculatedValidityDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    setCreatingCode(true);

    try {
      const maxUses = maxUsesInput.trim() ? parseInt(maxUsesInput.trim(), 10) : undefined;
      const res = await supabaseDb.createDiscountCode({
        code: codeToCreate,
        discountPercent,
        discountType: "percentage",
        discountValue: discountPercent,
        validFrom: fromDate,
        validUntil: untilDate,
        validityDays: calculatedValidityDays,
        isActive: true,
        maxUses: isNaN(maxUses as number) ? undefined : maxUses,
        notes: notesInput.trim(),
        targetEmail: targetEmailInput.trim() || undefined,
        targetPhone: targetPhoneInput.trim() || undefined,
        applicablePlans: selectedApplicablePlans,
      });

      if (!res.success || !res.code) {
        setCreateError(res.error || "Failed to create discount code.");
        return;
      }

      const isFuture = new Date(fromDate).getTime() > Date.now();
      const modeMsg = isFuture
        ? `It is scheduled from ${new Date(res.code.validFrom).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} to ${new Date(res.code.validUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} and will auto-activate.`
        : `It is active until ${new Date(res.code.validUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}.`;

      setCreateSuccess(`Code ${res.code.code} saved successfully! ${modeMsg}`);
      setDiscountCodes((prev) => [res.code!, ...prev]);
      setNewCodeName("");
      setNotesInput("");
      setMaxUsesInput("");
      setTargetEmailInput("");
      setTargetPhoneInput("");
    } catch (e: any) {
      setCreateError(e.message || "Failed to create discount code.");
    } finally {
      setCreatingCode(false);
    }
  };

  const handleOpenEdit = (dc: DiscountCode) => {
    setEditingCode(dc);
    setEditCodeName(dc.code);
    setEditDiscountPercent(dc.discountPercent);
    setEditIsActive(dc.isActive);
    setEditApplicablePlans(dc.applicablePlans || PLANS.map((p) => p.id));
    setEditTargetEmail(dc.targetEmail || "");
    setEditTargetPhone(dc.targetPhone || "");
    setEditMaxUses(dc.maxUses != null ? String(dc.maxUses) : "");
    setEditNotes(dc.notes || "");
    setEditError("");

    const fromDateStr = formatDateToInput(dc.validFrom);
    const untilDateStr = formatDateToInput(dc.validUntil);
    setEditStartDate(fromDateStr);
    setEditEndDate(untilDateStr);
    setEditValidityDays(dc.validityDays);
  };

  const handleSaveEdit = async () => {
    if (!editingCode) return;
    setEditError("");

    const codeToUpdate = editCodeName.trim().toUpperCase();
    if (!codeToUpdate) {
      setEditError("Please enter a code name.");
      return;
    }

    if (editDiscountPercent <= 0 || editDiscountPercent > 100) {
      setEditError("Discount percentage must be between 1% and 100%.");
      return;
    }

    if (editApplicablePlans.length === 0) {
      setEditError("Please select at least one applicable subscription plan.");
      return;
    }

    if (!editStartDate || !editEndDate) {
      setEditError("Please select start and end dates.");
      return;
    }

    if (new Date(editEndDate).getTime() < new Date(editStartDate).getTime()) {
      setEditError("End date cannot be earlier than start date.");
      return;
    }

    const validFrom = `${editStartDate}T00:00:00`;
    const validUntil = `${editEndDate}T23:59:59.999`;
    const diffMs = new Date(validUntil).getTime() - new Date(validFrom).getTime();
    const calculatedDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    setSavingEdit(true);
    try {
      const maxUses = editMaxUses.trim() ? parseInt(editMaxUses.trim(), 10) : null;
      const res = await supabaseDb.updateDiscountCode(editingCode.id, {
        code: codeToUpdate,
        discountPercent: editDiscountPercent,
        discountType: "percentage",
        discountValue: editDiscountPercent,
        validFrom,
        validUntil,
        validityDays: calculatedDays,
        isActive: editIsActive,
        maxUses: maxUses === null || isNaN(maxUses) ? null : maxUses,
        notes: editNotes.trim(),
        targetEmail: editTargetEmail.trim() || null,
        targetPhone: editTargetPhone.trim() || null,
        applicablePlans: editApplicablePlans,
      });

      if (!res.success || !res.code) {
        setEditError(res.error || "Failed to update discount code.");
        return;
      }

      setDiscountCodes((prev) =>
        prev.map((c) => (c.id === editingCode.id ? res.code! : c)),
      );
      setEditingCode(null);
    } catch (e: any) {
      setEditError(e.message || "Failed to update discount code.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleCode = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const ok = await supabaseDb.toggleDiscountCodeActive(id, nextStatus);
    if (ok) {
      setDiscountCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: nextStatus } : c)),
      );
    }
  };

  const handleDeleteCode = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete code "${codeName}"?`)) return;
    const ok = await supabaseDb.deleteDiscountCode(id);
    if (ok) {
      setDiscountCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionEyebrow>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3" /> Admin · {adminUser?.name || adminUser?.email}
            </span>
          </SectionEyebrow>
          <h1 className="mt-2 text-3xl leading-tight">Manage the directory</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
            title="Lock and cloak the admin portal on this device (reverts to 404)"
            onClick={async () => {
              await signOutAdmin();
              lockAndCloakAdminPortal();
            }}
          >
            <Lock className="size-3.5" />
            Lock & Cloak
          </Button>
          <Button
            variant="ghost"
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-rose"
            onClick={() => signOutAdmin()}
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
                : "rounded-full px-4 py-2 text-xs font-medium text-muted-foreground ring-1 ring-border hover:text-foreground"
            }
          >
            {t === "Analytics" ? "📊 Traffic & Footprints" : t === "Discount Codes" ? "🏷️ Discount & Referral Codes" : t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: ANALYTICS & FOOTPRINTS ──────────────────────────────── */}
      {tab === "Analytics" ? (
        <div className="mt-5">
          <AnalyticsTabContent
            visits={visits}
            loading={loadingVisits}
            range={analyticsRange}
            setRange={setAnalyticsRange}
            autoRefresh={liveAutoRefresh}
            setAutoRefresh={setLiveAutoRefresh}
            onRefresh={() => loadAnalytics(analyticsRange)}
            creators={creators}
          />
        </div>
      ) : null}

      {/* ── TAB 1: CREATORS & REGISTRATION FUNNEL ────────────────────────────── */}
      {tab === "Creators" ? (
        <div className="mt-5 space-y-5">
          {/* ACTION FEEDBACK ALERT */}
          {actionFeedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold border transition-all ${
                actionFeedback.type === "success"
                  ? "bg-tealdeep/15 text-tealdeep border-tealdeep/30"
                  : "bg-rose/15 text-rose border-rose/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{actionFeedback.msg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* ── INTERACTIVE FUNNEL / LIFECYCLE STATS CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* 1. ALL PROFILES */}
            <button
              type="button"
              onClick={() => {
                setCreatorFunnelFilter("all");
                setCreatorStatusFilter("All");
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                creatorFunnelFilter === "all"
                  ? "bg-card border-primary ring-2 ring-primary/20 shadow-sm"
                  : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-semibold">All Profiles</span>
                <User className="size-3.5" />
              </div>
              <p className="text-xl font-bold text-foreground">{creators.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total database</p>
            </button>

            {/* 2. REAL PAID SUBSCRIBERS */}
            {(() => {
              const now = Date.now();
              const paidCount = creators.filter((c) =>
                subscriptions.some(
                  (s) =>
                    s.creatorId === c.id &&
                    !s.isTrial &&
                    s.planId !== "trial-3d" &&
                    (s.price ?? 0) > 0 &&
                    new Date(s.expiresAt || s.startedAt).getTime() > now,
                ),
              ).length;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCreatorFunnelFilter("paid");
                    setCreatorStatusFilter("All");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    creatorFunnelFilter === "paid"
                      ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                      : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                    <span className="text-[11px] font-bold">Paid Plans (₹)</span>
                    <CreditCard className="size-3.5" />
                  </div>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {paidCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Real money paid</p>
                </button>
              );
            })()}

            {/* 3. 100% OFF PROMO PASSES */}
            {(() => {
              const now = Date.now();
              const promo100Count = creators.filter((c) => {
                if (c.status === "Draft" || c.id.startsWith("draft-")) return false;
                const hasRealPaid = subscriptions.some(
                  (s) =>
                    s.creatorId === c.id &&
                    !s.isTrial &&
                    s.planId !== "trial-3d" &&
                    (s.price ?? 0) > 0 &&
                    new Date(s.expiresAt || s.startedAt).getTime() > now,
                );
                if (hasRealPaid) return false;
                return subscriptions.some(
                  (s) =>
                    s.creatorId === c.id &&
                    !s.isTrial &&
                    s.planId !== "trial-3d" &&
                    (s.price === 0 || s.price == null) &&
                    new Date(s.expiresAt || s.startedAt).getTime() > now,
                );
              }).length;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCreatorFunnelFilter("promo100");
                    setCreatorStatusFilter("All");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    creatorFunnelFilter === "promo100"
                      ? "bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                      : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                    <span className="text-[11px] font-bold">100% OFF Pass</span>
                    <Tag className="size-3.5" />
                  </div>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {promo100Count}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">₹0 promo pass</p>
                </button>
              );
            })()}

            {/* 4. FREE TRIAL */}
            {(() => {
              const now = Date.now();
              const trialCount = creators.filter((c) => {
                if (c.status === "Draft" || c.id.startsWith("draft-")) return false;
                const hasPaidOrPromo = subscriptions.some(
                  (s) =>
                    s.creatorId === c.id &&
                    !s.isTrial &&
                    s.planId !== "trial-3d" &&
                    new Date(s.expiresAt || s.startedAt).getTime() > now,
                );
                if (hasPaidOrPromo) return false;
                const expTime = c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).getTime() : 0;
                return (Boolean(c.trialStartedAt) && expTime > now) || (c.status === "Active" && expTime > now);
              }).length;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCreatorFunnelFilter("trial");
                    setCreatorStatusFilter("All");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    creatorFunnelFilter === "trial"
                      ? "bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
                      : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-1">
                    <span className="text-[11px] font-bold">Free Trial</span>
                    <Zap className="size-3.5" />
                  </div>
                  <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                    {trialCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">3-day trial active</p>
                </button>
              );
            })()}

            {/* 5. ABANDONED / INCOMPLETE DRAFTS */}
            {(() => {
              const draftCount = creators.filter(
                (c) => c.status === "Draft" || c.id.startsWith("draft-"),
              ).length;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCreatorFunnelFilter("draft");
                    setCreatorStatusFilter("All");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    creatorFunnelFilter === "draft"
                      ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                      : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                    <span className="text-[11px] font-bold">Backed Out</span>
                    <Clock className="size-3.5" />
                  </div>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {draftCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Incomplete leads</p>
                </button>
              );
            })()}

            {/* 6. EXPIRED PLANS */}
            {(() => {
              const now = Date.now();
              const expiredCount = creators.filter((c) => {
                if (c.status === "Draft" || c.id.startsWith("draft-")) return false;
                const expTime = c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).getTime() : 0;
                return c.status === "Expired" || (expTime > 0 && expTime <= now);
              }).length;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCreatorFunnelFilter("expired");
                    setCreatorStatusFilter("All");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    creatorFunnelFilter === "expired"
                      ? "bg-rose/10 border-rose ring-2 ring-rose/20 shadow-sm"
                      : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-rose mb-1">
                    <span className="text-[11px] font-bold">Expired</span>
                    <AlertTriangle className="size-3.5" />
                  </div>
                  <p className="text-xl font-bold text-rose">{expiredCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Need renewal</p>
                </button>
              );
            })()}

            {/* 7. INACTIVE / SUSPENDED */}
            {(() => {
              const inactiveCount = creators.filter(
                (c) => c.status === "Inactive" || c.status === "Suspended",
              ).length;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setCreatorFunnelFilter("inactive");
                    setCreatorStatusFilter("All");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    creatorFunnelFilter === "inactive"
                      ? "bg-foreground/10 border-foreground ring-2 ring-foreground/20 shadow-sm"
                      : "bg-secondary/40 border-border/70 hover:bg-secondary/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-semibold">Inactive / Hold</span>
                    <LogOut className="size-3.5" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Paused / Suspended</p>
                </button>
              );
            })()}
          </div>

          {/* SEARCH & FILTERS BAR */}
          <Card className="p-4 bg-secondary/30 border border-border/80">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Search className="size-4" />
                </div>
                <TextInput
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                  placeholder="Search by name, instagram, mobile, email, city, locality..."
                  className="pl-10 text-xs sm:text-sm bg-background"
                />
                {creatorSearch && (
                  <button
                    type="button"
                    onClick={() => setCreatorSearch("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={creatorFunnelFilter}
                  onChange={(e) => setCreatorFunnelFilter(e.target.value as any)}
                  className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="all">Funnel: All Profiles</option>
                  <option value="paid">💎 Paid Subscribers (Real Money)</option>
                  <option value="promo100">🎟️ 100% OFF Passes (₹0)</option>
                  <option value="trial">⚡ Free Trial Active</option>
                  <option value="draft">⏳ Backed Out / Draft Leads</option>
                  <option value="expired">🔴 Expired Subscriptions</option>
                  <option value="inactive">⚠️ Inactive / Suspended</option>
                </select>

                <select
                  value={creatorStatusFilter}
                  onChange={(e) => setCreatorStatusFilter(e.target.value)}
                  className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="All">All Statuses ({creators.length})</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s} ({creators.filter((c) => c.status === s).length})
                    </option>
                  ))}
                </select>

                <select
                  value={creatorCategoryFilter}
                  onChange={(e) => setCreatorCategoryFilter(e.target.value)}
                  className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden max-w-[150px]"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {(creatorSearch || creatorFunnelFilter !== "all" || creatorStatusFilter !== "All" || creatorCategoryFilter !== "All") && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreatorSearch("");
                      setCreatorFunnelFilter("all");
                      setCreatorStatusFilter("All");
                      setCreatorCategoryFilter("All");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* CREATOR LIST WITH LIFECYCLE & FUNNEL INTELLIGENCE */}
          {(() => {
            const now = Date.now();
            const filtered = creators.filter((c) => {
              const q = creatorSearch.toLowerCase().trim();
              if (q) {
                const matchName = c.name?.toLowerCase().includes(q);
                const matchDisplay = c.displayName?.toLowerCase().includes(q);
                const matchInsta = c.instagram?.toLowerCase().includes(q);
                const matchCity = c.city?.toLowerCase().includes(q);
                const matchLocality = c.locality?.toLowerCase().includes(q);
                const matchPhone = c.contact?.phone?.toLowerCase().includes(q);
                const matchEmail = c.contact?.email?.toLowerCase().includes(q);
                if (!matchName && !matchDisplay && !matchInsta && !matchCity && !matchLocality && !matchPhone && !matchEmail) {
                  return false;
                }
              }

              const isDraft = c.status === "Draft" || c.id.startsWith("draft-");
              const creatorSubs = subscriptions.filter((s) => s.creatorId === c.id);
              const hasRealPaidSub = creatorSubs.some(
                (s) =>
                  !s.isTrial &&
                  s.planId !== "trial-3d" &&
                  (s.price ?? 0) > 0 &&
                  (s.expiresAt ? new Date(s.expiresAt).getTime() > now : s.status === "active"),
              );
              const hasPromo100Sub = !hasRealPaidSub && creatorSubs.some(
                (s) =>
                  !s.isTrial &&
                  s.planId !== "trial-3d" &&
                  (s.price === 0 || s.price == null) &&
                  (s.expiresAt ? new Date(s.expiresAt).getTime() > now : s.status === "active" || s.isQueued),
              );
              const expTime = c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).getTime() : 0;
              const isExpired = !isDraft && (c.status === "Expired" || (expTime > 0 && expTime <= now));
              const isTrial =
                !isDraft &&
                !hasRealPaidSub &&
                !hasPromo100Sub &&
                !isExpired &&
                ((Boolean(c.trialStartedAt) && expTime > now) ||
                  creatorSubs.some((s) => (s.isTrial || s.planId === "trial-3d") && (s.expiresAt ? new Date(s.expiresAt).getTime() > now : true)));
              const isInactive = c.status === "Inactive" || c.status === "Suspended";

              if (creatorFunnelFilter === "paid" && !hasRealPaidSub) return false;
              if (creatorFunnelFilter === "promo100" && !hasPromo100Sub) return false;
              if (creatorFunnelFilter === "trial" && !isTrial) return false;
              if (creatorFunnelFilter === "draft" && !isDraft) return false;
              if (creatorFunnelFilter === "expired" && !isExpired) return false;
              if (creatorFunnelFilter === "inactive" && !isInactive) return false;

              if (creatorStatusFilter !== "All" && c.status !== creatorStatusFilter) return false;
              if (creatorCategoryFilter !== "All" && !c.categories?.includes(creatorCategoryFilter)) return false;

              return true;
            });

            if (filtered.length === 0) {
              return (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  No creators match the selected filters or search query.
                </Card>
              );
            }

            return (
              <div className="grid gap-4">
                {filtered.map((c) => {
                  const isDraft = c.status === "Draft" || c.id.startsWith("draft-");
                  // ── Comprehensive Subscriptions Inspection (Active + Queued) ──
                  const creatorSubs = subscriptions.filter((s) => s.creatorId === c.id);
                  const activeSub = creatorSubs.find((s) => {
                    const started = s.startedAt ? new Date(s.startedAt).getTime() : 0;
                    const expires = s.expiresAt ? new Date(s.expiresAt).getTime() : Infinity;
                    return (
                      !s.isQueued &&
                      s.status !== "queued" &&
                      started <= now &&
                      expires > now
                    );
                  }) || creatorSubs.find((s) => !s.isQueued && s.status === "active");

                  const queuedSubs = creatorSubs.filter((s) => {
                    const started = s.startedAt ? new Date(s.startedAt).getTime() : 0;
                    return s.isQueued || s.status === "queued" || started > now;
                  });

                  const activeRealPaidSub = activeSub && !activeSub.isTrial && activeSub.planId !== "trial-3d" && (activeSub.price ?? 0) > 0 ? activeSub : null;
                  const activePromo100Sub = activeSub && !activeSub.isTrial && activeSub.planId !== "trial-3d" && (activeSub.price === 0 || activeSub.price == null) ? activeSub : null;
                  const activeTrialSub = activeSub && (activeSub.isTrial || activeSub.planId === "trial-3d") ? activeSub : null;
                  const latestQueuedSub = queuedSubs[0];

                  const creatorExplicitExpTime = c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).getTime() : 0;
                  let latestSubExpTime = 0;
                  for (const s of creatorSubs) {
                    if (s.expiresAt) {
                      const t = new Date(s.expiresAt).getTime();
                      if (t > latestSubExpTime) latestSubExpTime = t;
                    }
                  }
                  const expTime = Math.max(creatorExplicitExpTime, latestSubExpTime);
                  const effectiveExpiryDate = expTime > 0 ? new Date(expTime) : null;
                  const hasExpiry = expTime > 0;
                  const isExpired = !isDraft && (c.status === "Expired" || (hasExpiry && expTime <= now));
                  
                  const isPaidSubscriber = Boolean(activeRealPaidSub) || (!activeTrialSub && !activePromo100Sub && queuedSubs.some(s => (s.price ?? 0) > 0) && hasExpiry && expTime > now);
                  const isPromo100Subscriber = !isPaidSubscriber && (Boolean(activePromo100Sub) || (!activeTrialSub && queuedSubs.some(s => (s.price === 0 || s.price == null)) && hasExpiry && expTime > now));
                  const isTrial = !isDraft && !isExpired && !isPaidSubscriber && !isPromo100Subscriber && (Boolean(activeTrialSub) || Boolean(c.trialStartedAt && hasExpiry && expTime > now));
                  const isLifetimeActive = !isDraft && !isPaidSubscriber && !isPromo100Subscriber && !isTrial && !isExpired && c.status === "Active" && !hasExpiry;

                  const daysRemaining = hasExpiry && expTime > now ? Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)) : null;
                  const daysExpiredAgo = hasExpiry && expTime <= now ? Math.max(1, Math.floor((now - expTime) / (1000 * 60 * 60 * 24))) : null;

                  const phoneClean = (c.contact?.phone || "").replace(/[^0-9]/g, "");
                  const waNumber = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
                  const waMsg = isDraft
                    ? `Hi ${c.name}, saw you started registering on Influencer Dhundo! Need any help completing your profile to get business deals?`
                    : isTrial
                      ? `Hi ${c.name}, how is your free trial on Influencer Dhundo going? Let us know if you have any questions!`
                      : isExpired
                        ? `Hi ${c.name}, your Influencer Dhundo pass has expired. Renew today to keep receiving business enquiries!`
                        : `Hi ${c.name}, reaching out from Influencer Dhundo team!`;
                  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}` : null;

                  return (
                    <Card
                      key={c.id}
                      className={`p-5 transition-all shadow-xs border ${
                        isDraft
                          ? "border-amber-500/40 bg-amber-500/[0.02]"
                          : isPaidSubscriber
                            ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                            : isTrial
                              ? "border-sky-500/40 bg-sky-500/[0.02]"
                              : isExpired
                                ? "border-rose/40 bg-rose/[0.02]"
                                : "border-border/80"
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* TOP ROW: PROFILE PHOTO, NAME, CONTACT, MANAGEMENT BUTTONS */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3.5">
                            <div className="relative shrink-0">
                              {c.photo ? (
                                <img
                                  src={c.photo}
                                  alt={c.name}
                                  loading="lazy"
                                  width={816}
                                  height={816}
                                  className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-border shadow-xs bg-secondary"
                                />
                              ) : (
                                <div className="size-14 shrink-0 rounded-2xl bg-secondary ring-1 ring-border flex items-center justify-center text-muted-foreground/50">
                                  <User className="size-7" />
                                </div>
                              )}
                              {c.featured && (
                                <span
                                  className="absolute -top-1 -right-1 size-3.5 rounded-full bg-saffrondeep ring-2 ring-background shadow-xs"
                                  title="Featured Creator"
                                />
                              )}
                            </div>

                            <div className="min-w-0 space-y-1">
                              {/* NAME & PRIMARY BADGES */}
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-foreground text-base leading-tight">
                                  {c.name}
                                </p>
                                {c.displayName && c.displayName !== c.name && (
                                  <span className="text-xs text-muted-foreground font-medium">
                                    ({c.displayName})
                                  </span>
                                )}

                                <StatusPill status={isExpired ? "Expired" : c.status} />

                                {c.featured ? (
                                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-saffrondeep border border-primary/20">
                                    Featured
                                  </span>
                                ) : null}
                              </div>

                              {/* LOCATION, FOLLOWERS & PRICE */}
                              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                                <span className="text-foreground/80 font-medium">
                                  {[c.locality, c.city].filter(Boolean).join(", ") || "Location unassigned"}
                                </span>
                                <span>·</span>
                                <span>{formatFollowers(c.followers)} followers</span>
                                <span>·</span>
                                <span className="text-saffrondeep font-semibold">
                                  {formatPrice(c.startingPrice)}
                                </span>
                                {c.categories?.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span>{c.categories.slice(0, 3).join(", ")}{c.categories.length > 3 ? ` +${c.categories.length - 3}` : ""}</span>
                                  </>
                                )}
                              </p>

                              {/* CONTACT DETAILS & 1-CLICK REACHOUT */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                                {c.contact?.phone ? (
                                  <span className="font-mono flex items-center gap-1 text-foreground/90">
                                    <Phone className="size-3 text-muted-foreground" />
                                    {c.contact.phone}
                                  </span>
                                ) : null}

                                {c.contact?.email ? (
                                  <span className="font-mono flex items-center gap-1 text-foreground/90">
                                    <Mail className="size-3 text-muted-foreground" />
                                    {c.contact.email}
                                  </span>
                                ) : null}

                                {c.instagram ? (
                                  <a
                                    href={`https://instagram.com/${c.instagram.replace("@", "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-tealdeep font-medium hover:underline flex items-center gap-0.5"
                                  >
                                    <span>{c.instagram}</span>
                                    <ExternalLink className="size-2.5" />
                                  </a>
                                ) : null}

                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-bold hover:bg-emerald-500/25 transition-colors"
                                  >
                                    <MessageSquare className="size-3" />
                                    WhatsApp
                                  </a>
                                )}

                                {c.contact?.phone && (
                                  <a
                                    href={`tel:${c.contact.phone}`}
                                    className="inline-flex items-center gap-1 rounded-lg bg-secondary text-foreground px-2 py-0.5 text-[11px] font-medium hover:bg-secondary/80 transition-colors"
                                  >
                                    <PhoneCall className="size-3" />
                                    Call
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* RIGHT: ADMIN CONTROLS */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2.5 py-1.5 text-xs flex items-center gap-1 ring-1 ring-border bg-background hover:bg-secondary cursor-pointer"
                              onClick={() => setEditingCreator(c)}
                            >
                              <Pencil className="size-3 text-primary" />
                              <span>Edit</span>
                            </Button>

                            <select
                              value={c.status}
                              onChange={(e) =>
                                setCreatorStatus(c.id, e.target.value as CreatorStatus)
                              }
                              className="rounded-xl bg-background px-2.5 py-1.5 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2.5 py-1.5 text-xs ring-1 ring-border"
                              onClick={() => toggleFeatured(c.id)}
                            >
                              {c.featured ? "★ Unfeature" : "☆ Feature"}
                            </Button>

                            {!isDraft && (
                              <Link
                                to="/creators/$creatorId"
                                params={{ creatorId: getCreatorProfileSlug(c) }}
                                className="rounded-xl bg-background px-2.5 py-1.5 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
                              >
                                View
                              </Link>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2 py-1.5 text-xs text-rose hover:bg-rose/10"
                              onClick={() => removeCreator(c.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* ── DEDICATED PLAN DURATION & VALIDITY STATUS BAR ── */}
                        <div
                          className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                            isDraft
                              ? "bg-amber-500/10 border-amber-500/30"
                              : queuedSubs.length > 0 && isTrial
                                ? "bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-emerald-500/10 border-sky-500/30"
                                : isPaidSubscriber
                                  ? "bg-emerald-500/10 border-emerald-500/30"
                                  : isPromo100Subscriber
                                    ? "bg-purple-500/10 border-purple-500/30"
                                    : isTrial
                                      ? "bg-sky-500/10 border-sky-500/30"
                                      : isExpired
                                        ? "bg-rose/10 border-rose/30"
                                        : "bg-secondary/60 border-border/80"
                          }`}
                        >
                          {/* PLAN NAME & EXPIRATION STATUS */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isDraft ? (
                              <span className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                                <Clock className="size-4 text-amber-600" />
                                <span>{c.acceptsProductsDetails || "Incomplete Registration (Backed Out)"}</span>
                              </span>
                            ) : isTrial ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300">
                                  <Zap className="size-4 text-sky-600" />
                                  <span>Active: 3-Day Free Trial</span>
                                  {activeTrialSub?.expiresAt && (
                                    <span className="font-normal text-sky-700 dark:text-sky-400">
                                      (expires {new Date(activeTrialSub.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})
                                    </span>
                                  )}
                                </span>

                                {/* QUEUED SUBSCRIPTIONS BADGE */}
                                {queuedSubs.map((qs, i) => (
                                  <span
                                    key={qs.id || i}
                                    className={`flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border shadow-2xs ${
                                      (qs.price ?? 0) > 0
                                        ? "bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border-emerald-500/50"
                                        : "bg-purple-500/25 text-purple-950 dark:text-purple-200 border-purple-500/50"
                                    }`}
                                  >
                                    <Layers className={`size-3.5 ${(qs.price ?? 0) > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-purple-700 dark:text-purple-400"}`} />
                                    <span>
                                      Queued: {qs.duration}{" "}
                                      {(qs.price ?? 0) > 0
                                        ? `(${formatPrice(qs.price)})`
                                        : `(100% OFF Pass${qs.referralCodeUsed ? ` • ${qs.referralCodeUsed}` : ""})`}
                                    </span>
                                    {qs.startedAt && (
                                      <span className="bg-background/80 rounded px-1.5 py-0.5 font-semibold text-[11px] text-foreground border border-border/60">
                                        📅 Starts: {new Date(qs.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    )}
                                    {qs.expiresAt && (
                                      <span className="bg-background/80 rounded px-1.5 py-0.5 font-semibold text-[11px] text-foreground border border-border/60">
                                        🏁 Ends: {new Date(qs.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : isPaidSubscriber ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                                  <CreditCard className="size-4 text-emerald-600" />
                                  <span>Paid Plan: {activeRealPaidSub?.duration || latestQueuedSub?.duration || "Paid Subscription"}</span>
                                  {(activeRealPaidSub?.price != null || latestQueuedSub?.price != null) && (
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                      ({formatPrice(activeRealPaidSub?.price ?? latestQueuedSub?.price ?? 0)})
                                    </span>
                                  )}
                                </span>

                                {/* ADDITIONAL QUEUED PLANS */}
                                {queuedSubs.filter((qs) => qs !== activeRealPaidSub).map((qs, i) => (
                                  <span
                                    key={qs.id || i}
                                    className={`flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border shadow-2xs ${
                                      (qs.price ?? 0) > 0
                                        ? "bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border-emerald-500/50"
                                        : "bg-purple-500/25 text-purple-950 dark:text-purple-200 border-purple-500/50"
                                    }`}
                                  >
                                    <Layers className={`size-3.5 ${(qs.price ?? 0) > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-purple-700 dark:text-purple-400"}`} />
                                    <span>
                                      Queued: {qs.duration}{" "}
                                      {(qs.price ?? 0) > 0
                                        ? `(${formatPrice(qs.price)})`
                                        : `(100% OFF Pass${qs.referralCodeUsed ? ` • ${qs.referralCodeUsed}` : ""})`}
                                    </span>
                                    {qs.startedAt && (
                                      <span className="bg-background/80 rounded px-1.5 py-0.5 font-semibold text-[11px] text-foreground border border-border/60">
                                        📅 Starts: {new Date(qs.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    )}
                                    {qs.expiresAt && (
                                      <span className="bg-background/80 rounded px-1.5 py-0.5 font-semibold text-[11px] text-foreground border border-border/60">
                                        🏁 Ends: {new Date(qs.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : isPromo100Subscriber ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-300">
                                  <Tag className="size-4 text-purple-600" />
                                  <span>100% OFF Pass: {activePromo100Sub?.duration || latestQueuedSub?.duration || "1 Month"}</span>
                                  <span className="font-semibold text-purple-700 dark:text-purple-400">
                                    (₹0 {activePromo100Sub?.referralCodeUsed || latestQueuedSub?.referralCodeUsed ? `• ${activePromo100Sub?.referralCodeUsed || latestQueuedSub?.referralCodeUsed}` : "Promo"})
                                  </span>
                                </span>

                                {/* ADDITIONAL QUEUED PLANS */}
                                {queuedSubs.filter((qs) => qs !== activePromo100Sub).map((qs, i) => (
                                  <span
                                    key={qs.id || i}
                                    className={`flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border shadow-2xs ${
                                      (qs.price ?? 0) > 0
                                        ? "bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border-emerald-500/50"
                                        : "bg-purple-500/25 text-purple-950 dark:text-purple-200 border-purple-500/50"
                                    }`}
                                  >
                                    <Layers className={`size-3.5 ${(qs.price ?? 0) > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-purple-700 dark:text-purple-400"}`} />
                                    <span>
                                      Queued: {qs.duration}{" "}
                                      {(qs.price ?? 0) > 0
                                        ? `(${formatPrice(qs.price)})`
                                        : `(100% OFF Pass${qs.referralCodeUsed ? ` • ${qs.referralCodeUsed}` : ""})`}
                                    </span>
                                    {qs.startedAt && (
                                      <span className="bg-background/80 rounded px-1.5 py-0.5 font-semibold text-[11px] text-foreground border border-border/60">
                                        📅 Starts: {new Date(qs.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    )}
                                    {qs.expiresAt && (
                                      <span className="bg-background/80 rounded px-1.5 py-0.5 font-semibold text-[11px] text-foreground border border-border/60">
                                        🏁 Ends: {new Date(qs.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : isExpired ? (
                              <span className="flex items-center gap-1.5 font-bold text-rose">
                                <AlertTriangle className="size-4" />
                                <span>Plan Expired (Needs Renewal)</span>
                              </span>
                            ) : isLifetimeActive ? (
                              <span className="flex items-center gap-1.5 font-bold text-tealdeep">
                                <CheckCircle2 className="size-4" />
                                <span>Plan: Directory Active (Unrestricted Access)</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                                <span>Status: {c.status}</span>
                              </span>
                            )}

                            {/* TOTAL DAYS REMAINING COUNTDOWN PILL */}
                            {daysRemaining !== null ? (
                              <span className="rounded-lg bg-background px-2.5 py-1 text-xs font-bold text-foreground border border-border shadow-2xs">
                                ⏳ {daysRemaining} Day{daysRemaining === 1 ? "" : "s"} Total Validity
                                {effectiveExpiryDate ? ` · Valid until ${effectiveExpiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                              </span>
                            ) : daysExpiredAgo !== null ? (
                              <span className="rounded-lg bg-rose/20 px-2.5 py-1 text-xs font-bold text-rose border border-rose/40">
                                Ended {daysExpiredAgo} day{daysExpiredAgo === 1 ? "" : "s"} ago ({effectiveExpiryDate ? effectiveExpiryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""})
                              </span>
                            ) : isLifetimeActive ? (
                              <span className="rounded-lg bg-tealdeep/15 px-2.5 py-1 text-xs font-bold text-tealdeep border border-tealdeep/30">
                                ✓ No expiration date
                              </span>
                            ) : null}

                            {/* LAST TRANSACTION NOTE */}
                            {latestQueuedSub?.referralCodeUsed && (
                              <span className="rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-mono text-muted-foreground border border-border">
                                Coupon: {latestQueuedSub.referralCodeUsed}
                              </span>
                            )}
                          </div>

                          {/* QUICK PLAN CHANGER / EXTENDER BUTTONS */}
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-muted-foreground font-semibold mr-0.5">Quick Plan:</span>
                            <button
                              type="button"
                              onClick={() => handleGrantTrial(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-500/30 transition-colors cursor-pointer"
                              title="Grant 3-day free trial"
                            >
                              +3d Trial
                            </button>
                            <button
                              type="button"
                              onClick={() => handleActivatePass(c, "1m", "1 Month")}
                              className="px-2.5 py-1 rounded-lg bg-tealdeep/15 hover:bg-tealdeep/25 text-tealdeep text-xs font-bold border border-tealdeep/30 transition-colors cursor-pointer"
                              title="Activate 1-month paid pass"
                            >
                              +1M
                            </button>
                            <button
                              type="button"
                              onClick={() => handleActivatePass(c, "3m", "3 Months")}
                              className="px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-saffrondeep text-xs font-bold border border-primary/30 transition-colors cursor-pointer"
                              title="Activate 3-months paid pass"
                            >
                              +3M
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendExpiry(c, 7)}
                              className="px-2 py-1 rounded-lg bg-background hover:bg-secondary text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
                              title="Extend expiration by 7 days"
                            >
                              +7d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendExpiry(c, 30)}
                              className="px-2 py-1 rounded-lg bg-background hover:bg-secondary text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
                              title="Extend expiration by 30 days"
                            >
                              +30d
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* ── TAB 2: DISCOUNT & REFERRAL CODES ────────────────────────────── */}
      {tab === "Discount Codes" ? (
        <div className="mt-5 space-y-6">
          
          {/* CREATE CODE CARD */}
          <Card className="p-6 border border-border/90 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-tealdeep/10 text-tealdeep">
                <Tag className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Create Referral / Discount Code</h2>
                <p className="text-xs text-muted-foreground">
                  Create promo codes for today or schedule them for a future single day or date range. Scheduled codes auto-activate when their date arrives.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* CODE NAME & DISCOUNT PERCENTAGE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Code Name / Identifier" hint="Unique promo coupon code">
                  <div className="flex gap-2">
                    <TextInput
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      placeholder="e.g. DIWALI50, VIPCREATOR"
                      className="font-mono uppercase tracking-wider font-semibold"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={generateRandomCode}
                      className="shrink-0 text-xs flex items-center gap-1.5 ring-1 ring-border"
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      Generate
                    </Button>
                  </div>
                </Field>

                <Field label="Discount Percentage (%)" hint="Enter 100 for 100% Free Pass (₹0)">
                  <div className="relative">
                    <TextInput
                      type="number"
                      min={1}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      placeholder="e.g. 20, 50, 100"
                      className="font-mono pr-8"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-muted-foreground">
                      %
                    </div>
                  </div>
                </Field>
              </div>

              {/* SCHEDULE & VALIDITY SETTINGS (STREAMLINED) */}
              <div className="rounded-2xl border border-border/80 bg-secondary/25 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Calendar className="size-3.5 text-primary" />
                    <span>Validity &amp; Scheduling</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Select dates or type days — auto-activates &amp; auto-deactivates
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Start Date (Valid From)" hint="Defaults to today, or pick future date">
                    <DatePicker
                      value={startDate}
                      minDate={getTodayStr()}
                      onChange={(val) => {
                        if (!val) return;
                        setStartDate(val);
                        const startObj = new Date(val + "T00:00:00");
                        const newEndObj = new Date(startObj.getTime() + Math.max(0, validityDays - 1) * 86400000);
                        setEndDate(formatDateToInput(newEndObj));
                      }}
                      placeholder="Select start date"
                    />
                  </Field>

                  <Field label="End Date (Valid Until)" hint="Last valid day">
                    <DatePicker
                      value={endDate}
                      minDate={startDate || getTodayStr()}
                      onChange={(val) => {
                        if (!val) return;
                        setEndDate(val);
                        const diffMs = new Date(val + "T23:59:59").getTime() - new Date(startDate + "T00:00:00").getTime();
                        const calculatedDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
                        setValidityDays(calculatedDays);
                      }}
                      placeholder="Select end date"
                    />
                  </Field>

                  <Field label="Duration (Days)" hint="Or type number of days">
                    <div className="relative">
                      <TextInput
                        type="number"
                        min={1}
                        max={365}
                        value={validityDays}
                        onChange={(e) => {
                          const days = Math.max(1, Number(e.target.value));
                          setValidityDays(days);
                          const startObj = new Date(startDate + "T00:00:00");
                          const newEndObj = new Date(startObj.getTime() + Math.max(0, days - 1) * 86400000);
                          setEndDate(formatDateToInput(newEndObj));
                        }}
                        placeholder="Days (e.g. 7)"
                        className="font-mono pr-14"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-muted-foreground">
                        Days
                      </div>
                    </div>
                  </Field>
                </div>

                {/* Smart Live Preview Alert */}
                {(() => {
                  const isFuture = new Date(startDate + "T00:00:00").getTime() > Date.now();
                  const isSingleDay = startDate === endDate;
                  const startFormatted = new Date(startDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const endFormatted = new Date(endDate + "T23:59:59").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  if (isFuture) {
                    return (
                      <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5 text-xs text-sky-700 dark:text-sky-300 flex items-center gap-2">
                        <Clock className="size-3.5 shrink-0" />
                        <span>
                          {isSingleDay ? (
                            <>
                              🎯 <strong>Scheduled (Single Day)</strong>: Will automatically activate on{" "}
                              <strong>{startFormatted}</strong> (1 Day).
                            </>
                          ) : (
                            <>
                              🗓️ <strong>Scheduled (Date Range)</strong>: Will automatically activate on{" "}
                              <strong>{startFormatted}</strong> and deactivate after <strong>{endFormatted}</strong> ({validityDays} Day{validityDays > 1 ? "s" : ""}).
                            </>
                          )}
                          {" "}Saved in dashboard for future reactivation.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-xl bg-tealdeep/10 border border-tealdeep/20 p-2.5 text-xs text-tealdeep flex items-center gap-2">
                      <Sparkles className="size-3.5 shrink-0" />
                      <span>
                        ⚡ <strong>Active immediately</strong>: Valid from today until{" "}
                        <strong>{endFormatted}</strong> ({validityDays} Day{validityDays > 1 ? "s" : ""}). Deactivates after {endFormatted} without expiring permanently.
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* APPLICABLE SUBSCRIPTION PLANS */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Layers className="size-3.5 text-primary" />
                    <span>Applicable Subscription Plans</span>
                    <span className="text-muted-foreground font-normal">
                      ({selectedApplicablePlans.length} selected)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPlans}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground/50">·</span>
                    <button
                      type="button"
                      onClick={clearAllPlans}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLANS.map((plan) => {
                    const isSelected = selectedApplicablePlans.includes(plan.id);
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => togglePlanSelection(plan.id)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-tealdeep bg-tealdeep/10 text-foreground ring-1 ring-tealdeep/40 shadow-2xs"
                            : "border-border bg-background/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">{plan.duration}</span>
                          <span
                            className={`size-4 rounded-full flex items-center justify-center text-[10px] ${
                              isSelected
                                ? "bg-tealdeep text-white"
                                : "border border-border text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          {plan.duration} · ₹{plan.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedApplicablePlans.length === 0 && (
                  <p className="text-[11px] text-rose font-medium">
                    ⚠️ Please select at least one plan for this promo code to be redeemable.
                  </p>
                )}
              </div>

              {/* RESTRICT TO SPECIFIC CREATOR (OPTIONAL) */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <UserCheck className="size-3.5 text-primary" />
                  <span>Restrict to Specific Creator (Optional)</span>
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">
                  Leave blank to allow any registered creator to use this code. Fill in email or phone to lock this code exclusively to one creator.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Allowed Email Address" hint="Creator must be logged in with this email">
                    <div className="relative">
                      <TextInput
                        type="email"
                        value={targetEmailInput}
                        onChange={(e) => setTargetEmailInput(e.target.value)}
                        placeholder="e.g. creator@example.com"
                        className="pl-8"
                      />
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-muted-foreground">
                        <Mail className="size-3.5" />
                      </div>
                    </div>
                  </Field>

                  <Field label="Allowed Phone Number" hint="Creator profile contact must match">
                    <div className="relative">
                      <TextInput
                        type="tel"
                        value={targetPhoneInput}
                        onChange={(e) => setTargetPhoneInput(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="pl-8 font-mono"
                      />
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-muted-foreground">
                        <Phone className="size-3.5" />
                      </div>
                    </div>
                  </Field>
                </div>
              </div>

              {/* MAX REDEMPTIONS & NOTES */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Max Redemptions (Optional)" hint="Leave empty for unlimited">
                  <TextInput
                    type="number"
                    min={1}
                    value={maxUsesInput}
                    onChange={(e) => setMaxUsesInput(e.target.value)}
                    placeholder="e.g. 50"
                    className="font-mono"
                  />
                </Field>

                <Field label="Notes / Campaign Tag (Optional)" hint="For admin reference only">
                  <TextInput
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Special partnership / Bangalore bloggers"
                  />
                </Field>
              </div>

              {createError && (
                <div className="rounded-xl bg-rose/10 border border-rose/30 p-3 text-xs font-medium text-rose flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="rounded-xl bg-accent/15 border border-accent/30 p-3 text-xs font-medium text-tealdeep flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <Button
                variant="ink"
                onClick={handleCreateCode}
                disabled={creatingCode}
                className="w-full sm:w-auto justify-center px-6 py-2.5 font-semibold flex items-center gap-2"
              >
                <Plus className="size-4" />
                {creatingCode ? "Saving Code..." : "Save Discount Code"}
              </Button>
            </div>
          </Card>

          {/* LIST OF CREATED CODES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span>Active &amp; Scheduled Discount Codes</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-mono">
                  {discountCodes.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={loadDiscountCodes}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RefreshCw className={`size-3.5 ${loadingCodes ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loadingCodes ? (
              <div className="flex justify-center p-8">
                <div className="size-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
              </div>
            ) : discountCodes.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No discount codes created yet. Use the form above to generate your first offer!
              </Card>
            ) : (
              <div className="grid gap-3">
                {discountCodes.map((dc) => {
                  const now = Date.now();
                  const validFromTime = new Date(dc.validFrom).getTime();
                  const validUntilTime = new Date(dc.validUntil).getTime();
                  
                  const isScheduled = now < validFromTime && dc.isActive;
                  const isActiveNow = now >= validFromTime && now <= validUntilTime && dc.isActive;
                  const isEnded = now > validUntilTime;
                  const isManuallyDeactivated = !dc.isActive && !isEnded;
                  const isLimitReached = dc.maxUses != null && dc.usageCount >= dc.maxUses;

                  const applicablePlans = dc.applicablePlans || [];
                  const isTargeted = Boolean(dc.targetEmail || dc.targetPhone);

                  return (
                    <Card key={dc.id} className="p-4.5 border border-border/80">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-base font-bold tracking-wider text-foreground">
                              {dc.code}
                            </span>
                            
                            <span className="rounded-full bg-tealdeep/15 text-tealdeep px-2.5 py-0.5 text-xs font-bold">
                              {dc.discountPercent === 100
                                ? "100% (Free Pass)"
                                : `${dc.discountPercent}% OFF`}
                            </span>

                            {isActiveNow ? (
                              <span className="rounded-full bg-accent/25 text-tealdeep px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-tealdeep animate-pulse" />
                                Active Now
                              </span>
                            ) : isScheduled ? (
                              <span className="rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1">
                                <Clock className="size-3" />
                                Scheduled (Starts {new Date(dc.validFrom).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})
                              </span>
                            ) : isEnded ? (
                              <span className="rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium">
                                Deactivated (Period Ended)
                              </span>
                            ) : isLimitReached ? (
                              <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-semibold">
                                Limit Reached
                              </span>
                            ) : isManuallyDeactivated ? (
                              <span className="rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium">
                                Deactivated
                              </span>
                            ) : (
                              <span className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] font-bold">
                                Inactive
                              </span>
                            )}

                            {isTargeted ? (
                              <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                                <UserCheck className="size-3" />
                                Restricted
                              </span>
                            ) : (
                              <span className="rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                                <Globe className="size-3" />
                                All Creators
                              </span>
                            )}
                          </div>

                          {/* APPLICABLE PLANS BADGES */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                              <Layers className="size-3 text-muted-foreground" />
                              Plans:
                            </span>
                            {applicablePlans.length === 0 || applicablePlans.includes("all") ? (
                              <span className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                                All Plans
                              </span>
                            ) : (
                              applicablePlans.map((pId) => {
                                const matched = PLANS.find((p) => p.id === pId);
                                return (
                                  <span
                                    key={pId}
                                    className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                                  >
                                    {matched ? matched.duration : pId}
                                  </span>
                                );
                              })
                            )}
                          </div>

                          {/* TARGET CREATOR RESTRICTIONS */}
                          {isTargeted && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              {dc.targetEmail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="size-3" />
                                  <span>{dc.targetEmail}</span>
                                </span>
                              )}
                              {dc.targetPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3" />
                                  <span>{dc.targetPhone}</span>
                                </span>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 items-center">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              <span>
                                {new Date(dc.validFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {" → "}
                                {new Date(dc.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {" "}
                                <strong className="text-foreground font-semibold">({dc.validityDays} Day{dc.validityDays > 1 ? "s" : ""})</strong>
                              </span>
                            </span>
                            <span>·</span>
                            <span>
                              Used: <strong>{dc.usageCount} time{dc.usageCount !== 1 ? "s" : ""}</strong>
                              {dc.maxUses != null ? ` / ${dc.maxUses} max` : " (Unlimited)"}
                            </span>
                            {dc.notes && (
                              <>
                                <span>·</span>
                                <span className="italic text-foreground/80">{dc.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* VIEW REFERRER ATTRIBUTION */}
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs flex items-center gap-1.5 ring-1 ring-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold bg-emerald-500/5"
                            onClick={() => {
                              setSelectedAttributionCode(dc.code);
                              setAttributionModalCode(dc);
                            }}
                            title="View which creators referred these code redemptions"
                          >
                            <Users className="size-3.5 text-emerald-600" />
                            <span>Referrers ({dc.usageCount})</span>
                          </Button>

                          {/* EDIT CODE */}
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs flex items-center gap-1.5 ring-1 ring-border text-foreground hover:bg-secondary"
                            onClick={() => handleOpenEdit(dc)}
                          >
                            <Pencil className="size-3 text-primary" />
                            <span>Edit</span>
                          </Button>

                          {/* COPY CODE */}
                          <Button
                            variant="ghost"
                            className="px-3 py-1.5 text-xs flex items-center gap-1 ring-1 ring-border"
                            onClick={() => handleCopyCode(dc.code)}
                          >
                            {copiedCode === dc.code ? (
                              <>
                                <Check className="size-3.5 text-tealdeep" />
                                <span className="text-tealdeep font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </Button>

                          {/* TOGGLE ACTIVE / DEACTIVATE */}
                          <Button
                            variant="ghost"
                            className={`px-3 py-1.5 text-xs ${
                              dc.isActive ? "text-muted-foreground hover:text-foreground" : "text-tealdeep font-semibold hover:bg-tealdeep/10"
                            }`}
                            onClick={() => handleToggleCode(dc.id, dc.isActive)}
                          >
                            {dc.isActive ? "Deactivate" : "Activate"}
                          </Button>

                          {/* DELETE */}
                          <Button
                            variant="ghost"
                            className="px-2.5 py-1.5 text-xs text-rose hover:bg-rose/10"
                            onClick={() => handleDeleteCode(dc.id, dc.code)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CAMPAIGN REFERRAL ATTRIBUTION MATRIX ────────────────────── */}
          <Card className="p-6 border border-emerald-500/30 bg-emerald-500/[0.02] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  <Users className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Promo Code × Referrer Attribution Matrix</h2>
                  <p className="text-xs text-muted-foreground">
                    Track exactly which referring creators brought subscribers who redeemed each promo or 100% OFF pass.
                  </p>
                </div>
              </div>

              {/* PROMO CODE SELECTOR DROPDOWN */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">Filter by Code:</span>
                <select
                  value={selectedAttributionCode}
                  onChange={(e) => setSelectedAttributionCode(e.target.value)}
                  className="rounded-xl bg-background px-3 py-1.5 text-xs font-bold font-mono ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="all">All Promo Codes Combined</option>
                  {discountCodes.map((dc) => (
                    <option key={dc.id} value={dc.code}>
                      {dc.code} ({dc.discountPercent}% OFF) · {dc.usageCount} uses
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ATTRIBUTION CALCULATIONS & BREAKDOWN */}
            {(() => {
              // 1. Filter relevant subscriptions matching selected code (or all promo codes)
              const matchingSubs = subscriptions.filter((s) => {
                if (!s.referralCodeUsed) return false;
                const codeUsed = s.referralCodeUsed.trim().toUpperCase();
                if (selectedAttributionCode === "all") {
                  return discountCodes.some((dc) => dc.code.toUpperCase() === codeUsed);
                }
                return codeUsed === selectedAttributionCode.toUpperCase();
              });

              if (matchingSubs.length === 0) {
                return (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">No promo code redemptions recorded for this selection yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      When a creator subscribes using a discount code, this matrix will automatically map who referred them.
                    </p>
                  </div>
                );
              }

              // 2. Group redemptions by Referrer ID (or 'organic' for direct signups)
              type ReferrerAttributionGroup = {
                referrerId: string;
                referrer: Creator | null;
                isOrganic: boolean;
                redemptionsCount: number;
                totalRevenue: number;
                creators: Array<{
                  creator: Creator | null;
                  creatorId: string;
                  sub: typeof matchingSubs[0];
                  code: string;
                }>;
              };

              const groupsMap = new Map<string, ReferrerAttributionGroup>();

              matchingSubs.forEach((s) => {
                const creator = creators.find((c) => c.id === s.creatorId) || null;
                const referrerId = creator?.referredBy?.trim() || "organic";
                const isOrganic = referrerId === "organic";
                const referrer = !isOrganic ? (creators.find((c) => c.id === referrerId) || null) : null;

                if (!groupsMap.has(referrerId)) {
                  groupsMap.set(referrerId, {
                    referrerId,
                    referrer,
                    isOrganic,
                    redemptionsCount: 0,
                    totalRevenue: 0,
                    creators: [],
                  });
                }

                const group = groupsMap.get(referrerId)!;
                group.redemptionsCount += 1;
                group.totalRevenue += s.price || 0;
                group.creators.push({
                  creator,
                  creatorId: s.creatorId,
                  sub: s,
                  code: s.referralCodeUsed || "",
                });
              });

              const groups = Array.from(groupsMap.values()).sort((a, b) => b.redemptionsCount - a.redemptionsCount);
              const totalRedemptions = matchingSubs.length;
              const referredRedemptions = groups.filter((g) => !g.isOrganic).reduce((sum, g) => sum + g.redemptionsCount, 0);
              const organicRedemptions = groups.find((g) => g.isOrganic)?.redemptionsCount || 0;

              return (
                <div className="space-y-5 pt-4">
                  {/* SUMMARY STATS TILES */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-background border border-border p-3.5 shadow-2xs">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Code Redemptions</span>
                      <p className="text-2xl font-bold text-foreground mt-0.5">{totalRedemptions}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Across selected campaign filter</p>
                    </div>

                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 shadow-2xs">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Referred by Creators</span>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {referredRedemptions} <span className="text-xs font-normal text-muted-foreground">({Math.round((referredRedemptions / totalRedemptions) * 100)}%)</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Joined via personal referral links</p>
                    </div>

                    <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3.5 shadow-2xs">
                      <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">Direct / Organic</span>
                      <p className="text-2xl font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                        {organicRedemptions} <span className="text-xs font-normal text-muted-foreground">({Math.round((organicRedemptions / totalRedemptions) * 100)}%)</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Used code without referral link</p>
                    </div>
                  </div>

                  {/* REFERRER PERFORMANCE LEADERBOARD TABLE */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Award className="size-3.5 text-primary" />
                      <span>Referrer Breakdown Leaderboard</span>
                    </h3>

                    <div className="grid gap-3">
                      {groups.map((g) => {
                        const isExpanded = expandedReferrerId === g.referrerId;
                        const percentOfTotal = Math.round((g.redemptionsCount / totalRedemptions) * 100);

                        const refPhone = (g.referrer?.contact?.phone || "").replace(/[^0-9]/g, "");
                        const refWaNumber = refPhone.length === 10 ? `91${refPhone}` : refPhone;
                        const refWaMsg = `Hi ${g.referrer?.name || "there"}, amazing news! ${g.redemptionsCount} creators have signed up and redeemed passes using your referral link on Influencer Dhundo! Thank you for sharing!`;
                        const refWaUrl = refWaNumber ? `https://wa.me/${refWaNumber}?text=${encodeURIComponent(refWaMsg)}` : null;

                        return (
                          <div
                            key={g.referrerId}
                            className={`rounded-2xl border transition-all ${
                              g.isOrganic
                                ? "bg-secondary/40 border-border"
                                : "bg-background border-emerald-500/30 hover:border-emerald-500/50"
                            }`}
                          >
                            {/* GROUP HEADER ROW */}
                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {g.isOrganic ? (
                                  <div className="size-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                    <Globe className="size-5" />
                                  </div>
                                ) : g.referrer?.photo ? (
                                  <img
                                    src={g.referrer.photo}
                                    alt={g.referrer.name}
                                    className="size-10 rounded-xl object-cover ring-1 ring-border shrink-0"
                                  />
                                ) : (
                                  <div className="size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                                    {(g.referrer?.name || g.referrerId).slice(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-foreground">
                                      {g.isOrganic
                                        ? "Direct / Organic (No Referral Link)"
                                        : g.referrer?.name || `Creator: ${g.referrerId}`}
                                    </h4>
                                    {!g.isOrganic && g.referrer?.referralCode && (
                                      <span className="font-mono text-[11px] bg-secondary px-2 py-0.5 rounded-md font-semibold text-muted-foreground border border-border">
                                        {g.referrer.referralCode}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {g.isOrganic
                                      ? "Creators entered the promo code directly without clicking a creator's link"
                                      : [g.referrer?.city, g.referrer?.instagram, g.referrer?.contact?.phone].filter(Boolean).join(" · ")}
                                  </p>
                                </div>
                              </div>

                              {/* STATS & DRILL-DOWN TOGGLE */}
                              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                <div className="text-right">
                                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                    {g.redemptionsCount} Creator{g.redemptionsCount === 1 ? "" : "s"}
                                  </span>
                                  <div className="flex items-center gap-1.5 justify-end text-[11px] text-muted-foreground">
                                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden border border-border/60">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${percentOfTotal}%` }}
                                      />
                                    </div>
                                    <span>{percentOfTotal}%</span>
                                  </div>
                                </div>

                                {/* 1-CLICK WHATSAPP TO REFERRER */}
                                {refWaUrl && (
                                  <a
                                    href={refWaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
                                    title="Send update on WhatsApp to this referrer"
                                  >
                                    <MessageSquare className="size-3.5" />
                                    <span>WhatsApp Referrer</span>
                                  </a>
                                )}

                                {/* TOGGLE DRILLDOWN */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedReferrerId(isExpanded ? null : g.referrerId)}
                                  className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
                                >
                                  {isExpanded ? "Hide Details ▲" : "View Creators ▼"}
                                </button>
                              </div>
                            </div>

                            {/* EXPANDED DRILLDOWN OF INDIVIDUAL REFERRED CREATORS */}
                            {isExpanded && (
                              <div className="border-t border-border/80 bg-secondary/15 p-4 rounded-b-2xl space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                                  <span>Referred Creator Profile</span>
                                  <span>Plan &amp; Code Used</span>
                                </div>

                                <div className="grid gap-2">
                                  {g.creators.map((item, idx) => {
                                    const c = item.creator;
                                    const cPhone = (c?.contact?.phone || "").replace(/[^0-9]/g, "");
                                    const cWa = cPhone.length === 10 ? `91${cPhone}` : cPhone;
                                    const cWaMsg = `Hi ${c?.name || "there"}, welcome to Influencer Dhundo! Saw you activated your pass via ${g.referrer?.name || "a referral"}. Let us know if you need any help with brand collaborations!`;
                                    const cWaUrl = cWa ? `https://wa.me/${cWa}?text=${encodeURIComponent(cWaMsg)}` : null;

                                    return (
                                      <div
                                        key={item.creatorId + idx}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border text-xs gap-3"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          {c?.photo ? (
                                            <img
                                              src={c.photo}
                                              alt={c.name}
                                              className="size-7 rounded-lg object-cover ring-1 ring-border shrink-0"
                                            />
                                          ) : (
                                            <div className="size-7 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-bold shrink-0">
                                              {(c?.name || item.creatorId).slice(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-foreground truncate">
                                                {c?.name || item.creatorId}
                                              </span>
                                              {c?.instagram && (
                                                <span className="text-tealdeep font-mono text-[11px]">
                                                  {c.instagram}
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">
                                              {[c?.locality, c?.city, c?.contact?.phone].filter(Boolean).join(" · ") || "No phone"}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            {item.sub.duration} {item.sub.price === 0 ? "(Free Pass)" : `(₹${item.sub.price})`}
                                          </span>
                                          <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                            Code: {item.code}
                                          </span>

                                          {cWaUrl && (
                                            <a
                                              href={cWaUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-emerald-700 hover:text-emerald-800 p-1 hover:bg-emerald-500/10 rounded"
                                              title="WhatsApp this creator"
                                            >
                                              <MessageSquare className="size-3.5" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* EDIT DISCOUNT CODE MODAL */}
          {editingCode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
              <div
                className="fixed inset-0"
                onClick={() => !savingEdit && setEditingCode(null)}
              />
              <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Pencil className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Edit Discount Code</h3>
                      <p className="text-xs text-muted-foreground">
                        Update code details, discount rate, schedule dates, or active status.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => !savingEdit && setEditingCode(null)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* CODE NAME & ACTIVE TOGGLE */}
                  <div className="grid gap-4 sm:grid-cols-2 items-center">
                    <Field label="Code Name">
                      <TextInput
                        value={editCodeName}
                        onChange={(e) => setEditCodeName(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                        placeholder="e.g. SAVE50"
                        className="font-mono uppercase font-bold tracking-wider"
                      />
                    </Field>

                    <Field label="Code Status">
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditIsActive(!editIsActive)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                            editIsActive
                              ? "bg-tealdeep/15 border-tealdeep text-tealdeep"
                              : "bg-secondary border-border text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`size-2.5 rounded-full ${
                              editIsActive ? "bg-tealdeep animate-pulse" : "bg-muted-foreground"
                            }`}
                          />
                          <span>{editIsActive ? "Active / Enabled" : "Deactivated"}</span>
                        </button>
                        <span className="text-[11px] text-muted-foreground">
                          {editIsActive ? "Code can be used when schedule window allows" : "Code is temporarily disabled"}
                        </span>
                      </div>
                    </Field>
                  </div>

                  {/* DISCOUNT PERCENTAGE */}
                  <Field label="Discount Percentage (%)" hint="Enter 100 for 100% Free Pass">
                    <div className="relative">
                      <TextInput
                        type="number"
                        min={1}
                        max={100}
                        value={editDiscountPercent}
                        onChange={(e) => setEditDiscountPercent(Number(e.target.value))}
                        className="font-mono pr-8"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-muted-foreground">
                        %
                      </div>
                    </div>
                  </Field>

                  {/* VALIDITY & SCHEDULING (STREAMLINED) */}
                  <div className="rounded-2xl border border-border/80 bg-secondary/25 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Calendar className="size-3.5 text-primary" />
                        <span>Validity &amp; Scheduling</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Select dates or type days
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Start Date (Valid From)" hint="Pick today or future date">
                        <DatePicker
                          value={editStartDate}
                          minDate={getTodayStr()}
                          onChange={(val) => {
                            if (!val) return;
                            setEditStartDate(val);
                            const startObj = new Date(val + "T00:00:00");
                            const newEndObj = new Date(startObj.getTime() + Math.max(0, editValidityDays - 1) * 86400000);
                            setEditEndDate(formatDateToInput(newEndObj));
                          }}
                          placeholder="Select start date"
                        />
                      </Field>

                      <Field label="End Date (Valid Until)" hint="Last valid day">
                        <DatePicker
                          value={editEndDate}
                          minDate={editStartDate || getTodayStr()}
                          onChange={(val) => {
                            if (!val) return;
                            setEditEndDate(val);
                            const diffMs = new Date(val + "T23:59:59").getTime() - new Date(editStartDate + "T00:00:00").getTime();
                            const calculatedDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
                            setEditValidityDays(calculatedDays);
                          }}
                          placeholder="Select end date"
                        />
                      </Field>

                      <Field label="Duration (Days)" hint="Or type number of days">
                        <div className="relative">
                          <TextInput
                            type="number"
                            min={1}
                            max={365}
                            value={editValidityDays}
                            onChange={(e) => {
                              const days = Math.max(1, Number(e.target.value));
                              setEditValidityDays(days);
                              const startObj = new Date(editStartDate + "T00:00:00");
                              const newEndObj = new Date(startObj.getTime() + Math.max(0, days - 1) * 86400000);
                              setEditEndDate(formatDateToInput(newEndObj));
                            }}
                            placeholder="Days"
                            className="font-mono pr-14"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-muted-foreground">
                            Days
                          </div>
                        </div>
                      </Field>
                    </div>
                  </div>

                  {/* APPLICABLE PLANS */}
                  <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Applicable Subscription Plans</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditApplicablePlans(PLANS.map((p) => p.id))}
                          className="text-[11px] text-primary hover:underline"
                        >
                          All
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setEditApplicablePlans([])}
                          className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PLANS.map((plan) => {
                        const isSelected = editApplicablePlans.includes(plan.id);
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                              setEditApplicablePlans((prev) =>
                                prev.includes(plan.id)
                                  ? prev.filter((p) => p !== plan.id)
                                  : [...prev, plan.id],
                              );
                            }}
                            className={`p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                              isSelected
                                ? "border-tealdeep bg-tealdeep/10 text-foreground ring-1 ring-tealdeep/30"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{plan.duration}</span>
                              <span className={`size-3.5 rounded-full flex items-center justify-center text-[9px] ${isSelected ? "bg-tealdeep text-white" : "border border-border"}`}>
                                {isSelected ? "✓" : ""}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">₹{plan.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* RESTRICT TO CREATOR (OPTIONAL) */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Allowed Email (Optional)">
                      <TextInput
                        type="email"
                        value={editTargetEmail}
                        onChange={(e) => setEditTargetEmail(e.target.value)}
                        placeholder="creator@example.com"
                      />
                    </Field>

                    <Field label="Allowed Phone (Optional)">
                      <TextInput
                        type="tel"
                        value={editTargetPhone}
                        onChange={(e) => setEditTargetPhone(e.target.value)}
                        placeholder="9876543210"
                        className="font-mono"
                      />
                    </Field>
                  </div>

                  {/* MAX USES & NOTES */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Max Redemptions">
                      <TextInput
                        type="number"
                        min={1}
                        value={editMaxUses}
                        onChange={(e) => setEditMaxUses(e.target.value)}
                        placeholder="Leave empty for unlimited"
                        className="font-mono"
                      />
                    </Field>

                    <Field label="Notes / Campaign Tag">
                      <TextInput
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Campaign details..."
                      />
                    </Field>
                  </div>

                  {editError && (
                    <div className="rounded-xl bg-rose/10 border border-rose/30 p-3 text-xs font-medium text-rose flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={savingEdit}
                      onClick={() => setEditingCode(null)}
                      className="px-4 py-2 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ink"
                      type="button"
                      disabled={savingEdit}
                      onClick={handleSaveEdit}
                      className="px-5 py-2 text-xs font-semibold"
                    >
                      {savingEdit ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* DEDICATED ATTRIBUTION DRILLDOWN MODAL */}
          {attributionModalCode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
              <div
                className="fixed inset-0"
                onClick={() => setAttributionModalCode(null)}
              />
              <Card className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span>Attribution: {attributionModalCode.code}</span>
                        <span className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {attributionModalCode.discountPercent}% OFF
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Which creators brought users who redeemed promo code <strong>{attributionModalCode.code}</strong> ({attributionModalCode.usageCount} total redemptions)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttributionModalCode(null)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {(() => {
                  const matchingSubs = subscriptions.filter(
                    (s) => s.referralCodeUsed?.trim().toUpperCase() === attributionModalCode.code.toUpperCase()
                  );

                  if (matchingSubs.length === 0) {
                    return (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No redemptions found for this coupon code yet.
                      </div>
                    );
                  }

                  type ReferrerAttributionGroup = {
                    referrerId: string;
                    referrer: Creator | null;
                    isOrganic: boolean;
                    redemptionsCount: number;
                    creators: Array<{
                      creator: Creator | null;
                      creatorId: string;
                      sub: typeof matchingSubs[0];
                    }>;
                  };

                  const groupsMap = new Map<string, ReferrerAttributionGroup>();

                  matchingSubs.forEach((s) => {
                    const creator = creators.find((c) => c.id === s.creatorId) || null;
                    const referrerId = creator?.referredBy?.trim() || "organic";
                    const isOrganic = referrerId === "organic";
                    const referrer = !isOrganic ? (creators.find((c) => c.id === referrerId) || null) : null;

                    if (!groupsMap.has(referrerId)) {
                      groupsMap.set(referrerId, {
                        referrerId,
                        referrer,
                        isOrganic,
                        redemptionsCount: 0,
                        creators: [],
                      });
                    }

                    const group = groupsMap.get(referrerId)!;
                    group.redemptionsCount += 1;
                    group.creators.push({
                      creator,
                      creatorId: s.creatorId,
                      sub: s,
                    });
                  });

                  const groups = Array.from(groupsMap.values()).sort((a, b) => b.redemptionsCount - a.redemptionsCount);

                  return (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {groups.map((g) => {
                          const percentOfTotal = Math.round((g.redemptionsCount / matchingSubs.length) * 100);
                          const refPhone = (g.referrer?.contact?.phone || "").replace(/[^0-9]/g, "");
                          const refWaNumber = refPhone.length === 10 ? `91${refPhone}` : refPhone;
                          const refWaMsg = `Hi ${g.referrer?.name || "there"}, awesome! ${g.redemptionsCount} creators have signed up using your link with code ${attributionModalCode.code} on Influencer Dhundo!`;
                          const refWaUrl = refWaNumber ? `https://wa.me/${refWaNumber}?text=${encodeURIComponent(refWaMsg)}` : null;

                          return (
                            <div
                              key={g.referrerId}
                              className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  {g.isOrganic ? (
                                    <div className="size-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                                      <Globe className="size-4" />
                                    </div>
                                  ) : (
                                    <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                                      {(g.referrer?.name || g.referrerId).slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-foreground">
                                      {g.isOrganic ? "Direct / Organic (No Referrer)" : g.referrer?.name || g.referrerId}
                                    </p>
                                    {!g.isOrganic && g.referrer?.contact?.phone && (
                                      <p className="text-[11px] text-muted-foreground">{g.referrer.contact.phone}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                    {g.redemptionsCount} Creator{g.redemptionsCount === 1 ? "" : "s"} ({percentOfTotal}%)
                                  </span>
                                  {refWaUrl && (
                                    <a
                                      href={refWaUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold hover:bg-emerald-500/25"
                                    >
                                      <MessageSquare className="size-3" />
                                      WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* LIST OF CREATORS */}
                              <div className="grid gap-1.5 pt-1">
                                {g.creators.map((item, idx) => {
                                  const c = item.creator;
                                  const cPhone = (c?.contact?.phone || "").replace(/[^0-9]/g, "");
                                  const cWa = cPhone.length === 10 ? `91${cPhone}` : cPhone;
                                  const cWaUrl = cWa ? `https://wa.me/${cWa}` : null;

                                  return (
                                    <div
                                      key={item.creatorId + idx}
                                      className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/80 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-semibold text-foreground truncate">
                                          {c?.name || item.creatorId}
                                        </span>
                                        {c?.instagram && (
                                          <span className="text-tealdeep font-mono text-[11px] truncate">
                                            {c.instagram}
                                          </span>
                                        )}
                                        {c?.contact?.phone && (
                                          <span className="text-muted-foreground text-[11px]">
                                            · {c.contact.phone}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                          {item.sub.duration} {item.sub.price === 0 ? "(Free)" : `(₹${item.sub.price})`}
                                        </span>
                                        {cWaUrl && (
                                          <a
                                            href={cWaUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-600 hover:text-emerald-700 p-1"
                                          >
                                            <MessageSquare className="size-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-border">
                        <Button
                          variant="ink"
                          type="button"
                          onClick={() => setAttributionModalCode(null)}
                          className="px-4 py-2 text-xs"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}
        </div>
      ) : null}

      {/* ── TAB 3: SUBSCRIPTIONS ────────────────────────────────────────── */}
      {tab === "Subscriptions" ? (
        <div className="mt-5 space-y-5">
          {/* SUBSCRIPTION FINANCIAL SUMMARY CARDS */}
          {(() => {
            const now = Date.now();
            const totalRevenue = subscriptions
              .filter((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price || 0) > 0)
              .reduce((sum, s) => sum + (s.price || 0), 0);
            const paidSubs = subscriptions.filter((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price || 0) > 0);
            const promo100Subs = subscriptions.filter((s) => !s.isTrial && s.planId !== "trial-3d" && (s.price === 0 || s.price == null));
            const trialSubs = subscriptions.filter((s) => s.isTrial || s.planId === "trial-3d");
            const activeSubs = subscriptions.filter((s) => {
              const exp = s.expiresAt ? new Date(s.expiresAt).getTime() : 0;
              return exp > now || (!s.expiresAt && s.status === "active");
            });

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                    <span className="text-xs font-bold">Total Revenue</span>
                    <IndianRupee className="size-4" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Across paid purchases (₹)</p>
                </Card>

                <Card className="p-4 bg-primary/10 border-primary/20">
                  <div className="flex items-center justify-between text-saffrondeep mb-1">
                    <span className="text-xs font-bold">Paid Purchases</span>
                    <CreditCard className="size-4" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{paidSubs.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Real money paid (₹)</p>
                </Card>

                <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                    <span className="text-xs font-bold">100% OFF Passes</span>
                    <Tag className="size-4" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{promo100Subs.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Promo codes (₹0)</p>
                </Card>

                <Card className="p-4 bg-sky-500/10 border-sky-500/20">
                  <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-1">
                    <span className="text-xs font-bold">Free Trials</span>
                    <Zap className="size-4" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{trialSubs.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">3-Day free trials</p>
                </Card>

                <Card className="p-4 bg-tealdeep/10 border-tealdeep/20">
                  <div className="flex items-center justify-between text-tealdeep mb-1">
                    <span className="text-xs font-bold">Active Access</span>
                    <Activity className="size-4" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{activeSubs.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Currently valid access</p>
                </Card>
              </div>
            );
          })()}

          {/* SEARCH & FILTERS BAR */}
          <Card className="p-4 bg-secondary/30 border border-border/80">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Search className="size-4" />
                </div>
                <TextInput
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Search subscriptions by creator name or ID..."
                  className="pl-10 text-xs sm:text-sm bg-background"
                />
                {subSearch && (
                  <button
                    type="button"
                    onClick={() => setSubSearch("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value as any)}
                  className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                >
                  <option value="all">All Subscriptions ({subscriptions.length})</option>
                  <option value="paid">💎 Paid Plans Only (Real Money)</option>
                  <option value="promo100">🎟️ 100% OFF Passes (₹0)</option>
                  <option value="trial">⚡ 3-Day Free Trials</option>
                  <option value="active">🟢 Active Now</option>
                  <option value="queued">⏳ Queued Renewals</option>
                  <option value="expired">🔴 Expired</option>
                </select>

                {(subSearch || subFilter !== "all") && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSubSearch("");
                      setSubFilter("all");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-2"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* SUBSCRIPTION RECORDS LIST */}
          {(() => {
            const now = Date.now();
            const filteredSubs = subscriptions.filter((s) => {
              const matchedCreator = creators.find((c) => c.id === s.creatorId);
              const q = subSearch.toLowerCase().trim();
              if (q) {
                const matchName = matchedCreator?.name?.toLowerCase().includes(q);
                const matchId = s.creatorId.toLowerCase().includes(q);
                const matchPlan = s.duration?.toLowerCase().includes(q) || s.planId?.toLowerCase().includes(q);
                if (!matchName && !matchId && !matchPlan) return false;
              }

              const isQueued = s.isQueued || s.status === "queued" || new Date(s.startedAt).getTime() > now;
              const expTime = s.expiresAt ? new Date(s.expiresAt).getTime() : 0;
              const isExpired = !isQueued && expTime > 0 && expTime <= now;
              const isActive = !isQueued && !isExpired;
              const isTrial = s.isTrial || s.planId === "trial-3d";
              const isRealPaid = !isTrial && (s.price || 0) > 0;
              const isPromo100 = !isTrial && (s.price === 0 || s.price == null);

              if (subFilter === "paid" && !isRealPaid) return false;
              if (subFilter === "promo100" && !isPromo100) return false;
              if (subFilter === "trial" && !isTrial) return false;
              if (subFilter === "active" && !isActive) return false;
              if (subFilter === "queued" && !isQueued) return false;
              if (subFilter === "expired" && !isExpired) return false;

              return true;
            });

            if (filteredSubs.length === 0) {
              return (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  No subscription records found matching the filters.
                </Card>
              );
            }

            return (
              <div className="grid gap-3">
                {filteredSubs.map((s) => {
                  const matchedCreator = creators.find((c) => c.id === s.creatorId);
                  const isQueued = s.isQueued || s.status === "queued" || new Date(s.startedAt).getTime() > now;
                  const expTime = s.expiresAt ? new Date(s.expiresAt).getTime() : 0;
                  const isExpired = !isQueued && expTime > 0 && expTime <= now;
                  const isTrial = s.isTrial || s.planId === "trial-3d";
                  const isRealPaid = !isTrial && (s.price || 0) > 0;
                  const isPromo100 = !isTrial && (s.price === 0 || s.price == null);

                  const daysLeft = expTime > now ? Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)) : 0;

                  return (
                    <Card key={s.id || s.startedAt + s.creatorId} className="p-4 border border-border/80 hover:border-primary/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                              {matchedCreator?.name ?? s.creatorId}
                            </span>
                            {matchedCreator?.displayName && matchedCreator.displayName !== matchedCreator.name && (
                              <span className="text-xs text-muted-foreground">
                                ({matchedCreator.displayName})
                              </span>
                            )}

                            {/* STATUS BADGES */}
                            {isQueued ? (
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1 ${
                                  isRealPaid
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                    : isPromo100
                                      ? "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300"
                                      : "bg-accent/20 border-tealdeep/30 text-tealdeep"
                                }`}
                              >
                                <Clock className="size-3" />
                                Queued ({isRealPaid ? "Paid" : isPromo100 ? "100% OFF" : "Trial"} • Starts {new Date(s.startedAt).toLocaleDateString("en-IN")})
                              </span>
                            ) : isExpired ? (
                              <span className="rounded-full bg-rose/15 border border-rose/30 px-2.5 py-0.5 text-[11px] font-bold text-rose flex items-center gap-1">
                                <AlertTriangle className="size-3" />
                                Expired
                              </span>
                            ) : isTrial ? (
                              <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                                <Zap className="size-3" />
                                Free Trial ({daysLeft}d left)
                              </span>
                            ) : isPromo100 ? (
                              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <Tag className="size-3" />
                                100% OFF Pass ({daysLeft}d left)
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                Active Paid ({daysLeft}d left)
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              Plan: <strong className="text-foreground">{s.duration}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Amount:{" "}
                              {isRealPaid ? (
                                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatPrice(s.price)} (Paid)</strong>
                              ) : isPromo100 ? (
                                <strong className="text-purple-600 dark:text-purple-400 font-bold">₹0 (100% OFF Pass)</strong>
                              ) : (
                                <strong className="text-sky-600 dark:text-sky-400 font-bold">Free (Trial)</strong>
                              )}
                            </span>
                            <span>·</span>
                            <span>
                              Started: {new Date(s.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            {s.expiresAt && (
                              <>
                                <span>·</span>
                                <span>
                                  Expires: {new Date(s.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </>
                            )}
                            {s.referralCodeUsed && (
                              <>
                                <span>·</span>
                                <span className="rounded-md bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 font-bold">
                                  Promo: {s.referralCodeUsed}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* QUICK ACTION CONTROLS */}
                        {matchedCreator && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2.5 py-1.5 text-xs ring-1 ring-border bg-background hover:bg-secondary flex items-center gap-1 cursor-pointer"
                              onClick={() => handleExtendExpiry(matchedCreator, 7)}
                            >
                              <Plus className="size-3" />
                              <span>+7d</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2.5 py-1.5 text-xs text-tealdeep bg-tealdeep/10 hover:bg-tealdeep/20 ring-1 ring-tealdeep/30 flex items-center gap-1 cursor-pointer"
                              onClick={() => handleActivatePass(matchedCreator, "1m", "1 Month")}
                            >
                              <Award className="size-3" />
                              <span>+1M</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* ── TAB 4: BUSINESSES ───────────────────────────────────────────── */}
      {tab === "Businesses" ? (
        <Card className="mt-5">
          {business ? (
            <div className="text-sm">
              <p className="font-semibold">{business.businessName}</p>
              <p className="text-muted-foreground">
                {business.name} · {business.mobile} · {business.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No business accounts registered yet.
            </p>
          )}
        </Card>
      ) : null}

      {/* ── TAB 5: REPORTS ──────────────────────────────────────────────── */}
      {tab === "Reports" ? (
        <Card className="mt-5">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reported profiles.</p>
          ) : (
            <ul className="space-y-4 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="border-b border-border pb-3 last:border-0">
                  <p className="font-semibold">
                    {creators.find((c) => c.id === r.creatorId)?.name ?? r.creatorId} ·{" "}
                    <span className="text-rose">{r.reason}</span>
                  </p>
                  {r.details ? (
                    <p className="mt-1 text-muted-foreground">{r.details}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.at).toLocaleString("en-IN")}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2 px-3 py-2 text-xs"
                    onClick={() => setCreatorStatus(r.creatorId, "Suspended")}
                  >
                    Suspend this creator
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {/* ── TAB 6: TAXONOMY ─────────────────────────────────────────────── */}
      {tab === "Taxonomy" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-lg">Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg">Locations</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {/* ── EDIT CREATOR MODAL ── */}
      {editingCreator && (
        <EditCreatorModal
          creator={editingCreator}
          onClose={() => setEditingCreator(null)}
          onSave={async (updated) => {
            return await updateCreator(updated);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Creator Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function EditCreatorModal({
  creator,
  onClose,
  onSave,
}: {
  creator: Creator;
  onClose: () => void;
  onSave: (updated: Creator) => Promise<boolean>;
}) {
  const [form, setForm] = useState<Creator>({
    ...creator,
    otherSocials: creator.otherSocials || [],
    categories: creator.categories || [],
    contentTypes: creator.contentTypes || [],
    languages: creator.languages || [],
    contact: creator.contact || { phone: "", whatsapp: "", email: "" },
  });

  const [activeTab, setActiveTab] = useState<
    "identity" | "location" | "social" | "pricing" | "categories" | "contact"
  >("identity");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle Photo Upload directly to Supabase Storage
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image exceeds 5MB size limit.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadError("");
      const publicUrl = await supabaseDb.uploadCreatorPhoto(
        file,
        `admin-edit-${creator.id}`,
      );
      if (publicUrl) {
        setForm((prev) => ({ ...prev, photo: publicUrl }));
      } else {
        setUploadError("Could not upload to storage bucket. You can paste a direct URL below.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: "" }));
    setUploadError("");
  };

  const toggleArrayItem = (
    key: "categories" | "contentTypes" | "languages",
    item: string,
  ) => {
    setForm((prev) => {
      const current = prev[key] || [];
      const next = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      return { ...prev, [key]: next };
    });
  };

  const handleAddSocial = () => {
    setForm((prev) => ({
      ...prev,
      otherSocials: [
        ...(prev.otherSocials || []),
        { platform: "YouTube", handle: "" },
      ],
    }));
  };

  const handleUpdateSocial = (
    index: number,
    field: "platform" | "handle",
    value: string,
  ) => {
    setForm((prev) => {
      const list = [...(prev.otherSocials || [])];
      const currentItem = list[index] || { platform: "YouTube", handle: "" };
      list[index] = {
        platform: field === "platform" ? value : (currentItem.platform || "YouTube"),
        handle: field === "handle" ? value : (currentItem.handle || ""),
      };
      return { ...prev, otherSocials: list };
    });
  };

  const handleRemoveSocial = (index: number) => {
    setForm((prev) => ({
      ...prev,
      otherSocials: (prev.otherSocials || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError("Creator Full Name is required.");
      return;
    }
    if (form.followers < 500) {
      setSaveError("Follower count must be at least 500.");
      return;
    }
    if (form.followers > 300000) {
      setSaveError("Follower count cannot exceed 300,000 (300K).");
      return;
    }
    if (form.startingPrice < 0) {
      setSaveError("Starting rate cannot be negative.");
      return;
    }
    if (form.startingPrice > 100000) {
      setSaveError("Starting rate cannot exceed ₹1,00,000.");
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      const ok = await onSave(form);
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setSaveError("Failed to update creator. Please try again.");
      }
    } catch (err: any) {
      setSaveError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const TABS_CONFIG = [
    { id: "identity", label: "Identity & Photo", icon: User },
    { id: "location", label: "Location & Bio", icon: Globe },
    { id: "social", label: "Socials & Reach", icon: Eye },
    { id: "pricing", label: "Pricing & Collabs", icon: IndianRupee },
    { id: "categories", label: "Categories & Formats", icon: Tag },
    { id: "contact", label: "Contact Info", icon: Phone },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-background border border-border/90 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            {form.photo ? (
              <img
                src={form.photo}
                alt={form.name}
                className="size-10 rounded-xl object-cover ring-1 ring-border shadow-xs"
              />
            ) : (
              <div className="size-10 rounded-xl bg-secondary ring-1 ring-border flex items-center justify-center text-muted-foreground/60">
                <User className="size-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Edit Creator: {form.name || "Unnamed"}
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
                  ID: {form.id}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Update profile photo, demographics, pricing, categories, and direct contact details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Tab Strip */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-border/60 bg-secondary/15 overflow-x-auto shrink-0 no-scrollbar">
          {TABS_CONFIG.map((t) => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 flex-1">
            
            {saveError && (
              <div className="rounded-2xl border border-rose/30 bg-rose/10 p-3.5 text-xs text-rose flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-2xl border border-tealdeep/30 bg-tealdeep/10 p-3.5 text-xs text-tealdeep flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Creator details updated successfully! Closing...</span>
              </div>
            )}

            {/* ── TAB: IDENTITY & PHOTO ── */}
            {activeTab === "identity" && (
              <div className="space-y-6">
                {/* PHOTO MANAGEMENT CARD */}
                <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4 sm:p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Camera className="size-3.5 text-primary" /> Profile Picture
                  </h3>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="relative shrink-0">
                      {form.photo ? (
                        <img
                          src={form.photo}
                          alt={form.name}
                          className="size-20 rounded-2xl object-cover ring-2 ring-border shadow-md bg-secondary"
                        />
                      ) : (
                        <div className="size-20 rounded-2xl bg-secondary ring-2 ring-border shadow-md flex items-center justify-center text-muted-foreground/50">
                          <User className="size-8" />
                        </div>
                      )}
                      {form.photo && (
                        <span
                          className="absolute -bottom-1 -right-1 size-4 rounded-full bg-tealdeep ring-2 ring-background shadow-xs"
                          title="Photo Uploaded"
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          id="admin-creator-photo-input"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={uploadingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs flex items-center gap-1.5 ring-1 ring-border bg-background hover:bg-secondary cursor-pointer"
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin text-primary" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="size-3.5 text-primary" />
                              <span>Upload New Photo</span>
                            </>
                          )}
                        </Button>

                        {form.photo && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRemovePhoto}
                            className="text-xs text-rose hover:bg-rose/10 cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Remove Photo</span>
                          </Button>
                        )}
                      </div>

                      {uploadError && (
                        <p className="text-xs text-rose font-medium">{uploadError}</p>
                      )}

                      <div>
                        <Field label="Or Direct Image URL" hint="Paste image CDN or public image URL">
                          <TextInput
                            value={form.photo || ""}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, photo: e.target.value.trim() }))
                            }
                            placeholder="https://..."
                            className="font-mono text-xs"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NAME & DISPLAY NAME */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" hint="Official name of the creator">
                    <TextInput
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Aditi Sharma"
                      required
                    />
                  </Field>

                  <Field label="Display / Stage Name" hint="Shown on card badges / channel">
                    <TextInput
                      value={form.displayName || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, displayName: e.target.value }))
                      }
                      placeholder="e.g. aditi.eats"
                    />
                  </Field>
                </div>

                {/* BIRTH DATE, GENDER, STATUS, FEATURED */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Birth Date" hint="YYYY-MM-DD">
                    <TextInput
                      type="date"
                      value={form.birthDate || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, birthDate: e.target.value || undefined }))
                      }
                    />
                  </Field>

                  <Field label="Gender">
                    <select
                      value={form.gender || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, gender: e.target.value || undefined }))
                      }
                      className="w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    >
                      <option value="">Select Gender</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Directory Status">
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value as CreatorStatus,
                        }))
                      }
                      className="w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="rounded-2xl border border-border/80 p-4 bg-secondary/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Featured Creator Spotlight</p>
                    <p className="text-xs text-muted-foreground">
                      Featured creators appear highlighted at the top of directory searches.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.featured}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, featured: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary ring-1 ring-border"></div>
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB: LOCATION & BIO ── */}
            {activeTab === "location" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Locality / Area" hint="e.g. Bandra West, Thane West">
                    <TextInput
                      value={form.locality}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, locality: e.target.value }))
                      }
                      placeholder="e.g. Bandra West"
                    />
                  </Field>

                  <Field label="City" hint="City name">
                    <TextInput
                      value={form.city}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="e.g. Mumbai"
                      list="admin-city-list"
                    />
                    <datalist id="admin-city-list">
                      {CITIES.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="State" hint="e.g. Maharashtra">
                    <TextInput
                      value={form.state}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="e.g. Maharashtra"
                    />
                  </Field>

                  <Field label="Pincode" hint="6-digit postal code">
                    <TextInput
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, pincode: e.target.value }))
                      }
                      placeholder="e.g. 400050"
                    />
                  </Field>
                </div>

                <Field label="About Creator / Bio" hint="Public profile bio description">
                  <TextArea
                    value={form.about}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, about: e.target.value }))
                    }
                    rows={4}
                    placeholder="Tell brands about creator's niche, tone, audience and experience..."
                  />
                </Field>
              </div>
            )}

            {/* ── TAB: SOCIALS & REACH ── */}
            {activeTab === "social" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Instagram Handle" hint="Without or with @">
                    <TextInput
                      value={form.instagram}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, instagram: e.target.value }))
                      }
                      placeholder="@username"
                    />
                  </Field>

                  <Field label="Followers Count" hint="500 to 300,000 (300K)">
                    <TextInput
                      type="number"
                      min={500}
                      max={300000}
                      value={form.followers}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          followers: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      placeholder="e.g. 25000"
                    />
                  </Field>
                </div>

                {/* OTHER SOCIAL CHANNELS */}
                <div className="rounded-2xl border border-border/80 p-4 bg-secondary/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Other Social Media Platforms
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAddSocial}
                      className="text-xs flex items-center gap-1.5 ring-1 ring-border bg-background hover:bg-secondary cursor-pointer"
                    >
                      <Plus className="size-3.5 text-primary" />
                      Add Channel
                    </Button>
                  </div>

                  {(!form.otherSocials || form.otherSocials.length === 0) ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No other social links added. Click "+ Add Channel" to link YouTube, Twitter, etc.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {form.otherSocials.map((soc, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            value={soc.platform}
                            onChange={(e) =>
                              handleUpdateSocial(idx, "platform", e.target.value)
                            }
                            className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border w-32 focus:ring-2 focus:ring-primary focus:outline-hidden"
                          >
                            <option value="YouTube">YouTube</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Twitter / X">Twitter / X</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Snapchat">Snapchat</option>
                            <option value="Pinterest">Pinterest</option>
                            <option value="Blog">Blog</option>
                            <option value="Other">Other</option>
                          </select>

                          <TextInput
                            value={soc.handle}
                            onChange={(e) =>
                              handleUpdateSocial(idx, "handle", e.target.value)
                            }
                            placeholder="Handle or URL"
                            className="flex-1 text-xs"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveSocial(idx)}
                            className="size-8 p-0 text-rose hover:bg-rose/10 flex items-center justify-center shrink-0"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: PRICING & COLLABS ── */}
            {activeTab === "pricing" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Starting Rate (₹)"
                    hint={
                      form.collabType === "Barter"
                        ? "Optional for Barter collaborations (up to ₹1,00,000)"
                        : "₹0 to ₹1,00,000 base collaboration fee"
                    }
                  >
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground font-semibold">
                        ₹
                      </div>
                      <TextInput
                        type="number"
                        min={0}
                        max={100000}
                        value={form.startingPrice}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            startingPrice: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="pl-8 font-mono font-semibold"
                        placeholder="e.g. 2000"
                      />
                    </div>
                  </Field>

                  <Field label="Collab Mode">
                    <select
                      value={form.collabType}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          collabType: e.target.value as (typeof COLLAB_TYPES)[number],
                        }))
                      }
                      className="w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    >
                      {COLLAB_TYPES.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct} Collaboration
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Accepts Barter / Products">
                    <select
                      value={form.acceptsProducts}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          acceptsProducts: e.target.value as "Yes" | "No" | "Depends",
                        }))
                      }
                      className="w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Depends">Depends</option>
                    </select>
                  </Field>

                  <Field label="Barter / Product Notes" hint="Optional details on barter terms">
                    <TextInput
                      value={form.acceptsProductsDetails || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          acceptsProductsDetails: e.target.value || undefined,
                        }))
                      }
                      placeholder="e.g. Depends on product value (> ₹1,500)"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Turnaround Delivery Time">
                    <select
                      value={form.turnaround}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, turnaround: e.target.value }))
                      }
                      className="w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    >
                      {TURNAROUNDS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Travel Range for Shoots">
                    <select
                      value={form.travelRange || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          travelRange: e.target.value || undefined,
                          travels: !!e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl bg-background px-4 py-3 text-sm ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
                    >
                      <option value="">Doesn&apos;t travel (Studio / Home only)</option>
                      {TRAVEL_RANGES.map((tr) => (
                        <option key={tr} value={tr}>
                          {tr}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* ── TAB: CATEGORIES & FORMATS ── */}
            {activeTab === "categories" && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Primary Niche / Categories ({form.categories?.length || 0} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSel = form.categories?.includes(cat);
                      return (
                        <Chip
                          key={cat}
                          label={cat}
                          selected={isSel}
                          onClick={() => toggleArrayItem("categories", cat)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Content Formats ({form.contentTypes?.length || 0} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((ct) => {
                      const isSel = form.contentTypes?.includes(ct);
                      return (
                        <Chip
                          key={ct}
                          label={ct}
                          selected={isSel}
                          tone="accent"
                          onClick={() => toggleArrayItem("contentTypes", ct)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Languages ({form.languages?.length || 0} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const isSel = form.languages?.includes(lang);
                      return (
                        <Chip
                          key={lang}
                          label={lang}
                          selected={isSel}
                          onClick={() => toggleArrayItem("languages", lang)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: CONTACT INFO ── */}
            {activeTab === "contact" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/80 p-4 bg-secondary/15">
                  <p className="text-xs text-muted-foreground">
                    Direct contact channels are unlocked by registered businesses on Influencer Dhundo.
                  </p>
                </div>

                <Field label="Mobile / Phone Number" hint="Primary phone with country code">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <Phone className="size-4" />
                    </div>
                    <TextInput
                      value={form.contact?.phone || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, phone: e.target.value },
                        }))
                      }
                      className="pl-10"
                      placeholder="+91 98200 11223"
                    />
                  </div>
                </Field>

                <Field label="WhatsApp Number" hint="WhatsApp chat link target">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <Phone className="size-4" />
                    </div>
                    <TextInput
                      value={form.contact?.whatsapp || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, whatsapp: e.target.value },
                        }))
                      }
                      className="pl-10"
                      placeholder="+91 98200 11223"
                    />
                  </div>
                </Field>

                <Field label="Email Address" hint="Contact email">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                      <Mail className="size-4" />
                    </div>
                    <TextInput
                      type="email"
                      value={form.contact?.email || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, email: e.target.value },
                        }))
                      }
                      className="pl-10"
                      placeholder="creator@example.com"
                    />
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Modal Action Footer */}
          <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-secondary/30 shrink-0 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={saving || saveSuccess}
                className="text-xs px-5 py-2.5 font-semibold flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="size-3.5 text-tealdeep" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


