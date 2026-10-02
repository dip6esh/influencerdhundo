import aditi from "@/assets/creator-aditi.jpg";
import rohan from "@/assets/creator-rohan.jpg";
import sneha from "@/assets/creator-sneha.jpg";
import kabir from "@/assets/creator-kabir.jpg";

export const CATEGORIES = [
  "Food",
  "Fashion",
  "Beauty",
  "Fitness",
  "Lifestyle",
  "Travel",
  "Technology",
  "Finance",
  "Education",
  "Parenting",
  "Gaming",
  "Automobile",
  "Wedding",
  "Photography",
  "Real Estate",
  "Home & Interior",
  "Entertainment",
  "Comedy",
  "Music",
  "Events",
  "Other",
] as const;

export const CONTENT_TYPES = [
  "Reels",
  "Stories",
  "Posts",
  "UGC",
  "Photography",
  "Event coverage",
  "Other",
] as const;

export const LANGUAGES = [
  "Hindi",
  "English",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Punjabi",
  "Urdu",
] as const;

export const COLLAB_TYPES = ["Paid", "Barter", "Both"] as const;

export const TRAVEL_RANGES = [
  "Up to 2 km",
  "Up to 5 km",
  "Up to 10 km",
  "Up to 20 km",
  "Anywhere within my city",
] as const;

export const TURNAROUNDS = ["Same day", "1–2 days", "3–5 days", "5–7 days", "7+ days"] as const;

export const CITIES = [
  "Mumbai",
  "Thane",
  "Pune",
  "Bengaluru",
  "Delhi",
  "Hyderabad",
  "Ahmedabad",
  "Jaipur",
] as const;

export const SIZE_BANDS = [
  { label: "Under 1K", min: 0, max: 1000 },
  { label: "1K–5K", min: 1000, max: 5000 },
  { label: "5K–10K", min: 5000, max: 10000 },
  { label: "10K–50K", min: 10000, max: 50000 },
  { label: "50K+", min: 50000, max: Infinity },
] as const;

export const BUDGET_BANDS = [
  { label: "Under ₹1,000", max: 1000 },
  { label: "Under ₹2,000", max: 2000 },
  { label: "Under ₹5,000", max: 5000 },
  { label: "Under ₹10,000", max: 10000 },
  { label: "Any budget", max: Infinity },
] as const;

export const PLANS = [
  { id: "1m", duration: "1 Month", price: 799, note: "Try it out" },
  { id: "3m", duration: "3 Months", price: 1999, note: "Most popular" },
  { id: "6m", duration: "6 Months", price: 3398, note: "Better value" },
  { id: "1y", duration: "1 Year", price: 7996, note: "Best value" },
] as const;

export const PROMO_CODE_3DAYS = "TRYFREE3DAYS";

export function getSubscriptionExpiry(sub: {
  planId?: string;
  duration?: string;
  startedAt: string;
}): Date {
  const started = new Date(sub.startedAt).getTime();
  if (sub.planId === "trial-3d" || sub.duration?.toLowerCase().includes("3 day")) {
    return new Date(started + 3 * 24 * 60 * 60 * 1000);
  }
  if (sub.planId === "1m" || sub.duration?.toLowerCase().includes("1 month")) {
    return new Date(started + 30 * 24 * 60 * 60 * 1000);
  }
  if (sub.planId === "3m" || sub.duration?.toLowerCase().includes("3 month")) {
    return new Date(started + 90 * 24 * 60 * 60 * 1000);
  }
  if (sub.planId === "6m" || sub.duration?.toLowerCase().includes("6 month")) {
    return new Date(started + 180 * 24 * 60 * 60 * 1000);
  }
  if (sub.planId === "1y" || sub.duration?.toLowerCase().includes("1 year")) {
    return new Date(started + 365 * 24 * 60 * 60 * 1000);
  }
  // Default fallback: 30 days
  return new Date(started + 30 * 24 * 60 * 60 * 1000);
}

