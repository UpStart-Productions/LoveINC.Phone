# Love INC: Client vs volunteer onboarding rule (product-specific)

## Read this before “fixing” volunteer or client flows

**This behavior is intentional for the Love INC app only.** It is **not** a general rule for nonprofits, GrovLink, or other white-label apps.

If something “doesn’t work” for a user who chose **Get Help** (client path)—for example, no volunteer handshake icon on cards, no **Volunteer** button on a detail screen, or the volunteer signup sheet never opening—**check onboarding first.** The app may be doing exactly what Love INC asked for. Spending time “debugging” without reading this doc often wastes effort.

---

## Business rule (Love INC)

- During onboarding, **Get Help** and **Volunteer** are **mutually exclusive** (a person picks one primary path, not both).
- **Give** can be combined with either path (same as onboarding step 2).
- **Just exploring** is a separate skip-style path.

This is enforced in UI during onboarding and mirrored in **Developer Options → Onboarding selections** (checkboxes).

---

## Stored data

- Selections live in onboarding storage (`OnboardingService`: `loveinc_onboarding_data` → `selectedOptions` string array).
- Canonical IDs: `get-help`, `volunteer`, `give`, `exploring`.

Helper methods (see `src/app/services/onboarding.service.ts`):

| Method | Meaning |
|--------|--------|
| `selectedGetHelpOnboarding()` | User chose **Get Help** → treated as **client** for app policy. |
| `canShowVolunteerRequestUi()` | `false` when `selectedGetHelpOnboarding()` is true—volunteer **signup/request** UI is hidden for clients. |

---

## What the app hides or blocks for **clients** (Get Help)

These are **by design**, not bugs:

1. **Volunteer request / signup flow**  
   - `VolunteerActionSheetService.openVolunteerActionSheet()` returns immediately if `!canShowVolunteerRequestUi()`.  
   - Central choke point so the volunteer modal cannot open for clients even if something calls the service by mistake.

2. **Volunteer icons on cards** (e.g. `heart-handshake` action)  
   - Hidden when `!canShowVolunteerRequestUi()` on: Home feed, Gap Ministries, Transformational Classes, Donate Goods, Updates.

3. **Content detail**  
   - **Volunteer** primary buttons (volunteer CTA + volunteer-position detail) hidden via `showVolunteerRequestActions` when user is on the client path.

4. **Profile → Service Access (QR intake)**  
   - Shown only when `selectedGetHelpOnboarding()` (clients who need intake), not for volunteer-only / give-only / exploring.

5. **Gap Ministries phone** (separate policy)  
   - Clients may need intake unlock to dial providers directly; non–Get Help users are not restricted the same way (see `gap-ministries.page.ts`).

---

## What stays available to **everyone** (including clients)

- **More → Open Volunteer Positions** (browse list). Love INC wanted browsing to remain possible as motivation to transition roles later.
- Clients can open read-only-style detail from that list; **signup** actions remain gated as above.

---

## Onboarding UI enforcement

- `src/app/onboarding/onboarding-step2.page.ts`: toggling **Get Help** clears **Volunteer** and vice versa.

---

## Forking or reusing this codebase

If you build another nonprofit app:

- **Do not assume** clients and volunteers are mutually exclusive.
- **Do not assume** volunteer signup must be hidden for “clients.”
- Either remove the gates, replace them with your org’s rules, or gate on a different signal (e.g. CRM role from API instead of onboarding checkboxes).

When in doubt, search the codebase for:

- `canShowVolunteerRequestUi`
- `selectedGetHelpOnboarding`
- `VolunteerActionSheetService`
- `showVolunteerRequestActions`
- `showServiceAccessSection` (Profile)

---

## Last updated

Document reflects Love INC app behavior as implemented in-repo; update this file when product rules change.
