# Phase 0 infrastructure hello-world

Scope: a lazy Phaser 3 test canvas and a manually triggered private Supabase Broadcast between the browser and a bundled Capacitor Android debug shell. No gameplay or Phase 1 signup/pairing. Approved game visuals remain in DESIGN.md.

## Local web

Node 22.14+ and pnpm 11.19.0:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

The canvas works without a backend. For ping testing, copy `apps/web/.env.example` to `apps/web/.env.local` and supply only the public project URL and anon/publishable key, or enter those public values in the spike's setup form. Runtime public configuration is saved per device; secrets are rejected. Never put an administrative secret in any `VITE_` variable. CI builds without cloud credentials and tests empty/error setup states.

Browser checks: `pnpm exec playwright install chromium`, then `pnpm test:e2e`. On this Windows host, `PLAYWRIGHT_CHANNEL=msedge` uses the installed Edge browser. Six browser checks verify canvas sizing, touch-sized controls, actual swipes from the landscape canvas to setup/account fields, no viewport overflow, rejected private keys, separate contexts and disconnected/error/recovered states. Recovery uses mocked HTTP/WebSocket fixtures; these automated checks are **not** live multiplayer proof.

The Phase 0 static canvas permits vertical page gestures and is limited to 55% of viewport height, preserving its 16:9 shape. This fixes the installed phone build trapping swipes before the account form. Native landscape remains enabled. The future interactive house follows the approved HUD and input design in its own phase.

## Supabase Free project

Use an existing dedicated Free project, with no payment method or upgrade. Inspect its existing schema before applying the migration; never reset a hosted database. For a fresh project, apply the tracked migration through the CLI (`supabase link --project-ref <ref>` then `supabase db push`) or paste its exact content into the SQL editor. Administrative credentials stay in local CLI storage or dashboard, never this repo. No dashboard-only schema edits.

