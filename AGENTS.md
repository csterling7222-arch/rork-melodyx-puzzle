# Repository Guidelines

## Project Structure & Module Organization
Melodyx is an Expo Router + React Native TypeScript app. Keep feature code close to these folders:
- `app/`: route files and screen entry points (`app/(tabs)/*`, `app/_layout.tsx`).
- `components/`: reusable UI units in PascalCase files (for example, `GuessGrid.tsx`).
- `contexts/`: global/shared state providers.
- `hooks/`: custom hooks prefixed with `use`.
- `utils/` and `constants/`: pure logic, helpers, and static data.
- `__tests__/`: Jest unit/component tests.
- `assets/images/`: app icons and static media.

## Build, Test, and Development Commands
- `bun i`: install dependencies.
- `bun run start`: start Expo dev server (native).
- `bun run start-web`: start web preview.
- `bun run lint`: run Expo/ESLint checks.
- `npx tsc --noEmit`: strict TypeScript type check.
- `npx jest`: run all tests.
- `npx jest --coverage`: run tests with coverage report.

Husky hooks run checks automatically: pre-commit runs lint-staged + typecheck; pre-push runs tests.

## Coding Style & Naming Conventions
Use TypeScript-first, functional React components, and hooks. Follow existing conventions:
- Indentation: 2 spaces; keep imports and props readable.
- Components/types: `PascalCase`; hooks/utils/functions: `camelCase`; constants: `SCREAMING_SNAKE_CASE` for fixed values.
- Avoid `any`; prefer explicit types for state and function inputs/outputs.
- Use `eslint` + `prettier` via lint-staged on staged `*.ts`, `*.tsx`, `*.json`, and `*.md` files.

## Testing Guidelines
Jest (`jest-expo`) is the test framework. Place tests in `__tests__/` with `*.test.ts` or `*.test.tsx` naming. Prioritize tests for `utils/`, `hooks/`, `components/`, and `contexts/`.

Coverage thresholds are enforced globally at 50% for branches, functions, lines, and statements.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects (mostly `Fix ...`). Keep commits focused and descriptive (for example, `Fix note scrolling on mobile`).

For PRs:
- Explain what changed and why.
- Link related issues.
- Include screenshots/video for UI updates.
- Confirm lint, typecheck, and tests pass locally.
