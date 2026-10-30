import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { supabaseDb } from "@/lib/supabase";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/components/google-auth-button";

export const Route = createFileRoute("/business/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Business Login — Influencer Dhundo" },
      {
        name: "description",
        content: "Log in to your business account to access direct creator contacts.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BusinessLogin,
});

function BusinessLogin() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const targetUrl = redirect || "/discover";
  const { setBusiness, myCreator } = useAppState();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await supabaseDb.signInBusiness(cleanEmail, password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      try {
        localStorage.setItem("influencer_active_role", "business");
      } catch {}
      setBusiness(result);
      router.history.push(targetUrl);
    } catch {
      setError("An error occurred while logging in. Please try again.");
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
            <SectionEyebrow>Business Portal</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-4xl">
              Log in to your business account
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground">
              Access direct creator contacts and collaboration features.
            </p>
          </div>

          <div className="mt-8 max-w-md w-full md:mx-auto">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-left">
              <div className="space-y-4">
                <GoogleAuthButton
                  role="business"
                  redirectTarget={targetUrl}
                  label="Sign in with Google"
                />

                <div className="relative my-2 flex items-center justify-center">
                  <div className="w-full border-t border-border" />
                  <span className="relative bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    or with email
                  </span>
                </div>

                <Field label="Email address">
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="rahul@cafemocha.com"
                    autoFocus
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <TextInput
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="Your password"
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
                  <div className="mt-1.5 flex justify-end">
                    <Link
                      to="/forgot-password"
                      search={{
                        role: "business",
                        ...(email.trim() ? { email: email.trim() } : {}),
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </Field>

                {error ? (
                  <div className="rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                    {error}
                  </div>
                ) : null}

                <Button
                  variant="primary"
                  className="w-full justify-center py-3 font-semibold"
                  disabled={loading}
                  onClick={handleLogin}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Log in to Business Account"
                  )}
                </Button>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Don't have a business account yet?{" "}
                <Link
                  to="/business/signup"
                  search={{ redirect }}
                  className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Sign up free
                </Link>
              </div>
            </Card>

            <div className="mt-6 text-center">
              <Link
                to={myCreator ? "/creator/dashboard" : "/creator/login"}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <span>
                  {myCreator
                    ? "← Are you a creator? Go to Creator Dashboard"
                    : "← Are you a creator? Switch to Creator Login"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
