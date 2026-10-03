import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  DatePicker,
  DropdownSelect,
  Field,
  Label,
  SectionEyebrow,
  Select,
  Tag,
  TextArea,
  TextInput,
} from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { supabaseDb, supabase } from "@/lib/supabase";
import {
  CATEGORIES,
  CITIES,
  COLLAB_TYPES,
  CONTENT_TYPES,
  LANGUAGES,
  TRAVEL_RANGES,
  TURNAROUNDS,
  calculateAge,
  formatFollowers,
  formatPrice,
  type Creator,
} from "@/lib/directory-data";
import defaultPhoto from "@/assets/creator-aditi.jpg";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/creator/register")({
  head: () => ({
    meta: [
      { title: "Create your creator profile — influencer Dhundo" },
      {
        name: "description",
        content:
          "Build your creator profile for free in a few minutes: location, categories, content formats, languages, collaboration preferences and starting price.",
      },
      { property: "og:title", content: "Create your creator profile" },
      {
        property: "og:description",
        content:
          "Get discovered by local businesses looking for creators in your area. Creating a profile is free.",
      },
    ],
  }),
  component: Register,
});

const STEPS = ["Account", "Basics", "Social", "Content", "Collaboration", "Preview"] as const;
const DRAFT_STORAGE_KEY = "influencer-dhundo-creator-draft-v2";

type Form = {
  // ── Account step ──────────────────────────
  password: string;
  confirmPassword: string;
  // ── Basics step ───────────────────────────
  name: string;
  displayName: string;
  birthDate: string;
  email: string;
  mobile: string;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  photo: string;
  about: string;
  // ── Social step ───────────────────────────
  instagram: string;
  followers: string;
  facebook: string;
  youtube: string;
  otherPlatform: string;
  // ── Content step ──────────────────────────
  categories: string[];
  contentTypes: string[];
  languages: string[];
  // ── Collaboration step ────────────────────
  collabType: string;
  startingPrice: string;
  travels: "" | "Yes" | "No";
  travelRange: string;
  acceptsProducts: "" | "Yes" | "No" | "Depends";
  acceptsProductsDetails: string;
  turnaround: string;
};

