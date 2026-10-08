# Freediving & CO2 Tables

Expo React Native app for CO2 and O2 static-apnea tables. iOS is the shipping target. Sessions stay in an on-device SQLite database.

The project layout follows the same core stack as The Climber's Journal: Expo Router, `styled-components/native`, Drizzle, and RevenueCat.

## Get started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and add a RevenueCat iOS key when you have one:

```bash
cp .env.example .env.local
```

3. Build a development client (native modules such as SQLite and RevenueCat are not available in Expo Go):

```bash
npx expo run:ios
```

4. Later starts:

```bash
npm run dev
```

## Stack

- Expo 54, React Native 0.81, React 19, new architecture
- File-based navigation with Expo Router
- Styles in `styled-components/native`, tokens in `design/styles.ts`
- Drizzle ORM on `expo-sqlite`
- RevenueCat via `react-native-purchases` (`lifetime_access` entitlement)

## Database

Schema lives in `db/schema.ts`. Reads, inserts, updates, and deletes are split across `db/queries.ts`, `db/inserts.ts`, `db/updates.ts`, and `db/deletions.ts`.

After a schema change:

```bash
npx drizzle-kit generate
```

Migrations run on launch from `app/_layout.tsx`. In a dev client, press Shift+M and open `expo-drizzle-studio-plugin` to inspect the database.

## Purchases

Set `REVENUECAT_IOS_API_KEY` in `.env.local` or as an EAS secret. The app looks for a `lifetime_access` entitlement. The first 10 logged tables are free.

## Releases

```bash
eas build --platform ios --profile development
eas build --platform ios --profile production
eas submit --platform ios
```

Link an EAS project before the first cloud build (`npx eas init`). Do not reuse another app's EAS project id or App Store id.
