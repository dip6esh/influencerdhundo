import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState } from "@/lib/app-state";
import { Building2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/business/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Business Login — Influencer Dhundo" },
      {
        name: "description",
        content: "Log in to your business account to access direct creator contacts.",
      },
    ],
  }),
  component: BusinessLogin,
});

function BusinessLogin() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const targetUrl = redirect || "/discover";
  const { findBusinessByContact } = useAppState();

  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const clean = contact.trim();
    if (!clean) {
      setError("Please enter your registered mobile number or email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const account = await findBusinessByContact(clean);
      if (account) {
        router.history.push(targetUrl);
      } else {
        setError(
          "No business account found with this mobile or email. Please check your details or create a free account below.",
        );
      }
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

        <div className="relative mx-auto max-w-5xl px-5">
          <div className="max-w-2xl">
            <SectionEyebrow>Business Portal</SectionEyebrow>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <h1 className="text-3xl font-display font-semibold tracking-tight text-balance md:text-4xl">
                Log in to your business account
              </h1>
            </div>
            <p className="mt-3 text-base text-pretty text-muted-foreground">
              Enter your registered mobile number or email to unlock creator contact details instantly.
            </p>
          </div>

          <div className="mt-8 max-w-md">
            <Card className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
              <div className="space-y-4">
                <Field
                  label="Registered Mobile or Email"
                  hint="The 10-digit number or email you signed up with"
                >
                  <TextInput
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="9820011223 or rahul@company.com"
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
                  className="w-full justify-center py-3 font-semibold"
                  disabled={loading}
                  onClick={handleLogin}
                >
                  {loading ? "Checking..." : "Log in to Business Account"}
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
                to="/login"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <span>← Are you a creator? Switch to Creator Login</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
