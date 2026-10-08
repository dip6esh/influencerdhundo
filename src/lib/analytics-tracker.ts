import { supabase } from "./supabase";

export interface GeoLocationInfo {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  ipMasked?: string;
}

const GEO_CACHE_KEY = "cc_geo_cache_v1";
const SESSION_ID_KEY = "cc_session_id_v1";

/** Get or create an anonymous session ID for this browser session */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `s_${Date.now()}`;
  }
}

/** Detect human-friendly referrer source (Instagram, WhatsApp, Google, Direct, etc.) */
export function detectReferrerSource(referrerStr: string): string {
  if (!referrerStr || referrerStr.trim() === "") {
    // Check if user agent indicates in-app browser like Instagram or WhatsApp
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      if (ua.includes("Instagram")) return "Instagram (In-App)";
      if (ua.includes("WhatsApp")) return "WhatsApp (In-App)";
      if (ua.includes("FBAN") || ua.includes("FBAV")) return "Facebook (In-App)";
    }
    return "Direct";
  }

  const ref = referrerStr.toLowerCase();
  if (ref.includes("instagram.com") || ref.includes("ig_")) return "Instagram";
  if (ref.includes("whatsapp") || ref.includes("wa.me")) return "WhatsApp";
  if (ref.includes("google.") || ref.includes("google.co")) return "Google Search";
  if (ref.includes("facebook.com") || ref.includes("fb.me") || ref.includes("m.facebook.com")) return "Facebook";
  if (ref.includes("youtube.com") || ref.includes("youtu.be")) return "YouTube";
  if (ref.includes("twitter.com") || ref.includes("x.com") || ref.includes("t.co")) return "Twitter / X";
  if (ref.includes("linkedin.com") || ref.includes("lnkd.in")) return "LinkedIn";
  if (ref.includes("bing.com")) return "Bing";
  if (ref.includes("yahoo.com")) return "Yahoo";
  if (ref.includes("threads.net")) return "Threads";
  if (ref.includes("pinterest.com")) return "Pinterest";

  try {
    const url = new URL(referrerStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "External Link";
  }
}

/** Parse device type, OS, and browser from userAgent */
export function detectDeviceInfo() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceType: "Desktop" as const,
      os: "Other",
      browser: "Other",
      screenResolution: "Unknown",
    };
  }

  const ua = navigator.userAgent || "";
  const screenResolution = `${window.screen?.width || 0}x${window.screen?.height || 0}`;

  // Device Type
  let deviceType: "Mobile" | "Tablet" | "Desktop" = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "Tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua,
    )
  ) {
    deviceType = "Mobile";
  }

  // OS
  let os = "Other";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";

  // Browser
  let browser = "Other";
  if (ua.includes("Instagram")) browser = "Instagram In-App";
  else if (ua.includes("WhatsApp")) browser = "WhatsApp In-App";
  else if (ua.includes("FBAN") || ua.includes("FBAV")) browser = "Facebook In-App";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser/")) browser = "Samsung Internet";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  return { deviceType, os, browser, screenResolution };
}

/** Lightweight anonymous geolocation fetching (cached per session) */
let geoFetchPromise: Promise<GeoLocationInfo> | null = null;

export async function getVisitorGeo(): Promise<GeoLocationInfo> {
  if (typeof window === "undefined") {
    return { city: "Unknown", region: "Unknown", country: "India", countryCode: "IN" };
  }

  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as GeoLocationInfo;
    }
  } catch {
    // sessionStorage not available
  }

  if (geoFetchPromise) {
    return geoFetchPromise;
  }

  geoFetchPromise = (async (): Promise<GeoLocationInfo> => {
    // Primary lookup: ipwho.is (fast, free, CORS-enabled, reliable for Indian cities)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch("https://ipwho.is/", {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          const ipRaw = typeof data.ip === "string" ? data.ip : "";
          const ipMasked = ipRaw ? ipRaw.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, "$1.$2.xx.xx") : undefined;

          const geo: GeoLocationInfo = {
            city: data.city || "Unknown City",
            region: data.region || data.region_code || "Unknown Region",
            country: data.country || "India",
            countryCode: data.country_code || "IN",
            ipMasked,
          };
          try {
            sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
          } catch {}
          return geo;
        }
      }
    } catch {
      // Fallback below
    }

    // Secondary fallback: ipapi.co
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const ipRaw = typeof data.ip === "string" ? data.ip : "";
        const ipMasked = ipRaw ? ipRaw.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, "$1.$2.xx.xx") : undefined;

        const geo: GeoLocationInfo = {
          city: data.city || "Unknown City",
          region: data.region || "Unknown Region",
          country: data.country_name || "India",
          countryCode: data.country_code || "IN",
          ipMasked,
        };
        try {
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
        } catch {}
        return geo;
      }
    } catch {
      // Ignore network errors or ad-blockers
    }

    // Default safe fallback
    const fallback: GeoLocationInfo = {
      city: "Unknown City",
      region: "Unknown Region",
      country: "India",
      countryCode: "IN",
    };
    try {
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(fallback));
    } catch {}
    return fallback;
  })();

  return geoFetchPromise;
}

// Memory throttle cache to avoid duplicate trackings on hot re-renders
let lastTrackedPath = "";
let lastTrackedTime = 0;

/**
 * Non-blocking page visit recorder
 */
export function trackPageView(
  path: string,
  extra?: {
    creatorId?: string;
    creatorName?: string;
    overrideReferrer?: string;
  },
) {
  if (typeof window === "undefined") return;

  // Don't track admin pages to keep analytics pure and clean
  if (path.startsWith("/admin") || path.startsWith("/admin/")) return;

  // Debounce duplicate tracking on the same path within 2.5 seconds
  const now = Date.now();
  if (path === lastTrackedPath && now - lastTrackedTime < 2500) {
    return;
  }
  lastTrackedPath = path;
  lastTrackedTime = now;

  // Execute asynchronously in background without blocking page render
  setTimeout(async () => {
    try {
      const sessionId = getSessionId();
      const geo = await getVisitorGeo();
      const device = detectDeviceInfo();
      const referrer = extra?.overrideReferrer ?? (document.referrer || "");
      const referrerSource = detectReferrerSource(referrer);
      const fullUrl = window.location.href;

      await supabase.from("website_visits").insert({
        session_id: sessionId,
        path: path,
        full_url: fullUrl,
        referrer: referrer ? referrer.slice(0, 500) : null,
        referrer_source: referrerSource,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        country_code: geo.countryCode,
        ip_masked: geo.ipMasked || null,
        device_type: device.deviceType,
        browser: device.browser,
        os: device.os,
        screen_resolution: device.screenResolution,
        creator_id: extra?.creatorId || null,
        creator_name: extra?.creatorName || null,
      });
    } catch (err) {
      // Silently catch tracking errors so visitor experience is never disrupted
      console.debug("Analytics visit logging skipped:", err);
    }
  }, 100);
}
