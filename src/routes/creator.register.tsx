import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  GENDERS,
  LANGUAGES,
  STATES,
  TRAVEL_RANGES,
  TURNAROUNDS,
  calculateAge,
  formatFollowers,
  formatInstagramHandle,
  formatPrice,
  normalizeInstagramHandle,
  validateTrustedEmail,
  type Creator,
} from "@/lib/directory-data";
import { Camera, Eye, EyeOff, Gift, Loader2, Save, Sparkles, Trash2, Upload, User } from "lucide-react";
import { GoogleAuthButton } from "@/components/google-auth-button";

export const Route = createFileRoute("/creator/register")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    email?: string | undefined;
    name?: string | undefined;
    ref?: string | undefined;
  } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    name: typeof search["name"] === "string" ? search["name"] : undefined,
    ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your creator profile — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Build your creator profile for free in a few minutes: location, categories, content formats, languages, collaboration preferences and starting price.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Register,
});

const STEPS = ["Account", "Basics", "Social", "Content", "Collaboration", "Preview"] as const;
const DRAFT_STORAGE_KEY = "influencer-dhundo-creator-draft-v2";
const DRAFT_ID_KEY = "influencer-dhundo-creator-draft-id-v2";
const DRAFT_STEP_KEY = "influencer-dhundo-creator-draft-step-v2";

function getOrCreateDraftId(name: string, email: string, mobile: string): string {
  if (typeof window === "undefined") return "draft-lead";
  try {
    const existingId = localStorage.getItem(DRAFT_ID_KEY);
    if (existingId) return existingId;
  } catch {
    // ignore
  }
  const clean = (name || email.split("@")[0] || mobile || "lead")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const newId = `draft-${clean || "creator"}-${randomSuffix}`;
  try {
    localStorage.setItem(DRAFT_ID_KEY, newId);
  } catch {
    // ignore
  }
  return newId;
}

