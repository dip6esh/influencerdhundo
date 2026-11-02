import React from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  LogIn,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface DuplicateAccountInfo {
  type: "email" | "phone" | "instagram";
  value: string;
  loginUrl: string;
  role?: "creator" | "business";
}

interface DuplicateAlertCardProps {
  message: string;
  loginUrl: string;
}

/**
 * Clean, compact, single-row responsive alert shown directly beneath the input field.
 * Fits naturally on all mobile and desktop screens without awkward wrapping.
 */
export function DuplicateAlertCard({
  message,
  loginUrl,
}: DuplicateAlertCardProps) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-rose/30 bg-rose/10 px-3 py-2 text-rose shadow-xs animate-in fade-in-50 slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle className="size-4 shrink-0 text-rose" />
        <span className="text-xs font-medium truncate">{message}</span>
      </div>
      <Link
        to={loginUrl}
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-primary hover:bg-saffrondeep text-primary-foreground font-display font-semibold ring-1 ring-saffrondeep/30 px-3 py-1.5 text-xs shadow-xs active:scale-[0.98] transition-all cursor-pointer"
      >
        <span>Log in</span>
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

interface DuplicateAccountPopupProps {
  open: boolean;
  onClose: () => void;
  info: DuplicateAccountInfo | null;
  onUseDifferent?: () => void;
}

/**
 * Streamlined, punchy popup card with zero filler text.
 * Fast to scan and effortless to act on.
 */
export function DuplicateAccountPopup({
  open,
  onClose,
  info,
  onUseDifferent,
}: DuplicateAccountPopupProps) {
  if (!info) return null;

  const { type, value, loginUrl } = info;

  const typeConfig = {
    email: {
      title: "Email Already Registered",
      label: "email",
    },
    phone: {
      title: "Mobile Already Registered",
      label: "mobile number",
    },
    instagram: {
      title: "Instagram Already Registered",
      label: "Instagram handle",
    },
  }[type];

  const handleUseDifferent = () => {
    onClose();
    if (onUseDifferent) {
      onUseDifferent();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm sm:w-full rounded-2xl sm:rounded-3xl border border-border bg-card/95 glass-card p-5 sm:p-6 shadow-2xl shadow-rose/10 overflow-hidden text-foreground">
        {/* Subtle ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 size-36 rounded-full bg-rose/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-12 size-36 rounded-full bg-primary/10 blur-2xl"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Animated icon badge */}
          <div className="relative mb-3 flex size-12 items-center justify-center rounded-2xl bg-rose/10 text-rose border border-rose/30 shadow-xs">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-rose/25 animate-ping opacity-30 pointer-events-none"
            />
            <AlertTriangle className="size-6 text-rose relative z-10" />
          </div>

          <DialogHeader className="space-y-1 text-center sm:text-center">
            <DialogTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {typeConfig.title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              An account with <strong className="text-foreground font-semibold break-all">{value}</strong> already exists.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Actions */}
          <div className="mt-5 w-full space-y-2">
            <Link
              to={loginUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-saffrondeep text-primary-foreground font-display font-semibold ring-1 ring-saffrondeep/30 px-4 py-2.5 text-sm shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <LogIn className="size-4" />
              <span>Log in to your account</span>
              <ArrowRight className="size-4 ml-1" />
            </Link>

            <button
              type="button"
              onClick={handleUseDifferent}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 ring-1 ring-border px-4 py-2 text-xs font-medium active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Use a different {typeConfig.label}</span>
            </button>
          </div>

          {/* Password recovery link */}
          <div className="mt-3.5 pt-2.5 border-t border-border w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span>Forgot password?</span>
            <Link
              to="/forgot-password"
              className="font-semibold text-accent hover:text-tealdeep underline underline-offset-4 transition-colors"
            >
              Reset it here
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
