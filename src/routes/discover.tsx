import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { CreatorCard } from "@/components/creator-card";
import {
  Button,
  Chip,
  DropdownSelect,
  Field,
  Label,
  SectionEyebrow,
  TextInput,
} from "@/components/ui-kit";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/app-state";
import {
  CATEGORIES,
  CITIES,
  COLLAB_TYPES,
  CONTENT_TYPES,
  EMPTY_FILTERS,
  LANGUAGES,
  filterCreators,
  formatFollowers,
  formatPrice,
  type Filters,
} from "@/lib/directory-data";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Find Relevant Influencers & Content Creators — Influencer Dhundo" },
      {
        name: "description",
        content:
          "Discover and connect directly with local Instagram creators and influencers across India. Filter by city, category, follower count, and budget.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Find Relevant Influencers & Content Creators — Influencer Dhundo" },
      {
        property: "og:description",
        content: "Filter and connect directly with creators by location, niche, audience size, and budget with 0% commission.",
      },
      { property: "og:image", content: "https://www.influencerdhundo.com/logo.png" },
      { property: "og:url", content: "https://www.influencerdhundo.com/discover" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Find Relevant Influencers & Content Creators — Influencer Dhundo" },
      {
        name: "twitter:description",
        content: "Filter and connect directly with creators by location, niche, audience size, and budget with 0% commission.",
      },
      { name: "twitter:image", content: "https://www.influencerdhundo.com/logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://www.influencerdhundo.com/discover" },
    ],
  }),
  component: Discover,
});

const SORT_OPTIONS: { label: string; value: SortOptionValue }[] = [
  { label: "Default (Best Match)", value: "default" },
  { label: "Followers: High to Low", value: "followers-desc" },
  { label: "Followers: Low to High (Nano/Micro)", value: "followers-asc" },
  { label: "Price: Low to High (Budget-Friendly)", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "⚡ Fastest Delivery", value: "turnaround-asc" },
  { label: "✨ Newest Creators", value: "newest" },
];

type SortOptionValue =
  | "default"
  | "followers-desc"
  | "followers-asc"
  | "price-asc"
  | "price-desc"
  | "turnaround-asc"
  | "newest";

