This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Fitli scope and product rules

- English UI, left-to-right, dark "Night Hustle" original street-game theme (tokens in `src/theme.ts`; Bebas Neue for display, Heebo for body). Keep it original: no copied logos, fonts, art or catchphrases from existing games. Users may type food names in Hebrew, so text inputs use `writingDirection: 'auto'`. Never revert the UI to Hebrew/RTL.
- Game layer (`src/domain/gamification.ts`): XP, levels, streaks with a weekly shield and daily quests are DERIVED from real logs, never stored. Reward consistency, never punish; no shame language.
- Plans saved before the English redesign contain Hebrew titles. Render stored plan text through `legacyText()`; never rewrite saved plan versions.
- Secrets: never put API keys in code or the repo. Keys live only in Cloudflare Worker secrets; `.env*` is git-ignored and unreadable to Claude.
- Scope so far: one local profile per installation, stable profile ID, migration, personal planning estimates and meal/workout journals. No cloud, AI, food photos or health connectors yet.
- Keep user data separate from clearly labeled meal/workout examples. Missing measurements are null, never zero.
- Only comparable recorded circumferences may change the original human 2D avatar. Keep pose and scale fixed, compare limb sides and waist protocols, and show “Stylised illustration based on your data”. RFM is allowed only as a documented estimate with appropriate inputs and a confirmed NHANES waist protocol. Never invent fat percentage or muscle mass.
- Preserve the v1 snapshot in a backup before migrating to schema 2. Never replace missing sex/physiology with avatar choices. Never reset a corrupt or unreadable save. Keep daily targets and plan versions immutable once assigned; planned meals/workouts are never actual logs.
- Preserve font scaling, safe areas, screen-reader labels, 48-point touch targets and system/app reduced motion. Do not shame body changes.
- Run typecheck, lint and meaningful domain/storage tests. Native bundle export and browser QA are not device testing; document actual test surfaces honestly.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
