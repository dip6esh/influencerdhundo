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

export const GENDERS = [
  "Female",
  "Male",
  "Non-binary / Other",
  "Prefer not to say",
] as const;

export const TRAVEL_RANGES = [
  "Up to 2 km",
  "Up to 5 km",
  "Up to 10 km",
  "Up to 20 km",
  "Anywhere within my city",
] as const;

export const TURNAROUNDS = ["Same day", "1–2 days", "3–5 days", "5–7 days", "7+ days"] as const;

export const CITIES = [
  "Agartala",
  "Agra",
  "Ahmedabad",
  "Ajmer",
  "Akola",
  "Aligarh",
  "Amravati",
  "Amritsar",
  "Anand",
  "Asansol",
  "Aurangabad",
  "Bareilly",
  "Belagavi",
  "Bengaluru",
  "Bhagalpur",
  "Bharatpur",
  "Bhavnagar",
  "Bhilai",
  "Bhilwara",
  "Bhiwandi",
  "Bhopal",
  "Bhubaneswar",
  "Bikaner",
  "Bilaspur",
  "Bokaro",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Cuttack",
  "Dehradun",
  "Delhi",
  "Dhanbad",
  "Dharwad",
  "Durg",
  "Durgapur",
  "Erode",
  "Faridabad",
  "Firozabad",
  "Gandhinagar",
  "Gaya",
  "Ghaziabad",
  "Gorakhpur",
  "Greater Noida",
  "Guntur",
  "Gurugram",
  "Guwahati",
  "Gwalior",
  "Haldia",
  "Haridwar",
  "Hisar",
  "Hubballi",
  "Hyderabad",
  "Imphal",
  "Indore",
  "Jabalpur",
  "Jaipur",
  "Jalandhar",
  "Jammu",
  "Jamnagar",
  "Jamshedpur",
  "Jhansi",
  "Jodhpur",
  "Junagadh",
  "Kanpur",
  "Karnal",
  "Kochi",
  "Kolhapur",
  "Kollam",
  "Kota",
  "Kottayam",
  "Kozhikode",
  "Kurnool",
  "Latur",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Malegaon",
  "Mangaluru",
  "Mathura",
  "Meerut",
  "Mohali",
  "Moradabad",
  "Mumbai",
  "Muzaffarpur",
  "Mysuru",
  "Nadiad",
  "Nagercoil",
  "Nagpur",
  "Nanded",
  "Nashik",
  "Navi Mumbai",
  "Nellore",
  "Noida",
  "Panipat",
  "Patiala",
  "Patna",
  "Pimpri-Chinchwad",
  "Pondicherry",
  "Puducherry",
  "Pune",
  "Raipur",
  "Rajahmundry",
  "Rajkot",
  "Ranchi",
  "Ratlam",
  "Rohtak",
  "Rourkela",
  "Sagar",
  "Saharanpur",
  "Salem",
  "Sangli",
  "Satara",
  "Shillong",
  "Shimla",
  "Siliguri",
  "Solapur",
  "Srinagar",
  "Surat",
  "Thane",
  "Thanjavur",
  "Thiruvananthapuram",
  "Thrissur",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupati",
  "Tumakuru",
  "Udaipur",
  "Ujjain",
  "Vadodara",
  "Varanasi",
  "Vasai-Virar",
  "Vellore",
  "Vijayawada",
  "Visakhapatnam",
  "Warangal",
] as const;

export const STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
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

export function getSubscriptionDurationMs(planId?: string, duration?: string): number {
  if (planId === "trial-3d" || duration?.toLowerCase().includes("3 day")) {
    return 3 * 24 * 60 * 60 * 1000;
  }
  if (planId === "1m" || duration?.toLowerCase().includes("1 month")) {
    return 30 * 24 * 60 * 60 * 1000;
  }
  if (planId === "3m" || duration?.toLowerCase().includes("3 month")) {
    return 90 * 24 * 60 * 60 * 1000;
  }
  if (planId === "6m" || duration?.toLowerCase().includes("6 month")) {
    return 180 * 24 * 60 * 60 * 1000;
  }
  if (planId === "1y" || duration?.toLowerCase().includes("1 year")) {
    return 365 * 24 * 60 * 60 * 1000;
  }
  return 30 * 24 * 60 * 60 * 1000;
}

export type SubscriptionLike = {
  id?: string | undefined;
  creatorId: string;
  planId?: string | undefined;
  duration?: string | undefined;
  price?: number | undefined;
  startedAt: string;
  expiresAt?: string | undefined;
  isTrial?: boolean | undefined;
  referralCodeUsed?: string | undefined;
  isQueued?: boolean | undefined;
  status?: string | undefined;
};

export function getSubscriptionExpiry(sub: {
  planId?: string | undefined;
  duration?: string | undefined;
  startedAt: string;
  expiresAt?: string | undefined;
}): Date {
  if (sub.expiresAt) {
    const d = new Date(sub.expiresAt);
    if (!isNaN(d.getTime())) return d;
  }
  const started = new Date(sub.startedAt).getTime();
  const dur = getSubscriptionDurationMs(sub.planId, sub.duration);
  return new Date(started + dur);
}

export function isSubscriptionQueued(sub?: {
  startedAt?: string | undefined;
  isQueued?: boolean | undefined;
  status?: string | undefined;
}): boolean {
  if (!sub) return false;
  if (sub.isQueued || sub.status === "queued") return true;
  if (sub.startedAt && new Date(sub.startedAt).getTime() > Date.now()) return true;
  return false;
}

