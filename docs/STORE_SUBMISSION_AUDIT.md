# Store Submission Audit

Date: 2026-02-10

## Summary
This audit focuses on manifest/permission accuracy, metadata consistency, and common App Store / Play Console blockers. I removed unused permissions and cleaned metadata references to features that do not exist in the current codebase.

## Changes Applied
- `app.json`
  - Removed iOS microphone usage, background audio mode, Face ID usage, and Wi‑Fi info entitlement.
  - Removed Android `RECORD_AUDIO` permission.
  - Simplified Expo plugin configs to avoid microphone/biometric prompts.
- `README.md`, `docs/LAUNCH_CHECKLIST.md`, `docs/DEPLOYMENT_GUIDE.md`, `constants/storeMetadata.ts`
  - Removed references to microphone/AR/Health features not present in code.
  - Clarified that carbon offsets are in‑game points (not real‑money donations).
  - Added guidance to keep bundle/package IDs consistent with `app.json` and store listings.

## High‑Risk Review Blockers (Verify)
1. Bundle ID / Package Name mismatch
   - `app.json` uses `app.christophersterling.melodyx` (iOS/Android).
   - Some docs previously referenced `app.melodyx.puzzle`.
   - Confirm App Store Connect / Play Console use the same identifiers as `app.json`.

2. IAP product mismatch
   - `contexts/PurchasesContext.tsx` declares many product IDs (e.g., `melodyx_premium_monthly`, `melodyx_hints_5`, `melodyx_skin_collector`).
   - Ensure every product referenced in the app exists in App Store Connect/Play Console and RevenueCat, or hide/remove unused packages from the UI.

3. Privacy policy and terms links
   - The app links to `https://melodyx.app/privacy` and `/terms`.
   - Verify these are live, accurate, and match App Privacy disclosures.

4. App Privacy disclosures
   - The code tracks analytics and crash data in `utils/errorTracking.ts` and can send to a remote endpoint if `EXPO_PUBLIC_RORK_API_BASE_URL` is set.
   - If the endpoint is configured in production, declare **Diagnostics** and **Usage Data** in App Privacy.

## Additional Recommendations
- App Review Notes: include that no login is required for core gameplay and that Restore Purchases is available in the Shop tab.
- If iPad support is not intended, keep `supportsTablet: false` and ensure screenshots match iPhone‑only.
- Avoid listing features in store metadata that are not in the shipped build.

## Next Steps
- Provide the exact rejection message (or screenshots) for targeted fixes.
- Confirm the intended bundle/package identifiers.
- Validate the RevenueCat offering configuration against the product IDs used in `contexts/PurchasesContext.tsx`.
