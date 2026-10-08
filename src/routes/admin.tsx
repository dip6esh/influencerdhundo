import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Chip, DatePicker, Field, SectionEyebrow, StatusPill, TextArea, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { AdminStateProvider, useAdminState } from "@/lib/admin-state";
import { supabaseDb, type DiscountCode } from "@/lib/supabase";
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
  CalendarDays,
  Pencil,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  User,
  Globe,
  Mail,
  Phone,
  Layers,
  Camera,
  Upload,
  Search,
  IndianRupee,
  Loader2,
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
    updateCreator,
  } = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Creators");

  // Creator search & filter state
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorStatusFilter, setCreatorStatusFilter] = useState<string>("All");
  const [creatorCategoryFilter, setCreatorCategoryFilter] = useState<string>("All");

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
        <div className="mt-5 space-y-4">
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
                  placeholder="Search creators by name, instagram, city, locality, phone..."
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
                  className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden max-w-[160px]"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {(creatorSearch || creatorStatusFilter !== "All" || creatorCategoryFilter !== "All") && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreatorSearch("");
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

            <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>
                Showing <strong className="text-foreground">{
                  creators.filter((c) => {
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
                    if (creatorStatusFilter !== "All" && c.status !== creatorStatusFilter) return false;
                    if (creatorCategoryFilter !== "All" && !c.categories?.includes(creatorCategoryFilter)) return false;
                    return true;
                  }).length
                }</strong> of {creators.length} creators
              </span>
              <span className="text-[11px] font-medium text-tealdeep">
                Click &quot;Edit&quot; on any creator to modify photo, contact, pricing &amp; bio
              </span>
            </div>
          </Card>

          {/* CREATOR LIST */}
          {creators
            .filter((c) => {
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
              if (creatorStatusFilter !== "All" && c.status !== creatorStatusFilter) return false;
              if (creatorCategoryFilter !== "All" && !c.categories?.includes(creatorCategoryFilter)) return false;
              return true;
            })
            .map((c) => (
              <Card key={c.id} className="p-4.5 hover:border-primary/40 transition-colors shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground text-base leading-tight">
                          {c.name}
                        </p>
                        {c.displayName && c.displayName !== c.name && (
                          <span className="text-xs text-muted-foreground font-medium">
                            ({c.displayName})
                          </span>
                        )}
                        <StatusPill status={c.status} />
                        {c.featured ? (
                          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-saffrondeep border border-primary/20">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
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

                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {c.contact.phone || "No phone"} · {c.contact.email || "No email"}
                        {c.instagram && ` · ${c.instagram}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 py-2 text-xs flex items-center gap-1.5 ring-1 ring-border bg-background hover:bg-secondary cursor-pointer"
                      onClick={() => setEditingCreator(c)}
                    >
                      <Pencil className="size-3.5 text-primary" />
                      <span>Edit</span>
                    </Button>

                    <select
                      value={c.status}
                      onChange={(e) =>
                        setCreatorStatus(c.id, e.target.value as CreatorStatus)
                      }
                      className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border focus:ring-2 focus:ring-primary focus:outline-hidden"
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
                      className="px-3 py-2 text-xs"
                      onClick={() => toggleFeatured(c.id)}
                    >
                      {c.featured ? "Unfeature" : "Feature"}
                    </Button>

                    <Link
                      to="/creators/$creatorId"
                      params={{ creatorId: getCreatorProfileSlug(c) }}
                      className="rounded-xl bg-background px-3 py-2 text-xs font-semibold ring-1 ring-border hover:bg-secondary transition-colors"
                    >
                      View
                    </Link>

                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 py-2 text-xs text-rose hover:bg-rose/10"
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


