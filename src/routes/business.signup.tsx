import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { supabase, supabaseDb } from "@/lib/supabase";
import { validateTrustedEmail } from "@/lib/directory-data";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/components/google-auth-button";

export const Route = createFileRoute("/business/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create a free business account — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Create a free business account to view creator contact details. No subscription, no lengthy profile.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BusinessSignup,
});

function BusinessSignup() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const targetUrl = redirect || "/discover";
  const { signUpBusiness, myCreator } = useAppState();

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailLiveError, setEmailLiveError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // Duplicate checks state
  const [duplicateMobileError, setDuplicateMobileError] = useState<string | null>(null);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [duplicateEmailError, setDuplicateEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Debounce check for mobile duplicate
  useEffect(() => {
    const cleanMobile = form.mobile.replace(/\D/g, "").slice(-10);
    if (cleanMobile.length !== 10) {
      setDuplicateMobileError(null);
      setCheckingMobile(false);
      return;
    }

    setCheckingMobile(true);
    const timer = setTimeout(async () => {
      try {
        const res = await supabaseDb.findExistingBusinessByContact({ mobile: cleanMobile });
        if (res.exists) {
          setDuplicateMobileError(
            "A business account with this mobile number already exists."
          );
        } else {
          setDuplicateMobileError(null);
        }
      } catch {
        setDuplicateMobileError(null);
      } finally {
        setCheckingMobile(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.mobile]);

  // Debounce check for email duplicate
  useEffect(() => {
    const cleanEmail = form.email.trim();
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setDuplicateEmailError(null);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await supabaseDb.findExistingBusinessByContact({ email: cleanEmail });
        if (res.exists) {
          setDuplicateEmailError(
            "An account with this email address already exists."
          );
        } else {
          setDuplicateEmailError(null);
        }
      } catch {
        setDuplicateEmailError(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.email]);

  const handleEmailChange = (val: string) => {
    setForm((prev) => ({ ...prev, email: val }));
    const clean = val.trim();
    if (!clean) {
      setEmailLiveError(null);
      setEmailSuggestion(null);
      return;
    }
    if (clean.includes("@") && clean.split("@")[1]?.includes(".")) {
      const res = validateTrustedEmail(clean);
      if (!res.valid) {
        setEmailLiveError(res.error || "Invalid email domain");
        setEmailSuggestion(res.suggestion || null);
      } else {
        setEmailLiveError(null);
        setEmailSuggestion(null);
      }
    } else {
      setEmailLiveError(null);
      setEmailSuggestion(null);
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

  // Listen for cross-tab auth state changes (e.g. email confirmation clicked)
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user && awaitingVerification) {
        setAwaitingVerification(false);
        signUpBusiness(
          {
            name: form.name.trim(),
            businessName: form.businessName.trim(),
            mobile: form.mobile.trim(),
            email: form.email.trim(),
            authUserId: data.session.user.id,
          },
          data.session.user.id,
        );
        router.history.push(targetUrl);
      }
    }
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && awaitingVerification) {
        setAwaitingVerification(false);
        signUpBusiness(
          {
            name: form.name.trim(),
            businessName: form.businessName.trim(),
            mobile: form.mobile.trim(),
            email: form.email.trim(),
            authUserId: session.user.id,
          },
          session.user.id,
        );
        router.history.push(targetUrl);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [awaitingVerification, form, router, targetUrl, signUpBusiness]);

  const validate = () => {
    if (!form.name.trim() || !form.businessName.trim()) {
      return "Please enter your full name and business name.";
    }
    const cleanMobile = form.mobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      return "Please enter a valid 10-digit mobile number.";
    }
    if (duplicateMobileError) {
      return duplicateMobileError;
    }
    const emailCheck = validateTrustedEmail(form.email);
    if (!emailCheck.valid) {
      return emailCheck.error!;
    }
    if (duplicateEmailError) {
      return duplicateEmailError;
    }
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Check for duplicate mobile or email before calling signup
      const cleanMobile = form.mobile.replace(/\D/g, "").slice(-10);
      const cleanEmail = form.email.trim().toLowerCase();
      const existingCheck = await supabaseDb.findExistingBusinessByContact({
        mobile: cleanMobile,
        email: cleanEmail,
      });

      if (existingCheck.exists) {
        if (existingCheck.matchedField === "mobile") {
          const msg = "A business account with this mobile number already exists. Please log in.";
          setDuplicateMobileError(msg);
          setError(msg);
          setLoading(false);
          return;
        } else {
          const msg = "An account with this email address already exists. Please log in.";
          setDuplicateEmailError(msg);
          setError(msg);
          setLoading(false);
          return;
        }
      }

      const result = await supabaseDb.signUpBusiness(form.email.trim(), form.password, {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        mobile: form.mobile.trim(),
      });

      if ("error" in result) {
        // If user already exists, try direct sign-in with the given password
        if (
          result.error.toLowerCase().includes("already registered") ||
          result.error.toLowerCase().includes("user already exists")
        ) {
          const signInRes = await supabaseDb.signInBusiness(form.email.trim(), form.password);
          if (!("error" in signInRes)) {
            signUpBusiness(signInRes, signInRes.authUserId);
            router.history.push(targetUrl);
            return;
          }
        }
        setError(result.error);
        return;
      }

      const account = {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        authUserId: result.userId,
      };

      if (result.hasSession) {
        signUpBusiness(account, result.userId);
        router.history.push(targetUrl);
      } else {
        setAwaitingVerification(true);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  /** User clicks "I've confirmed" button */
  const handleVerificationCheck = async () => {
    setVerifyError("");
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      setAwaitingVerification(false);
      signUpBusiness(
        {
          name: form.name.trim(),
          businessName: form.businessName.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          authUserId: data.session.user.id,
        },
        data.session.user.id,
      );
      router.history.push(targetUrl);
      return;
    }

    // Try password sign-in in case confirmation was handled
    try {
      const signInRes = await supabaseDb.signInBusiness(form.email.trim(), form.password);
      if (!("error" in signInRes)) {
        setAwaitingVerification(false);
        signUpBusiness(signInRes, signInRes.authUserId);
        router.history.push(targetUrl);
        return;
      }
    } catch {
      // ignore
    }

    setVerifyError(
      "Your email isn't confirmed yet. Please check your inbox and click the verification link.",
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

  // ── Email verification gate ────────────────────────────────────────────────
  if (awaitingVerification) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center px-5 py-16">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 -left-16 size-48 rounded-full bg-accent/15 blur-2xl" />
          <Card className="relative glass-card rounded-2xl sm:rounded-3xl p-8 shadow-xl border border-border/80 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-8" />
            </div>

            <h2 className="mt-5 text-2xl font-display font-semibold tracking-tight">
              Confirm your business email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <span className="font-semibold text-foreground">{form.email}</span>. Click the link in
              the email to activate your account.
            </p>

            <div className="mt-5 rounded-xl bg-secondary/80 p-4 text-left text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground text-sm">Next steps:</p>
              <p>
                1. Open the email from <strong>Influencer Dhundo</strong>
              </p>
              <p>
                2. Click <strong>"Confirm your email"</strong>
              </p>
              <p>3. This window will advance automatically</p>
            </div>

            {verifyError ? (
              <div className="mt-4 rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                {verifyError}
              </div>
            ) : null}

            <Button
              variant="primary"
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
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
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
                ← Back to business sign up
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5 flex flex-col items-start text-left md:items-center md:text-center">
          <div className="max-w-2xl w-full md:mx-auto">
            <SectionEyebrow>Free business account</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              Want to contact creators?
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Create a free business account with password to unlock direct creator contact details.
            </p>
          </div>

          <div className="mt-8 max-w-xl w-full md:mx-auto">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-left">
              <div className="space-y-4">
                <GoogleAuthButton
                  role="business"
                  redirectTarget={targetUrl}
                  label="Sign up in 1-click with Google"
                />

                <div className="relative my-2 flex items-center justify-center">
                  <div className="w-full border-t border-border" />
                  <span className="relative bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    or register with email
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name">
                    <TextInput
                      value={form.name}
                      maxLength={100}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Rahul Verma"
                      autoFocus
                    />
                  </Field>
                  <Field label="Business name">
                    <TextInput
                      value={form.businessName}
                      maxLength={120}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      placeholder="Cafe Mocha, Thane West"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Mobile number"
                    hint={duplicateMobileError ? undefined : "10-digit mobile number"}
                    error={duplicateMobileError || undefined}
                  >
                    <div className="relative">
                      <TextInput
                        value={form.mobile}
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="9820011223"
                        className={duplicateMobileError ? "border-rose focus:ring-rose" : ""}
                      />
                      {checkingMobile ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin text-primary" />
                        </div>
                      ) : null}
                    </div>
                    {duplicateMobileError ? (
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-rose/10 p-2.5 text-xs text-rose">
                        <span>{duplicateMobileError}</span>
                        <Link
                          to="/business/login"
                          className="font-semibold underline underline-offset-2 hover:text-foreground shrink-0 ml-2"
                        >
                          Log in &rarr;
                        </Link>
                      </div>
                    ) : null}
                  </Field>
                  <Field
                    label="Email address"
                    hint={duplicateEmailError ? undefined : "Trusted providers only (Gmail, Yahoo, Outlook, etc.)"}
                    error={duplicateEmailError || emailLiveError || undefined}
                  >
                    <div className="relative">
                      <TextInput
                        value={form.email}
                        type="email"
                        maxLength={255}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={handleEmailBlur}
                        placeholder="rahul@gmail.com"
                        className={
                          duplicateEmailError || emailLiveError
                            ? "border-rose focus:ring-rose"
                            : ""
                        }
                      />
                      {checkingEmail ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin text-primary" />
                        </div>
                      ) : null}
                    </div>
                    {duplicateEmailError ? (
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-rose/10 p-2.5 text-xs text-rose">
                        <span>{duplicateEmailError}</span>
                        <Link
                          to="/business/login"
                          className="font-semibold underline underline-offset-2 hover:text-foreground shrink-0 ml-2"
                        >
                          Log in &rarr;
                        </Link>
                      </div>
                    ) : null}
                    {emailSuggestion && !duplicateEmailError && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Suggestion:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, email: emailSuggestion }));
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
                </div>

                <Field label="Password" hint="At least 8 characters">
                  <div className="relative">
                    <TextInput
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Repeat your password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                    >
                      {showConfirmPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Field>

                {error ? (
                  <div className="rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                    {error}
                  </div>
                ) : null}

                <Button
                  variant="primary"
                  className="w-full justify-center py-3.5 text-base font-semibold"
                  disabled={loading}
                  onClick={submit}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create free business account"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  That's it — no business subscription, no long profile.
                </p>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Already have a business account?{" "}
                <Link
                  to="/business/login"
                  search={{ redirect }}
                  className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Log in
                </Link>
              </div>
            </Card>

            <div className="mt-6 text-center">
              <Link
                to={myCreator ? "/creator/dashboard" : "/creator/register"}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <span>
                  {myCreator
                    ? "Are you a creator? Go to your creator dashboard →"
                    : "Are you a creator? Create your creator profile →"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
