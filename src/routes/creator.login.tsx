import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { supabaseDb } from "@/lib/supabase";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/creator/login")({
  head: () => ({
    meta: [
      { title: "Creator Login — Influencer Dhundo" },
      {
        name: "description",
        content: "Log in to your creator profile to edit your details, view stats, and manage plans.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CreatorLogin,
});

function CreatorLogin() {
  const navigate = useNavigate();
  const { loginCreator, upsertCreator } = useAppState();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await supabaseDb.signInCreator(email.trim(), password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // result is a Creator — load into local state
      upsertCreator(result, true);
      loginCreator(result.id);
      navigate({ to: "/creator/dashboard" });
    } catch {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      <section className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-saffrondeep/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-5 flex flex-col items-center text-center">
          <div className="max-w-xl w-full">
            <SectionEyebrow>Creator Portal</SectionEyebrow>
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-saffrondeep/10 text-saffrondeep">
                <Sparkles className="size-5" />
              </div>
              <h1 className="text-3xl font-display font-semibold tracking-tight text-balance md:text-4xl">
                Log in to your creator profile
              </h1>
            </div>
            <p className="mt-3 text-base text-pretty text-muted-foreground">
              Access your creator dashboard to update your rates, edit your categories, and manage your subscription.
            </p>
          </div>

          <div className="mt-8 max-w-md w-full">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-left">
              <div className="space-y-4">
                <Field label="Email address">
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="you@email.com"
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
                </Field>

                {error ? (
                  <div className="rounded-xl bg-rose/10 p-3 text-xs font-medium text-rose">
                    {error}
                  </div>
                ) : null}

                <Button
                  variant="ink"
                  className="w-full justify-center py-3 font-semibold"
                  disabled={loading}
                  onClick={handleLogin}
                >
                  {loading ? "Signing in..." : "Log in to Creator Dashboard"}
                </Button>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Don't have an account yet?{" "}
                <Link
                  to="/creator/register"
                  className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Sign up &amp; create profile
                </Link>
              </div>
            </Card>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <span>← Are you a business? Switch to Business Login</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
