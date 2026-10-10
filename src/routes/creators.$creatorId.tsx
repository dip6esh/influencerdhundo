import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Field, Select, Tag, TextArea } from "@/components/ui-kit";
import { InstagramIcon } from "@/components/icons";
import { useAppState } from "@/lib/app-state";
import { trackPageView } from "@/lib/analytics-tracker";
import {
  REPORT_REASONS,
  calculateAge,
  formatFollowers,
  formatInstagramHandle,
  formatPrice,
  getCreatorProfileSlug,
  getInstagramUrl,
  normalizeInstagramHandle,
} from "@/lib/directory-data";

import {
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  Gift,
  Globe,
  IndianRupee,
  Layers,
  MapPin,
  Plane,
  User,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/creators/$creatorId")({
  head: ({ params }) => ({
    meta: [
      { title: "Creator Profile — Influencer Dhundo" },
      {
        name: "description",
        content:
          "See a local creator's verified audience, content categories, starting pricing, turnaround time, and direct collaboration preferences on Influencer Dhundo.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "profile" },
      { property: "og:image", content: "https://www.influencerdhundo.com/logo.png" },
      { property: "og:url", content: `https://www.influencerdhundo.com/creators/${params.creatorId}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://www.influencerdhundo.com/logo.png" },
    ],
    links: [
      { rel: "canonical", href: `https://www.influencerdhundo.com/creators/${params.creatorId}` },
    ],
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { preview?: boolean | undefined } => ({
    preview:
      search["preview"] === true || search["preview"] === "true"
        ? true
        : undefined,
  }),
  component: CreatorProfile,
});

function CreatorProfile() {
  const navigate = useNavigate();
  const { creatorId } = Route.useParams();
  const { preview } = Route.useSearch();
  const { creators, business, addReport } = useAppState();
  const cleanParam = (creatorId || "").trim().toLowerCase();
  const cleanParamNorm = cleanParam.replace(/^-+|-+$/g, "");

  const creator = creators.find((c) => {
    if (!cleanParam) return false;
    const cId = (c.id || "").toLowerCase().trim();
    const cIdClean = cId.replace(/^-+|-+$/g, "");
    const cSlug = getCreatorProfileSlug(c).toLowerCase();
    const cDisplay = (c.displayName || "").toLowerCase().trim();
    const cName = (c.name || "").toLowerCase().trim();
    const cNameSlug = cName.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const cDisplaySlug = cDisplay.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const cHandle = normalizeInstagramHandle(c.instagram).toLowerCase();

    return (
      cId === cleanParam ||
      cIdClean === cleanParamNorm ||
      cSlug === cleanParam ||
      cSlug === cleanParamNorm ||
      cDisplay === cleanParam ||
      cName === cleanParam ||
      cNameSlug === cleanParam ||
      cNameSlug === cleanParamNorm ||
      cDisplaySlug === cleanParam ||
      cDisplaySlug === cleanParamNorm ||
      (cHandle && (cHandle === cleanParam || cHandle === cleanParamNorm))
    );
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (creator && typeof window !== "undefined") {
      const creatorName = creator.displayName || creator.name;
      const categoriesText = (creator.categories || []).slice(0, 2).join(" & ");
      const cityText = creator.city ? ` in ${creator.city}` : "";
      document.title = `${creatorName}${categoriesText ? ` — ${categoriesText} Creator` : ""}${cityText} | Influencer Dhundo`;

      trackPageView(window.location.pathname + window.location.search, {
        creatorId: creator.id,
        creatorName: creatorName,
      });
    }
  }, [creator?.id, creator?.displayName, creator?.name, creator?.city]);

  if (!creator) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">Creator not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may have been removed or is no longer visible.
        </p>
        <Link
          to="/discover"
          className="mt-5 inline-flex rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
        >
          Back to search
        </Link>
      </div>
    );
  }

  const expTime = creator.subscriptionExpiresAt
    ? new Date(creator.subscriptionExpiresAt).getTime()
    : 0;
  const isExpired =
    creator.status === "Expired" ||
    creator.status === "Inactive" ||
    creator.status === "Draft" ||
    (expTime > 0 && expTime <= Date.now());

  if (!preview && isExpired) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">Profile Currently Inactive</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          This creator&apos;s pass has expired and their profile is temporarily inactive while awaiting renewal.
        </p>
        <Link
          to="/discover"
          className="mt-5 inline-flex rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
        >
          Discover Active Creators
        </Link>
      </div>
    );
  }

  const age = calculateAge(creator.birthDate);

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": creator.displayName || creator.name,
      "description": creator.about || `Verified Instagram creator and influencer based in ${creator.city}`,
      "image": creator.photo || "https://www.influencerdhundo.com/logo.png",
      "jobTitle": "Content Creator & Influencer",
      "homeLocation": {
        "@type": "Place",
        "name": [creator.locality, creator.city, creator.state].filter(Boolean).join(", "),
      },
      "sameAs": creator.instagram
        ? [getInstagramUrl(creator.instagram)]
        : [],
    },
  };

  return (
    <div className="min-h-screen bg-secondary/50 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <div className="mx-auto max-w-5xl px-5 py-8">

        {/* PREVIEW MODE BANNER */}
        {preview ? (
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/10 border border-primary/25 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                👁
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Profile preview</p>
                <p className="text-xs text-muted-foreground">
                  This is how your profile looks to businesses in the public directory.
                </p>
              </div>
            </div>
            <Link
              to="/creator/dashboard"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all"
            >
              ← Back to dashboard
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                navigate({ to: "/discover" });
              }
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            ← Back to results
          </button>
        )}

        {/* UNIFIED CREATOR PROFILE CARD */}
        <Card className="glass-card mt-6 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 space-y-8">
          {/* 1. IDENTITY & HEADER AREA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                {creator.photo ? (
                  <img
                    src={creator.photo}
                    alt={creator.name}
                    width={816}
                    height={816}
                    className="size-24 sm:size-28 rounded-2xl object-cover ring-2 ring-border shadow-md bg-secondary"
                  />
                ) : (
                  <div className="size-24 sm:size-28 rounded-2xl ring-2 ring-border shadow-md bg-secondary flex items-center justify-center text-muted-foreground/50">
                    <User className="size-10" />
                  </div>
                )}
                <span
                  className="absolute -bottom-1 -right-1 size-4 rounded-full bg-tealdeep ring-2 ring-background shadow-xs"
                  title="Verified Profile"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
                    {creator.name || creator.displayName}
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-tealdeep border border-accent/30">
                    Active Creator
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-foreground/80">
                    <MapPin className="size-3.5 text-primary" />
                    {[creator.locality, creator.city, creator.state].filter(Boolean).join(", ")}
                  </span>
                  {[
                    age !== null ? `${age} yrs old` : null,
                    creator.gender,
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5">
                        <span className="text-muted-foreground/60">·</span>
                        <span>{item}</span>
                      </span>
                    ))}
                </p>

                {/* Social Channels Row */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={getInstagramUrl(creator.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-border/80 hover:bg-secondary hover:ring-border text-foreground transition-all shadow-xs group"
                  >
                    <InstagramIcon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="font-mono font-semibold">
                      {formatInstagramHandle(creator.instagram) || creator.instagram}
                    </span>
                    <ExternalLink className="size-3 text-muted-foreground ml-0.5 group-hover:text-foreground transition-colors" />
                  </a>

                  {creator.otherSocials?.map((s) => (
                    <span
                      key={s.platform}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-border text-foreground"
                    >
                      <span className="font-semibold">{s.platform}:</span> {s.handle}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Audience & Rate Highlight Tiles */}
            <div className="flex flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial rounded-2xl bg-secondary/70 border border-border/80 px-4 py-3 sm:min-w-[145px] text-center shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                  <Users className="size-3.5 text-tealdeep" /> Audience
                </span>
                <p className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
                  {formatFollowers(creator.followers)}
                </p>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Instagram Followers</span>
              </div>

              <div className="flex-1 sm:flex-initial rounded-2xl bg-secondary/70 border border-border/80 px-4 py-3 sm:min-w-[145px] text-center shadow-xs">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                  <IndianRupee className="size-3.5 text-saffrondeep" /> Starting Rate
                </span>
                <p className="font-display text-xl sm:text-2xl font-bold text-saffrondeep mt-1">
                  {formatPrice(creator.startingPrice)}
                </p>
                <span className="text-[10px] text-muted-foreground block mt-0.5">Base Collab Fee</span>
              </div>
            </div>
          </div>

          {/* 2. ABOUT THE CREATOR */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-foreground font-display font-semibold text-base">
              <User className="size-4 text-primary" />
              <h2>About the Creator</h2>
            </div>
            <div className="rounded-2xl bg-background/60 border border-border/60 p-4 sm:p-5">
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {creator.about || "No detailed bio provided by the creator."}
              </p>
            </div>
          </div>

          {/* 3. CONTENT NICHES & LANGUAGES */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-display font-semibold text-base">
              <Layers className="size-4 text-primary" />
              <h2>Niche, Formats &amp; Languages</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categories */}
              <div className="rounded-2xl bg-background/60 border border-border/60 p-4 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Primary Categories &amp; Niche
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {creator.categories && creator.categories.length > 0 ? (
                    creator.categories.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-semibold text-saffrondeep border border-primary/20"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None specified</span>
                  )}
                </div>
              </div>

              {/* Languages & Formats */}
              <div className="rounded-2xl bg-background/60 border border-border/60 p-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Languages Spoken
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {creator.languages && creator.languages.length > 0 ? (
                      creator.languages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground border border-border/60"
                        >
                          <Globe className="size-3 text-muted-foreground" />
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Content Formats
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {creator.contentTypes && creator.contentTypes.length > 0 ? (
                      creator.contentTypes.map((ct) => (
                        <span
                          key={ct}
                          className="inline-flex items-center rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-medium text-tealdeep border border-accent/25"
                        >
                          {ct}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. COLLABORATION & DELIVERABLES DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-display font-semibold text-base">
              <Briefcase className="size-4 text-primary" />
              <h2>Collaboration Details &amp; Terms</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              {/* Collab Type */}
              <div className="rounded-2xl bg-background/60 border border-border/60 p-4 flex items-center gap-3.5 shadow-xs">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Briefcase className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Collaboration Type
                  </span>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
                    {creator.collabType || "Paid"}
                  </p>
                </div>
              </div>

              {/* Turnaround */}
              <div className="rounded-2xl bg-background/60 border border-border/60 p-4 flex items-center gap-3.5 shadow-xs">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Typical Turnaround
                  </span>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
                    {creator.turnaround || "3–5 days"}
                  </p>
                </div>
              </div>

              {/* Accepts Products */}
              <div className="rounded-2xl bg-background/60 border border-border/60 p-4 flex items-center gap-3.5 shadow-xs">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Accepts Products / Deliveries
                  </span>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate" title={creator.acceptsProductsDetails}>
                    {creator.acceptsProducts || "Depends"}
                    {creator.acceptsProducts === "Depends" && creator.acceptsProductsDetails && (
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        ({creator.acceptsProductsDetails})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Travel Availability */}
              <div className="rounded-2xl bg-background/60 border border-border/60 p-4 flex items-center gap-3.5 shadow-xs">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Plane className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Travel Availability
                  </span>
                  <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
                    {creator.travels ? (creator.travelRange ?? "Anywhere within my city") : "Does not travel"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* CONTACT */}
        {business ? (
          <Card className="glass-card mt-6 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold">
                  Contact {creator.name.split(" ")[0]}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reach out directly — the collaboration is between you and the creator.
                </p>
              </div>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-tealdeep border border-accent/25">
                ✓ Verified Business Access
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
              {creator.contact.phone ? (
                <a
                  href={`tel:${creator.contact.phone.replace(/\s/g, "")}`}
                  className="rounded-2xl bg-background p-4 ring-1 ring-border shadow-sm hover:ring-primary hover:bg-secondary/40 transition-all flex flex-col justify-between gap-2 group"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone Call
                  </span>
                  <span className="font-semibold text-foreground text-base group-hover:text-primary">
                    {creator.contact.phone}
                  </span>
                  <span className="text-xs text-primary font-medium">Click to call →</span>
                </a>
              ) : (
                <div className="rounded-2xl bg-secondary/50 p-4 ring-1 ring-border text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    Phone Call
                  </span>
                  <span>Not provided</span>
                </div>
              )}

              {creator.contact.whatsapp || creator.contact.phone ? (
                <a
                  href={`https://wa.me/${(creator.contact.whatsapp || creator.contact.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-background p-4 ring-1 ring-border shadow-sm hover:ring-primary hover:bg-secondary/40 transition-all flex flex-col justify-between gap-2 group"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    WhatsApp Chat
                  </span>
                  <span className="font-semibold text-foreground text-base group-hover:text-primary">
                    {creator.contact.whatsapp || creator.contact.phone}
                  </span>
                  <span className="text-xs text-tealdeep font-medium">
                    Open WhatsApp →
                  </span>
                </a>
              ) : (
                <div className="rounded-2xl bg-secondary/50 p-4 ring-1 ring-border text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    WhatsApp
                  </span>
                  <span>Not provided</span>
                </div>
              )}

              {creator.contact.email ? (
                <a
                  href={`mailto:${creator.contact.email}`}
                  className="rounded-2xl bg-background p-4 ring-1 ring-border shadow-sm hover:ring-primary hover:bg-secondary/40 transition-all flex flex-col justify-between gap-2 group"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="font-semibold text-foreground text-base truncate group-hover:text-primary">
                    {creator.contact.email}
                  </span>
                  <span className="text-xs text-primary font-medium">Send email →</span>
                </a>
              ) : (
                <div className="rounded-2xl bg-secondary/50 p-4 ring-1 ring-border text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    Email
                  </span>
                  <span>Not provided</span>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="mt-6 rounded-2xl sm:rounded-3xl bg-foreground p-6 sm:p-8 text-background shadow-xl">
            <p className="font-display text-xl font-semibold">Want to contact this creator?</p>
            <p className="mt-1 text-sm text-background/70">
              Create a free account to view their contact details.
            </p>
            <Button
              variant="primary"
              className="mt-5 py-3.5 px-8 font-semibold text-base"
              onClick={() =>
                navigate({
                  to: "/business/signup",
                  search: { redirect: `/creators/${creator.id}` },
                })
              }
            >
              Contact Creator
            </Button>
          </div>
        )}

        {/* REPORT — hidden in preview mode */}
        {!preview && (
          <div className="mt-6">
            {reported ? (
              <p className="text-sm font-medium text-tealdeep">
                Thanks — this profile has been reported for review.
              </p>
            ) : reportOpen ? (
              <Card>
                <h2 className="text-lg">Report this profile</h2>
                <div className="mt-4 space-y-4">
                  <Field label="Reason">
                    <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Details (optional)">
                    <TextArea
                      maxLength={500}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Tell us what's wrong with this profile"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      variant="ink"
                      onClick={() => {
                        addReport({ creatorId: creator.id, reason, details });
                        setReportOpen(false);
                        setReported(true);
                      }}
                    >
                      Submit report
                    </Button>
                    <Button variant="ghost" onClick={() => setReportOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setReportOpen(true)}
                className="text-xs font-medium text-muted-foreground underline underline-offset-4"
              >
                Report this profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* STICKY BAR */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-5xl px-5 pb-4">
          <div className="glass-card flex items-center gap-3 rounded-2xl p-3 shadow-2xl border border-border/80">
            <div className="min-w-0 flex-1">
              <p className="label-caps">Starting from</p>
              <p className="font-display text-lg font-semibold leading-none text-saffrondeep">
                {formatPrice(creator.startingPrice)}
              </p>
            </div>
            {preview ? (
              <Link
                to="/creator/register"
                className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Edit profile
              </Link>
            ) : business ? (
              <a
                href={`tel:${creator.contact.phone.replace(/\s/g, "")}`}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Call Creator
              </a>
            ) : (
              <Link
                to="/business/signup"
                search={{ redirect: `/creators/${creator.id}` }}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Contact Creator
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
