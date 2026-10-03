import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Chip({
  label,
  selected,
  onClick,
  tone = "primary",
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  tone?: "primary" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? tone === "accent"
            ? "bg-accent font-semibold text-accent-foreground"
            : "bg-primary font-semibold text-primary-foreground"
          : "bg-background text-muted-foreground ring-1 ring-border hover:ring-foreground/20",
      )}
    >
      {label}
    </button>
  );
}

export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "accent" | "rose";
}) {
  const tones = {
    muted: "bg-background text-muted-foreground ring-1 ring-border",
    primary: "bg-primary/15 text-saffrondeep",
    accent: "bg-accent/10 text-tealdeep",
    rose: "bg-rose/10 text-rose",
  } as const;
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="label-caps block">{children}</span>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-xl bg-background px-4 py-3 text-sm font-medium text-foreground ring-1 ring-border outline-none placeholder:font-normal placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-28", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, "appearance-none pr-10", props.className)} />;
}

export function DropdownSelect<T extends string = string>({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  options: { label: string; value: T }[] | readonly T[] | T[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt as T } : opt,
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder || "Select...";

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-xl bg-background px-4 py-3 text-sm font-medium text-foreground ring-1 ring-border outline-none transition-all hover:ring-foreground/30 focus:ring-2 focus:ring-ring text-left cursor-pointer",
          className,
        )}
      >
        <span className={value ? "text-foreground font-medium" : "text-muted-foreground font-normal"}>
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-background/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {placeholder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("" as T);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer",
                value === ""
                  ? "bg-primary/15 text-saffrondeep font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>{placeholder}</span>
              {value === "" && <Check className="size-4 text-saffrondeep" />}
            </button>
          )}
          {normalizedOptions.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer",
                  isSelected
                    ? "bg-primary/15 text-saffrondeep font-semibold"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="size-4 text-saffrondeep" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date of birth",
  maxDate,
  minDate,
  className,
}: {
  value?: string | undefined;
  onChange: (val: string) => void;
  placeholder?: string | undefined;
  maxDate?: string | undefined;
  minDate?: string | undefined;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parseDate = (d?: string): Date | null => {
    if (!d) return null;
    const parts = d.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  };

  const parsedValue = parseDate(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(() => parsedValue?.getFullYear() ?? 2002);
  const [viewMonth, setViewMonth] = useState(() => parsedValue?.getMonth() ?? 0);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setViewMode("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const currentYear = new Date().getFullYear();
  const startYear = 1950;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
    setViewMode("days");
  };

  const isDayDisabled = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (maxDate && dateStr > maxDate) return true;
    if (minDate && dateStr < minDate) return true;
    return false;
  };

  const formattedDisplay = parsedValue
    ? parsedValue.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-xl bg-background px-4 py-3 text-sm font-medium text-foreground ring-1 ring-border outline-none transition-all hover:ring-foreground/30 focus:ring-2 focus:ring-ring text-left cursor-pointer",
          className,
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="size-4 text-primary shrink-0" />
          <span className={value ? "text-foreground font-medium" : "text-muted-foreground font-normal"}>
            {formattedDisplay || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear date"
            >
              <X className="size-3.5" />
            </span>
          ) : (
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180 text-foreground",
              )}
            />
          )}
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full max-w-[340px] rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* CALENDAR HEADER */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
            {viewMode === "days" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("months");
                    }}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    {MONTHS[viewMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("years");
                    }}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    {viewYear}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Previous month"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Next month"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {viewMode === "months" ? "Select Month" : "Select Year"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode("days");
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Back to calendar
                </button>
              </div>
            )}
          </div>

          {/* VIEW MODE: MONTHS GRID */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2 py-3">
              {SHORT_MONTHS.map((m, idx) => {
                const isSelectedMonth = viewMonth === idx;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMonth(idx);
                      setViewMode("days");
                    }}
                    className={cn(
                      "rounded-xl py-2.5 text-xs font-semibold transition-all",
                      isSelectedMonth
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: YEARS GRID */}
          {viewMode === "years" && (
            <div className="max-h-56 overflow-y-auto grid grid-cols-3 gap-2 py-3 pr-1">
              {years.map((y) => {
                const isSelectedYear = viewYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewYear(y);
                      setViewMode("days");
                    }}
                    className={cn(
                      "rounded-xl py-2 text-xs font-semibold transition-all",
                      isSelectedYear
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: DAYS CALENDAR */}
          {viewMode === "days" && (
            <div className="pt-3">
              {/* WEEKDAY LABELS */}
              <div className="grid grid-cols-7 mb-1 text-center">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="text-[11px] font-semibold text-muted-foreground/80 uppercase">
                    {w}
                  </span>
                ))}
              </div>

              {/* DAYS GRID */}
              <div className="grid grid-cols-7 gap-1">
                {/* Blank days before 1st of month */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`blank-${i}`} className="size-8" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected =
                    parsedValue &&
                    parsedValue.getFullYear() === viewYear &&
                    parsedValue.getMonth() === viewMonth &&
                    parsedValue.getDate() === day;

                  const isCurrentDay =
                    today.getFullYear() === viewYear &&
                    today.getMonth() === viewMonth &&
                    today.getDate() === day;

                  const disabled = isDayDisabled(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDay(day);
                      }}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl text-xs font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 scale-105"
                          : isCurrentDay
                            ? "border border-primary text-primary font-semibold hover:bg-primary/10"
                            : "text-foreground hover:bg-secondary hover:text-foreground",
                        disabled && "opacity-25 cursor-not-allowed hover:bg-transparent text-muted-foreground",
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* QUICK JUMP SHORTCUTS FOR BIRTH YEARS */}
              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">Quick year:</span>
                <div className="flex items-center gap-1">
                  {[2004, 2000, 1996, 1992].map((quickYear) => (
                    <button
                      key={quickYear}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewYear(quickYear);
                      }}
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                        viewYear === quickYear
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-secondary text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {quickYear}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: {
  variant?: "primary" | "ink" | "ghost" | "outline";
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground font-display text-base font-semibold ring-1 ring-saffrondeep/30 hover:bg-saffrondeep",
    ink: "bg-foreground text-background font-semibold hover:bg-foreground/90",
    ghost: "bg-background text-muted-foreground font-medium ring-1 ring-border hover:text-foreground",
    outline: "glass-card text-foreground font-semibold",
  } as const;
  return (
    <button
      {...rest}
      className={cn(
        "rounded-xl px-5 py-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass-card rounded-2xl p-5", className)}>{children}</div>;
}

export function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-accent ${className ?? ""}`}>
      {children}
    </p>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Active"
      ? "bg-accent/10 text-tealdeep"
      : status === "Suspended"
        ? "bg-rose/10 text-rose"
        : "bg-primary/15 text-saffrondeep";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {status}
    </span>
  );
}

export function IndiaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 225 150"
      className={cn("inline-block shrink-0 rounded-[2px] shadow-2xs overflow-hidden border border-black/10", className ?? "w-4 h-3")}
      aria-label="Flag of India"
    >
      <rect width="225" height="50" fill="#FF9933" />
      <rect y="50" width="225" height="50" fill="#FFFFFF" />
      <rect y="100" width="225" height="50" fill="#138808" />
      <circle cx="112.5" cy="75" r="20" fill="none" stroke="#000080" strokeWidth="3" />
      <circle cx="112.5" cy="75" r="3.5" fill="#000080" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="112.5"
          y1="75"
          x2={112.5 + 20 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={75 + 20 * Math.sin((i * 15 * Math.PI) / 180)}
          stroke="#000080"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}
