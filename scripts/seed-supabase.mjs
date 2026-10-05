import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      env[k] = v;
    }
  }
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  env.VITE_SUPABASE_URL ||
  "https://ixfcoilswyagwifaronh.supabase.co";

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4ZmNvaWxzd3lhZ3dpZmFyb25oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDgzOTA5NSwiZXhwIjoyMTA2NDE1MDk1fQ.W8MofXjLgVJ15yXzDP_Cn7Y-lxBSl7RLPFgcuGhArbI";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DEFAULT_CREATORS = [
  {
    id: "aditi-sharma",
    name: "Aditi Sharma",
    display_name: "aditi.eats",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    city: "Thane",
    locality: "Thane West",
    state: "Maharashtra",
    pincode: "400601",
    followers: 12400,
    instagram: "@aditi.eats",
    other_socials: [{ platform: "YouTube", handle: "AditiEatsIndia" }],
    categories: ["Food", "Lifestyle"],
    content_types: ["Reels", "Stories", "UGC"],
    languages: ["Hindi", "English", "Marathi"],
    about: "Street food discoveries, hidden cafes, and authentic Maharashtrian dishes in Thane & Mumbai.",
    collab_type: "Both",
    starting_price: 2500,
    travels: true,
    travel_range: "Up to 20 km",
    accepts_products: "Yes",
    turnaround: "3–5 days",
    status: "Active",
    featured: true,
    gender: "Female",
    contact: { phone: "+91 98201 12345", whatsapp: "+91 98201 12345", email: "collabs@aditieats.in" },
  },
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    display_name: "rohan.fits",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    city: "Mumbai",
    locality: "Bandra West",
    state: "Maharashtra",
    pincode: "400050",
    followers: 48500,
    instagram: "@rohan.fits",
    other_socials: [],
    categories: ["Fitness", "Lifestyle"],
    content_types: ["Reels", "Posts"],
    languages: ["English", "Hindi"],
    about: "Calisthenics, gym motivation, and clean eating. Working with gyms, apparel brands & healthy food spots.",
    collab_type: "Paid",
    starting_price: 7500,
    travels: true,
    travel_range: "Anywhere within my city",
    accepts_products: "Depends",
    turnaround: "1–2 days",
    status: "Active",
    featured: true,
    gender: "Male",
    contact: { phone: "+91 98202 23456", whatsapp: "+91 98202 23456", email: "rohan@rohanfits.com" },
  },
  {
    id: "sneha-patel",
    name: "Sneha Patel",
    display_name: "sneha.glam",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    city: "Ahmedabad",
    locality: "Navrangpura",
    state: "Gujarat",
    pincode: "380009",
    followers: 24300,
    instagram: "@sneha.glam",
    other_socials: [],
    categories: ["Beauty", "Fashion"],
    content_types: ["Reels", "Stories", "Photography"],
    languages: ["Gujarati", "Hindi", "English"],
    about: "Bridal makeup artist & daily beauty tips. Reviewing skincare, makeup brands, and salon services in Ahmedabad.",
    collab_type: "Both",
    starting_price: 4000,
    travels: false,
    travel_range: "Up to 5 km",
    accepts_products: "Yes",
    turnaround: "3–5 days",
    status: "Active",
    featured: false,
    gender: "Female",
    contact: { phone: "+91 98203 34567", whatsapp: "+91 98203 34567", email: "sneha@snehaglam.com" },
  },
  {
    id: "kabir-verma",
    name: "Kabir Verma",
    display_name: "kabir.tech",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    city: "Bengaluru",
    locality: "Koramangala",
    state: "Karnataka",
    pincode: "560034",
    followers: 8600,
    instagram: "@kabir.tech",
    other_socials: [{ platform: "Twitter/X", handle: "kabirv_tech" }],
    categories: ["Technology", "Gaming"],
    content_types: ["Reels", "UGC", "Posts"],
    languages: ["English", "Hindi"],
    about: "Unboxing gadgets, smartphone reviews, and workstation setups. Perfect partner for local electronics stores & consumer tech.",
    collab_type: "Paid",
    starting_price: 3000,
    travels: true,
    travel_range: "Up to 10 km",
    accepts_products: "Yes",
    turnaround: "5–7 days",
    status: "Active",
    featured: false,
    gender: "Male",
    contact: { phone: "+91 98204 45678", whatsapp: "+91 98204 45678", email: "kabir@kabirtech.in" },
  },
];

async function seed() {
  console.log("🌱 Seeding Supabase database with creators...");
  const { data, error } = await supabaseAdmin.from("creators").upsert(DEFAULT_CREATORS, {
    onConflict: "id",
  });

  if (error) {
    console.error("❌ Seed error:", error.message);
    if (error.code === "PGRST205") {
      console.log("💡 The 'creators' table doesn't exist yet.");
      console.log("💡 Run the SQL statements in supabase/schema.sql in Supabase SQL editor first.");
    }
  } else {
    console.log("✅ Successfully seeded creators into Supabase!");
  }
}

seed().catch(console.error);
