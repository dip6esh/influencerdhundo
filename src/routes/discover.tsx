import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
      { title: "Find local creators — influencer Dhundo" },
      {
        name: "description",
        content:
          "Search local creators by city, locality, category, follower size, budget, content type, language and collaboration preferences.",
      },
      { property: "og:title", content: "Find local creators — influencer Dhundo" },
      {
        property: "og:description",
        content: "Tell us what you're looking for and see matching local creators.",
      },
    ],
  }),
  component: Discover,
});

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

  const search = () => setDiscoverHasSearched(true);

  const results = useMemo(() => {
    if (!discoverHasSearched) return null;
    return filterCreators(creators, filters);
  }, [discoverHasSearched, creators, filters]);

  const hasActiveFilters =
    Boolean(filters.city) ||
    Boolean(filters.locality) ||
    Boolean(filters.pincode) ||
    Boolean(filters.category) ||
    Boolean(filters.otherCategory) ||
    filters.followerRange[0] > 500 ||
    filters.followerRange[1] < 50000 ||
    (!isBarter && (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 50000)) ||
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
          <div className="max-w-2xl">
            <SectionEyebrow>Discovery</SectionEyebrow>
            <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight text-balance md:text-5xl">
              Find Local Creators
            </h1>
            <p className="mt-3 text-base text-pretty text-muted-foreground md:text-lg">
              Tell us what you're looking for and explore verified creators near your business.
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

                {/* SECTION 2: DUAL RANGE SLIDERS (FOLLOWER SIZE & BUDGET) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* FOLLOWER SIZE RANGE */}
                  <div className="rounded-xl bg-background/40 p-4 sm:p-5 border border-border/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <Label>Follower Size</Label>
                      <span className="text-xs font-semibold text-saffrondeep px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        {filters.followerRange[0] === 500 && filters.followerRange[1] >= 50000
                          ? "Any size"
                          : filters.followerRange[1] >= 50000
                            ? `${formatFollowers(filters.followerRange[0])} – 50K+`
                            : `${formatFollowers(filters.followerRange[0])} – ${formatFollowers(filters.followerRange[1])}`}
                      </span>
                    </div>
                    <div className="pt-2 pb-1 px-1">
                      <Slider
                        value={filters.followerRange}
                        onValueChange={(val) =>
                          setFilters({
                            ...filters,
                            followerRange: [val[0] ?? 500, val[1] ?? 50000],
                          })
                        }
                        min={500}
                        max={50000}
                        step={500}
                        minStepsBetweenThumbs={1}
                      />
                      <div className="flex justify-between text-[11px] text-muted-foreground mt-2 font-medium">
                        <span>500</span>
                        <span>10K</span>
                        <span>20K</span>
                        <span>30K</span>
                        <span>40K</span>
                        <span>50K+</span>
                      </div>
                    </div>
                  </div>

                  {/* BUDGET RANGE (0 - 50,000) */}
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
                          : filters.budgetRange[0] === 0 && filters.budgetRange[1] >= 50000
                            ? "Any budget"
                            : filters.budgetRange[1] >= 50000
                              ? `${formatPrice(filters.budgetRange[0])} – ₹50,000+`
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
                            budgetRange: [val[0] ?? 0, val[1] ?? 50000],
                          })
                        }
                        min={0}
                        max={50000}
                        step={500}
                        minStepsBetweenThumbs={1}
                      />
                      <div className={cn("flex justify-between text-[11px] text-muted-foreground mt-2 font-medium", isBarter && "opacity-50")}>
                        <span>₹0</span>
                        <span>₹10K</span>
                        <span>₹20K</span>
                        <span>₹30K</span>
                        <span>₹40K</span>
                        <span>₹50K+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: COLLABORATION TYPE (SELECTABLE BUTTONS) */}
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
                      <Field label="Locality / Area">
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
                  {showMore ? "▲ Fewer filters" : "▼ More filters (Locality, Language, Travel, Products)"}
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
      <div className="mx-auto mt-10 max-w-5xl px-5">
        {results === null ? (
          <div className="glass-card rounded-2xl p-8 text-center max-w-xl mx-auto">
            <h2 className="text-xl font-display font-semibold">Ready to explore?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select your preferred city, category, follower range, or budget above and tap{" "}
              <span className="font-semibold text-foreground">Find Creators</span> to discover matching creators.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <p className="text-sm font-medium text-foreground">
                <span className="font-semibold text-saffrondeep">{results.length}</span> creator
                {results.length === 1 ? "" : "s"} found
                {filters.city ? ` in ${filters.city}` : ""}
                {filters.pincode ? ` (${filters.pincode})` : ""}
                {filters.category
                  ? ` • ${filters.category === "Other" && filters.otherCategory ? filters.otherCategory : filters.category}`
                  : ""}
                {filters.collabType ? ` • ${filters.collabType}` : ""}
              </p>
              <span className="text-xs text-muted-foreground">Sorted by fit</span>
            </div>

            {results.length === 0 ? (
              <div className="glass-card mt-6 rounded-2xl p-10 text-center max-w-xl mx-auto">
                <h2 className="text-lg font-semibold">No creators match yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your follower range slider, selecting a different city/pincode, or widening your budget range.
                </p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={resetDiscoverFilters}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((c, i) => (
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
