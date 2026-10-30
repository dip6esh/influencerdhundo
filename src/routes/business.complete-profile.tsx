import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Field, SectionEyebrow, TextInput } from "@/components/ui-kit";
import { useAppState, type BusinessAccount } from "@/lib/app-state";
import { supabase, supabaseDb } from "@/lib/supabase";
import { Building2, CheckCircle2, Loader2, Phone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/business/complete-profile")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Complete your business profile — Influencer Dhundo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BusinessCompleteProfile,
});

function BusinessCompleteProfile() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const targetUrl = redirect || "/discover";
  const { signUpBusiness, business } = useAppState();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [duplicateMobileError, setDuplicateMobileError] = useState<string | null>(null);
  const [checkingMobile, setCheckingMobile] = useState(false);

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    mobile: "",
  });

  // Debounce check for duplicate mobile number
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
        const res = await supabaseDb.findExistingBusinessByContact({
          mobile: cleanMobile,
          excludeAuthUserId: authUserId || undefined,
        });
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
  }, [form.mobile, authUserId]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          // If no active auth session, redirect to business login
          navigate({ to: "/business/login", search: { redirect: targetUrl }, replace: true });
          return;
        }

        const user = session.user;
        setAuthUserId(user.id);
        setUserEmail(user.email || "");

        // Prefill name if available
        const defaultName =
          business?.name ||
          (user.user_metadata?.["full_name"] as string) ||
          user.email?.split("@")[0] ||
          "";

        setForm({
          name: defaultName,
          businessName: business?.businessName && business.businessName !== defaultName ? business.businessName : "",
          mobile: business?.mobile || "",
        });
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [business, navigate, targetUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUserId) return;

    const trimmedName = form.name.trim();
    const trimmedBusiness = form.businessName.trim();
    const cleanMobile = form.mobile.replace(/\D/g, "");

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedBusiness) {
      setError("Please enter your company or brand name.");
      return;
    }
    if (!cleanMobile || cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit WhatsApp / phone number.");
      return;
    }
    if (duplicateMobileError) {
      setError(duplicateMobileError);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      // Final check to prevent race condition
      const check = await supabaseDb.findExistingBusinessByContact({
        mobile: cleanMobile.slice(-10),
        excludeAuthUserId: authUserId,
      });
      if (check.exists) {
        const msg = "A business account with this mobile number already exists.";
        setDuplicateMobileError(msg);
        setError(msg);
        setSubmitting(false);
        return;
      }

      const account: BusinessAccount = {
        name: trimmedName,
        businessName: trimmedBusiness,
        mobile: cleanMobile,
        email: userEmail,
        authUserId,
      };

      // 1. Save to Supabase business_accounts table
      const saved = await supabaseDb.saveBusinessAccount(account, authUserId);
      if (!saved) {
        // Fallback: still continue into app state so user is not blocked
        console.warn("Could not write to Supabase, continuing with local session");
      }

      // 2. Set active business session in React state
      signUpBusiness(account, authUserId);

      // 3. Navigate to destination
      navigate({ to: targetUrl, replace: true });
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Setting up your brand profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 flex items-center justify-center px-5 py-12">
      <div className="relative w-full max-w-lg">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 -left-16 size-48 rounded-full bg-accent/15 blur-2xl" />

        <Card className="relative glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Sparkles className="size-3.5" />
              10-Second Setup
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground">
            Complete your brand profile
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Add your brand details so creators know who is reaching out for collaborations.
          </p>

          {/* Google Verified Identity Badge */}
          <div className="mt-5 rounded-2xl bg-tealdeep/10 border border-tealdeep/25 p-3.5 flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tealdeep text-white font-bold text-xs">
              ✓
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-foreground">Google Account Connected</p>
              <p className="text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="Your Name" hint="Contact person name">
              <TextInput
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Rahul Mehta"
                required
              />
            </Field>

            <Field label="Company / Brand Name" hint="Brand or agency name (e.g. Acme Clothing, Urban Cafe)">
              <div className="relative">
                <TextInput
                  value={form.businessName}
                  maxLength={100}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="e.g. Acme Apparel"
                  className="pl-9"
                  autoFocus
                  required
                />
                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </Field>

            <Field
              label="WhatsApp / Mobile Number"
              hint={duplicateMobileError ? undefined : "Creators will use this to reply to your collaboration inquiries"}
              error={duplicateMobileError || undefined}
            >
              <div className="relative">
                <TextInput
                  type="tel"
                  value={form.mobile}
                  maxLength={15}
                  onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
                  placeholder="9876543210"
                  className={`pl-9 ${duplicateMobileError ? "border-rose focus:ring-rose" : ""}`}
                  required
                />
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                {checkingMobile ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                ) : null}
              </div>
              {duplicateMobileError ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
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

            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={submitting}
                className="w-full justify-center py-3 text-sm font-semibold shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving profile...
                  </>
                ) : (
                  <>Complete & Explore Creators →</>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
