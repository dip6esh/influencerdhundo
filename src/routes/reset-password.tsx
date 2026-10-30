import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { supabase, supabaseDb } from "@/lib/supabase";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Influencer Dhundo" },
      {
        name: "description",
        content: "Choose a new secure password for your Influencer Dhundo account.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check for recovery session from PKCE code, hash fragments, or active session
  useEffect(() => {
    let isMounted = true;

    async function checkRecoveryAuth() {
      try {
        // 1. Check for PKCE code in query string
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            const { data, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && data.session && isMounted) {
              setHasValidSession(true);
              setVerifyingSession(false);
              return;
            }
          }
        }

        // 2. Check for hash parameters (#access_token=...&type=recovery)
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          // Allow Supabase client an instant to parse the hash
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // 3. Check active session
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr) {
          if (isMounted) {
            setSessionError(sessionErr.message);
            setVerifyingSession(false);
          }
          return;
        }

        if (session && isMounted) {
          setHasValidSession(true);
          setVerifyingSession(false);
          return;
        }

        // 4. Set up an onAuthStateChange listener in case Supabase is still parsing recovery token
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && newSession && isMounted) {
            setHasValidSession(true);
            setVerifyingSession(false);
          }
        });

        // 5. Fallback timer if no session is detected within 2.5 seconds
        setTimeout(() => {
          if (isMounted) {
            authListener.subscription.unsubscribe();
            setVerifyingSession(false);
          }
        }, 2500);
      } catch (e) {
        if (isMounted) {
          setSessionError(String(e));
          setVerifyingSession(false);
        }
      }
    }

    checkRecoveryAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await supabaseDb.updatePassword(password);
      if (!result.success) {
        setError(result.error || "Failed to update password. Please try again.");
        return;
      }

      setSuccess(true);
      // Clean up session so user logs in cleanly with new credentials
      try {
        await supabase.auth.signOut();
      } catch {}
    } catch {
      setError("An unexpected error occurred while updating your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5 flex flex-col items-start text-left md:items-center md:text-center">
          <div className="max-w-xl w-full md:mx-auto">
            <SectionEyebrow>Account Security</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-4xl">
              Create a new password
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground">
              Please choose a strong password with at least 8 characters.
            </p>
          </div>

          <div className="mt-8 max-w-md w-full md:mx-auto">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-left">
              {verifyingSession ? (
                <div className="text-center py-8 space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Verifying your recovery link...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please wait while we validate your security token.
                  </p>
                </div>
              ) : success ? (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      Password changed!
                    </h2>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your password has been successfully updated. You can now log in using your new credentials.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2.5">
                    <Button
                      variant="ink"
                      className="w-full justify-center py-3 font-semibold"
                      onClick={() => navigate({ to: "/creator/login" })}
                    >
                      Log in as Creator
                    </Button>
                    <Button
                      variant="primary"
                      className="w-full justify-center py-3 font-semibold"
                      onClick={() => navigate({ to: "/business/login" })}
                    >
                      Log in as Business
                    </Button>
                  </div>
                </div>
              ) : !hasValidSession ? (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose/10 text-rose">
                    <ShieldAlert className="size-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      Invalid or expired link
                    </h2>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {sessionError ||
                        "This password reset link is invalid or has expired. Password reset links can only be used once."}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/forgot-password"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
                    >
                      Request a new reset link
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <KeyRound className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Set New Password</p>
                      <p className="text-xs text-muted-foreground">
                        Enter your new secure password below.
                      </p>
                    </div>
                  </div>

                  <Field label="New Password">
                    <div className="relative">
                      <TextInput
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm New Password">
                    <div className="relative">
                      <TextInput
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                        placeholder="Re-type your new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
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
                    variant="primary"
                    className="w-full justify-center py-3 font-semibold shadow-md"
                    disabled={loading}
                    onClick={handleUpdatePassword}
                  >
                    {loading ? "Updating password..." : "Update Password"}
                  </Button>
                </div>
              )}
            </Card>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <span>← Return to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
