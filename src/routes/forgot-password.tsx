import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { supabaseDb } from "@/lib/supabase";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    role?: "creator" | "business" | undefined;
    email?: string | undefined;
  } => {
    const roleVal = search["role"];
    const emailVal = search["email"];
    return {
      ...(roleVal === "creator" || roleVal === "business" ? { role: roleVal } : {}),
      ...(typeof emailVal === "string" && emailVal.trim() ? { email: emailVal.trim() } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Forgot Password — Influencer Dhundo" },
      {
        name: "description",
        content: "Reset your Influencer Dhundo account password securely.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { role, email: initialEmail } = Route.useSearch();
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const backLoginUrl =
    role === "creator"
      ? "/creator/login"
      : role === "business"
        ? "/business/login"
        : "/login";

  const backLoginLabel =
    role === "creator"
      ? "Back to Creator Login"
      : role === "business"
        ? "Back to Business Login"
        : "Back to Login";

  const handleResetRequest = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;

      const result = await supabaseDb.resetPasswordForEmail(email.trim(), redirectUrl);

      if (!result.success) {
        setError(result.error || "Unable to send reset email. Please try again.");
        return;
      }

      setSubmitted(true);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Something went wrong while requesting password reset. Please try again.");
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
            <SectionEyebrow>Account Recovery</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-4xl">
              Forgot your password?
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground">
              {role === "creator"
                ? "Reset the password for your Creator profile"
                : role === "business"
                  ? "Reset the password for your Business account"
                  : "Enter your registered email address and we'll send you a password reset link"}
            </p>
          </div>

          <div className="mt-8 max-w-md w-full md:mx-auto">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-left">
              {submitted ? (
                <div className="text-center space-y-4 py-2">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Mail className="size-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold">Check your email</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We’ve sent a password reset link to:
                    </p>
                    <p className="mt-1 font-semibold text-foreground break-all">{email}</p>
                  </div>

                  <div className="rounded-xl bg-secondary/80 p-3.5 text-xs text-muted-foreground text-left space-y-1.5">
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Click the link in the email to set your new password.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>If you don't see it within a minute, please check your spam/junk folder.</span>
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-center text-xs"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResetRequest}
                    >
                      {resendCooldown > 0
                        ? `Resend email in ${resendCooldown}s`
                        : "Resend reset email"}
                    </Button>

                    <Link
                      to={backLoginUrl}
                      className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>{backLoginLabel}</span>
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
                      <p className="text-sm font-semibold text-foreground">Password Reset</p>
                      <p className="text-xs text-muted-foreground">
                        We'll send a secure one-click reset link to your email.
                      </p>
                    </div>
                  </div>

                  <Field label="Registered Email Address">
                    <TextInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResetRequest()}
                      placeholder="you@email.com"
                      autoFocus
                    />
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
                    onClick={handleResetRequest}
                  >
                    {loading ? "Sending reset link..." : "Send Reset Link"}
                  </Button>

                  <div className="border-t border-border pt-4 text-center">
                    <Link
                      to={backLoginUrl}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>{backLoginLabel}</span>
                    </Link>
                  </div>
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
