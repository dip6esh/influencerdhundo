import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Creator, CreatorStatus } from "./directory-data";
import type { BusinessAccount, Report, Subscription } from "./app-state";

export const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"] || "https://ixfcoilswyagwifaronh.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmNvaWxzd3lhZ3dpZmFyb25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzkwOTUsImV4cCI6MjEwNjQxNTA5NX0.1M5rC0is9q0dWdjC5bBDVWWVZo7BFLe0S7vKlWbFZBw";

export const supabase: SupabaseClient<any, "public", any> = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

// Database record types
export interface CreatorRow {
  id: string;
  auth_user_id?: string | null;
  name: string;
  display_name: string;
  photo: string;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  followers: number;
  instagram: string;
  other_socials: { platform: string; handle: string }[];
  categories: string[];
  content_types: string[];
  languages: string[];
  about: string;
  collab_type: "Paid" | "Barter" | "Both";
  starting_price: number;
  travels: boolean;
  travel_range?: string | null;
  accepts_products: "Yes" | "No" | "Depends";
  accepts_products_details?: string | null;
  turnaround: string;
  status: CreatorStatus;
  featured: boolean;
  birth_date?: string | null;
  gender?: string | null;
  contact: { phone: string; whatsapp: string; email: string };
  // Referral system
  referral_code?: string | null;
  referred_by?: string | null;
  trial_started_at?: string | null;
  subscription_expires_at?: string | null;
  referral_bonus_days?: number | null;
  created_at?: string;
  updated_at?: string;
}

export function creatorToRow(c: Creator, authUserId?: string): CreatorRow {
  return {
    id: c.id,
    auth_user_id: authUserId ?? null,
    name: c.name,
    display_name: c.displayName,
    photo: c.photo || "",
    city: c.city,
    locality: c.locality,
    state: c.state || "",
    pincode: c.pincode || "",
    followers: c.followers || 0,
    instagram: c.instagram || "",
    other_socials: c.otherSocials || [],
    categories: c.categories || [],
    content_types: c.contentTypes || [],
    languages: c.languages || [],
    about: c.about || "",
    collab_type: c.collabType,
    starting_price: c.startingPrice || 0,
    travels: !!c.travels,
    travel_range: c.travelRange || null,
    accepts_products: c.acceptsProducts || "Depends",
    accepts_products_details: c.acceptsProductsDetails || "",
    turnaround: c.turnaround || "3–5 days",
    status: c.status || "Active",
    featured: !!c.featured,
    birth_date: c.birthDate || null,
    gender: c.gender || null,
    contact: c.contact || { phone: "", whatsapp: "", email: "" },
    referral_code: c.referralCode ?? null,
    referred_by: c.referredBy ?? null,
    trial_started_at: c.trialStartedAt ?? null,
    subscription_expires_at: c.subscriptionExpiresAt ?? null,
    referral_bonus_days: c.referralBonusDays ?? 0,
  };
}

export function rowToCreator(row: CreatorRow): Creator {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    photo: row.photo,
    city: row.city,
    locality: row.locality,
    state: row.state,
    pincode: row.pincode,
    followers: Number(row.followers) || 0,
    instagram: row.instagram,
    otherSocials: Array.isArray(row.other_socials) ? row.other_socials : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    contentTypes: Array.isArray(row.content_types) ? row.content_types : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    about: row.about,
    collabType: row.collab_type,
    startingPrice: Number(row.starting_price) || 0,
    travels: Boolean(row.travels),
    travelRange: row.travel_range ?? undefined,
    acceptsProducts: row.accepts_products || "Depends",
    acceptsProductsDetails: row.accepts_products_details ?? undefined,
    turnaround: row.turnaround || "3–5 days",
    status: row.status || "Active",
    featured: Boolean(row.featured),
    birthDate: row.birth_date ?? undefined,
    gender: row.gender ?? undefined,
    contact: row.contact || { phone: "", whatsapp: "", email: "" },
    referralCode: row.referral_code ?? undefined,
    referredBy: row.referred_by ?? undefined,
    trialStartedAt: row.trial_started_at ?? undefined,
    subscriptionExpiresAt: row.subscription_expires_at ?? undefined,
    referralBonusDays: row.referral_bonus_days ?? 0,
  };
}