const initialForm: Form = {
  password: "",
  confirmPassword: "",
  name: "",
  displayName: "",
  birthDate: "",
  email: "",
  mobile: "",
  city: "",
  locality: "",
  state: "",
  pincode: "",
  photo: "",
  about: "",
  instagram: "",
  followers: "",
  facebook: "",
  youtube: "",
  otherPlatform: "",
  categories: [],
  contentTypes: [],
  languages: [],
  collabType: "",
  startingPrice: "",
  travels: "",
  travelRange: "",
  acceptsProducts: "",
  acceptsProductsDetails: "",
  turnaround: "",
};

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function Register() {
  const navigate = useNavigate();
  const { creators, myCreatorId, upsertCreatorWithAuth, loginCreator, startFreeTrial, hasUsedTrial } =
    useAppState();
  const existing = creators.find((c) => c.id === myCreatorId);

  const [step, setStep] = useState(existing ? 1 : 0);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Referral code from URL param, localStorage draft, or manual input
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get("ref");
      if (urlRef) return urlRef.trim().toUpperCase();
      try {
        const saved = localStorage.getItem("influencer_referral_code");
        if (saved) return saved.trim().toUpperCase();
      } catch {
        // ignore
      }
    }
    return "";
  });
  const [referrerInfo, setReferrerInfo] = useState<{ id: string; name: string } | null>(null);
  const [referralStatus, setReferralStatus] = useState<string>("");

  // Persist referral code to localStorage
  useEffect(() => {
    if (referralCode) {
      try {
        localStorage.setItem("influencer_referral_code", referralCode.trim().toUpperCase());
      } catch {
        // ignore
      }
    }
  }, [referralCode]);

  useEffect(() => {
    async function checkReferral() {
      if (!referralCode || referralCode.trim().length < 4) {
        setReferrerInfo(null);
        setReferralStatus("");
        return;
      }
      const cleaned = referralCode.trim().toUpperCase();
      // Check local creators first
      const local = creators.find(
        (c) => c.referralCode && c.referralCode.toUpperCase() === cleaned,
      );
      if (local) {
        setReferrerInfo({ id: local.id, name: local.displayName || local.name });
        setReferralStatus(`Invited by ${local.displayName || local.name}`);
        return;
      }
      // Check Supabase
      const remote = await supabaseDb.lookupReferralCode(cleaned);
      if (remote) {
        setReferrerInfo({ id: remote.id, name: remote.displayName || remote.name });
        setReferralStatus(`Invited by ${remote.displayName || remote.name}`);
      } else {
        setReferrerInfo(null);
        setReferralStatus("Referral code not found");
      }
    }
    checkReferral();
  }, [referralCode, creators]);

  // Initialize form from existing creator OR saved draft in localStorage
  const [form, setForm] = useState<Form>(() => {
    if (existing) {
      return {
        ...initialForm,
        name: existing.name,
        displayName: existing.displayName,
        birthDate: existing.birthDate ?? "",
        email: existing.contact.email,
        mobile: existing.contact.phone,
        city: existing.city,
        locality: existing.locality,
        state: existing.state,
        pincode: existing.pincode,
        photo: existing.photo,
        about: existing.about,
        instagram: existing.instagram,
        followers: String(existing.followers),
        categories: existing.categories,
        contentTypes: existing.contentTypes,
        languages: existing.languages,
        collabType: existing.collabType,
        startingPrice: String(existing.startingPrice),
        travels: existing.travels ? "Yes" : "No",
        travelRange: existing.travelRange ?? "",
        acceptsProducts: existing.acceptsProducts,
        acceptsProductsDetails: existing.acceptsProductsDetails ?? "",
        turnaround: existing.turnaround,
      };
    }
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return { ...initialForm, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return initialForm;
  });

  // Save form draft to localStorage
  useEffect(() => {
    if (!existing && (form.name || form.email || form.instagram || form.city)) {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      } catch {
        // ignore
      }
    }
  }, [form, existing]);

  // Check for existing session & listen for cross-tab auth state changes (e.g. email confirmation in another tab)
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setAuthUserId(data.session.user.id);
        if (awaitingVerification) {
          setAwaitingVerification(false);
          setStep((s) => (s === 0 ? 1 : s));
        }
      }
    }
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUserId(session.user.id);
        setAwaitingVerification(false);
        setStep((s) => (s === 0 ? 1 : s));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [awaitingVerification]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (key: "categories" | "contentTypes" | "languages", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const draft: Creator = useMemo(
    () => ({
      id:
        existing?.id ??
        (form.displayName || form.name || "my-profile").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: form.name || "Your name",
      displayName: form.displayName || form.name,
      photo: form.photo || defaultPhoto,
      city: form.city || "Your city",
      locality: form.locality || "Your locality",
      state: form.state || "",
      pincode: form.pincode,
      followers: Number(form.followers) || 0,
      instagram: form.instagram.startsWith("@")
        ? form.instagram
        : form.instagram
          ? `@${form.instagram}`
          : "@yourhandle",
      otherSocials: [
        form.facebook ? { platform: "Facebook", handle: form.facebook } : null,
        form.youtube ? { platform: "YouTube", handle: form.youtube } : null,
        form.otherPlatform ? { platform: "Other", handle: form.otherPlatform } : null,
      ].filter(Boolean) as Creator["otherSocials"],
      categories: form.categories,
      contentTypes: form.contentTypes,
      languages: form.languages,
      about: form.about,
      collabType: (form.collabType || "Paid") as Creator["collabType"],
      startingPrice: Number(form.startingPrice) || 0,
      travels: form.travels === "Yes",
      travelRange: form.travels === "Yes" ? form.travelRange : undefined,
      acceptsProducts: (form.acceptsProducts || "Depends") as Creator["acceptsProducts"],
      acceptsProductsDetails:
        form.acceptsProducts === "Depends"
          ? form.acceptsProductsDetails.trim() || undefined
          : undefined,
      turnaround: form.turnaround || "3–5 days",
      status: existing?.status ?? "Inactive",
      birthDate: form.birthDate || undefined,
      referralCode: existing?.referralCode,
      referredBy: referrerInfo?.id ?? existing?.referredBy,
      contact: {
        phone: form.mobile,
        whatsapp: form.mobile,
        email: form.email,
      },
    }),
    [form, existing, referrerInfo],
  );

  const validateStep = () => {
    if (step === 0) {
      // Account step — only for new sign-ups
      if (existing) return "";
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email address.";
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      return "";
    }
    if (step === 1) {
      if (!form.name.trim()) return "Please enter your name.";
      if (!form.birthDate) return "Please enter your date of birth.";
      const age = calculateAge(form.birthDate);
      if (age === null || isNaN(age)) return "Please enter a valid date of birth.";
      if (age < 13) return "Creators must be at least 13 years old.";
      if (age > 100) return "Please enter a valid date of birth.";
      if (!form.mobile.trim() || form.mobile.replace(/\D/g, "").length < 10)
        return "Please enter a valid 10-digit mobile number.";
      if (!form.city) return "Select your city.";
      if (!form.locality.trim()) return "Enter your locality.";
      if (wordCount(form.about) > 300) return "About must be 300 words or less.";
    }
    if (step === 2) {
      if (!form.instagram.trim()) return "Instagram profile is required.";
      if (!form.followers || Number(form.followers) <= 0)
        return "Enter your Instagram follower count.";
    }
    if (step === 3) {
      if (!form.categories.length) return "Select at least one category.";
      if (!form.contentTypes.length) return "Select at least one content type.";
      if (!form.languages.length) return "Select at least one language.";
    }
    if (step === 4) {
      if (!form.collabType) return "Select your collaboration type.";
      if (!form.startingPrice) return "Enter your starting price.";
      if (!form.travels) return "Tell us whether you travel for collaborations.";
      if (form.travels === "Yes" && !form.travelRange) return "Select your travel range.";
      if (!form.acceptsProducts)
        return "Tell us whether you accept products or services delivered to you.";
      if (form.acceptsProducts === "Depends" && !form.acceptsProductsDetails.trim())
        return "Please explain what your product/service delivery acceptance depends on.";
      if (!form.turnaround) return "Select your typical turnaround.";
    }
    return "";
  };

  const next = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");

    // Step 0: create Supabase Auth account
    if (step === 0 && !existing) {
      setSigningUp(true);
      try {
        const result = await supabaseDb.signUpCreator(form.email.trim(), form.password);
        if ("error" in result) {
          // If user already exists, try signing in with their password!
          if (
            result.error.toLowerCase().includes("already registered") ||
            result.error.toLowerCase().includes("user already exists")
          ) {
            const signInRes = await supabase.auth.signInWithPassword({
              email: form.email.trim(),
              password: form.password,
            });
            if (signInRes.data?.session?.user) {
              setAuthUserId(signInRes.data.session.user.id);
              setStep(1);
              return;
            }
          }
          setError(result.error);
          return;
        }

        setAuthUserId(result.userId);

        if (result.hasSession) {
          // Direct login without email gate
          setStep(1);
        } else {
          // Email confirmation required
          setAwaitingVerification(true);
        }
        return;
      } finally {
        setSigningUp(false);
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  /** User clicks "I've confirmed" — check if session is active or sign in */
  const handleVerificationCheck = async () => {
    setVerifyError("");
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setAuthUserId(data.session.user.id);
      setAwaitingVerification(false);
      setStep(1);
      return;
    }

    // Attempt direct sign in with password in case confirmation was handled elsewhere
    try {
      const signInRes = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (signInRes.data?.session?.user) {
        setAuthUserId(signInRes.data.session.user.id);
        setAwaitingVerification(false);
        setStep(1);
        return;
      }
    } catch {
      // ignore
    }

    setVerifyError(
      "Your email isn't confirmed yet. Please click the link in the email we sent, then click this button again.",
    );
  };

  /** Resend verification email with a 60-second cooldown */
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    await supabase.auth.resend({ type: "signup", email: form.email.trim() });
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  /** Final save handler on step 5 (Preview) */
  const handleFinalSave = async (redirectTo: "/creator/plans" | "/creator/dashboard") => {
    setSaving(true);
    setSaveError("");

    try {
      let finalReferredBy = draft.referredBy;
      if (!finalReferredBy && referralCode && referralCode.trim().length >= 4) {
        const cleaned = referralCode.trim().toUpperCase();
        const local = creators.find((c) => c.referralCode && c.referralCode.toUpperCase() === cleaned);
        if (local) {
          finalReferredBy = local.id;
        } else {
          const remote = await supabaseDb.lookupReferralCode(cleaned);
          if (remote) {
            finalReferredBy = remote.id;
          }
        }
      }

      const finalDraft: Creator = {
        ...draft,
        referredBy: finalReferredBy || undefined,
      };

      const uid = authUserId || (await supabaseDb.getCreatorSession());
      const result = await upsertCreatorWithAuth(finalDraft, uid);

      if (!result.success) {
        setSaveError(
          result.error ||
            "Failed to save profile to database. Please check your connection and retry.",
        );
        return;
      }

      // Automatically start 3-day free trial for new creators
      if (!existing && !hasUsedTrial(finalDraft.id)) {
        await startFreeTrial(finalDraft.id);
      }

      // Success! Clear local draft cache & referral cache
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem("influencer_referral_code");
      } catch {
        // ignore
      }

      loginCreator(finalDraft.id);
      navigate({ to: redirectTo });
    } catch (err) {
      setSaveError(String(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Email verification gate ────────────────────────────────────────────────
  if (awaitingVerification) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center px-5 py-16">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 -left-16 size-48 rounded-full bg-accent/15 blur-2xl" />
          <Card className="relative glass-card rounded-2xl sm:rounded-3xl p-8 shadow-xl border border-border/80 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                className="size-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-2xl font-display font-semibold tracking-tight">
              Check your inbox
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{form.email}</span>. Click that link
              to verify your email, and this page will automatically continue.
            </p>

            <div className="mt-5 rounded-xl bg-secondary/80 p-4 text-left text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground text-sm">How to continue:</p>
              <p>
                1. Open the email from <strong>Influencer Dhundo</strong>
              </p>
              <p>
                2. Click <strong>"Confirm your email"</strong>
              </p>
              <p>3. This window will advance automatically (or click below)</p>
            </div>

            {verifyError ? (
              <div className="mt-4 rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                {verifyError}
              </div>
            ) : null}

            <Button
              variant="ink"
              className="mt-6 w-full justify-center py-3 font-semibold"
              onClick={handleVerificationCheck}
            >
              ✓ I've confirmed my email — Continue
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Didn't get the email?</span>
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleResendEmail}
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
              </button>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setAwaitingVerification(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                ← Back to account setup
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        {/* CONTAINER ALIGNED EXACTLY WITH SITE HEADER / LOGO */}
        <div className="relative mx-auto max-w-5xl px-5">
          <div className="max-w-2xl">
            <SectionEyebrow>Creator registration</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              {existing ? "Edit your profile" : "Create your creator profile"}
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Free to create and takes a few minutes. You only pay when you want to be visible in
              the directory.
            </p>
          </div>

          {/* STEP RAIL */}
          <div className="mt-8 flex flex-wrap gap-2">
            {STEPS.filter((_, i) => !(existing && i === 0)).map((s, i) => {
              // When editing, skip index 0 (Account), so visual index shifts by -1
              const actualIndex = existing ? i + 1 : i;
              return (
                <span
                  key={s}
                  className={
                    actualIndex === step
                      ? "rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background shadow-sm"
                      : actualIndex < step
                        ? "rounded-full bg-accent/15 px-3.5 py-1.5 text-xs font-semibold text-tealdeep"
                        : "rounded-full bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
                  }
                >
                  {i + 1}. {s}
                </span>
              );
            })}
          </div>

          {/* FORM CARD (ALIGNED FLUSH WITH CONTAINER) */}
          <div className="mt-6">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
              {/* ── Step 0: Account (sign-up) ─────────────────────────────────── */}
              {step === 0 && !existing ? (
                <div className="space-y-5">
                  <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Create your account first
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      You'll use these credentials to log in and edit your profile any time.
                    </p>
                  </div>

                  <Field label="Email address" hint="This will be your login email">
                    <TextInput
                      type="email"
                      value={form.email}
                      maxLength={255}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@email.com"
                      autoFocus
                    />
                  </Field>

                  <Field label="Password" hint="At least 8 characters">
                    <div className="relative">
                      <TextInput
                        type={showPwd ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder="Create a password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm password">
                    <div className="relative">
                      <TextInput
                        type={showConfirmPwd ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => set("confirmPassword", e.target.value)}
                        placeholder="Repeat your password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                      >
                        {showConfirmPwd ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field
                    label="Referral code (optional)"
                    hint="Enter a creator's referral code to connect accounts"
                  >
                    <TextInput
                      type="text"
                      value={referralCode}
                      maxLength={30}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DHUNDO-RS7X2A"
                      className="font-mono uppercase tracking-wider"
                    />
                    {referrerInfo ? (
                      <p className="mt-1 text-xs font-semibold text-tealdeep">
                        ✓ Valid invitation from {referrerInfo.name}
                      </p>
                    ) : referralCode.trim().length >= 4 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {referralStatus || "Checking code..."}
                      </p>
                    ) : null}
                  </Field>

                  <div className="rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-3.5 flex items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                      3D
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">3-Day Free Trial Included</p>
                      <p className="text-muted-foreground">
                        Your profile automatically goes live for 3 days once created. No credit card required.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/creator/login"
                      className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Log in instead
                    </Link>
                  </p>
                </div>
              ) : null}

              {/* ── Step 1: Basics ────────────────────────────────────────────── */}
              {step === 1 ? (
                <div className="space-y-4">
                  <Field label="Full name">
                    <TextInput
                      value={form.name}
                      maxLength={100}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Aditi Sharma"
                    />
                  </Field>
                  <Field label="Creator / display name">
                    <TextInput
                      value={form.displayName}
                      maxLength={60}
                      onChange={(e) => set("displayName", e.target.value)}
                      placeholder="aditi.eats"
                    />
                  </Field>
                  <Field label="Profile photo" hint="JPG or PNG, portrait or square works best.">
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Instant local preview
                          const localPreview = URL.createObjectURL(file);
                          set("photo", localPreview);

                          // Upload to Supabase Storage bucket
                          setUploadingPhoto(true);
                          try {
                            const publicUrl = await supabaseDb.uploadCreatorPhoto(
                              file,
                              form.displayName || form.name || "creator",
                            );
                            if (publicUrl) {
                              set("photo", publicUrl);
                            }
                          } catch (err) {
                            console.error("Photo upload failed:", err);
                          } finally {
                            setUploadingPhoto(false);
                          }
                        }}
                        className="w-full rounded-xl bg-background px-4 py-3 text-sm ring-1 ring-border file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                      />
                      {form.photo ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={form.photo}
                            alt="Preview"
                            className="size-16 rounded-xl object-cover ring-1 ring-border shadow-sm"
                          />
                          <div className="text-xs text-muted-foreground">
                            {uploadingPhoto ? (
                              <span className="inline-flex items-center text-primary font-medium">
                                ⏳ Uploading to Supabase Storage...
                              </span>
                            ) : (
                              <span className="text-tealdeep font-medium">
                                ✓ Photo ready
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email">
                      <TextInput
                        type="email"
                        value={form.email}
                        maxLength={255}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@email.com"
                      />
                    </Field>
                    <Field label="Mobile number">
                      <TextInput
                        value={form.mobile}
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(e) => set("mobile", e.target.value)}
                        placeholder="9820011223"
                      />
                    </Field>
                  </div>
                  <Field
                    label="Date of birth"
                    hint={
                      form.birthDate && calculateAge(form.birthDate) !== null
                        ? `Age: ${calculateAge(form.birthDate)} years old (auto-updated every year)`
                        : "Required to calculate your age accurately for brand listings"
                    }
                  >
                    <DatePicker
                      value={form.birthDate}
                      maxDate={new Date().toISOString().split("T")[0]}
                      onChange={(val) => set("birthDate", val)}
                      placeholder="Select your date of birth"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="City">
                      <DropdownSelect
                        value={form.city}
                        onChange={(val) => set("city", val)}
                        placeholder="Select city"
                        options={CITIES}
                      />
                    </Field>
                    <Field label="Locality">
                      <TextInput
                        value={form.locality}
                        onChange={(e) => set("locality", e.target.value)}
                        placeholder="Thane West"
                      />
                    </Field>
                    <Field label="Pincode">
                      <TextInput
                        value={form.pincode}
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(e) => set("pincode", e.target.value)}
                        placeholder="400601"
                      />
                    </Field>
                  </div>
                  <Field label="State">
                    <TextInput
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      placeholder="Maharashtra"
                    />
                  </Field>
                  <Field
                    label="About you"
                    hint={`${wordCount(form.about)}/300 words — tell businesses briefly about yourself and the content you create.`}
                  >
                    <TextArea
                      value={form.about}
                      onChange={(e) => set("about", e.target.value)}
                      placeholder="I create short-form food content around cafés and local experiences…"
                    />
                  </Field>
                </div>
              ) : null}

              {/* ── Step 2: Social ────────────────────────────────────────────── */}
              {step === 2 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Instagram profile" hint="Required">
                      <TextInput
                        value={form.instagram}
                        onChange={(e) => set("instagram", e.target.value)}
                        placeholder="@aditi.eats"
                      />
                    </Field>
                    <Field label="Instagram followers" hint="Required">
                      <TextInput
                        value={form.followers}
                        inputMode="numeric"
                        onChange={(e) => set("followers", e.target.value.replace(/\D/g, ""))}
                        placeholder="12400"
                      />
                    </Field>
                  </div>
                  <p className="label-caps">Other platforms (optional)</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Facebook">
                      <TextInput
                        value={form.facebook}
                        onChange={(e) => set("facebook", e.target.value)}
                        placeholder="Page name"
                      />
                    </Field>
                    <Field label="YouTube">
                      <TextInput
                        value={form.youtube}
                        onChange={(e) => set("youtube", e.target.value)}
                        placeholder="@channel"
                      />
                    </Field>
                    <Field label="Other platform">
                      <TextInput
                        value={form.otherPlatform}
                        onChange={(e) => set("otherPlatform", e.target.value)}
                        placeholder="e.g. Sharechat"
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {/* ── Step 3: Content ───────────────────────────────────────────── */}
              {step === 3 ? (
                <div className="space-y-6">
                  <div>
                    <Label>Category</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pick the broad categories that describe your content.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={form.categories.includes(c)}
                          onClick={() => toggle("categories", c)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Content type</Label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {CONTENT_TYPES.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          tone="accent"
                          selected={form.contentTypes.includes(c)}
                          onClick={() => toggle("contentTypes", c)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Languages</Label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {LANGUAGES.map((l) => (
                        <Chip
                          key={l}
                          label={l}
                          selected={form.languages.includes(l)}
                          onClick={() => toggle("languages", l)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Step 4: Collaboration ─────────────────────────────────────── */}
              {step === 4 ? (
                <div className="space-y-6">
                  <div>
                    <Label>Collaboration type</Label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {COLLAB_TYPES.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={form.collabType === c}
                          onClick={() => set("collabType", c)}
                        />
                      ))}
                    </div>
                  </div>

                  <Field
                    label="Starting price (₹)"
                    hint="Shown publicly as “Starting from ₹1,000”. Format-wise pricing is optional."
                  >
                    <TextInput
                      value={form.startingPrice}
                      inputMode="numeric"
                      onChange={(e) => set("startingPrice", e.target.value.replace(/\D/g, ""))}
                      placeholder="1000"
                    />
                  </Field>

                  <div>
                    <Label>Do you travel to businesses for collaborations?</Label>
                    <div className="mt-3 flex gap-2">
                      {(["Yes", "No"] as const).map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          selected={form.travels === v}
                          onClick={() => {
                            set("travels", v);
                            if (v === "No") set("travelRange", "");
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {form.travels === "Yes" ? (
                    <div>
                      <Label>How far are you generally willing to travel?</Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TRAVEL_RANGES.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            selected={form.travelRange === t}
                            onClick={() => set("travelRange", t)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Label>Do you accept products or services delivered to you?</Label>
                    <div className="mt-3 flex gap-2">
                      {(["Yes", "No", "Depends"] as const).map((v) => (
                        <Chip
                          key={v}
                          label={v}
                          selected={form.acceptsProducts === v}
                          onClick={() => {
                            set("acceptsProducts", v);
                            if (v !== "Depends") set("acceptsProductsDetails", "");
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {form.acceptsProducts === "Depends" ? (
                    <Field
                      label="What does it depend on?"
                      hint="e.g. Depends on product category, brand fit, minimum retail value, or clear creative brief."
                    >
                      <TextInput
                        value={form.acceptsProductsDetails}
                        maxLength={200}
                        onChange={(e) => set("acceptsProductsDetails", e.target.value)}
                        placeholder="e.g. Only beauty & skincare products, or minimum value ₹2,000"
                      />
                    </Field>
                  ) : null}

                  <div>
                    <Label>Typical turnaround time</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      An approximate timeframe, not a guarantee.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TURNAROUNDS.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          selected={form.turnaround === t}
                          onClick={() => set("turnaround", t)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── Step 5: Preview ───────────────────────────────────────────── */}
              {step === 5 ? (
                <div>
                  <p className="label-caps">This is how businesses will see you</p>
                  <div className="glass-card mt-3 rounded-2xl p-5 border border-border/80">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                        src={draft.photo}
                        alt={draft.name}
                        loading="lazy"
                        width={816}
                        height={816}
                        className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-border"
                      />
                      <div className="min-w-0">
                        <h2 className="text-2xl leading-tight">{draft.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          📍 {[draft.locality, draft.city].filter(Boolean).join(", ")}
                          {draft.pincode ? ` · ${draft.pincode}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-tealdeep">
                          {formatFollowers(draft.followers)} Instagram followers
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {draft.categories.map((c) => (
                        <Tag key={c} tone="primary">
                          {c}
                        </Tag>
                      ))}
                      {draft.languages.length ? <Tag>{draft.languages.join(" · ")}</Tag> : null}
                    </div>
                    {draft.about ? (
                      <p className="mt-4 text-sm text-muted-foreground">{draft.about}</p>
                    ) : null}
                    <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 text-sm">
                      {draft.birthDate && calculateAge(draft.birthDate) !== null ? (
                        <div>
                          <dt className="label-caps">Age</dt>
                          <dd className="mt-1 font-medium">
                            {calculateAge(draft.birthDate)} years old
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="label-caps">Creates</dt>
                        <dd className="mt-1 font-medium">{draft.contentTypes.join(" · ")}</dd>
                      </div>
                      <div>
                        <dt className="label-caps">Collaboration</dt>
                        <dd className="mt-1 font-medium">{draft.collabType}</dd>
                      </div>
                      <div>
                        <dt className="label-caps">Travel</dt>
                        <dd className="mt-1 font-medium">
                          {draft.travels ? draft.travelRange : "Does not travel"}
                        </dd>
                      </div>
                      <div>
                        <dt className="label-caps">Accepts products</dt>
                        <dd className="mt-1 font-medium">
                          {draft.acceptsProducts}
                          {draft.acceptsProducts === "Depends" && draft.acceptsProductsDetails
                            ? ` (${draft.acceptsProductsDetails})`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="label-caps">Turnaround</dt>
                        <dd className="mt-1 font-medium">{draft.turnaround}</dd>
                      </div>
                      <div>
                        <dt className="label-caps">Starting from</dt>
                        <dd className="mt-1 font-display text-xl font-semibold text-saffrondeep">
                          {formatPrice(draft.startingPrice)}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      {draft.instagram}
                    </p>
                  </div>

                  {existing ? (
                    <div className="mt-5 rounded-2xl bg-accent/15 border border-accent/25 p-5 text-tealdeep shadow-sm">
                      <p className="font-display text-lg font-semibold">
                        ✓ Review your changes
                      </p>
                      <p className="mt-1 text-sm text-tealdeep/80">
                        Click "Save changes" to update your profile. Your current plan and visibility
                        status will remain unchanged.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-foreground p-5 text-background shadow-md">
                      <p className="font-display text-lg font-semibold">
                        Your profile is saved, but hidden
                      </p>
                      <p className="mt-1 text-sm text-background/70">
                        An unpaid profile is not visible in the public directory. You can activate a
                        plan now or come back later.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {error ? <p className="mt-4 text-sm font-medium text-rose">{error}</p> : null}
              {saveError ? (
                <div className="mt-4 rounded-xl bg-rose/10 p-3.5 text-sm font-medium text-rose">
                  ⚠️ {saveError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                {/* Back: hide on step 0, or on step 1 when editing (existing user skips account step) */}
                {step > 0 && !(step === 1 && existing) ? (
                  <Button variant="ghost" disabled={saving} onClick={() => setStep((s) => s - 1)}>
                    Back
                  </Button>
                ) : null}

                {/* For existing creators: show Save on every step, plus Continue (except Preview) */}
                {existing ? (
                  <>
                    {step < STEPS.length - 1 ? (
                      <Button
                        variant="ghost"
                        className="justify-center gap-2 border border-border"
                        disabled={saving}
                        onClick={async () => {
                          const err = validateStep();
                          if (err) { setError(err); return; }
                          setError("");
                          await handleFinalSave("/creator/dashboard");
                        }}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    ) : null}
                    {step < STEPS.length - 1 ? (
                      <Button variant="primary" className="flex-1" onClick={next}>
                        Continue →
                      </Button>
                    ) : (
                      <Button
                        variant="ink"
                        className="flex-1 justify-center gap-2"
                        disabled={saving}
                        onClick={() => handleFinalSave("/creator/dashboard")}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving changes...
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  /* New creator: standard Continue / Save & plan flow */
                  <>
                    {step < STEPS.length - 1 ? (
                      <Button variant="primary" className="flex-1" disabled={signingUp} onClick={next}>
                        {signingUp ? "Creating account..." : "Continue"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ink"
                          className="flex-1 justify-center gap-2"
                          disabled={saving}
                          onClick={() => handleFinalSave("/creator/plans")}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Saving profile...
                            </>
                          ) : (
                            "Save & choose a plan"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={saving}
                          onClick={() => handleFinalSave("/creator/dashboard")}
                        >
                          Save for later
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already created a profile?{" "}
              <Link
                to="/creator/dashboard"
                className="underline underline-offset-4 font-medium text-foreground hover:text-primary"
              >
                Go to your dashboard
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
