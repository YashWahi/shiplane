# ShipLane refinement audit

Date: 2026-11-13

## Existing foundation

ShipLane is an npm workspace using Next.js 15, React 19, Prisma/PostgreSQL, Redis/BullMQ, Dockerode, MinIO, and Traefik. The dashboard, public REST routes, credentials-based NextAuth flow, deployment queue/worker, per-application Docker networks, encrypted environment-variable storage, GitHub webhook handler, database provisioning, and application pages are already present. Local Docker services and the dashboard are currently running; this is an audit of the existing implementation, not a replacement plan.

## Findings

### Critical

- **Dashboard credentials are not authentication.** The credentials provider accepts any supplied email, creates an account for it, and returns a session without a password or verified identity. Server actions also continue when no session is available and only compare email when one happens to exist. This allows account impersonation and unauthenticated server actions.
- **Deployment upload is not end-to-end.** The REST route stores the archive in MinIO and queues its object key as `sourcePath`; the worker treats that value as a local directory. Dashboard-triggered deployment queues a path that is not created by the current code. Uploaded builds therefore cannot reliably reach the Docker build stage.
- **Deployment replacement has no safe cutover.** The worker removes the currently running application container before starting and health-checking the candidate. A failed build or health probe therefore takes down the last live version, despite the deployment record being marked failed.
- **Git clone uses shell interpolation.** The worker passes the repository value into `execSync` command text, allowing shell metacharacters in a queued source value to execute on the worker host.

### High

- **Webhook signatures are optional.** If `GITHUB_WEBHOOK_SECRET` is unset, unsigned requests can enqueue production or preview deployments. The ping response is also returned before signature verification.
- **Internal errors are returned to API callers.** `handleApiError` includes unknown exception messages in 500 responses; these can reveal SQL, filesystem, or service details.
- **Resource ownership is inconsistent in server actions.** API routes generally use account ownership checks, but server actions use a permissive helper and some errors expose application IDs or internal messages.
- **Deployment recovery is incomplete.** BullMQ retries are configured, but database state transitions are not reconciled after hard worker termination; `currentStep`/status can remain in-progress. Queue failures in `deployApp` are swallowed after persisting a queued deployment.
- **Deployment logs may contain sensitive build output and grow without a per-deployment cap.** Logs are persisted one row per line without byte limits or pagination policy in the worker.
- **Container isolation is partial.** Per-app bridge networks and CPU/memory limits exist, but the runtime does not set `no-new-privileges`, drop Linux capabilities, or cap process count. Generated and supplied Dockerfiles run with their chosen/default user.

### Medium

- **MCP/agent support is REST documentation rather than an MCP server.** Existing API routes cover application CRUD, deploy, status, logs, secrets, databases, previews, domains, scaling, and security scans, but there is no MCP transport or rollback/analyze/resource-usage tool. The Antideploy MCP reference uses async deploy IDs, status polling, scoped credentials, and write-only secret operations; several of those patterns already exist in ShipLane's REST surface.
- **Billing and email are placeholders.** Stripe and Resend values are example placeholders; no complete billing or email workflow was found in the current product paths reviewed.
- **OAuth environment variables are empty locally.** Current auth code uses the insecure email-only credentials provider instead of GitHub/Google; provider variables alone do not enable OAuth.
- **Infrastructure defaults need production hardening.** Compose uses development credentials, binds service ports on all host interfaces, has no CPU/memory reservations, and Traefik's checked-in config lacks a certificate resolver definition. Local setup overrides MinIO's unavailable public image and the occupied dashboard port.
- **Some product claims exceed the implementation.** API contract text advertises rate limiting, metrics, TLS, and other behavior not consistently enforced by the route implementations reviewed.
- **Database provisioning is launched with `setImmediate` inside the web process rather than a durable queue.** A process restart can leave provisioned records stuck in `PROVISIONING`.

### Low

- The Compose `version` field is obsolete under current Compose and produces a warning.
- `npm install` reported 13 dependency advisories (1 low, 4 moderate, 8 high). They need triage before indiscriminate upgrades; this audit does not assume every advisory is reachable or safely fixable.

## Implemented versus incomplete

- **Implemented:** REST API, account-scoped application queries in API routes, hashed API keys, encrypted environment variables, MinIO archive storage, persistent deployment records/logs, BullMQ retries, Docker CPU/memory limits, database containers, and UI pages for apps/deployments/logs/secrets/databases/previews/scaling/settings.
- **Partially implemented:** deployment lifecycle, previews, scaling/health/cleanup workers, domain/TLS routing, database provisioning, OAuth, upload validation, and MCP/agent integration.
- **Not found in the reviewed application:** a safe live-container cutover/rollback path, durable worker-state reconciliation, request rate limiting, complete billing/email workflows, a native MCP server, and a tested backup/restore workflow.

## Reference notes

The Antideploy MCP README describes a minimal `deploy`, `deployment_status`, `list_env`, and `set_env` tool surface. Its deployment operation is asynchronous and returns a task ID; secret values are write-only, and its API key is scoped to one application. ShipLane can adopt these interface and security properties without copying its source or changing ShipLane's existing REST architecture.

## Verification status

At audit time, the dashboard returned HTTP 200; Postgres and Redis were healthy; MinIO's live endpoint and Traefik's dashboard returned HTTP 200; Prisma schema validation and schema push succeeded; and the builder worker started. No end-to-end deployment was claimed or tested in this audit. The destructive existing seed script was not run.

## Follow-up refinement (2026-11-14)

- **Implemented:** local developer sign-in is opt-in and development-only; console routes require a session; app and account reads are scoped to the signed-in account; server actions require ownership; internal API errors are redacted; GitHub webhooks fail closed without a signing secret.
- **Implemented:** uploaded tar.gz archives are safely materialized by the builder; GitHub clone inputs are allowlisted; candidate containers are health-checked before route cutover; queue failures persist a failed deployment state; container runtime limits and isolation were tightened.
- **Implemented:** console navigation, sign-out, dashboard hierarchy and status summaries, responsive spacing, and app creation guidance were refined. The dashboard environment now enables the configured local developer provider without changing credentials.
- **Verified:** dashboard and worker TypeScript checks pass; Prisma schema validation and a read-only database query pass; PostgreSQL, Redis, MinIO, Traefik, dashboard, local sign-in, app list, and app creation page respond successfully.
- **Not verified:** no end-to-end build/deploy was triggered because that would create or replace a running application deployment. Public HTTPS routing and certificate configuration still need a deployment-specific verification.
