# Phase 0 verification evidence

Date: 2026-10-02. **IN PROGRESS — not phase-0-done.** User approved all reference directions and authorized the infrastructure hello-world. Authenticated Supabase/Vercel configuration is deferred at the user's request.

| Requirement | Evidence / status |
|---|---|
| Architecture, quota research, approved art | DECISIONS.md, FREE_TIER_NOTES.md, DESIGN.md and saved reference boards |
| Strict TypeScript | Passed for web and shared packages |
| Unit checks | 15 passed: valid/invalid pings, bounded duplicates, simultaneous unique sends, rate cap, private key rejection, private-channel configuration, connection error/recovery, failed acknowledgement and cancelled join |
| Browser checks | 4 passed in headless Edge; 1280x800, 844x390 touch and 390x844 entry; Phaser canvas, no horizontal overflow, empty/error states, private-key rejection, isolated sessions, disconnected/reconnect feedback |
| Web bundle | Passed Vite production build; Phaser is a separate lazy chunk. Bundle size warning retained (engine ~319 KB gzip, main ~152 KB gzip); no performance claim on a low-end device |
| Dependency reproducibility | Pinned official registry versions and lockfile. Slow Phaser download completed locally in byte ranges and checked against official npm SHA-512. Temporary local mirror removed; official lockfile passed verification and offline frozen install succeeded |
| Membership/RLS/RPC migration | Written, not applied to hosted project. 17 pgTAP tests defined; local Docker is unavailable. CI DB verification pending |
| Hosted project | User supplied public URL/key, saved in ignored local env only. Public health check returned 404: migration not installed |
| Vercel | Configuration ready, deployment pending account access. No live URL |
| Android | Capacitor project generated, Java 21/SDK 36 present. First local build failed on Google Maven TLS downloads (AGP 8.13.0/repository 31.13.0), without disabling certificate checks. CI debug build configured as fallback. Landscape manifest. No phone or emulator proof yet |
| GitHub | Existing public repository verified; CI and manual debug-APK workflows ready. Keepalive skips until URL is configured; public key secret also required |
| Web ↔ APK private ping | Not tested; requires migration, administrative test pair and device. No partner receipt or cross-couple channel denial claimed |

Implemented: Phase 0 infrastructure foundation only. Files changed: workspace/tooling, apps/web and generated Android, packages/shared, supabase migration/tests/config, workflows, vercel.json, protocol/design/decision/quota/setup/status/changelog docs and asset provenance.

Database changes: two RLS-enabled admin-provisioned membership tables (two seats, one couple/user), membership helper, read policies and no client DML; Realtime Broadcast policies; read-only health. API/RPC changes: `is_couple_member`, `health`. Realtime changes: `spike_ping` only, behind RealtimeTransport, private topic, Zod validation, manual 1/s cap, no application idle broadcasts or persistent state.

Known issues: hosted operations and true device/security proof are pending; Android defaults are temporary launcher/splash assets. No signed release, gameplay, joystick, pairing, caches or production UI. Assumptions: prescribed stack approved by continuation in a documentation-only repo; bundled debug assets for a reproducible cross-platform spike; existing project will be inspected before migration (never reset).

Next: complete outstanding Phase 0 verification and update this evidence. **Phase 1 requires explicit approval after the Phase 0 report.**
