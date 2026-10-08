import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Field, SectionEyebrow, StatusPill, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { useAdminState } from "@/lib/admin-state";
import { supabaseDb, type DiscountCode } from "@/lib/supabase";
import {
  CATEGORIES,
  CITIES,
  formatFollowers,
  formatPrice,
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
  Percent,
  Calendar,
  Zap,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
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

type AuthMode = "login" | "signup";

function isLocalEnvironment() {
  if (typeof window === "undefined") {
    return process.env["NODE_ENV"] !== "production";
  }
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    Boolean(import.meta.env.DEV)
  );
}

function AdminPage() {
  const isLocal = isLocalEnvironment();

  // If accessed on live/production domain (e.g. Vercel), show 404 Not Found
  if (!isLocal) {
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
// Admin Auth Box (Login / Sign Up)
// ─────────────────────────────────────────────────────────────────────────────
function AdminAuthBox() {
  const { loginAdmin } = useAdminState();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPwd) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const result = await supabaseDb.signInAdmin(email.trim(), password);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        loginAdmin(result);
      } else {
        const result = await supabaseDb.signUpAdmin(
          email.trim(),
          password,
          name.trim(),
        );
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setSuccess(
          "Admin account created! Please sign in with your credentials.",
        );
        setMode("login");
        setName("");
        setPassword("");
        setConfirmPwd("");
      }
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
                Admin Portal
              </h1>
            </div>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              This area is restricted to platform administrators only.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mt-8 flex rounded-full bg-secondary p-1 ring-1 ring-border">
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setSuccess("");
                }}
                className={
                  mode === m
                    ? "rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background transition-all"
                    : "rounded-full px-5 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground"
                }
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="mt-6 w-full max-w-md">
            <Card className="glass-card rounded-2xl border border-border/80 p-6 text-left shadow-xl sm:rounded-3xl sm:p-8">
              <div className="space-y-4">
                {mode === "signup" && (
                  <Field label="Your name">
                    <TextInput
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Admin Name"
                      autoFocus
                    />
                  </Field>
                )}

                <Field label="Email address">
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="admin@influencerdhundo.com"
                    autoFocus={mode === "login"}
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <TextInput
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={
                        mode === "signup"
                          ? "Min 8 characters"
                          : "Your password"
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                {mode === "signup" && (
                  <Field label="Confirm password">
                    <TextInput
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Re-enter password"
                    />
                  </Field>
                )}

                {error ? (
                  <div className="rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-xl bg-accent/15 p-3 text-xs font-medium text-tealdeep">
                    {success}
                  </div>
                ) : null}

                <Button
                  variant="ink"
                  className="w-full justify-center py-3 font-semibold"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                      ? "Log in to Admin"
                      : "Create Admin Account"}
                </Button>
              </div>

              <div className="mt-5 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
                <ShieldCheck className="mx-auto mb-1.5 size-4 opacity-40" />
                Secured · Admin access only
              </div>
            </Card>
          </div>
        </div>
      </section>
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
  } = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Creators");

  // Discount Codes state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // New code form state
  const [newCodeName, setNewCodeName] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [validityDays, setValidityDays] = useState<number>(7);
  const [maxUsesInput, setMaxUsesInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

    if (validityDays <= 0) {
      setCreateError("Validity must be at least 1 day.");
      return;
    }

    setCreatingCode(true);

    try {
      const maxUses = maxUsesInput.trim() ? parseInt(maxUsesInput.trim(), 10) : undefined;
      const res = await supabaseDb.createDiscountCode({
        code: codeToCreate,
        discountPercent,
        discountType: "percentage",
        discountValue: discountPercent,
        validityDays,
        maxUses: isNaN(maxUses as number) ? undefined : maxUses,
        notes: notesInput.trim(),
      });

      if (!res.success || !res.code) {
        setCreateError(res.error || "Failed to create discount code.");
        return;
      }

      setCreateSuccess(`Code ${res.code.code} created successfully!`);
      setDiscountCodes((prev) => [res.code!, ...prev]);
      setNewCodeName("");
      setNotesInput("");
      setMaxUsesInput("");
    } catch (e: any) {
      setCreateError(e.message || "Failed to create discount code.");
    } finally {
      setCreatingCode(false);
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

  // Preview expiry date for new code
  const previewExpiry = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

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
        <Button
          variant="ghost"
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-rose"
          onClick={() => signOutAdmin()}
        >
          <LogOut className="size-3.5" />
          Sign out
        </Button>
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
            {t === "Discount Codes" ? "🏷️ Discount & Referral Codes" : t}
          </button>
        ))}
      </div>

      {/* ── TAB 1: CREATORS ─────────────────────────────────────────────── */}
      {tab === "Creators" ? (
        <div className="mt-5 space-y-3">
          {creators.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <img
                    src={c.photo}
                    alt={c.name}
                    loading="lazy"
                    width={816}
                    height={816}
                    className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{c.name}</p>
                      <StatusPill status={c.status} />
                      {c.featured ? (
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-saffrondeep">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.locality}, {c.city} · {formatFollowers(c.followers)} ·{" "}
                      {formatPrice(c.startingPrice)} · {c.categories.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.contact.phone} · {c.contact.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={c.status}
                    onChange={(e) =>
                      setCreatorStatus(c.id, e.target.value as CreatorStatus)
                    }
                    className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-xs"
                    onClick={() => toggleFeatured(c.id)}
                  >
                    {c.featured ? "Unfeature" : "Feature"}
                  </Button>
                  <Link
                    to="/creators/$creatorId"
                    params={{ creatorId: c.id }}
                    className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border"
                  >
                    View
                  </Link>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-xs text-rose"
                    onClick={() => removeCreator(c.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
                  Create validity-based promo codes. Applies discounts across all creator subscription plans.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* CODE NAME */}
              <Field label="Code Name / Identifier">
                <div className="flex gap-2">
                  <TextInput
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    placeholder="e.g. DIWALI50, LAUNCH100, BANGALORE30"
                    className="font-mono uppercase tracking-wider font-semibold"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={generateRandomCode}
                    className="shrink-0 text-xs flex items-center gap-1.5 ring-1 ring-border"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    Auto-Generate
                  </Button>
                </div>
              </Field>

              {/* DISCOUNT PERCENTAGE SELECTOR */}
              <Field label="Discount Amount (% off all plans)">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[10, 20, 30, 40, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                          discountPercent === pct
                            ? "bg-tealdeep text-white shadow-xs"
                            : "bg-background text-muted-foreground ring-1 ring-border hover:text-foreground"
                        }`}
                      >
                        {pct === 100 ? "100% (Free Pass)" : `${pct}% OFF`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 max-w-xs">
                    <TextInput
                      type="number"
                      min={1}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      placeholder="Custom %"
                      className="font-mono"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">%</span>
                  </div>
                </div>
              </Field>

              {/* VALIDITY DURATION SELECTOR (DAYS RANGE) */}
              <Field label="Validity Duration (Day Range)">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { days: 1, label: "1 Day (24 hrs)" },
                      { days: 2, label: "2 Days" },
                      { days: 3, label: "3 Days" },
                      { days: 7, label: "7 Days (1 Wk)" },
                      { days: 14, label: "14 Days" },
                      { days: 30, label: "30 Days (1 Mo)" },
                      { days: 90, label: "90 Days" },
                    ].map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        onClick={() => setValidityDays(item.days)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                          validityDays === item.days
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-background text-muted-foreground ring-1 ring-border hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 max-w-xs">
                      <TextInput
                        type="number"
                        min={1}
                        max={365}
                        value={validityDays}
                        onChange={(e) => setValidityDays(Number(e.target.value))}
                        placeholder="Custom days"
                        className="font-mono"
                      />
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Days from now</span>
                    </div>

                    <div className="text-xs text-muted-foreground bg-secondary/70 px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      <span>
                        Expires: <strong className="text-foreground">{previewExpiry.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} at {previewExpiry.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </Field>

              {/* MAX REDEMPTIONS (OPTIONAL) & NOTES */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Max Redemptions (Optional)">
                  <TextInput
                    type="number"
                    min={1}
                    value={maxUsesInput}
                    onChange={(e) => setMaxUsesInput(e.target.value)}
                    placeholder="e.g. 50 (leave empty for unlimited)"
                    className="font-mono"
                  />
                </Field>

                <Field label="Notes / Campaign Tag (Optional)">
                  <TextInput
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Bangalore food bloggers partner promo"
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
                {creatingCode ? "Creating Code..." : "Create & Activate Discount Code"}
              </Button>
            </div>
          </Card>

          {/* LIST OF CREATED CODES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span>Active &amp; Past Discount Codes</span>
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
                  const validUntilTime = new Date(dc.validUntil).getTime();
                  const isExpired = now > validUntilTime;
                  const isLimitReached = dc.maxUses != null && dc.usageCount >= dc.maxUses;
                  const isEffectivelyActive = dc.isActive && !isExpired && !isLimitReached;

                  return (
                    <Card key={dc.id} className="p-4.5 border border-border/80">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-base font-bold tracking-wider text-foreground">
                              {dc.code}
                            </span>
                            
                            <span className="rounded-full bg-tealdeep/15 text-tealdeep px-2.5 py-0.5 text-xs font-bold">
                              {dc.discountPercent === 100
                                ? "100% (Free Pass)"
                                : `${dc.discountPercent}% OFF`}
                            </span>

                            {isEffectivelyActive ? (
                              <span className="rounded-full bg-accent/25 text-tealdeep px-2 py-0.5 text-[11px] font-bold">
                                Active
                              </span>
                            ) : isExpired ? (
                              <span className="rounded-full bg-rose/15 text-rose px-2 py-0.5 text-[11px] font-bold">
                                Expired
                              </span>
                            ) : isLimitReached ? (
                              <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-bold">
                                Limit Reached
                              </span>
                            ) : (
                              <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-bold">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              Valid for <strong>{dc.validityDays} Day{dc.validityDays > 1 ? "s" : ""}</strong> (until {new Date(dc.validUntil).toLocaleDateString("en-IN")}, {new Date(dc.validUntil).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})
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

                          <Button
                            variant="ghost"
                            className={`px-3 py-1.5 text-xs ${
                              dc.isActive ? "text-muted-foreground" : "text-tealdeep"
                            }`}
                            onClick={() => handleToggleCode(dc.id, dc.isActive)}
                          >
                            {dc.isActive ? "Deactivate" : "Activate"}
                          </Button>

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
        </div>
      ) : null}

      {/* ── TAB 3: SUBSCRIPTIONS ────────────────────────────────────────── */}
      {tab === "Subscriptions" ? (
        <Card className="mt-5">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions recorded yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {subscriptions.map((s) => {
                const isQueued = s.isQueued || s.status === "queued" || new Date(s.startedAt).getTime() > Date.now();
                return (
                  <li key={s.id || s.startedAt} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {creators.find((c) => c.id === s.creatorId)?.name ?? s.creatorId}
                      </span>
                      {isQueued ? (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-tealdeep">
                          Queued (starts {new Date(s.startedAt).toLocaleDateString("en-IN")})
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-saffrondeep">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {s.duration} · {formatPrice(s.price)} ·{" "}
                      {new Date(s.startedAt).toLocaleDateString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
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
    </div>
  );
}

