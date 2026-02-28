# Melodyx Architecture & App Flow

Melodyx is an Expo Router + React Native app for daily melody guessing, speed modes, learning drills, and UGC melody creation.

## Tech Stack
- Expo Router (`app/`) for file-based navigation
- React Native + TypeScript
- Context hooks via `@nkzw/create-context-hook`
- React Query for async state orchestration and cache updates
- AsyncStorage/SecureStore for local persistence
- `expo-av` / Web Audio for playback

## Runtime Architecture
### 1) App bootstrap
`app/_layout.tsx` initializes platform services before rendering:
- error tracking (`utils/errorTracking.ts`)
- glitch/performance engines (`utils/glitchFreeEngine.ts`, `utils/performanceOptimizer.ts`)
- system integration bus (`utils/systemIntegration.ts`)
- haptics and accessibility setup

### 2) Auth and navigation shell
`AuthGate` in `app/_layout.tsx` redirects based on auth state:
- unauthenticated users -> `/auth`
- authenticated users -> `/(tabs)`

Top-level stack includes tabs plus modal routes (`/modal`, `/privacy`).

### 3) Provider graph (state domains)
Root providers in `app/_layout.tsx` expose the always-on domains:
- Core: `Auth`, `User`, `Theme`, `Instrument`, `Purchases`
- Gameplay: `Game` (daily), `Fever`, `Duels`, `Events`
- Content/social: `Playlist`, `UserMelodies`, `TuneSnippet`, `SocialShare`, `Eco`

Screen-scoped providers are mounted inside feature routes (for example `LearningProvider` in `app/(tabs)/learning.tsx`, `TournamentProvider` in `tournaments.tsx`, and `WellnessProvider` in `wellness.tsx`).

Most contexts use the same pattern: React Query + AsyncStorage mutation/query pairs for durable local state.

## App Flow
### Auth -> Home
`app/auth.tsx` supports signup/signin/guest flows, password reset, and username availability checks.

### Home -> Daily Puzzle
`app/(tabs)/index.tsx` is the feature hub. Entering daily mode routes to `app/(tabs)/daily.tsx`, where:
- melody/puzzle data comes from `GameContext`
- guesses are evaluated by `utils/gameLogic.ts`
- audio playback uses `hooks/useAudio.ts` + snippet fallback logic (`utils/audioSnippets.ts`)
- completion updates streak/stats/rewards and enables share text generation

### Home -> Fever / Learning / Create
- `fever.tsx` runs an endless timed loop backed by `FeverContext` (chains, multipliers, rewards)
- `learning.tsx` runs lesson cycles backed by `LearningContext` (listen -> repeat -> feedback/coaching)
- `create.tsx` uses `UserMelodiesContext` + validation to compose, save, and share user-generated melodies

## Repository Map
- `app/`: routes/screens
- `contexts/`: domain state containers
- `hooks/`: reusable hooks (audio, storage, interaction)
- `utils/`: game logic, telemetry, sync, performance, integrations
- `constants/`: large static catalogs (songs, instruments, curricula, i18n)
- `components/`: shared UI widgets
- `__tests__/`: Jest tests (game logic, hooks, components)

## Local Development
- `bun i`
- `bun run start`
- `bun run start-web`
- `bun run lint`
- `npx tsc --noEmit`
- `npx jest --coverage`
