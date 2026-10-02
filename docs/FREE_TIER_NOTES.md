# Free-tier notes

Date checked: **2026-10-02 (Asia/Manila)**. Official pricing and documentation only. Published limits, not measured usage; no cloud projects created. Recheck before deploying.

## Supabase Free

| Resource | Published allowance / restriction |
|---|---|
| Price / active projects | $0; 2 active free projects |
| Database size | 500 MB per project |
| File storage | 1 GB |
| Egress | 5 GB uncached plus a separate 5 GB cached allowance; not interchangeable |
| Realtime messages | 2 million per month |
| Realtime concurrent connections | 200 peak connections |
| Edge Function invocations | 500,000 included |
| Auth | 50,000 monthly active users |
| Storage upload / transformations | 50 MB maximum upload; image transformations excluded |
| Inactivity pause | After 1 week of inactivity |
| Automatic backups / PITR / uptime SLA | Not included |

Source: [Supabase pricing](https://supabase.com/pricing).

Built-in Auth email sender: **2 emails/hour per project**, restricted to organization team-member email addresses, best-effort and unsuitable as general production email delivery. Choose a free custom SMTP arrangement or another suitable auth approach in the auth phase; disabling confirmation alone does not provide password-reset delivery. Sources: [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits), [SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

### Realtime budget implications

Broadcast accounting includes one sent message plus each recipient delivery. Presence and Postgres Changes also consume quota. Source: [Realtime message accounting](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages).

Planning calculation (not a benchmark): 2 hours/day x 30 days = 216,000 seconds. Two avatars each sending 1 update/second, delivered to the other player with sender echo disabled, cost approximately **864,000 messages/month**. Only 136,000 remain within the spec's 1-million target for pets, direction changes, presence, chat and other events. Sustained 3 updates/second from each avatar cost 2,592,000 before other traffic, exceeding Free.

The spec's typical 1–3 updates/second must therefore be active bursts, not a sustained two-hour stream. Use change-driven motion and moving-only corrections. Idle clients send no gameplay motion; SDK transport keepalives still exist. Budget pet movement by duty cycle rather than continuously using its 5/second cap. Measure total usage in Supabase's dashboard; sent counters alone undercount deliveries. No new rate contract is introduced here.

Compress photos and create thumbnails locally. Keep caches disposable; queue idempotent actions rather than cached state. Plan exports because automatic backups are absent. The spec's health ping is a future proposal, not a verified guarantee against pausing; recovery must handle paused projects too.

## Vercel Hobby

| Resource | Published allowance / restriction |
|---|---|
| Fast Data Transfer / Fast Origin Transfer | 100 GB / 10 GB |
| CDN requests / Function invocations | 1 million / 1 million |
| Active CPU / provisioned memory | 4 CPU-hours / 360 GB-hours |
| Deployments | 100/day; 1 concurrent deployment |
| Build duration / container | 45 minutes maximum per build; 2 vCPUs, 8 GB RAM, 32 GB disk |
| Terms | Personal, non-commercial use only |
| Exceeding usage | Usually wait until 30 days have passed; Hobby does not automatically become paid capacity |

Sources: [Hobby plan](https://vercel.com/docs/plans/hobby), [platform limits](https://vercel.com/docs/limits). Current opened pages do not list a monthly build-execution-minute allowance. Older indexed snippets mention 6,000 minutes, so that number is **not confirmed** here. Pro's 6,000 deployments/day is not build minutes.

### WebSocket candidate gate (MASTER_SPEC 2.8)

Official pages now document native WebSockets in **public beta on all plans**, using Fluid Compute. Hobby connections are limited to **300 seconds**. Idle sockets do not consume active CPU, but the instance's provisioned memory remains billable against included capacity. Cross-instance fan-out requires an external store. Sources: [WebSockets documentation](https://vercel.com/docs/functions/websockets), [limits, pricing and reconnect guide](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections).

| Gate | Review result |
|---|---|
| 1. Hobby availability without card | Hobby availability documented; no-card beta activation not tested in an account |
| 2. Two hours/day within quotas with margin | Conditional only: at 2 GB/instance, 60 hours/month uses 120 GB-hours on one instance or 240 on two. CPU, reconnect overlap and fan-out are unmeasured |
| 3. Duration / idle behavior | 300-second forced reconnects: about 24 connection lifetimes/player/two-hour session; seamless recovery unproven |
| 4. Free Redis and Postgres fit | Supabase Postgres free tier verified; no Redis service or required pub/sub capability selected and verified |
| 5. Effort versus Supabase | More coordination, recovery and infrastructure; no demonstrated advantage for this couple |

**Recommendation: retain Option A, Supabase Realtime. Option B has not passed all five gates.** This corrects the older spec's blanket claim that Vercel Functions cannot host WebSockets without changing architecture or editing the master spec. No socket backend switch is approved or implemented.

## Other

- **GitHub Actions:** standard hosted runner compute is free for public repos. Private repos on GitHub Free include **2,000 minutes/month**, **500 MB artifact storage**, and **10 GB cache storage per repository**. Larger runners are paid even for public repos. Prefer standard Linux runners, short artifact retention and no paid overage. GitHub's repository API verified `jaxgun-uwu28/Couple-App` is **public** on 2026-10-02. [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- **Firebase Cloud Messaging:** no-cost product available under Spark, which needs no payment method. Other Firebase/Google Cloud services are not thereby free. Push remains optional and unimplemented. [Firebase pricing](https://firebase.google.com/pricing).
- **Distribution:** retain the prescribed Vercel subdomain and sideloaded Capacitor APK. No paid domain, store account, server or SMTP provisioned.

## Infrastructure validation status

User approved the references and Phase 0 continuation. Local scaffold, migration, workflows and Android build are in progress. User supplied an existing project's public URL/key, saved in ignored local configuration; its public health RPC returned HTTP 404 (migration not installed). User prefers to configure authenticated cloud access later, so hosted migration, Vercel deployment and actual web-to-APK ping remain pending. No paid service enabled, live URL or multiplayer proof claimed. See PHASE_0_SETUP.md and the Phase 0 evidence report for build/test results.
