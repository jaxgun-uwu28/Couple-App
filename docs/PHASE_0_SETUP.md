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

Browser checks: `pnpm exec playwright install chromium`, then `pnpm test:e2e`. On this Windows host, `PLAYWRIGHT_CHANNEL=msedge` uses the installed Edge browser. Browser tests verify a canvas, touch-sized controls, no viewport overflow, rejected private keys, separate contexts and disconnected/error states; they are **not** live multiplayer proof.

## Supabase Free project

Use an existing dedicated Free project, with no payment method or upgrade. Inspect its existing schema before applying the migration; never reset a hosted database. For a fresh project, apply the tracked migration through the CLI (`supabase link --project-ref <ref>` then `supabase db push`) or paste its exact content into the SQL editor. Administrative credentials stay in local CLI storage or dashboard, never this repo. No dashboard-only schema edits.

Disable **Allow public access** under Realtime settings. Keep signup disabled for this spike; create two test users through Auth's administrator UI, and assign them seats 1 and 2 in one admin-created couple. Use an additional unrelated couple to test isolation. The spike does not provide a membership-writing client or pairing RPC.

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

## Vercel Hobby

Import `jaxgun-uwu28/Couple-App` into the existing personal Hobby account. Repository root is the project root; `vercel.json` builds `apps/web` and serves its dist directory with SPA fallback. Use the included `*.vercel.app` subdomain. Optionally configure the two public VITE variables; the runtime form also works. Never use paid compute or a custom domain. Test the actual deployed canvas after deployment.

## Android debug APK

Bundled assets only, same web build, `com.pawandus.app`. Requires Java 21, Android SDK 36 and build tools 36.0.0. No store account or release keystore needed for this debug spike.

```powershell
pnpm build
pnpm android:sync
# Set JAVA_HOME to Android Studio/jbr and ANDROID_HOME to the installed SDK.
cd apps/web/android
.\gradlew.bat assembleDebug
```

Output: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`. Debug-signed, landscape activity; not a production release. Install by sideloading on the test phone. GitHub's manual `Phase 0 debug APK` workflow can also build it and retain the artifact for three days.

## Keepalive and quotas

In GitHub Actions configuration set repository variable `SUPABASE_URL` and secret `SUPABASE_ANON_KEY` to the **public** key. The scheduled workflow calls read-only `health` approximately every three days; delayed/disabled workflows or failed requests can still permit pausing. No private DB credentials. Standard hosted Linux runners, no large-runner usage, no paid overage. Supabase SDK heartbeats/token refresh are transport overhead; the application sends no automated ping traffic.

## Required live evidence before Phase 0 completion

1. Record Free plan/no paid add-ons and deployed URL; verify canvas on desktop and mobile browser.
2. Apply migration and run all pgTAP tests successfully; verify RLS on all app tables and private-channel settings.
3. Install the debug APK on an Android device, verify landscape canvas and touch controls. Record APK SHA-256.
4. Sign in as first member in the deployed browser and second member in the APK. Send both directions; record unique received IDs, sender device and timestamps. SDK acknowledgement alone is not proof of partner receipt.
5. Test disconnect, foreground/reconnect, duplicate suppression, simultaneous manual sends, idle/no application pings and absence of duplicate listeners.
6. With an unrelated account/couple, try the first pair's topic: join/send/receive must be denied. Anonymous health succeeds; membership reads/writes do not.
7. Record passing CI run and configured keepalive. Update the evidence report; only then commit/tag phase completion and wait for user approval. Never advance to Phase 1 automatically.
