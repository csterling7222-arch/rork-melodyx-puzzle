# Melodyx Puzzle

Melodyx Puzzle is a cross‑platform, audio‑first puzzle game built with React Native + Expo Router. Players guess daily melodies, use audio hints, and explore multiple game modes (daily, campaigns, tournaments, wellness, etc.). The app is optimized for offline play, rapid navigation, and a premium IAP model.

## Quick Start
```bash
bun i
bun run start         # native dev server (Rork tunnel)
bun run start-web     # web preview
bun run start-web-dev # web preview w/ Expo debug logs
bun run lint          # ESLint via Expo
npx tsc --noEmit      # typecheck
npx jest              # tests
```

## Project Structure
```
app/                  # Expo Router screens and layouts
  (tabs)/             # Tabbed navigation screens
components/           # UI components and modals
contexts/             # App state providers (game, auth, purchases, etc.)
hooks/                # Reusable hooks
utils/                # Shared utilities (audio, error tracking, validation)
assets/               # Images and icons
__tests__/            # Jest tests
```

## Architecture Overview
### Navigation
- **Expo Router** drives file‑based routing.
- `app/_layout.tsx` sets up the provider tree and the auth gate.
- `app/(tabs)/` contains main app tabs, plus `app/modal.tsx` and `app/auth.tsx` for overlays and authentication.

### State & Data Flow
- **React Query** is used throughout contexts for async state and caching.
- **AsyncStorage** persists local app state (streaks, cached content, share queues).
- **SecureStore** is used in `AuthContext` for sensitive auth data.

### Core Domain Providers (contexts/)
- **GameContext**: central game state and progression.
- **UserMelodiesContext**: per‑user progress and puzzle history.
- **LearningContext / AdvancedLearningContext**: learning flow and lesson data.
- **Fever / Eco / Wellness / Tournament / Duels / Events**: mode‑specific state.
- **AuthContext / UserContext**: auth state and user profile data.
- **PurchasesContext**: RevenueCat IAPs, subscription status, and restore flow.
- **SocialShareContext**: share payloads, offline queueing, and analytics.
- **ThemeContext / InstrumentContext / PlaylistContext / TuneSnippetContext**: UI themes, instruments, playlists, and audio playback control.

### Audio Pipeline
- `utils/audioSnippets.ts` and `TuneSnippetContext` manage playback, caching, and hint snippets.
- `utils/audioLock.ts` gates audio to avoid overlapping playback.
- Expo Audio/AV is used for playback and snippet management.

### Error Tracking & Performance
- `utils/errorTracking.ts` collects crash events, performance metrics, and local bug reports.
- `components/ErrorBoundary.tsx` prevents hard crashes during runtime.
- `components/PerformanceMonitor.tsx` can surface runtime metrics in dev.

## Configuration
- **App manifest**: `app.json` (name, icons, permissions, iOS/Android settings).
- **Environment variables**:
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` (optional)
  - `EXPO_PUBLIC_RORK_API_BASE_URL` (error tracking endpoint)
- **Rork project ID**: embedded in `package.json` scripts (`bunx rork start -p ...`).

## Store Submission Notes (Common Blockers)
These are the most likely manifest‑related review issues for this project:
- **Manifest alignment**:
  - Keep bundle ID and package name consistent across `app.json`, App Store Connect, and Play Console.
- **Permissions**:
  - Only request what the app actually uses. This app uses haptics (`VIBRATE`) and audio playback only.
- **Privacy & Terms**:
  - In‑app links point to `https://melodyx.app/privacy` and `/terms` (see `app/modal.tsx`, `app/auth.tsx`). Ensure these are live and accurate.
- **IAP setup**:
  - Product IDs must match RevenueCat configuration (see `docs/DEPLOYMENT_GUIDE.md`).

For a full checklist, see `docs/DEPLOYMENT_GUIDE.md`.

## Testing
- Jest config in `jest.config.js` with `jest-expo` preset.
- Tests live under `__tests__/` and use `*.test.ts(x)` naming.
- Coverage thresholds: 50% global minimum for branches, functions, lines, and statements.

## Contributing
- Use `@/` import alias for repo‑root paths.
- Keep components in `PascalCase`, hooks in `useCamelCase`, and utilities in `camelCase`.
- Pre‑commit runs `lint-staged` and `tsc --noEmit`; pre‑push runs tests.
