# Phase 1 setup and verification

Use the same free Supabase, Vercel Hobby, standard GitHub runners and bundled Capacitor app as Phase 0. `docs/PHASE_0_SETUP.md` is historical: do not use its administrative provisioning example for Phase 1 pairing.

## Public client configuration

Web: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel and ignored local env. APK CI: existing `SUPABASE_URL` / `SUPABASE_ANON_KEY` repository variables passed as public VITE values. Publishable/anon only; never service_role. The fallback project form accepts public configuration if build-time values are absent.

## Database

For a fresh local project: `supabase start`, `supabase test db`, then `node scripts/test-pairing-concurrency.mjs` (local CI Docker container only). Docker/CLI are required; hosted SQL Editor is not a substitute for concurrent sessions.

The current hosted project already has the foundation and Phase 1 additive migration. Before later CLI migration work, authenticate/link using normal Supabase CLI authorization, inspect `supabase migration list`, compare the actual installed schema against tracked migrations, and repair **only verified applied versions** using `supabase migration repair --status applied 20261002000100 20261002000200`. Recheck the list before `db push`. Do not reset the live project or replay these migrations. No token extraction from the browser or administrative key in client code.

Rollback-only dashboard verification:

```powershell
node scripts/prepare-hosted-db-test.mjs phase1
node scripts/prepare-hosted-db-test.mjs phase1_realtime
```

Clear the SQL editor completely before pasting the generated ignored `.cache/*-hosted-rls.sql`. Each hidden assertion failure raises an exception. Success grids show 42 and six passed checks. Fixtures roll back; verify original counts afterward. These checks do not prove real phone messaging or movement.

## Account and couple flow

Private-testing choice: email provider enabled, signup enabled, email confirmation disabled, anonymous sign-in disabled. Users enter their own passwords. Create account → Create couple → share invite link/code → partner signs in/registers and joins → Home. Invites expire after seven DB-clock days and can be used once. New invite rotates a pending invitation; Cancel invite archives an unjoined home. Active couples cannot be removed by this Phase 1 action.

Confirmed legacy test accounts keep their original membership. They can sign in and enter their backfilled room directly. Password-reset email/free custom SMTP and full unlink/delete/export are not included in this private Phase 1 build.

## Browser and Android

`pnpm dev` for local development; `pnpm build`, `pnpm android:sync` for bundled native assets/plugins. CI builds with Java 21 / SDK 36 / build-tools 36.0.0. APK package `com.pawandus.app`, version 0.1.0/code 2, minimum SDK 24, sensorLandscape, backup disabled. No stores, custom domain or paid runner. Debug artifacts expire after three days; keep the verified local APK copy. New CI debug certificate can require uninstalling the previous debug app before replacement.

The root URL opens the game/account flow. `?invite=CODE` retains pairing through sign-in; `?probe=1` opens the preserved Phase 0 infrastructure diagnostic. The full house is Phase 2.

## Required real-device check

Sign in as the two existing partner users on web and the replacement APK. Walk both directions; partner must see motion and final stopped positions. Check walls/furniture, joystick, Settings/scrolling, reconnect, then leave the phone with Home for 30 seconds and return. Movement and Presence must recover; a subsequent idle minute must send no motion. Also verify newest-device takeover if the same user is opened in another tab. Record actual observations in PHASE_1_STATUS.md; never substitute mocked/SQL checks for the real two-device DoD.
