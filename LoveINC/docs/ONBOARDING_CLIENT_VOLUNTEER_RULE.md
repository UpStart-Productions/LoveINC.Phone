# Love INC: App access model (post–role onboarding)

## Summary

The app no longer asks users to choose Get Help / Volunteer / Give at onboarding.

- **First launch:** Welcome splash only → Home (never shown again after Next).
- **Everyone** sees the same Home, volunteer CTAs, give CTAs, and browse flows.
- **Provider contact** (phone/email on Gap providers) requires **intake QR unlock** for all users — same org-level QR for clients and volunteers.
- **Gap Ministries** shows full cards for everyone; contact actions stay hidden until unlock.
- **Volunteer signup** requires affirming: *"I am not currently receiving services from Love INC."*
- **Request Help** (`/assistance/*`) is unchanged.

## Provider contact access

- Stored locally via `ServiceUnlockService` (SQLite) after successful `intake/validate` API call.
- Also reflected from API `intakeCompleted` on app user profile.
- `GapAccessService.hasProviderContactAccess` is the single gate for contact visibility and class intake registration.

## Removed

- Onboarding step 2 (role selection) and step 3 (name/email/newsletter).
- Profile and Developer Options “I am a…” role checkboxes.
- All UI branching on `selectedOptions` / client vs volunteer paths.

## Developer testing

- **Developer Options → Reset welcome splash** — shows welcome again on next launch.
- **`window.clearOnboarding()`** on Home (dev) — same effect.

## Last updated

Reflects welcome-only onboarding and permission-based provider contact gating.
