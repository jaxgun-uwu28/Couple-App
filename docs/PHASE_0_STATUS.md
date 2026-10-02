# Phase 0 verification evidence

Date: 2026-10-02. **LOCAL/CI FOUNDATION VERIFIED — LIVE CLOUD/DEVICE PROOF PENDING, not phase-0-done.** User approved all reference directions and authorized the infrastructure hello-world. Authenticated Supabase/Vercel configuration is deferred at the user's request.

| Requirement | Evidence / status |
|---|---|
| Architecture, quota research, approved art | DECISIONS.md, FREE_TIER_NOTES.md, DESIGN.md and saved reference boards |
| Strict TypeScript | Passed for web and shared packages |
| Unit checks | 15 passed: valid/invalid pings, bounded duplicates, simultaneous unique sends, rate cap, private key rejection, private-channel configuration, connection error/recovery, failed acknowledgement and cancelled join |
| Browser checks | 4 passed in headless Edge; 1280x800, 844x390 touch and 390x844 entry; Phaser canvas, no horizontal overflow, empty/error states, private-key rejection, isolated sessions, disconnected/reconnect feedback. Production desktop/landscape screenshots inspected; no page errors. Chromium checks also passed in CI |
| Web bundle | Passed Vite production build; Phaser is a separate lazy chunk. Bundle size warning retained (engine ~319 KB gzip, main ~152 KB gzip); no performance claim on a low-end device |
| Dependency reproducibility | Pinned official registry versions and lockfile. Slow Phaser download completed locally in byte ranges and checked against official npm SHA-512. Temporary local mirror removed; official lockfile passed verification and offline frozen install succeeded |
| Membership/RLS/RPC migration | Written, not applied to hosted project. All 17 pgTAP checks passed in GitHub CI using local Supabase/Docker on a standard Linux runner; local Docker on this Windows host is unavailable |
| Hosted project | User supplied public URL/key, saved in ignored local env only. Public health check returned 404: migration not installed |
| Vercel | Configuration ready, deployment pending account access. No live URL |
| Android | [Debug APK build passed](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37006605446), downloaded to ignored `artifacts/phase0/PawAndUs-phase0-debug.apk` (4,681,484 bytes). GitHub archive digest checked; `apksigner verify` passes with v2 signing. Package `com.pawandus.app`, min SDK 24 (Android 7+), target 36. Packaged manifest confirms sensorLandscape and backup disabled. Native immersive shell compiled. No phone/emulator proof: adb found no connected devices. Local Google Maven TLS download failure remains; CI builds successfully without weakening HTTPS |
| GitHub | Foundation `966cd44`, build fix `14c7ac0`, both pushed. [Latest web and DB CI passed](https://github.com/jaxgun-uwu28/Couple-App/actions/runs/37006605241). APK workflow runs on relevant main changes or manually, with three-day artifact retention. Keepalive skips until URL is configured; public key secret also required |
| Web ↔ APK private ping | Not tested; requires migration, administrative test pair and device. No partner receipt or cross-couple channel denial claimed |

Implemented: Phase 0 infrastructure foundation only. Files changed: workspace/tooling, apps/web and generated Android, packages/shared, supabase migration/tests/config, workflows, vercel.json, protocol/design/decision/quota/setup/status/changelog docs and asset provenance.

Database changes: two RLS-enabled admin-provisioned membership tables (two seats, one couple/user), membership helper, read policies and no client DML; Realtime Broadcast policies; read-only health. API/RPC changes: `is_couple_member`, `health`. Realtime changes: `spike_ping` only, behind RealtimeTransport, private topic, Zod validation, manual 1/s cap, no application idle broadcasts or persistent state.

APK SHA-256: `ECE9594A6BCB4ACC81901CE945C950BC1044791C554A6AFDC88DB54F59C37E4E`.

Known issues: hosted operations and true device/security proof are pending; Android defaults are temporary launcher/splash assets. The CI APK has no project variables and uses the runtime public setup form; local web build uses the supplied public configuration. No signed release, gameplay, joystick, pairing, caches or production UI. Assumptions: prescribed stack approved by continuation in a documentation-only repo; bundled debug assets for a reproducible cross-platform spike; existing project will be inspected before migration (never reset).

Next: complete outstanding Phase 0 verification and update this evidence. **Phase 1 requires explicit approval after the Phase 0 report.**