The existing `ncopulzhlthauttyrvgo` project was inspected and the exact `20261002000100_phase0_foundation.sql` migration applied through the dashboard on 2026-10-02. **Do not run that migration again.** The dashboard does not populate CLI migration history. Before the first future CLI push, authenticate locally, link this project, run `supabase migration repair 20261002000100 --status applied`, and confirm `supabase migration list` agrees with the tracked file. This repairs history only; never use a hosted reset. See the [official migration repair reference](https://supabase.com/docs/reference/cli/supabase-migration-repair).

Disable **Allow public access** under Realtime settings. Keep signup disabled for this spike; create two test users through Auth's administrator UI, and assign them seats 1 and 2 in one admin-created couple. Use an additional unrelated couple to test isolation. The spike does not provide a membership-writing client or pairing RPC.

The user created three confirmed accounts, and their administrative memberships are now provisioned: two members in one test couple, one member in a separate couple. Both existing memberships and confirmation were inspected before the atomic guarded insert. Real-account DB role checks passed for own data and cross-couple denial. Keep account-specific SQL and identifiers in ignored local files, not tracked migrations. Two different browser origins (live Vercel and localhost) signed in independently with human-entered passwords and exchanged private pings in both directions. Browser-to-browser testing is a preliminary check; actual web-to-APK proof remains required. After a page reload, use Reconnect to reuse the existing local Auth session rather than entering passwords again.

Admin-only provisioning example, replacing placeholders with the test users' UUIDs (no passwords):

```sql
with new_couple as (
  insert into public.couples default values returning id
)
insert into public.couple_members(user_id, couple_id, seat)
select 'FIRST_TEST_USER_UUID'::uuid, id, 1 from new_couple
union all
select 'SECOND_TEST_USER_UUID'::uuid, id, 2 from new_couple;
```

Local DB testing requires Docker and the Supabase CLI: `supabase start`, then `supabase test db`. CI performs this on a standard Linux runner. Tests roll back synthetic fixtures. Hosted migration/Realtime settings and actual channel authorization need their own recorded verification.

For the dashboard, run `node scripts/prepare-hosted-db-test.mjs` and paste the generated ignored `.cache/phase0-hosted-rls.sql` into a **cleared** SQL editor. The wrapper makes each failing pgTAP assertion raise a SQL error, since the dashboard only displays one result grid. It preserves all 17 assertions and the final rollback. Confirm no errors, then verify fixture counts return to their pre-test values. The hosted run passed with zero remaining users/couples/members. This does not prove a real WebSocket exchange.

## Vercel Hobby

Import `jaxgun-uwu28/Couple-App` into the existing personal Hobby account. Repository root is the project root; `vercel.json` builds `apps/web` and serves its dist directory with SPA fallback. Use the included `*.vercel.app` subdomain. Optionally configure the two public VITE variables; the runtime form also works. Never use paid compute or a custom domain. Test the actual deployed canvas after deployment.

Live Phase 0 build: [couple-app-web-two.vercel.app](https://couple-app-web-two.vercel.app), project `couple-app-web` in the existing Lance Hobby account. Root `./`; Vite/build/output read from tracked `vercel.json`. Production and preview have the supplied public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. No administrative key is configured. The canvas, landscape sizing, 44px buttons and SPA fallback were verified; the account form is temporary infrastructure diagnostics.

## Android debug APK

Bundled assets only, same web build, `com.pawandus.app`. Requires Java 21, Android SDK 36 and build tools 36.0.0. No store account or release keystore needed for this debug spike.

```powershell
pnpm build
pnpm android:sync
# Set JAVA_HOME to Android Studio/jbr and ANDROID_HOME to the installed SDK.
cd apps/web/android
.\gradlew.bat assembleDebug
```

Output: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`. Debug-signed, landscape activity; not a production release. Install by sideloading on the test phone. GitHub's `Phase 0 debug APK` workflow builds on relevant main changes or manual dispatch and retains the artifact for three days. The verified scrolling fix is locally available at ignored `artifacts/phase0/PawAndUs-phase0-scroll-fix.apk`; checksum and build-run link are in PHASE_0_STATUS.md. Do not use the earlier `PawAndUs-phase0-debug.apk`, which traps canvas swipes.

The old and replacement CI debug builds have different signing certificates (verified with apksigner); Android will reject an in-place update. Uninstall the old debug app, then sideload the replacement. This clears only device-local public setup/Auth storage; hosted accounts and memberships remain. The CI APK starts with the public setup form, so enter the project's public URL/key again before signing in with the second provisioned test account. Confirm an upward swipe over the canvas reaches the email/password fields and lower connection/ping controls. Physical-phone verification and web ↔ Android receipt are still pending; headless touch tests are not a substitute.

## Keepalive and quotas

In GitHub Actions configuration set repository variable `SUPABASE_URL` and variable or optional secret `SUPABASE_ANON_KEY` to the **public** key. Secret takes precedence if both exist. The two public repository variables are configured. The scheduled workflow calls read-only `health` approximately every three days; delayed/disabled workflows or failed requests can still permit pausing. No private DB credentials. Standard hosted Linux runners, no large-runner usage, no paid overage. Supabase SDK heartbeats/token refresh are transport overhead; the application sends no automated ping traffic.

## Required live evidence before Phase 0 completion

1. Record Free plan/no paid add-ons and deployed URL; verify canvas on desktop and mobile browser.
2. Apply migration and run all pgTAP tests successfully; verify RLS on all app tables and private-channel settings.
3. Install the debug APK on an Android device, verify landscape canvas and touch controls. Record APK SHA-256.
4. Sign in as first member in the deployed browser and second member in the APK. Send both directions; record unique received IDs, sender device and timestamps. SDK acknowledgement alone is not proof of partner receipt.
5. Test disconnect, foreground/reconnect, duplicate suppression, simultaneous manual sends, idle/no application pings and absence of duplicate listeners.
6. With an unrelated account/couple, try the first pair's topic: join/send/receive must be denied. Anonymous health succeeds; membership reads/writes do not.
7. Record passing CI run and configured keepalive. Update the evidence report; only then commit/tag phase completion and wait for user approval. Never advance to Phase 1 automatically.