type Form = {
  // ── Account step ──────────────────────────
  password: string;
  confirmPassword: string;
  // ── Basics step ───────────────────────────
  name: string;
  displayName: string;
  birthDate: string;
  gender: string;
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
  gender: "",
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
  const { email: queryEmail, name: queryName, ref: queryRef } = Route.useSearch();
  const { creators, myCreatorId, upsertCreatorWithAuth, loginCreator, startFreeTrial, hasUsedTrial } =
    useAppState();
  const existing = creators.find((c) => c.id === myCreatorId);

  const [step, setStep] = useState(() => {
    if (existing) return 1;
    if (typeof window !== "undefined") {
      try {
        const savedStep = localStorage.getItem(DRAFT_STEP_KEY);
        if (savedStep) {
          const num = Number(savedStep);
          if (!isNaN(num) && num >= 1 && num < STEPS.length) return num;
        }
      } catch {}
    }
    return 0;
  });
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLater, setSavingLater] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Referral code from URL param, query param, localStorage draft, or manual input
  const [referralCode, setReferralCode] = useState(() => {
    if (queryRef) return queryRef.trim().toUpperCase();
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

  // Check for active Google / Supabase session on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUserId(session.user.id);
          const hasGoogle =
            session.user.app_metadata?.provider === "google" ||
            session.user.identities?.some((id) => id.provider === "google");
          setIsGoogleAuth(Boolean(hasGoogle));
          if (session.user.email) {
            setForm((prev) => ({
              ...prev,
              email: session.user.email || prev.email,
              name: prev.name || (session.user.user_metadata?.["full_name"] as string) || queryName || "",
            }));
          }
        } else if (queryEmail || queryName) {
          setForm((prev) => ({
            ...prev,
            email: queryEmail || prev.email,
            name: prev.name || queryName || "",
          }));
        }
      } catch (e) {
        console.warn("Could not check session:", e);
      }
    }
    checkAuthSession();
  }, [queryEmail, queryName]);

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
        setReferrerInfo({ id: local.id, name: local.name || local.displayName });
        setReferralStatus(`Invited by ${local.name || local.displayName}`);
        return;
      }
      // Check Supabase
      const remote = await supabaseDb.lookupReferralCode(cleaned);
      if (remote) {
        setReferrerInfo({ id: remote.id, name: remote.name || remote.displayName });
        setReferralStatus(`Invited by ${remote.name || remote.displayName}`);
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
        gender: existing.gender ?? "",
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

  // Save form draft to localStorage and auto-sync in-progress lead to Supabase so Admin can track abandoned registrations
  useEffect(() => {
    if (existing) return;

    if (form.name || form.email || form.instagram || form.city || form.mobile) {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      } catch {
        // ignore
      }
    }

    const hasEnoughData = Boolean(
      (form.name && form.name.trim().length >= 2) ||
      (form.email && form.email.includes("@")) ||
      (form.mobile && form.mobile.trim().length >= 5) ||
      (form.instagram && form.instagram.trim().length >= 2),
    );
    if (!hasEnoughData) return;

    const timer = setTimeout(async () => {
      try {
        const draftId = getOrCreateDraftId(form.name, form.email, form.mobile);
        const currentStepName = STEPS[step] || "Account";
        const draftLead: Creator = {
          id: draftId,
          name: form.name.trim() || form.displayName.trim() || form.instagram.trim() || form.email || "Incomplete Profile",
          displayName: form.displayName.trim() || form.name.trim() || form.instagram.trim() || "Incomplete Profile",
          photo: form.photo || "",
          city: form.city || "Unassigned",
          locality: form.locality || "",
          state: form.state || "",
          pincode: form.pincode || "",
          followers: Number(form.followers) || 0,
          instagram: form.instagram || "",
          otherSocials: [],
          categories: form.categories || [],
          contentTypes: form.contentTypes || [],
          languages: form.languages || [],
          about: form.about || `In-progress registration started on ${new Date().toLocaleDateString("en-IN")}.`,
          collabType: (form.collabType as any) || "Paid",
          startingPrice: Number(form.startingPrice) || 0,
          travels: form.travels === "Yes",
          travelRange: form.travelRange || "",
          acceptsProducts: (form.acceptsProducts as any) || "Depends",
          acceptsProductsDetails: `[Abandoned Lead - Dropped at Step ${step + 1}: ${currentStepName}]`,
          turnaround: form.turnaround || "3–5 days",
          status: "Draft",
          contact: {
            phone: form.mobile || "",
            whatsapp: form.mobile || "",
            email: form.email || "",
          },
          birthDate: form.birthDate || undefined,
          gender: form.gender || undefined,
          referredBy: referralCode || undefined,
        };
        await supabaseDb.upsertCreator(draftLead);
      } catch (err) {
        console.debug("Draft sync error:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, step, existing, referralCode]);

  // Track if this form was loaded for an authenticated creator
  const wasLoggedInRef = useRef(Boolean(myCreatorId));

  // If the logged-in creator logs out while on the edit profile page:
  // Immediately wipe all form fields, purge local drafts, and redirect to /creator/login
  useEffect(() => {
    if (wasLoggedInRef.current && !myCreatorId) {
      setForm(initialForm);
      setStep(0);
      setAuthUserId(null);
      setSaving(false);
      setError("");
      setSaveError("");
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_ID_KEY);
      } catch {
        // ignore
      }
      navigate({ to: "/creator/login" });
    }
    wasLoggedInRef.current = Boolean(myCreatorId);
  }, [myCreatorId, navigate]);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAuthUserId(session.user.id);
        setAwaitingVerification(false);
        setStep((s) => (s === 0 ? 1 : s));
      } else if (event === "SIGNED_OUT") {
        setAuthUserId(null);
        setForm(initialForm);
        setStep(0);
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          localStorage.removeItem(DRAFT_ID_KEY);
        } catch {
          // ignore
        }
        navigate({ to: "/creator/login" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [awaitingVerification, navigate]);

  // Scroll to the top on every step change (Next / Continue / Back) for better UX
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [step]);

  const [emailLiveError, setEmailLiveError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === "name") {
        updated.displayName = String(value || "");
      }
      return updated;
    });
    if (key === "email") {
      const emailStr = String(value || "").trim();
      if (!emailStr) {
        setEmailLiveError(null);
        setEmailSuggestion(null);
      } else if (emailStr.includes("@") && emailStr.split("@")[1]?.includes(".")) {
        const res = validateTrustedEmail(emailStr);
        if (!res.valid) {
          setEmailLiveError(res.error || "Invalid email");
          setEmailSuggestion(res.suggestion || null);
        } else {
          setEmailLiveError(null);
          setEmailSuggestion(null);
        }
      } else {
        setEmailLiveError(null);
        setEmailSuggestion(null);
      }
    }
  };

  const handleEmailBlur = () => {
    if (!form.email.trim()) {
      setEmailLiveError(null);
      setEmailSuggestion(null);
      return;
    }
    const res = validateTrustedEmail(form.email);
    if (!res.valid) {
      setEmailLiveError(res.error || "Invalid email");
      setEmailSuggestion(res.suggestion || null);
    } else {
      setEmailLiveError(null);
      setEmailSuggestion(null);
    }
  };

  const toggle = (key: "categories" | "contentTypes" | "languages", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const draft: Creator = useMemo(
    () => {
      const cleanName = (form.name || "").trim();
      const cleanDisplay = (form.displayName || form.name || "").trim();
      const generatedId = (cleanName || cleanDisplay || "my-profile")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      return {
        id: existing?.id ?? (generatedId || "my-profile"),
        name: cleanName || form.email.split("@")[0] || "New Creator",
        displayName: cleanDisplay || cleanName || form.email.split("@")[0] || "New Creator",
        photo: (form.photo || "").trim(),
        city: (form.city || "").trim() || "Unassigned",
        locality: (form.locality || "").trim(),
        state: (form.state || "").trim(),
        pincode: (form.pincode || "").trim(),
        followers: Number(form.followers) || 0,
        instagram: form.instagram.trim()
          ? (normalizeInstagramHandle(form.instagram)
              ? `@${normalizeInstagramHandle(form.instagram)}`
              : form.instagram.startsWith("@")
                ? form.instagram.trim()
                : `@${form.instagram.trim()}`)
          : "",
        otherSocials: [
          form.facebook ? { platform: "Facebook", handle: form.facebook.trim() } : null,
          form.youtube ? { platform: "YouTube", handle: form.youtube.trim() } : null,
          form.otherPlatform ? { platform: "Other", handle: form.otherPlatform.trim() } : null,
        ].filter(Boolean) as Creator["otherSocials"],
        categories: form.categories,
        contentTypes: form.contentTypes,
        languages: form.languages,
        about: (form.about || "").trim(),
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
        status: existing?.status ?? "Draft",
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        referralCode: existing?.referralCode,
        referredBy: referrerInfo?.id ?? existing?.referredBy,
        contact: {
          phone: (form.mobile || "").trim(),
          whatsapp: (form.mobile || "").trim(),
          email: (form.email || "").trim(),
        },
      };
    }, [form, existing, referrerInfo]);

  const validateStep = () => {
    if (step === 0) {
      // Account step — only for new sign-ups
      if (existing) return "";
      const cleanMobile = form.mobile.replace(/\D/g, "");
      if (!cleanMobile || cleanMobile.length < 10) {
        return "Please enter a valid 10-digit WhatsApp / mobile number.";
      }
      if (authUserId || isGoogleAuth) return ""; // Google-verified account
      const emailCheck = validateTrustedEmail(form.email);
      if (!emailCheck.valid) return emailCheck.error!;
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      return "";
    }
    if (step === 1) {
      // Step 1: Mandatory fields are Full name, Email, Mobile, Gender, State, City, Pincode
      if (!form.name.trim()) return "Please enter your full name.";
      const emailCheck = validateTrustedEmail(form.email);
      if (!emailCheck.valid) return emailCheck.error || "Please enter a valid email address.";
      const cleanMobile = form.mobile.replace(/\D/g, "");
      if (!cleanMobile || cleanMobile.length < 10)
        return "Please enter a valid 10-digit mobile number.";
      if (!form.gender) return "Please select your gender.";
      if (!form.state) return "Please select your state.";
      if (!form.city) return "Please select your city.";
      const cleanPin = form.pincode.replace(/\D/g, "");
      if (!cleanPin || cleanPin.length < 6)
        return "Please enter a valid 6-digit pincode.";

      // Optional fields in Step 1
      if (form.birthDate) {
        const age = calculateAge(form.birthDate);
        if (age === null || isNaN(age)) return "Please enter a valid date of birth.";
        if (age < 13) return "Creators must be at least 13 years old.";
        if (age > 100) return "Please enter a valid date of birth.";
      }
      if (form.about && wordCount(form.about) > 300) return "About must be 300 words or less.";
      return "";
    }

    // After step 1: NO mandatory field inputs (all optional, can be completed now or later)
    if (step === 2) {
      if (form.instagram.trim()) {
        const cleanHandle = normalizeInstagramHandle(form.instagram);
        if (!cleanHandle) return "Please enter a valid Instagram username or profile link.";
      }
      if (form.followers) {
        const numFollowers = Number(form.followers);
        if (isNaN(numFollowers) || numFollowers < 0)
          return "Please enter a valid follower count.";
        if (numFollowers > 300000)
          return "Follower count cannot exceed 300,000 (300K).";
      }
      return "";
    }
    if (step === 3) {
      return ""; // categories, content types, languages are optional
    }
    if (step === 4) {
      if (form.startingPrice) {
        const price = Number(form.startingPrice);
        if (isNaN(price) || price < 0) return "Starting price cannot be negative.";
        if (price > 100000) return "Starting price cannot exceed ₹1,00,000.";
      }
      return ""; // collaboration options are optional
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

    // Step 0: create Supabase Auth account & immediately capture lead
    if (step === 0 && !existing) {
      // Immediately write lead to Supabase so Email and WhatsApp are 100% saved
      try {
        const draftId = getOrCreateDraftId(form.name, form.email, form.mobile);
        const draftLead: Creator = {
          id: draftId,
          name: form.name.trim() || form.email.split("@")[0] || "New Creator Lead",
          displayName: form.displayName.trim() || form.name.trim() || form.email.split("@")[0] || "New Creator",
          photo: form.photo || "",
          city: form.city || "Unassigned",
          locality: form.locality || "",
          state: form.state || "",
          pincode: form.pincode || "",
          followers: Number(form.followers) || 0,
          instagram: form.instagram || "",
          otherSocials: [],
          categories: form.categories || [],
          contentTypes: form.contentTypes || [],
          languages: form.languages || [],
          about: form.about || `In-progress registration started on ${new Date().toLocaleDateString("en-IN")}.`,
          collabType: (form.collabType as any) || "Paid",
          startingPrice: Number(form.startingPrice) || 0,
          travels: form.travels === "Yes",
          travelRange: form.travelRange || "",
          acceptsProducts: (form.acceptsProducts as any) || "Depends",
          acceptsProductsDetails: "[Initial Account Lead - Step 0 Completed]",
          turnaround: form.turnaround || "3–5 days",
          status: "Draft",
          contact: {
            phone: form.mobile.trim(),
            whatsapp: form.mobile.trim(),
            email: form.email.trim(),
          },
          birthDate: form.birthDate || undefined,
          gender: form.gender || undefined,
          referredBy: referralCode || undefined,
        };
        supabaseDb.upsertCreator(draftLead).catch(() => {});
      } catch {
        // non-blocking
      }

      if (authUserId || isGoogleAuth) {
        // Direct advancement for Google-authenticated creators
        setStep(1);
        return;
      }
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

    setStep((s) => {
      const nextStep = Math.min(s + 1, STEPS.length - 1);
      if (typeof window !== "undefined" && !existing) {
        try {
          localStorage.setItem(DRAFT_STEP_KEY, String(nextStep));
        } catch {}
      }
      return nextStep;
    });
  };

  /** Allows creator to save in-progress draft and finish later from dashboard */
  const handleSaveAndExitLater = async () => {
    // If on Step 1, ensure the 7 mandatory fields are filled first so core contact & location are saved
    if (step === 1) {
      const err = validateStep();
      if (err) {
        setError(err);
        return;
      }
    }
    setSavingLater(true);
    setError("");
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
          localStorage.setItem(DRAFT_STEP_KEY, String(step));
        } catch {}
      }

      const draftId = existing?.id || getOrCreateDraftId(form.name, form.email, form.mobile);
      const currentStepName = STEPS[step] || "Basics";
      const draftCreator: Creator = {
        ...draft,
        id: draftId,
        status: existing?.status === "Active" ? "Active" : "Draft",
        acceptsProductsDetails: existing?.acceptsProductsDetails || `[In-Progress Draft - Paused at ${currentStepName}]`,
      };

      const uid = authUserId || (await supabaseDb.getCreatorSession());
      await upsertCreatorWithAuth(draftCreator, uid).catch(() => {});

      loginCreator(draftId);
      navigate({ to: "/creator/dashboard" });
    } catch {
      setError("Could not save draft. Please check your internet connection.");
    } finally {
      setSavingLater(false);
    }
  };

  /** Creates initial draft profile from the 7 basic fields and takes new creator directly to dashboard */
  const handleCreateInitialProfile = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError("");
    try {
      let finalReferredBy: string | null = null;
      const cleaned = (referralCode || "").trim().toUpperCase();
      if (cleaned) {
        const local = creators.find((c) => c.referralCode?.toUpperCase() === cleaned);
        if (local) {
          finalReferredBy = local.id;
        } else {
          const remote = await supabaseDb.lookupReferralCode(cleaned);
          if (remote) {
            finalReferredBy = remote.id;
          }
        }
      }

      const cleanName = (form.name || "").trim();
      const generatedId = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const draftId = getOrCreateDraftId(form.name, form.email, form.mobile) || generatedId || `creator-${Date.now()}`;

      const initialDraft: Creator = {
        ...draft,
        id: draftId,
        status: "Draft",
        referredBy: finalReferredBy || undefined,
        acceptsProductsDetails: "[Initial Setup - Draft]",
      };

      const uid = authUserId || (await supabaseDb.getCreatorSession());
      const res = await upsertCreatorWithAuth(initialDraft, uid);
      if (!res.success) {
        setError(res.error || "Could not save your profile. Please check your internet connection.");
        return;
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_ID_KEY);
        localStorage.removeItem(DRAFT_STEP_KEY);
      } catch {}

      loginCreator(initialDraft.id);
      navigate({ to: "/creator/dashboard" });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
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
      let candidateRef = referrerInfo?.id || draft.referredBy || referralCode;
      let finalReferredBy = candidateRef;
      if (candidateRef && candidateRef.trim().length >= 4) {
        const cleaned = candidateRef.trim().toUpperCase();
        const local = creators.find(
          (c) => c.id === candidateRef || (c.referralCode && c.referralCode.toUpperCase() === cleaned),
        );
        if (local) {
          finalReferredBy = local.id;
        } else {
          const remote = await supabaseDb.lookupReferralCode(cleaned);
          if (remote) {
            finalReferredBy = remote.id;
          }
        }
      }

      const isDraftOrNew = !existing || existing.status === "Draft";
      const finalDraft: Creator = {
        ...draft,
        status: isDraftOrNew ? "Active" : (existing?.status ?? "Active"),
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

      // Automatically start 3-day free trial once profile setup is fully completed
      if (isDraftOrNew && !hasUsedTrial(finalDraft.id) && !existing?.trialStartedAt) {
        await startFreeTrial(finalDraft.id);
      }

      // Success! Clear local draft cache & temporary draft ID
      try {
        const tempDraftId = localStorage.getItem(DRAFT_ID_KEY);
        if (tempDraftId && tempDraftId !== finalDraft.id) {
          // Clean up the temporary lead record from Supabase since final active profile is now saved
          supabaseDb.deleteCreator(tempDraftId).catch(() => {});
        }
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(DRAFT_ID_KEY);
        localStorage.removeItem(DRAFT_STEP_KEY);
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
          <div className="max-w-2xl text-left md:text-center md:mx-auto">
            <SectionEyebrow>Creator registration</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              {existing ? "Edit your profile" : "Create your creator profile"}
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Set up your profile in 2 minutes and get discovered by local businesses.
            </p>
          </div>

          {/* STEP RAIL (Only visible when existing creator is editing) */}
          {existing && (
            <div className="mt-8 flex flex-wrap gap-2 md:justify-center">
              {[
                { label: "1. Basics", stepIdx: 1 },
                { label: "2. Social", stepIdx: 2 },
                { label: "3. Content", stepIdx: 3 },
                { label: "4. Collaboration", stepIdx: 4 },
                { label: "Preview", stepIdx: 5 },
              ].map(({ label, stepIdx }) => (
                <span
                  key={label}
                  className={
                    step === stepIdx
                      ? "rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background shadow-sm"
                      : step > stepIdx
                        ? "rounded-full bg-accent/15 px-3.5 py-1.5 text-xs font-semibold text-tealdeep"
                        : "rounded-full bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border"
                  }
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* FORM CARD (ALIGNED FLUSH WITH CONTAINER) */}
          <div className="mt-6">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
              {/* CARD HEADER */}
              <div className="pb-5 mb-6 border-b border-border/70">
                {step === 0 && !existing ? (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Create your account
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set up your login credentials and contact details to get started.
                    </p>
                  </div>
                ) : step === 1 && !existing ? (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Basic details
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fill in these 7 quick details to create your creator profile.
                    </p>
                  </div>
                ) : step === 5 ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-tealdeep bg-tealdeep/10 px-2.5 py-0.5 rounded-full">
                        Final Step
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-sm font-semibold text-foreground">
                        Profile Preview
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This is how businesses will see your profile in the directory.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Step {step} of 4
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-sm font-semibold text-foreground">
                        {STEPS[step]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step === 1
                        ? "Required fields marked * — all other fields can be completed later"
                        : "All fields on this step are optional — skip or fill and continue anytime"}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Step 0: Account (sign-up) ─────────────────────────────────── */}
              {step === 0 && !existing ? (
                <div className="space-y-5">
                  {authUserId || isGoogleAuth ? (
                    /* Google-authenticated account badge */
                    <div className="rounded-2xl border border-tealdeep/30 bg-tealdeep/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tealdeep text-white font-bold text-xs">
                          ✓
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Connected with Google
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{form.email}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Your account identity is verified via Google. No password needed!
                      </p>
                    </div>
                  ) : (
                    /* Standard flow: Google option + email/password */
                    <>
                      <GoogleAuthButton
                        role="creator"
                        redirectTarget="/creator/register"
                        label="Sign up with Google"
                      />

                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                          Or sign up with email
                        </div>
                      </div>

                      <Field
                        label="Email address"
                        hint="Trusted providers only (Gmail, Yahoo, Outlook, etc.)"
                        error={emailLiveError || undefined}
                      >
                        <TextInput
                          type="email"
                          value={form.email}
                          maxLength={255}
                          onChange={(e) => set("email", e.target.value)}
                          onBlur={handleEmailBlur}
                          placeholder="you@gmail.com"
                          className={emailLiveError ? "ring-2 ring-rose focus:ring-rose" : ""}
                          autoFocus
                        />
                        {emailSuggestion && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Suggestion:</span>
                            <button
                              type="button"
                              onClick={() => {
                                set("email", emailSuggestion);
                                setEmailLiveError(null);
                                setEmailSuggestion(null);
                              }}
                              className="font-semibold text-primary underline hover:text-primary/80 cursor-pointer"
                            >
                              Use {emailSuggestion}
                            </button>
                          </div>
                        )}
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
                    </>
                  )}

                  {/* WhatsApp / Mobile Number - Captured upfront in Step 0 */}
                  <Field
                    label="WhatsApp / Mobile number"
                    hint="10-digit number. Brands & local businesses will use this to contact you"
                  >
                    <TextInput
                      type="tel"
                      value={form.mobile}
                      maxLength={15}
                      onChange={(e) => set("mobile", e.target.value)}
                      placeholder="9876543210"
                      className="font-mono"
                      required
                    />
                  </Field>

                  {/* Referral Code (Available for both Google & Manual) */}
                  <Field
                    label="Referral code (optional)"
                    hint="Have a creator's referral code? Type or paste it here to link your invitations"
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
                  {!existing ? (
                    <>
                      <Field label="Full name *">
                        <TextInput
                          value={form.name}
                          maxLength={100}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Aditi Sharma"
                          required
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email *">
                          <TextInput
                            type="email"
                            value={form.email}
                            maxLength={255}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="you@email.com"
                            required
                          />
                        </Field>
                        <Field label="Mobile number *" hint="10-digit number. Used for WhatsApp & brand inquiries">
                          <TextInput
                            value={form.mobile}
                            inputMode="numeric"
                            maxLength={15}
                            onChange={(e) => set("mobile", e.target.value)}
                            placeholder="9820011223"
                            className="font-mono"
                            required
                          />
                        </Field>
                      </div>

                      <Field
                        label="Gender *"
                        hint="Helps businesses find relevant creators for targeted campaigns"
                      >
                        <DropdownSelect
                          value={form.gender}
                          onChange={(val) => set("gender", val)}
                          placeholder="Select gender"
                          options={GENDERS}
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="State *">
                          <DropdownSelect
                            value={form.state}
                            onChange={(val) => set("state", val)}
                            placeholder="Select state"
                            searchPlaceholder="Search state..."
                            options={STATES}
                          />
                        </Field>
                        <Field label="City *">
                          <DropdownSelect
                            value={form.city}
                            onChange={(val) => set("city", val)}
                            placeholder="Select city"
                            searchPlaceholder="Search city..."
                            options={CITIES}
                          />
                        </Field>
                      </div>

                      <Field label="Pincode *">
                        <TextInput
                          value={form.pincode}
                          inputMode="numeric"
                          maxLength={6}
                          onChange={(e) => set("pincode", e.target.value)}
                          placeholder="400601"
                          className="font-mono"
                          required
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Full name *">
                        <TextInput
                          value={form.name}
                          maxLength={100}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Aditi Sharma"
                          required
                        />
                      </Field>
                      <Field label="Profile photo (Optional)" hint="JPG, PNG or WebP. Portrait or square works best.">
                        <div className="space-y-3">
                          {form.photo ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-secondary/40 border border-border/80">
                              <div className="flex items-center gap-3.5">
                                <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden ring-2 ring-border shadow-md bg-secondary">
                                  <img
                                    src={form.photo}
                                    alt="Preview"
                                    className="size-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">Profile Photo Selected</p>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {uploadingPhoto ? (
                                      <span className="inline-flex items-center text-primary font-medium">
                                        <Loader2 className="size-3.5 animate-spin mr-1.5" /> Uploading to storage...
                                      </span>
                                    ) : (
                                      <span className="text-tealdeep font-medium inline-flex items-center">
                                        ✓ Photo ready
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Change Photo Button */}
                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-secondary text-foreground text-xs font-semibold ring-1 ring-border/80 transition-all shadow-xs">
                                  <Camera className="size-3.5 text-primary" />
                                  <span>Change Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const localPreview = URL.createObjectURL(file);
                                      set("photo", localPreview);
                                      setUploadingPhoto(true);
                                      try {
                                        const publicUrl = await supabaseDb.uploadCreatorPhoto(
                                          file,
                                          form.name || "creator",
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
                                  />
                                </label>

                                {/* Delete / Remove Photo Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    set("photo", "");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold ring-1 ring-destructive/30 transition-all shadow-xs cursor-pointer"
                                  title="Delete photo"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="group flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-secondary/15 hover:bg-secondary/30 transition-all cursor-pointer text-center">
                                <div className="size-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-105 transition-all">
                                  <Upload className="size-6" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    Click or drag to upload photo
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    JPG, PNG or WebP up to 5MB (leave empty if you prefer no photo)
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const localPreview = URL.createObjectURL(file);
                                      set("photo", localPreview);
                                      setUploadingPhoto(true);
                                      try {
                                        const publicUrl = await supabaseDb.uploadCreatorPhoto(
                                          file,
                                          form.name || "creator",
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
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email *">
                          <TextInput
                            type="email"
                            value={form.email}
                            maxLength={255}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="you@email.com"
                            required
                          />
                        </Field>
                        <Field label="Mobile number *" hint="10-digit number. Used for WhatsApp & brand inquiries">
                          <TextInput
                            value={form.mobile}
                            inputMode="numeric"
                            maxLength={15}
                            onChange={(e) => set("mobile", e.target.value)}
                            placeholder="9820011223"
                            className="font-mono"
                            required
                          />
                        </Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Date of birth (Optional)"
                          hint={
                            form.birthDate && calculateAge(form.birthDate) !== null
                              ? `Age: ${calculateAge(form.birthDate)} years old`
                              : "Optional — helps calculate your age for targeted campaigns (can be filled later)"
                          }
                        >
                          <DatePicker
                            value={form.birthDate}
                            maxDate={new Date().toISOString().split("T")[0]}
                            onChange={(val) => set("birthDate", val)}
                            placeholder="Select your date of birth"
                          />
                        </Field>
                        <Field
                          label="Gender *"
                          hint="Helps businesses find relevant creators for targeted campaigns"
                        >
                          <DropdownSelect
                            value={form.gender}
                            onChange={(val) => set("gender", val)}
                            placeholder="Select gender"
                            options={GENDERS}
                          />
                        </Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="State *">
                          <DropdownSelect
                            value={form.state}
                            onChange={(val) => set("state", val)}
                            placeholder="Select state"
                            searchPlaceholder="Search state..."
                            options={STATES}
                          />
                        </Field>
                        <Field label="City *">
                          <DropdownSelect
                            value={form.city}
                            onChange={(val) => set("city", val)}
                            placeholder="Select city"
                            searchPlaceholder="Search city..."
                            options={CITIES}
                          />
                        </Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Area / Locality (Optional)">
                          <TextInput
                            value={form.locality}
                            onChange={(e) => set("locality", e.target.value)}
                            placeholder="e.g. Thane West, Indiranagar"
                          />
                        </Field>
                        <Field label="Pincode *">
                          <TextInput
                            value={form.pincode}
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(e) => set("pincode", e.target.value)}
                            placeholder="400601"
                            className="font-mono"
                            required
                          />
                        </Field>
                      </div>
                      <Field
                        label="About you (Optional)"
                        hint={`${wordCount(form.about)}/300 words — optional, tell businesses briefly about yourself (can be filled later)`}
                      >
                        <TextArea
                          value={form.about}
                          onChange={(e) => set("about", e.target.value)}
                          placeholder="I create short-form food content around cafés and local experiences…"
                        />
                      </Field>
                    </>
                  )}
                </div>
              ) : null}

              {/* ── Step 2: Social ────────────────────────────────────────────── */}
              {step === 2 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Instagram profile (Username or Link)"
                      hint={
                        normalizeInstagramHandle(form.instagram)
                          ? `Detected handle: @${normalizeInstagramHandle(form.instagram)}`
                          : "Enter handle (e.g. @aditi.eats) or paste full profile link"
                      }
                    >
                      <TextInput
                        value={form.instagram}
                        onChange={(e) => set("instagram", e.target.value)}
                        placeholder="@aditi.eats or https://instagram.com/aditi.eats"
                      />
                    </Field>
                    <Field label="Instagram followers" hint="Min 500, max 300,000 (300K) followers">
                      <TextInput
                        value={form.followers}
                        inputMode="numeric"
                        maxLength={6}
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
                    hint={
                      form.collabType === "Barter"
                        ? "Optional for Barter collaborations (or enter base rate up to ₹1,00,000)."
                        : "Enter starting rate up to ₹1,00,000. Shown publicly as “Starting from ₹1,000”."
                    }
                  >
                    <TextInput
                      value={form.startingPrice}
                      inputMode="numeric"
                      maxLength={6}
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
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        {draft.photo ? (
                          <img
                            src={draft.photo}
                            alt={draft.name}
                            loading="lazy"
                            width={816}
                            height={816}
                            className="size-20 rounded-2xl object-cover ring-1 ring-border shadow-xs"
                          />
                        ) : (
                          <div className="size-20 rounded-2xl bg-secondary ring-1 ring-border flex items-center justify-center text-muted-foreground/50">
                            <User className="size-8 opacity-40" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          {draft.photo ? "Change / Remove" : "+ Add Photo"}
                        </button>
                      </div>
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
                      {draft.gender ? (
                        <div>
                          <dt className="label-caps">Gender</dt>
                          <dd className="mt-1 font-medium">{draft.gender}</dd>
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
                    <div className="mt-5 rounded-2xl bg-accent/15 border border-accent/25 p-5 text-tealdeep shadow-sm">
                      <p className="font-display text-lg font-semibold flex items-center gap-2">
                        <span>🎉</span> You&apos;re almost done! 3-Day Free Trial Included
                      </p>
                      <p className="mt-1 text-sm text-tealdeep/85">
                        Click <strong>Continue</strong> to create your profile and activate your <strong>complimentary 3-Day Free Trial</strong>. Your profile will go live instantly in the public creator directory!
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

              <div className="mt-8 pt-6 border-t border-border space-y-3">
                {/* ROW 1 (mobile): Save & finish later — full width, dark ink style */}
                {/* ROW 1 (desktop): inline with Continue → on the right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left: Go Back */}
                  {step > 0 && !(step === 1 && existing && existing.status === "Active") ? (
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={saving || savingLater}
                      onClick={() => setStep((s) => s - 1)}
                    >
                      ← Go Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {/* Right: Save & finish later + Continue/Submit / Create your profile */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    {step >= 1 && existing && (
                      <Button
                        variant="ink"
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
                        disabled={savingLater || saving}
                        onClick={handleSaveAndExitLater}
                      >
                        {savingLater ? (
                          <>
                            <Loader2 className="size-4 animate-spin shrink-0" />
                            <span>Saving draft...</span>
                          </>
                        ) : (
                          <>
                            <Save className="size-4 shrink-0" />
                            <span>Save & finish later</span>
                          </>
                        )}
                      </Button>
                    )}

                    {step === 1 && !existing ? (
                      <Button
                        variant="primary"
                        type="button"
                        className="w-full sm:w-auto justify-center gap-2 shadow-xs"
                        disabled={saving}
                        onClick={handleCreateInitialProfile}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Creating profile...</span>
                          </>
                        ) : (
                          "Create your profile 🚀"
                        )}
                      </Button>
                    ) : step < STEPS.length - 1 ? (
                      <Button
                        variant="primary"
                        type="button"
                        className="w-full sm:w-auto justify-center"
                        disabled={signingUp || savingLater}
                        onClick={next}
                      >
                        {signingUp ? "Saving & continuing..." : "Continue →"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        type="button"
                        className="w-full sm:w-auto justify-center gap-2 shadow-xs"
                        disabled={saving || savingLater}
                        onClick={() => handleFinalSave("/creator/dashboard")}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving changes...
                          </>
                        ) : existing?.status === "Active" ? (
                          "Save changes"
                        ) : (
                          "Launch Profile 🚀"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