export function isSubscriptionActive(sub?: {
  planId?: string;
  duration?: string;
  startedAt: string;
}): boolean {
  if (!sub || !sub.startedAt) return false;
  return new Date() < getSubscriptionExpiry(sub);
}

export function formatTimeRemaining(expiry: Date): string {
  const diff = expiry.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${mins}m left`;
}

export function calculateAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export const REPORT_REASONS = [
  "Fake profile",
  "Incorrect information",
  "Misleading information",
  "Inappropriate content",
  "No longer active",
  "Other",
] as const;

export type CreatorStatus = "Draft" | "Inactive" | "Active" | "Expired" | "Suspended";

export type Creator = {
  id: string;
  name: string;
  displayName: string;
  photo: string;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  followers: number;
  instagram: string;
  otherSocials: { platform: string; handle: string }[];
  categories: string[];
  contentTypes: string[];
  languages: string[];
  about: string;
  collabType: (typeof COLLAB_TYPES)[number];
  startingPrice: number;
  travels: boolean;
  travelRange?: string | undefined;
  acceptsProducts: "Yes" | "No" | "Depends";
  acceptsProductsDetails?: string | undefined;
  turnaround: string;
  status: CreatorStatus;
  featured?: boolean | undefined;
  birthDate?: string | undefined;
  contact: { phone: string; whatsapp: string; email: string };
};

export const CREATORS: Creator[] = [
  {
    id: "aditi-sharma",
    name: "Aditi Sharma",
    displayName: "aditi.eats",
    photo: aditi,
    city: "Thane",
    locality: "Thane West",
    state: "Maharashtra",
    pincode: "400601",
    followers: 12400,
    instagram: "@aditi.eats",
    otherSocials: [{ platform: "YouTube", handle: "@aditieats" }],
    categories: ["Food", "Lifestyle"],
    contentTypes: ["Reels", "Stories", "Photography"],
    languages: ["Hindi", "English", "Marathi"],
    about:
      "Mumbai-based food and lifestyle creator making short-form content around local experiences, restaurants and cafés across Thane and the suburbs.",
    collabType: "Both",
    startingPrice: 1000,
    travels: true,
    travelRange: "Up to 10 km",
    acceptsProducts: "Yes",
    turnaround: "3–5 days",
    status: "Active",
    featured: true,
    birthDate: "2000-05-14",
    contact: {
      phone: "+91 98200 11223",
      whatsapp: "+91 98200 11223",
      email: "aditi.eats@example.com",
    },
  },
  {
    id: "rohan-kale",
    name: "Rohan Kale",
    displayName: "rohan.lifts",
    photo: rohan,
    city: "Mumbai",
    locality: "Andheri West",
    state: "Maharashtra",
    pincode: "400058",
    followers: 8100,
    instagram: "@rohan.lifts",
    otherSocials: [],
    categories: ["Fitness"],
    contentTypes: ["Reels", "UGC"],
    languages: ["Hindi", "English"],
    about:
      "Fitness creator covering neighbourhood gyms, home workouts and supplement reviews for first-time gym goers.",
    collabType: "Paid",
    startingPrice: 1500,
    travels: true,
    travelRange: "Up to 5 km",
    acceptsProducts: "Yes",
    turnaround: "1–2 days",
    status: "Active",
    birthDate: "1998-11-20",
    contact: {
      phone: "+91 98670 44551",
      whatsapp: "+91 98670 44551",
      email: "rohan.lifts@example.com",
    },
  },
  {
    id: "sneha-patil",
    name: "Sneha Patil",
    displayName: "snehaglows",
    photo: sneha,
    city: "Thane",
    locality: "Dombivli",
    state: "Maharashtra",
    pincode: "421201",
    followers: 3200,
    instagram: "@snehaglows",
    otherSocials: [{ platform: "Facebook", handle: "snehaglows" }],
    categories: ["Beauty", "Fashion"],
    contentTypes: ["Posts", "UGC"],
    languages: ["Marathi", "Hindi"],
    about:
      "Beauty and skincare creator making honest, budget-friendly reviews for salons, studios and local beauty brands.",
    collabType: "Barter",
    startingPrice: 800,
    travels: false,
    acceptsProducts: "Yes",
    turnaround: "3–5 days",
    status: "Active",
    birthDate: "2002-08-09",
    contact: {
      phone: "+91 90040 87612",
      whatsapp: "+91 90040 87612",
      email: "sneha.patil@example.com",
    },
  },
  {
    id: "kabir-mehta",
    name: "Kabir Mehta",
    displayName: "kabirroams",
    photo: kabir,
    city: "Jaipur",
    locality: "Malviya Nagar",
    state: "Rajasthan",
    pincode: "302017",
    followers: 56800,
    instagram: "@kabirroams",
    otherSocials: [
      { platform: "YouTube", handle: "@kabirroams" },
      { platform: "Facebook", handle: "kabirroams" },
    ],
    categories: ["Travel", "Photography"],
    contentTypes: ["Reels", "Photography", "Event coverage"],
    languages: ["Hindi", "English"],
    about:
      "Travel and photography creator shooting heritage stays, cafés and city walks across Rajasthan.",
    collabType: "Paid",
    startingPrice: 9000,
    travels: true,
    travelRange: "Anywhere within my city",
    acceptsProducts: "Depends",
    turnaround: "5–7 days",
    status: "Active",
    featured: true,
    birthDate: "1996-03-25",
    contact: {
      phone: "+91 94140 23098",
      whatsapp: "+91 94140 23098",
      email: "kabir.mehta@example.com",
    },
  },
  {
    id: "meera-iyer",
    name: "Meera Iyer",
    displayName: "meera.athome",
    photo: sneha,
    city: "Bengaluru",
    locality: "Koramangala",
    state: "Karnataka",
    pincode: "560034",
    followers: 21500,
    instagram: "@meera.athome",
    otherSocials: [],
    categories: ["Home & Interior", "Lifestyle"],
    contentTypes: ["Reels", "Posts"],
    languages: ["English", "Tamil", "Kannada"],
    about:
      "Home and interior creator showing small-space makeovers, furniture stores and decor finds around Bengaluru.",
    collabType: "Both",
    startingPrice: 4500,
    travels: true,
    travelRange: "Up to 20 km",
    acceptsProducts: "Yes",
    turnaround: "5–7 days",
    status: "Active",
    contact: {
      phone: "+91 98450 66712",
      whatsapp: "+91 98450 66712",
      email: "meera.iyer@example.com",
    },
  },
  {
    id: "faisal-khan",
    name: "Faisal Khan",
    displayName: "faisaleats",
    photo: rohan,
    city: "Pune",
    locality: "Kothrud",
    state: "Maharashtra",
    pincode: "411038",
    followers: 940,
    instagram: "@faisaleats",
    otherSocials: [],
    categories: ["Food", "Comedy"],
    contentTypes: ["Reels", "Stories"],
    languages: ["Hindi", "Urdu", "Marathi"],
    about:
      "New food creator reviewing street food carts, tapris and small eateries around Kothrud and Warje.",
    collabType: "Barter",
    startingPrice: 500,
    travels: true,
    travelRange: "Up to 2 km",
    acceptsProducts: "Depends",
    turnaround: "Same day",
    status: "Active",
    contact: {
      phone: "+91 77980 45512",
      whatsapp: "+91 77980 45512",
      email: "faisal.khan@example.com",
    },
  },
  {
    id: "ananya-rao",
    name: "Ananya Rao",
    displayName: "ananya.weds",
    photo: aditi,
    city: "Hyderabad",
    locality: "Jubilee Hills",
    state: "Telangana",
    pincode: "500033",
    followers: 34200,
    instagram: "@ananya.weds",
    otherSocials: [{ platform: "YouTube", handle: "@ananyaweds" }],
    categories: ["Wedding", "Fashion", "Events"],
    contentTypes: ["Photography", "Event coverage", "Reels"],
    languages: ["Telugu", "English", "Hindi"],
    about:
      "Wedding and events creator documenting boutiques, makeup studios and venue walkthroughs in Hyderabad.",
    collabType: "Paid",
    startingPrice: 7500,
    travels: true,
    travelRange: "Anywhere within my city",
    acceptsProducts: "No",
    turnaround: "7+ days",
    status: "Active",
    contact: {
      phone: "+91 99490 77120",
      whatsapp: "+91 99490 77120",
      email: "ananya.rao@example.com",
    },
  },
  {
    id: "dev-bhatia",
    name: "Dev Bhatia",
    displayName: "dev.techtalk",
    photo: kabir,
    city: "Delhi",
    locality: "Lajpat Nagar",
    state: "Delhi",
    pincode: "110024",
    followers: 6700,
    instagram: "@dev.techtalk",
    otherSocials: [],
    categories: ["Technology", "Gaming"],
    contentTypes: ["Reels", "UGC", "Posts"],
    languages: ["Hindi", "English", "Punjabi"],
    about:
      "Tech creator covering gadget shops, repair services and budget accessories for everyday buyers.",
    collabType: "Both",
    startingPrice: 1800,
    travels: false,
    acceptsProducts: "Yes",
    turnaround: "3–5 days",
    status: "Expired",
    contact: {
      phone: "+91 98110 33447",
      whatsapp: "+91 98110 33447",
      email: "dev.bhatia@example.com",
    },
  },
];

export function formatFollowers(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

export function formatPrice(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export type Filters = {
  city: string;
  locality: string;
  pincode: string;
  category: string;
  otherCategory?: string | undefined;
  followerRange: [number, number];
  budget: string;
  contentTypes: string[];
  collabType: string;
  language: string;
  travel: string;
  products: string;
};

export const EMPTY_FILTERS: Filters = {
  city: "",
  locality: "",
  pincode: "",
  category: "",
  otherCategory: "",
  followerRange: [500, 50000],
  budget: "",
  contentTypes: [],
  collabType: "",
  language: "",
  travel: "",
  products: "",
};

export function filterCreators(creators: Creator[], f: Filters) {
  return creators.filter((c) => {
    if (c.status !== "Active") return false;
    if (f.city && c.city !== f.city) return false;
    if (f.locality && !c.locality.toLowerCase().includes(f.locality.trim().toLowerCase()))
      return false;
    if (f.pincode && !c.pincode.startsWith(f.pincode.trim())) return false;
    if (f.category) {
      if (f.category === "Other") {
        if (f.otherCategory && f.otherCategory.trim()) {
          const query = f.otherCategory.trim().toLowerCase();
          const match =
            c.categories.some((cat) => cat.toLowerCase().includes(query)) ||
            c.about.toLowerCase().includes(query) ||
            c.categories.includes("Other");
          if (!match) return false;
        } else {
          if (!c.categories.includes("Other")) return false;
        }
      } else {
        if (!c.categories.includes(f.category)) return false;
      }
    }
    if (f.contentTypes.length && !f.contentTypes.some((x) => c.contentTypes.includes(x)))
      return false;
    if (f.language && !c.languages.includes(f.language)) return false;
    if (f.followerRange) {
      const [min, max] = f.followerRange;
      if (c.followers < min) return false;
      if (max < 50000 && c.followers > max) return false;
    }
    if (f.budget) {
      const band = BUDGET_BANDS.find((b) => b.label === f.budget);
      if (band && c.startingPrice > band.max) return false;
    }
    if (f.collabType) {
      if (
        f.collabType === "Both"
          ? c.collabType !== "Both"
          : !(c.collabType === f.collabType || c.collabType === "Both")
      )
        return false;
    }
    if (f.travel === "Travels for collaborations" && !c.travels) return false;
    if (f.travel === "Does not travel" && c.travels) return false;
    if (f.products === "Accepts products" && c.acceptsProducts !== "Yes") return false;
    if (f.products === "Doesn't accept products" && c.acceptsProducts !== "No") return false;
    if (f.products === "Depends" && c.acceptsProducts !== "Depends") return false;
    return true;
  });
}
