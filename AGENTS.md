# AGENTS.md

Freediving & CO2 Tables is an Expo / React Native app. iOS is the shipping target. Web is unsupported — do not debug or "fix" web bundle failures.

## Commands

```bash
npm run dev          # Metro with APP_VARIANT=development
npm run ios          # Native iOS build
npm run lint
npm run typecheck
npx drizzle-kit generate
```

Start Metro non-interactively with `CI=1 npm run dev`. To check the iOS bundle without a simulator, export with `npx expo export --platform ios`.

## Layout

- `app/` — Expo Router screens. Root layout runs SQLite migrations.
- `components/` — one component per file, styled with `styled-components/native`.
- `design/styles.ts` — color and font-size tokens.
- `db/` — Drizzle schema and SQL operations.
- `providers/` — SQL, formatter, warning modal, and RevenueCat subscription.
- `hooks/` — screen logic that is more than a short handler.

Do not copy API keys, EAS project ids, or bundle identifiers from other apps.
