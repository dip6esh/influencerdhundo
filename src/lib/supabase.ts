import { createClient } from "@supabase/supabase-js";
import type { Creator, CreatorStatus } from "./directory-data";
import type { BusinessAccount, Report, Subscription } from "./app-state";

export const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"] || "https://ixfcoilswyagwifaronh.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmNvaWxzd3lhZ3dpZmFyb25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzkwOTUsImV4cCI6MjEwNjQxNTA5NX0.1M5rC0is9q0dWdjC5bBDVWWVZo7BFLe0S7vKlWbFZBw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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
  contact: { phone: string; whatsapp: string; email: string };
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
    contact: c.contact || { phone: "", whatsapp: "", email: "" },
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
    contact: row.contact || { phone: "", whatsapp: "", email: "" },
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

  async addReport(report: Omit<Report, "id" | "at"> & { id: string; at: string }): Promise<boolean> {
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
      });
      return !error;
    } catch (e) {
      console.warn("Supabase addSubscription error:", e);
      return false;
    }
  },

  async saveBusinessAccount(business: BusinessAccount): Promise<boolean> {
    try {
      const { error } = await supabase.from("business_accounts").upsert(
        {
          name: business.name,
          business_name: business.businessName,
          mobile: business.mobile,
          email: business.email,
        },
        { onConflict: "mobile" },
      );
      return !error;
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
        typeof window !== "undefined"
          ? `${window.location.origin}/creator/register`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
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
  async signInCreator(
    email: string,
    password: string,
  ): Promise<Creator | { error: string }> {
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
        return { error: "No creator profile found for this account. Please complete your profile." };
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
};
