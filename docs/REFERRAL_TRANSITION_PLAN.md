# Referral Program Transition & Grandfathering Plan

## Overview
This document outlines the phased strategy for the **Influencer Dhundo Creator Referral Program**. It defines how we handle partner influencers during the initial bootstrap ("chicken-and-egg") phase and how we will transition to a **paid-only referral policy** without disrupting early supporters.

---

## 1. Context & Business Strategy

### The Bootstrap Phase ("Chicken-and-Egg")
- **Goal:** Rapidly onboard supply-side creators across target niches and locations.
- **Tactic:** Admin issues 100% OFF promotional codes (e.g., custom codes for individual influencers or campaigns) so creators join at ₹0 without payment barriers.
- **Referral Behavior:** All onboarded partner influencers automatically receive an active referral link and code in their Creator Dashboard. This enables them to invite creator friends, driving organic word-of-mouth growth.

### The Future Monetization / Quality Phase
- **Goal:** Protect unit economics, prevent coupon abuse, and ensure referral rewards (+7 bonus days) are driven by real revenue-generating subscribers.
- **Rule:** Referral program access in the dashboard will be restricted to creators who purchase a standard paid pass (or use an offer code with $\le 30\%$ discount).
- **Core Dilemma:** What happens to the early influencers who were onboarded for free with 100% OFF codes?

---

## 2. Selected Policy: Solution 1 ("On-Demand Grandfathering Cutoff")

Instead of guessing an arbitrary future date before solving the supply problem:
1. **No date is fixed in advance.** The bootstrap phase runs for as long as needed (whether 2 months or 1 year) until marketplace liquidity is achieved.
2. **On the exact day leadership decides critical mass has been reached**, that date becomes the **Grandfathering Cutoff Date** (`REFERRAL_GRANDFATHER_CUTOFF`).
3. **All early partner influencers registered on or before that date** keep their referral code unlocked permanently as **Founding Creators**.
4. **All new creators who register after that date** must hold an active paid subscription (discount $\le 30\%$) to unlock a referral link.

---

## 3. Technical Implementation Specification

### A. Current System State
In [`creator.dashboard.tsx`](file:///d:/Coding/Influencer%20Dundho/creator-connect-main/creator-connect-main/src/routes/creator.dashboard.tsx):
- Referral unlock logic currently:
  ```ts
  const isReferralUnlocked = (subActive && !isTrial) || hasPaidQueued;
  ```
- Every creator record already contains a permanent timestamp:
  - `creator.createdAt` (ISO 8601 string in Supabase).
- Every subscription already stores:
  - `sub.price` (0 for 100% off passes, >0 for paid passes).
  - `sub.referralCodeUsed` (the coupon code redeemed).

### B. Changes to Apply on the Cutoff Date

When you are ready to flip the switch, apply the following updates:

#### 1. Define the Cutoff in Configuration / Environment
In `src/lib/directory-data.ts` (or environment config):
```ts
// Set to the ISO date on the day the transition goes live:
export const REFERRAL_GRANDFATHER_CUTOFF = "2026-XX-XXT00:00:00.000Z";
```

#### 2. Update Referral Eligibility in `creator.dashboard.tsx`
Replace the referral unlock logic with:

```ts
// Calculate if user is a grandfathered founding creator
const isFoundingCreator = Boolean(
  mine?.createdAt && 
  new Date(mine.createdAt).getTime() <= new Date(REFERRAL_GRANDFATHER_CUTOFF).getTime()
);

// Calculate effective discount on current/active plan
const originalPlanPrice = currentSub?.planId 
  ? (PLANS.find(p => p.id === currentSub.planId)?.price ?? 0)
  : 0;

const pricePaid = currentSub?.price ?? 0;

const effectiveDiscountPercent = originalPlanPrice > 0
  ? Math.round(((originalPlanPrice - pricePaid) / originalPlanPrice) * 100)
  : (pricePaid === 0 ? 100 : 0);

// Paid subscription with acceptable discount (<= 30% off)
const hasEligiblePaidPlan = 
  subActive && 
  !isTrial && 
  pricePaid > 0 && 
  effectiveDiscountPercent <= 30;

// Referral is unlocked if user is a founding partner OR holds an eligible paid pass
const isReferralUnlocked = isFoundingCreator || hasEligiblePaidPlan;
```

#### 3. Dashboard UI Messaging for Ineligible Creators (Post-Cutoff)
For creators who join **after** the cutoff date and use a $>30\%$ discount or ₹0 pass:
- The referral section will display a locked state with clear messaging:
  > **Referral Program Unlocks on Standard Memberships ⚡**  
  > *Referral rewards and invite links are reserved for standard membership passes (discounts up to 30%). Upgrade or renew at the standard rate to unlock your referral link and earn +7 free days for every friend!*
- Button: **[Upgrade / View Plans]** linking to `/creator/plans`.

---

## 4. Operational Checklist for Later (When Ready to Transition)

- [ ] **Step 1:** Confirm team consensus that the marketplace has reached sufficient creator density.
- [ ] **Step 2:** Note the transition date/time (e.g. `2026-12-01T00:00:00Z`).
- [ ] **Step 3:** Set `REFERRAL_GRANDFATHER_CUTOFF` to that timestamp.
- [ ] **Step 4:** Deploy the update.
- [ ] **Step 5:** Verify in staging/production:
  - An existing test partner creator (created before the cutoff) still has their referral code active.
  - A new test creator created after the cutoff with a 100% OFF or >30% OFF pass sees the locked upgrade banner.
  - A new test creator created after the cutoff who pays full price or has $\le 30\%$ discount sees their referral code unlocked.

---

## 5. Summary Table

| Creator Type | Onboarding Period | Plan Used | Referral Program Access |
| :--- | :--- | :--- | :--- |
| **Partner Influencer** | Before Cutoff | 100% OFF Pass (₹0) | ✅ **Unlocked Forever (Founding Partner)** |
| **Early Organic User** | Before Cutoff | 100% Promo Code | ✅ **Unlocked Forever (Grandfathered)** |
| **New Creator** | After Cutoff | 100% Promo Code (₹0) | 🔒 **Locked** (Prompt to upgrade) |
| **New Creator** | After Cutoff | > 30% Promo Code | 🔒 **Locked** (Prompt to upgrade at standard price) |
| **New Creator** | After Cutoff | Full Price or $\le 30\%$ Off | ✅ **Unlocked** |