function Discover() {
  const {
    creators,
    discoverFilters: filters,
    setDiscoverFilters: setFilters,
    discoverHasSearched,
    setDiscoverHasSearched,
    resetDiscoverFilters,
  } = useAppState();

  const isBarter = filters.collabType === "Barter";

  const [showMore, setShowMore] = useState(() => {
    return (
      Boolean(filters.locality) ||
      Boolean(filters.language) ||
      Boolean(filters.travel) ||
      Boolean(filters.products)
    );
  });

  const toggleContentType = (type: string) => {
    setFilters((f) => ({
      ...f,
      contentTypes: f.contentTypes.includes(type)
        ? f.contentTypes.filter((v) => v !== type)
        : [...f.contentTypes, type],
    }));
  };

  const resultsRef = useRef<HTMLDivElement>(null);

  const search = () => {
    setDiscoverHasSearched(true);
    // Smoothly scroll down towards the results section for better UX
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollBy({ top: 380, behavior: "smooth" });
      }
    }, 60);
  };

  const [sortBy, setSortBy] = useState<
    | "default"
    | "followers-desc"
    | "followers-asc"
    | "price-asc"
    | "price-desc"
    | "turnaround-asc"
    | "newest"
  >("default");

  const results = useMemo(() => {
    if (!discoverHasSearched) return null;
    return filterCreators(creators, filters);
  }, [discoverHasSearched, creators, filters]);

  const sortedResults = useMemo(() => {
    if (!results) return null;
    const list = [...results];

    switch (sortBy) {
      case "followers-desc":
        return list.sort((a, b) => (b.followers || 0) - (a.followers || 0));
      case "followers-asc":
        return list.sort((a, b) => (a.followers || 0) - (b.followers || 0));
      case "price-asc":
        return list.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
      case "price-desc":
        return list.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
      case "turnaround-asc": {
        const getTurnaroundWeight = (t?: string) => {
          if (!t) return 99;
          const lower = t.toLowerCase();
          if (lower.includes("1–2 day") || lower.includes("1-2 day") || lower.includes("24 hour")) return 1;
          if (lower.includes("3–5 day") || lower.includes("3-5 day")) return 2;
          if (lower.includes("5–7 day") || lower.includes("5-7 day")) return 3;
          if (lower.includes("1–2 week") || lower.includes("1-2 week") || lower.includes("week")) return 4;
          return 5;
        };
        return list.sort((a, b) => getTurnaroundWeight(a.turnaround) - getTurnaroundWeight(b.turnaround));
      }
      case "newest": {
        return list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      }
      case "default":
      default:
        return list;
    }
  }, [results, sortBy]);

  const hasActiveFilters =
    Boolean(filters.city) ||
    Boolean(filters.locality) ||
    Boolean(filters.pincode) ||
    Boolean(filters.category) ||
    Boolean(filters.otherCategory) ||
    filters.followerRange[0] > 500 ||
    filters.followerRange[1] < 300000 ||
    (!isBarter && (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 100000)) ||
    filters.contentTypes.length > 0 ||
    Boolean(filters.collabType) ||
    Boolean(filters.language) ||
    Boolean(filters.travel) ||
    Boolean(filters.products);

  return (
    <div className="min-h-screen bg-secondary/50 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/15 blur-2xl" />
        <div className="pointer-events-none absolute top-40 -left-20 size-48 rounded-full bg-accent/15 blur-2xl" />

        {/* CONTAINER ALIGNED EXACTLY WITH SITE HEADER / LOGO */}
        <div className="relative mx-auto max-w-5xl px-5">
          <div className="max-w-4xl">
            <SectionEyebrow>Discovery</SectionEyebrow>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-display font-semibold tracking-tight text-foreground">
              Find Relevant Influencers / Creators
            </h1>
            <p className="mt-2.5 text-base text-muted-foreground md:text-lg">
              Filter by location, niche, audience size, budget, collaboration preferences &amp; more.
            </p>
          </div>

          {/* HERO SEARCH BOX (ALIGNED FLUSH WITH CONTAINER) */}
          <div className="mt-8">
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80">
              <div className="space-y-6">
                
                {/* SECTION 1: 3-FIELD LOCATION & CATEGORY GRID */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="City">
                    <DropdownSelect
                      value={filters.city}
                      onChange={(val) => setFilters({ ...filters, city: val })}
                      placeholder="Any city"
                      searchPlaceholder="Search city..."
                      options={CITIES}
                    />
                  </Field>

                  <Field label="Pincode">
                    <TextInput
                      placeholder="e.g. 400601"
                      inputMode="numeric"
                      maxLength={6}
                      value={filters.pincode}
                      onChange={(e) =>
                        setFilters({ ...filters, pincode: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Category">
                    <DropdownSelect
                      value={filters.category}
                      onChange={(val) =>
                        setFilters({
                          ...filters,
                          category: val,
                          otherCategory: val === "Other" ? (filters.otherCategory ?? "") : "",
                        })
                      }
                      placeholder="All categories"
                      options={CATEGORIES.map((cat) => ({
                        label: cat === "Other" ? "Other (Custom...)" : cat,
                        value: cat,
                      }))}
                    />
                  </Field>
                </div>

                {/* CUSTOM CATEGORY INPUT (When 'Other' selected in dropdown) */}
                {filters.category === "Other" && (
                  <div className="rounded-xl bg-background/50 p-4 border border-border animate-in fade-in duration-200">
                    <Field
                      label="Specify custom category"
                      hint="Type niche keyword (e.g. Handmade pottery, AI Tools, Pet care, Yoga...)"
                    >
                      <TextInput
                        placeholder="e.g. Handmade crafts, Pottery, AI & Tech..."
                        value={filters.otherCategory ?? ""}
                        onChange={(e) =>
                          setFilters({ ...filters, otherCategory: e.target.value })
                        }
                        autoFocus
                      />
                    </Field>
                  </div>
                )}

                {/* SECTION 2: COLLABORATION TYPE (SELECTABLE BUTTONS) */}
                <div>
                  <Label>Collaboration type</Label>
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Any type", value: "" },
                      ...COLLAB_TYPES.map((c) => ({ label: c, value: c })),
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setFilters({ ...filters, collabType: item.value })}
                        className={`rounded-xl py-2.5 px-3 text-xs font-semibold transition-all border text-center cursor-pointer ${
                          filters.collabType === item.value
                            ? "bg-primary text-primary-foreground border-saffrondeep shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION 3: DUAL RANGE SLIDERS (FOLLOWER SIZE & BUDGET) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* FOLLOWER SIZE RANGE */}
                  <div className="rounded-xl bg-background/40 p-4 sm:p-5 border border-border/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <Label>Follower Size</Label>
                      <span className="text-xs font-semibold text-saffrondeep px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        {filters.followerRange[0] === 500 && filters.followerRange[1] >= 300000
                          ? "Any size"
                          : filters.followerRange[1] >= 300000
                            ? `${formatFollowers(filters.followerRange[0])} – 300K+`
                            : `${formatFollowers(filters.followerRange[0])} – ${formatFollowers(filters.followerRange[1])}`}
                      </span>
                    </div>
                    <div className="pt-2 pb-1 px-1">
                      <Slider
                        value={filters.followerRange}
                        onValueChange={(val) =>
                          setFilters({
                            ...filters,
                            followerRange: [val[0] ?? 500, val[1] ?? 300000],
                          })
                        }
                        min={500}
                        max={300000}
                        step={2500}
                        minStepsBetweenThumbs={1}
                      />
                      <div className="flex justify-between text-[11px] text-muted-foreground mt-2 font-medium">
                        <span>500</span>
                        <span>50K</span>
                        <span>100K</span>
                        <span>150K</span>
                        <span>200K</span>
                        <span>300K+</span>
                      </div>
                    </div>
                  </div>

                  {/* BUDGET RANGE (0 - 100,000) */}
                  <div
                    className={cn(
                      "rounded-xl bg-background/40 p-4 sm:p-5 border border-border/60 flex flex-col justify-between transition-all duration-200",
                      isBarter && "opacity-55 bg-muted/20 border-border/40 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Label className={isBarter ? "text-muted-foreground" : ""}>Budget Range</Label>
                        {isBarter && (
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                            Disabled
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold px-3 py-1 rounded-full border transition-all",
                          isBarter
                            ? "bg-secondary text-muted-foreground border-border/60"
                            : "text-saffrondeep bg-primary/10 border-primary/20",
                        )}
                      >
                        {isBarter
                          ? "Not applicable (Barter)"
                          : filters.budgetRange[0] === 0 && filters.budgetRange[1] >= 100000
                            ? "Any budget"
                            : filters.budgetRange[1] >= 100000
                              ? `${formatPrice(filters.budgetRange[0])} – ₹1,00,000+`
                              : `${formatPrice(filters.budgetRange[0])} – ${formatPrice(filters.budgetRange[1])}`}
                      </span>
                    </div>
                    <div className="pt-2 pb-1 px-1">
                      <Slider
                        disabled={isBarter}
                        value={filters.budgetRange}
                        onValueChange={(val) =>
                          setFilters({
                            ...filters,
                            budgetRange: [val[0] ?? 0, val[1] ?? 100000],
                          })
                        }
                        min={0}
                        max={100000}
                        step={1000}
                        minStepsBetweenThumbs={1}
                      />
                      <div className={cn("flex justify-between text-[11px] text-muted-foreground mt-2 font-medium", isBarter && "opacity-50")}>
                        <span>₹0</span>
                        <span>₹25K</span>
                        <span>₹50K</span>
                        <span>₹75K</span>
                        <span>₹1,00,000+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: CONTENT FORMATS (SELECTABLE BUTTONS) */}
                <div>
                  <Label>Content format (Select one or more)</Label>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        tone="accent"
                        selected={filters.contentTypes.includes(c)}
                        onClick={() => toggleContentType(c)}
                      />
                    ))}
                  </div>
                </div>

                {/* ADVANCED / MORE FILTERS (CLEAN 2-COLUMN GRID) */}
                {showMore && (
                  <div className="space-y-5 border-t border-border pt-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Area">
                        <TextInput
                          placeholder="e.g. Thane West, Bandra, Indiranagar"
                          value={filters.locality}
                          onChange={(e) =>
                            setFilters({ ...filters, locality: e.target.value })
                          }
                        />
                      </Field>

                      <Field label="Language">
                        <DropdownSelect
                          value={filters.language}
                          onChange={(val) =>
                            setFilters({ ...filters, language: val })
                          }
                          placeholder="Any language"
                          searchPlaceholder="Search language..."
                          options={LANGUAGES}
                        />
                      </Field>

                      <Field label="Travel preference">
                        <DropdownSelect
                          value={filters.travel}
                          onChange={(val) =>
                            setFilters({ ...filters, travel: val })
                          }
                          placeholder="Any travel preference"
                          options={[
                            "Travels for collaborations",
                            "Does not travel",
                          ]}
                        />
                      </Field>

                      <Field label="Product collaborations">
                        <DropdownSelect
                          value={filters.products}
                          onChange={(val) =>
                            setFilters({ ...filters, products: val })
                          }
                          placeholder="Any product policy"
                          options={[
                            "Accepts products",
                            "Doesn't accept products",
                            "Depends",
                          ]}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* TOGGLE MORE FILTERS BUTTON */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs font-medium cursor-pointer"
                  onClick={() => setShowMore((s) => !s)}
                >
                  {showMore ? "▲ Fewer filters" : "▼ More filters (Area, Language, Travel, Products)"}
                </Button>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  variant="primary"
                  className="w-full py-4 text-base sm:text-lg font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={search}
                >
                  Find Creators
                </Button>
                {(results !== null || hasActiveFilters) && (
                  <button
                    type="button"
                    onClick={resetDiscoverFilters}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 px-3 py-1 cursor-pointer transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS SECTION */}
      <div ref={resultsRef} className="mx-auto mt-10 max-w-5xl px-5 scroll-mt-10">
        {sortedResults === null ? (
          <div className="glass-card rounded-2xl p-8 text-center max-w-xl mx-auto">
            <h2 className="text-xl font-display font-semibold">Ready to explore?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select your preferred city, category, follower range, or budget above and tap{" "}
              <span className="font-semibold text-foreground">Find Creators</span> to discover matching creators.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <p className="text-sm font-medium text-foreground">
                <span className="font-semibold text-saffrondeep">{sortedResults.length}</span> creator
                {sortedResults.length === 1 ? "" : "s"} found
                {filters.city ? ` in ${filters.city}` : ""}
                {filters.pincode ? ` (${filters.pincode})` : ""}
                {filters.category
                  ? ` • ${filters.category === "Other" && filters.otherCategory ? filters.otherCategory : filters.category}`
                  : ""}
                {filters.collabType ? ` • ${filters.collabType}` : ""}
              </p>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Sort by:</span>
                <div className="w-full sm:w-64">
                  <DropdownSelect
                    value={sortBy}
                    onChange={(val) => setSortBy(val as SortOptionValue)}
                    options={SORT_OPTIONS}
                    searchable={false}
                    className="py-2 px-3.5 text-xs rounded-xl bg-background ring-1 ring-border shadow-2xs hover:ring-foreground/30 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {sortedResults.length === 0 ? (
              <div className="glass-card mt-6 rounded-2xl p-10 text-center max-w-xl mx-auto">
                <h2 className="text-lg font-semibold">No creators match yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your follower range slider, selecting a different city/pincode, or widening your budget range.
                </p>
                <Button
                  variant="ghost"
                  className="mt-4 cursor-pointer"
                  onClick={resetDiscoverFilters}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedResults.map((c, i) => (
                  <CreatorCard key={c.id} creator={c} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