// Supabase API service functions
export const supabaseDb = {
  async fetchCreators(): Promise<Creator[] | null> {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetchCreators error:", error.message);
        return null;
      }
      return (data as CreatorRow[]).map(rowToCreator);
    } catch (e) {
      console.warn("Supabase fetchCreators exception:", e);
      return null;
    }
  },

  async upsertCreator(creator: Creator): Promise<boolean> {
    try {
      const row = creatorToRow(creator);
      const { error } = await supabase.from("creators").upsert(row);
      if (error) {
        console.warn("Supabase upsertCreator error:", error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Supabase upsertCreator exception:", e);
      return false;
    }
  },

  async updateCreatorStatus(id: string, status: CreatorStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("creators")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      return !error;
    } catch (e) {
      console.warn("Supabase updateCreatorStatus error:", e);
      return false;
    }
  },

  async toggleFeatured(id: string, featured: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("creators")
        .update({ featured, updated_at: new Date().toISOString() })
        .eq("id", id);
      return !error;
    } catch (e) {
      console.warn("Supabase toggleFeatured error:", e);
      return false;
    }
  },

  async deleteCreator(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("creators").delete().eq("id", id);
      return !error;
    } catch (e) {
      console.warn("Supabase deleteCreator error:", e);
      return false;
    }
  },

  async addReport(
    report: Omit<Report, "id" | "at"> & { id: string; at: string },
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("reports").insert({
        id: report.id,
        creator_id: report.creatorId,
        reason: report.reason,
        details: report.details,
        at: report.at,
      });
      return !error;
    } catch (e) {
      console.warn("Supabase addReport error:", e);
      return false;
    }
  },

  async addSubscription(sub: Subscription): Promise<boolean> {
    try {
      const { error } = await supabase.from("subscriptions").insert({
        creator_id: sub.creatorId,
        plan_id: sub.planId,
        duration: sub.duration,
        price: sub.price,
        started_at: sub.startedAt,
        expires_at: sub.expiresAt ?? null,
        is_trial: sub.isTrial ?? false,
        referral_code_used: sub.referralCodeUsed ?? null,
        is_queued: sub.isQueued ?? false,
        status: sub.status ?? (sub.isQueued ? "queued" : "active"),
      });
      return !error;
    } catch (e) {
      console.warn("Supabase addSubscription error:", e);
      return false;
    }
  },

  async updateSubscriptionStatus(
    id: string,
    status: "active" | "queued" | "expired",
    isQueued = false,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status, is_queued: isQueued })
        .eq("id", id);
      return !error;
    } catch (e) {
      console.warn("Supabase updateSubscriptionStatus error:", e);
      return false;
    }
  },

  /** Fetch all subscriptions for a creator from Supabase, ordered by most recent first. */
  async fetchSubscriptionsForCreator(creatorId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((row) => ({
        id: row.id as string | undefined,
        creatorId: row.creator_id as string,
        planId: row.plan_id as string,
        duration: row.duration as string,
        price: Number(row.price),
        startedAt: row.started_at as string,
        expiresAt: row.expires_at as string | undefined,
        isTrial: Boolean(row.is_trial),
        referralCodeUsed: row.referral_code_used as string | undefined,
        isQueued: Boolean(row.is_queued),
        status: (row.status as "active" | "queued" | "expired") || (row.is_queued ? "queued" : "active"),
      }));
    } catch (e) {
      console.warn("Supabase fetchSubscriptionsForCreator error:", e);
      return [];
    }
  },

  /** Fetch all subscriptions in the system, ordered by most recent first. */
  async fetchAllSubscriptions(): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((row) => ({
        id: row.id as string | undefined,
        creatorId: row.creator_id as string,
        planId: row.plan_id as string,
        duration: row.duration as string,
        price: Number(row.price),
        startedAt: row.started_at as string,
        expiresAt: row.expires_at as string | undefined,
        isTrial: Boolean(row.is_trial),
        referralCodeUsed: row.referral_code_used as string | undefined,
        isQueued: Boolean(row.is_queued),
        status: (row.status as "active" | "queued" | "expired") || (row.is_queued ? "queued" : "active"),
      }));
    } catch (e) {
      console.warn("Supabase fetchAllSubscriptions error:", e);
      return [];
    }
  },

  async saveBusinessAccount(
    business: BusinessAccount,
    authUserId?: string | null,
  ): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = {
        name: business.name,
        business_name: business.businessName,
        mobile: business.mobile,
        email: business.email,
        updated_at: new Date().toISOString(),
      };
      if (authUserId || business.authUserId) {
        payload["auth_user_id"] = authUserId || business.authUserId;
      }
      const { error } = await supabase
        .from("business_accounts")
        .upsert(payload, { onConflict: "mobile" });
      if (error) {
        console.warn("Supabase saveBusinessAccount error:", error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Supabase saveBusinessAccount error:", e);
      return false;
    }
  },

  async uploadCreatorPhoto(file: File, pathPrefix = "avatar"): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const cleanPrefix = pathPrefix.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      const fileName = `${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("creator-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.warn("Supabase photo upload error:", uploadError.message);
        return null;
      }

      const { data } = supabase.storage.from("creator-photos").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.warn("Supabase photo upload exception:", e);
      return null;
    }
  },

  async findBusinessAccount(query: string): Promise<BusinessAccount | null> {
    try {
      const clean = query.trim();
      if (!clean) return null;
      const { data, error } = await supabase
        .from("business_accounts")
        .select("*")
        .or(`mobile.eq.${clean},email.ilike.${clean}`)
        .limit(1);

      if (error || !data || data.length === 0) return null;
      const row = data[0];
      return {
        id: row.id,
        authUserId: row.auth_user_id ?? undefined,
        name: row.name,
        businessName: row.business_name,
        mobile: row.mobile,
        email: row.email,
      };
    } catch (e) {
      console.warn("Supabase findBusinessAccount error:", e);
      return null;
    }
  },

  // ── Business Auth ─────────────────────────────────────────────────────────

  /** Sign up a new business user with email + password via Supabase Auth */
  async signUpBusiness(
    email: string,
    password: string,
    businessData: { name: string; businessName: string; mobile: string },
  ): Promise<{ userId: string; hasSession: boolean } | { error: string }> {
    try {
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/business/signup` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "business",
            name: businessData.name,
            business_name: businessData.businessName,
            mobile: businessData.mobile,
          },
          ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {}),
        },
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: "Sign-up failed. Please try again." };

      // Save into business_accounts table
      await this.saveBusinessAccount(
        {
          name: businessData.name,
          businessName: businessData.businessName,
          mobile: businessData.mobile,
          email: email,
          authUserId: data.user.id,
        },
        data.user.id,
      );

      return {
        userId: data.user.id,
        hasSession: !!data.session,
      };
    } catch (e) {
      return { error: String(e) };
    }
  },

  /** Sign in an existing business user with email + password */
  async signInBusiness(
    email: string,
    password: string,
  ): Promise<BusinessAccount | { error: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: "Login failed. Please try again." };

      // Look up business account by auth_user_id
      const { data: rows, error: dbErr } = await supabase
        .from("business_accounts")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .limit(1);

      if (!dbErr && rows && rows.length > 0) {
        const row = rows[0];
        return {
          id: row.id,
          authUserId: row.auth_user_id ?? undefined,
          name: row.name,
          businessName: row.business_name,
          mobile: row.mobile,
          email: row.email,
        };
      }

      // Fallback: match by email
      const { data: byEmail } = await supabase
        .from("business_accounts")
        .select("*")
        .ilike("email", email)
        .limit(1);

      if (byEmail && byEmail.length > 0) {
        const row = byEmail[0];
        // Link auth_user_id if not linked
        if (!row.auth_user_id) {
          await supabase
            .from("business_accounts")
            .update({ auth_user_id: data.user.id, updated_at: new Date().toISOString() })
            .eq("id", row.id);
        }
        return {
          id: row.id,
          authUserId: data.user.id,
          name: row.name,
          businessName: row.business_name,
          mobile: row.mobile,
          email: row.email,
        };
      }

      // Check user metadata if not in business_accounts table yet
      const userMeta = (data.user.user_metadata || {}) as Record<string, unknown>;
      const newBiz: BusinessAccount = {
        name:
          typeof userMeta["name"] === "string"
            ? userMeta["name"]
            : (email.split("@")[0] ?? "Business"),
        businessName:
          typeof userMeta["business_name"] === "string" ? userMeta["business_name"] : "My Business",
        mobile: typeof userMeta["mobile"] === "string" ? userMeta["mobile"] : "",
        email: email,
        authUserId: data.user.id,
      };
      await this.saveBusinessAccount(newBiz, data.user.id);
      return newBiz;
    } catch (e) {
      return { error: String(e) };
    }
  },

  /** Sign out business user */
  async signOutBusiness(): Promise<void> {
    await supabase.auth.signOut();
  },

  /** Get business profile for current auth user id or email */
  async getBusinessProfileForAuthUser(
    authUserId?: string,
    email?: string,
  ): Promise<BusinessAccount | null> {
    try {
      if (authUserId) {
        const { data } = await supabase
          .from("business_accounts")
          .select("*")
          .eq("auth_user_id", authUserId)
          .limit(1);
        if (data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            authUserId: row.auth_user_id ?? undefined,
            name: row.name,
            businessName: row.business_name,
            mobile: row.mobile,
            email: row.email,
          };
        }
      }
      if (email) {
        const { data } = await supabase
          .from("business_accounts")
          .select("*")
          .ilike("email", email)
          .limit(1);
        if (data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            authUserId: row.auth_user_id ?? undefined,
            name: row.name,
            businessName: row.business_name,
            mobile: row.mobile,
            email: row.email,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  async findCreatorAccount(query: string): Promise<Creator | null> {
    try {
      const clean = query.trim();
      if (!clean) return null;
      const cleanHandle = clean.startsWith("@") ? clean : `@${clean}`;

      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .or(`id.eq.${clean},instagram.ilike.${clean},instagram.ilike.${cleanHandle}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        return rowToCreator(data[0] as CreatorRow);
      }

      // Check contact phone/email across creators
      const { data: all } = await supabase.from("creators").select("*");
      if (all) {
        const match = (all as CreatorRow[]).find(
          (c) =>
            c.contact?.phone?.includes(clean) ||
            c.contact?.email?.toLowerCase() === clean.toLowerCase() ||
            c.id === clean ||
            c.instagram?.toLowerCase() === clean.toLowerCase() ||
            c.instagram?.toLowerCase() === cleanHandle.toLowerCase(),
        );
        if (match) return rowToCreator(match);
      }
      return null;
    } catch (e) {
      console.warn("Supabase findCreatorAccount error:", e);
      return null;
    }
  },

  // ── Creator Auth ──────────────────────────────────────────────────────────

  /** Sign up a new creator with email + password via Supabase Auth. */
  async signUpCreator(
    email: string,
    password: string,
  ): Promise<{ userId: string; hasSession: boolean } | { error: string }> {
    try {
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/creator/register` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        ...(redirectUrl ? { options: { emailRedirectTo: redirectUrl } } : {}),
      });

      if (error) return { error: error.message };
      if (!data.user) return { error: "Sign-up failed. Please try again." };

      return {
        userId: data.user.id,
        hasSession: !!data.session,
      };
    } catch (e) {
      return { error: String(e) };
    }
  },

  /** Sign in an existing creator with email + password. Returns their creator row. */
  async signInCreator(email: string, password: string): Promise<Creator | { error: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: "Login failed. Please try again." };

      // Look up the creator row linked to this auth user
      const { data: rows, error: dbErr } = await supabase
        .from("creators")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .limit(1);

      if (dbErr || !rows || rows.length === 0) {
        // Fallback: match by contact email
        const { data: byEmail } = await supabase
          .from("creators")
          .select("*")
          .filter("contact->>email", "ilike", email)
          .limit(1);
        if (byEmail && byEmail.length > 0) return rowToCreator(byEmail[0] as CreatorRow);
        return {
          error: "No creator profile found for this account. Please complete your profile.",
        };
      }
      return rowToCreator(rows[0] as CreatorRow);
    } catch (e) {
      return { error: String(e) };
    }
  },

  /** Sign out the currently logged-in creator. */
  async signOutCreator(): Promise<void> {
    await supabase.auth.signOut();
  },

  /** Get the currently active Supabase Auth session's user id (if any). */
  async getCreatorSession(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.id) return data.session.user.id;
      const { data: userData } = await supabase.auth.getUser();
      return userData?.user?.id ?? null;
    } catch {
      return null;
    }
  },

  /** Fetch creator profile associated with an auth user id or email */
  async getCreatorProfileForAuthUser(authUserId?: string, email?: string): Promise<Creator | null> {
    try {
      if (authUserId) {
        const { data } = await supabase
          .from("creators")
          .select("*")
          .eq("auth_user_id", authUserId)
          .limit(1);
        if (data && data.length > 0) return rowToCreator(data[0] as CreatorRow);
      }
      if (email) {
        const { data } = await supabase
          .from("creators")
          .select("*")
          .filter("contact->>email", "ilike", email)
          .limit(1);
        if (data && data.length > 0) return rowToCreator(data[0] as CreatorRow);
      }
      return null;
    } catch {
      return null;
    }
  },

  /** Save a creator profile linked to a Supabase Auth user id. Returns success status and error message if any. */
  async upsertCreatorWithAuth(
    creator: Creator,
    authUserId?: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const row = creatorToRow(creator, authUserId || undefined);
      const { error } = await supabase.from("creators").upsert(row);

      if (error) {
        console.warn("Supabase upsertCreatorWithAuth error:", error.message);
        // If foreign key constraint fails on auth_user_id, retry without auth_user_id so profile is preserved
        if (error.message.includes("auth_user_id") || error.code === "23503") {
          console.warn("Retrying creator upsert without auth_user_id FK...");
          const fallbackRow = { ...row, auth_user_id: null };
          const { error: fbErr } = await supabase.from("creators").upsert(fallbackRow);
          if (fbErr) {
            return { success: false, error: fbErr.message };
          }
          return { success: true };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.warn("Supabase upsertCreatorWithAuth exception:", e);
      return { success: false, error: String(e) };
    }
  },

  // ── Referral System ───────────────────────────────────────────────────────

  /** Save a referral code to a creator row */
  async setReferralCode(creatorId: string, referralCode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("creators")
        .update({ referral_code: referralCode, updated_at: new Date().toISOString() })
        .eq("id", creatorId);
      return !error;
    } catch {
      return false;
    }
  },

  /** Find a creator by their referral code */
  async findCreatorByReferralCode(code: string): Promise<Creator | null> {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("referral_code", code.trim().toUpperCase())
        .limit(1);
      if (error || !data || data.length === 0) return null;
      return rowToCreator(data[0] as CreatorRow);
    } catch {
      return null;
    }
  },

  /** Alias for findCreatorByReferralCode */
  async lookupReferralCode(code: string): Promise<Creator | null> {
    return this.findCreatorByReferralCode(code);
  },

  /** Save the referredBy creator id to a creator row */
  async setReferredBy(creatorId: string, referrerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("creators")
        .update({ referred_by: referrerId, updated_at: new Date().toISOString() })
        .eq("id", creatorId);
      return !error;
    } catch {
      return false;
    }
  },

  /** Update the subscription_expires_at and referral_bonus_days on a creator row and their active subscription */
  async updateSubscriptionExpiry(
    creatorId: string,
    expiresAt: Date,
    bonusDays: number,
  ): Promise<boolean> {
    try {
      // 1. Update creators table
      const { error: cErr } = await supabase
        .from("creators")
        .update({
          subscription_expires_at: expiresAt.toISOString(),
          referral_bonus_days: bonusDays,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creatorId);

      // 2. Also update the active subscription in subscriptions table
      await supabase
        .from("subscriptions")
        .update({ expires_at: expiresAt.toISOString() })
        .eq("creator_id", creatorId)
        .eq("status", "active");

      return !cErr;
    } catch {
      return false;
    }
  },

  /** Fetch all referral events for a creator (as the referrer) */
  async fetchReferralEvents(referrerId: string): Promise<ReferralEvent[]> {
    try {
      const { data, error } = await supabase
        .from("referral_events")
        .select("*")
        .eq("referrer_id", referrerId)
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return data.map((row) => ({
        id: row.id as string,
        referrerId: row.referrer_id as string,
        referredCreatorId: row.referred_creator_id as string,
        referredSubId: row.referred_sub_id as string | undefined,
        daysDelta: Number(row.days_delta),
        eventType: row.event_type as "earned" | "reversed",
        note: row.note as string,
        createdAt: row.created_at as string,
      }));
    } catch {
      return [];
    }
  },

  /** Record a referral event (earned or reversed) */
  async addReferralEvent(event: Omit<ReferralEvent, "id" | "createdAt">): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("referral_events")
        .insert({
          referrer_id: event.referrerId,
          referred_creator_id: event.referredCreatorId,
          referred_sub_id: event.referredSubId ?? null,
          days_delta: event.daysDelta,
          event_type: event.eventType,
          note: event.note,
        })
        .select("id")
        .single();
      if (error || !data) return null;
      return (data as { id: string }).id;
    } catch {
      return null;
    }
  },

  /** Mark a subscription as having its referral reversed (for refund scenarios) */
  async reverseReferralForSub(
    referrerId: string,
    referredCreatorId: string,
    referredSubId: string,
    referredCreatorName: string,
  ): Promise<boolean> {
    try {
      // 1. Record the reversal event (-7 days)
      await this.addReferralEvent({
        referrerId,
        referredCreatorId,
        referredSubId,
        daysDelta: -7,
        eventType: "reversed",
        note: `${referredCreatorName}'s subscription was refunded (-7 Days)`,
      });

      // 2. Fetch current referral_bonus_days and subscription_expires_at for referrer
      const { data: referrerRow } = await supabase
        .from("creators")
        .select("referral_bonus_days, subscription_expires_at")
        .eq("id", referrerId)
        .single();

      if (!referrerRow) return false;

      const currentBonus = Number((referrerRow as { referral_bonus_days: number }).referral_bonus_days ?? 0);
      const newBonus = Math.max(0, currentBonus - 7);

      const currentExpiry = (referrerRow as { subscription_expires_at: string | null }).subscription_expires_at;
      const newExpiry = currentExpiry
        ? new Date(new Date(currentExpiry).getTime() - 7 * 24 * 60 * 60 * 1000)
        : null;

      if (newExpiry) {
        await this.updateSubscriptionExpiry(referrerId, newExpiry, newBonus);
      } else {
        // Just update bonus days
        await supabase
          .from("creators")
          .update({ referral_bonus_days: newBonus, updated_at: new Date().toISOString() })
          .eq("id", referrerId);
      }

      return true;
    } catch {
      return false;
    }
  },

  /** Check if a creator has ever used free trial (by checking trial_started_at and subscriptions table) */
  async checkCreatorHasUsedTrial(creatorId: string): Promise<boolean> {
    try {
      // 1. Check creators table
      const { data: creator } = await supabase
        .from("creators")
        .select("trial_started_at")
        .eq("id", creatorId)
        .maybeSingle();
      if (creator && (creator as { trial_started_at?: string | null }).trial_started_at) {
        return true;
      }

      // 2. Check subscriptions table
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("creator_id", creatorId)
        .or("is_trial.eq.true,plan_id.eq.trial-3d")
        .limit(1);
      if (subs && subs.length > 0) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  },

  /** Start free trial for a creator — sets trial_started_at and subscription_expires_at */
  async startFreeTrial(creatorId: string): Promise<boolean> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const { error } = await supabase
        .from("creators")
        .update({
          trial_started_at: now.toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          status: "Active",
          updated_at: now.toISOString(),
        })
        .eq("id", creatorId);
      return !error;
    } catch {
      return false;
    }
  },
};

// ── Referral Event type ────────────────────────────────────────────────────
export type ReferralEvent = {
  id: string;
  referrerId: string;
  referredCreatorId: string;
  referredSubId?: string | undefined;
  daysDelta: number; // +3 or -3
  eventType: "earned" | "reversed";
  note: string;
  createdAt: string;
};