export function isSubscriptionActive(sub?: {
  planId?: string | undefined;
  duration?: string | undefined;
  startedAt: string;
  expiresAt?: string | undefined;
  isQueued?: boolean | undefined;
  status?: string | undefined;
}): boolean {
  if (!sub || !sub.startedAt) return false;
  if (isSubscriptionQueued(sub)) return false;
  const now = Date.now();
  const started = new Date(sub.startedAt).getTime();
  const expiry = getSubscriptionExpiry(sub).getTime();
  return now >= started && now < expiry;
}

export function getActiveSubscription<T extends SubscriptionLike>(
  subscriptions: T[],
  creatorId: string,
): T | undefined {
  const userSubs = subscriptions.filter((s) => s.creatorId === creatorId);
  // Find currently active subscription (started <= now < expiry and not queued)
  return userSubs.find((s) => isSubscriptionActive(s));
}

export function getQueuedSubscriptions<T extends SubscriptionLike>(
  subscriptions: T[],
  creatorId: string,
): T[] {
  return subscriptions
    .filter((s) => s.creatorId === creatorId && isSubscriptionQueued(s))
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
}

/** Generates a unique referral code for a creator based on their display name */
export function generateReferralCode(displayName: string): string {
  const initials = displayName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `DHUNDO-${initials}${rand}`;
}

/** Builds the full referral URL for sharing */
export function getReferralUrl(referralCode: string): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : "https://influencerdhundo.com";
  return `${base}/creator/register?ref=${encodeURIComponent(referralCode)}`;
}

/** Builds a WhatsApp share URL for the referral link */
export function getWhatsAppShareUrl(referralUrl: string, creatorName: string): string {
  const msg = encodeURIComponent(
    `Hey! I'm on Influencer Dhundo — a platform that connects local creators with local businesses. Create your free creator profile and start getting discovered!\n\nJoin using my link: ${referralUrl}`,
  );
  return `https://wa.me/?text=${msg}`;
}

/** Returns the subscription expiry date considering referral bonus days */
export function getEffectiveExpiry(
  sub: { planId?: string; duration?: string; startedAt: string } | undefined,
  subscriptionExpiresAt?: string | undefined,
  referralBonusDays?: number | undefined,
): Date | null {
  if (!sub && !subscriptionExpiresAt) return null;
  // If the DB has a stored expiry (with bonus days already baked in), use that
  if (subscriptionExpiresAt) {
    return new Date(subscriptionExpiresAt);
  }
  if (!sub) return null;
  const base = getSubscriptionExpiry(sub);
  const bonus = (referralBonusDays ?? 0) * 24 * 60 * 60 * 1000;
  return new Date(base.getTime() + bonus);
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
  gender?: (typeof GENDERS)[number] | string | undefined;
  contact: { phone: string; whatsapp: string; email: string };
  // Referral system
  referralCode?: string | undefined;
  referredBy?: string | undefined; // creator id of referrer
  trialStartedAt?: string | undefined;
  subscriptionExpiresAt?: string | undefined;
  referralBonusDays?: number | undefined;
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
    gender: "Female",
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
    gender: "Male",
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
    gender: "Female",
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
    gender: "Male",
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
    gender: "Female",
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
    gender: "Male",
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
    gender: "Female",
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
    gender: "Male",
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
  budgetRange: [number, number];
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
  budgetRange: [0, 50000],
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
    if (f.collabType !== "Barter" && f.budgetRange) {
      const [min, max] = f.budgetRange;
      if (c.startingPrice < min) return false;
      if (max < 50000 && c.startingPrice > max) return false;
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

/**
 * Normalizes an Instagram input string (which may be a username, @handle,
 * or full URL with query parameters/tracking strings) into a clean username.
 * Example inputs handled:
 * - "abeyarchit" -> "abeyarchit"
 * - "@abeyarchit" -> "abeyarchit"
 * - "https://www.instagram.com/abeyarchit?stkn=MW1yZDdwMGt6bjFnZA%3D%3D&utm_source=qr]" -> "abeyarchit"
 * - "https://instagram.com/abeyarchit/" -> "abeyarchit"
 * - "instagram.com/abeyarchit" -> "abeyarchit"
 */
export function normalizeInstagramHandle(input?: string | null): string {
  if (!input) return "";
  let clean = input.trim();
  // Strip enclosing quotes, brackets, parentheses, trailing punctuation
  clean = clean.replace(/^[@\s"'\(\[]+|[@\s"'\]\)\.,;]+$/g, "");

  if (!clean) return "";

  try {
    const urlCandidate =
      clean.startsWith("http://") || clean.startsWith("https://")
        ? clean
        : clean.includes("instagram.com")
          ? `https://${clean}`
          : "";

    if (urlCandidate) {
      const parsed = new URL(urlCandidate);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const firstSegment = segments[0];
      if (firstSegment) {
        const segment = firstSegment.replace(/^@/, "").trim();
        return segment.replace(/[^a-zA-Z0-9._]/g, "");
      }
    }
  } catch {
    const match = clean.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    const matchedHandle = match?.[1];
    if (matchedHandle) {
      return matchedHandle.replace(/[^a-zA-Z0-9._]/g, "");
    }
  }

  // If it's a simple handle or contains query strings
  const firstPart = clean.replace(/^@+/, "").split(/[?#/\s]/)[0] ?? "";
  return firstPart.replace(/[^a-zA-Z0-9._]/g, "");
}

/**
 * Returns a valid Instagram profile URL.
 */
export function getInstagramUrl(input?: string | null): string {
  const handle = normalizeInstagramHandle(input);
  return handle ? `https://www.instagram.com/${handle}/` : "https://www.instagram.com";
}

/**
 * Returns a formatted Instagram handle (e.g. "@username").
 */
export function formatInstagramHandle(input?: string | null): string {
  const handle = normalizeInstagramHandle(input);
  return handle ? `@${handle}` : "";
}

