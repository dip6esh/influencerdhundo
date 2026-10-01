import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";
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
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </label>
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
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        onClick={() => setOpen((prev) => !prev)}
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
              onClick={() => {
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
                onClick={() => {
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
