import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Field, SectionEyebrow, StatusPill, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { AdminStateProvider, useAdminState } from "@/lib/admin-state";
import { supabaseDb, type DiscountCode } from "@/lib/supabase";
import {
  CATEGORIES,
  CITIES,
  formatFollowers,
  formatPrice,
  PLANS,
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
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Globe,
  Mail,
  Phone,
  Layers,
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

    if (validityDays <= 0) {
      setCreateError("Validity must be at least 1 day.");
      return;
    }

    if (selectedApplicablePlans.length === 0) {
      setCreateError("Please select at least one subscription plan this promo applies to.");
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
        targetEmail: targetEmailInput.trim() || undefined,
        targetPhone: targetPhoneInput.trim() || undefined,
        applicablePlans: selectedApplicablePlans,
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
      setTargetEmailInput("");
      setTargetPhoneInput("");
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
                  Create targeted or general discount promo codes with custom validity, plan restrictions, and creator limits.
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
                    placeholder="e.g. DIWALI50, VIPCREATOR, EXCLUSIVE100"
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

              {/* CLEAN 2-COLUMN: DISCOUNT PERCENTAGE & VALIDITY DURATION */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Discount Percentage (%)" hint="Enter 100 for 100% Free Pass">
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

                <Field
                  label="Validity Duration (Days)"
                  hint={`Expires on ${previewExpiry.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`}
                >
                  <div className="relative">
                    <TextInput
                      type="number"
                      min={1}
                      max={365}
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      placeholder="e.g. 7, 30, 90"
                      className="font-mono pr-14"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-muted-foreground">
                      Days
                    </div>
                  </div>
                </Field>
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

