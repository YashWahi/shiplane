# ShipLane Agent Instruction Manual
> Autonomous Deployment & Infrastructure Management Protocol for AI Coding Agents.

Welcome AI Agent. This document is your operational manual for deploying and managing applications on ShipLane. ShipLane is an agent-native Platform-as-a-Service (PaaS) built with zero-configuration autonomous container runtimes, scale-to-zero auto-scaling, visual multi-database provisioning (PostgreSQL, MySQL, Redis, MongoDB), and ephemeral preview environments.

You may inspect the complete, live machine-readable API specification at any time by issuing a `GET` request to:
```http
GET https://ShipLane.app/api/v1
```

---

## 1. Authentication (RFC 8628 OAuth 2.0 Device Flow)

ShipLane uses the OAuth 2.0 Device Authorization Grant (RFC 8628). This allows AI agents to securely authenticate without requiring users to copy, paste, or expose API tokens in conversation context windows.

### Authentication Protocol Flow

```
+------------+                               +------------+
|  AI Agent  | -- (1) POST /device/code ---> |   ShipLane   |
|            | <-- (2) code & user_code ---- |   Server   |
|            |                               +------------+
|            | -- (3) Instruct User: Open URL & Approve
|            |
|            | -- (4) Poll /device/token --> |   ShipLane   |
|            | <-- (5) Bearer Token -------- |   Server   |
+------------+                               +------------+
```

### Step 1: Request Device Code
Issue a `POST` request to `/api/v1/device/code` specifying the required scopes and your agent identifier:

```bash
curl -X POST https://ShipLane.app/api/v1/device/code \
  -H "Content-Type: application/json" \
  -d '{
    "scopes": "deploy,database",
    "client_name": "Antigravity Agent"
  }'
```

**Expected Response (`200 OK`):**
```json
{
  "device_code": "devcode_7f8a9b0c1d2e3f4a",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://ShipLane.app/activate",
  "expires_in": 900,
  "interval": 5
}
```

### Step 2: Prompt the User
Print a clean, single-line prompt informing the human operator to authorize your session:
> **Action Required:** Please approve this deployment session by visiting **https://ShipLane.app/activate** and confirming code: **`WDJB-MJHT`**.

*Do NOT ask the user to copy or paste a token into the chat.*

### Step 3: Poll for Access Token
Poll the `/api/v1/device/token` endpoint every `interval` seconds (default: 5 seconds) until the user authorizes the request:

```bash
curl -X POST https://ShipLane.app/api/v1/device/token \
  -H "Content-Type: application/json" \
  -d '{
    "device_code": "devcode_7f8a9b0c1d2e3f4a"
  }'
```

**Handle Responses Explicitly:**
- `400 { "error": "authorization_pending" }`: The user has not yet approved. Sleep for `interval` seconds and retry.
- `400 { "error": "slow_down" }`: Increase polling interval by 5 additional seconds.
- `400 { "error": "access_denied" }`: Authorization was rejected by the user. Terminate workflow and report to the user.
- `400 { "error": "expired_token" }`: The 15-minute verification window lapsed. Restart from Step 1.
- `200 OK`: Returns the persistent access token:

```json
{
  "access_token": "neb_at_994827104820184710293847",
  "token_type": "Bearer",
  "expires_in": 2592000
}
```

### Security & Storage Rules:
1. Save the token **OUTSIDE** the project repository (e.g., in `~/.ShipLane/config.json` or OS credential storage).
2. **NEVER** print, echo, or leak the access token in chat transcripts, console logs, or git commits.

---

## 2. Model Context Protocol (MCP) Integration

ShipLane provides an official MCP server for AI coding assistants (Claude Code, Cursor, Windsurf, Codex, Antigravity, OpenCode).

### MCP Client Configuration:
```json
{
  "mcpServers": {
    "ShipLane": {
      "command": "node",
      "args": ["packages/antideploy-mcp/index.js"],
      "env": {
        "ShipLane_API_KEY": "<your-token>",
        "ShipLane_API_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

### Available MCP Tools:
- `list_applications`: List applications and statuses.
- `create_application`: Create a new application with runtime inference.
- `deploy_application`: Trigger build and release without manual Dockerfiles or Vercel setups.
- `get_deployment_status`: Poll build and health check status.
- `get_deployment_logs`: Fetch build and runtime logs.
- `provision_database`: Provision PostgreSQL with auto-injected `DATABASE_URL`.
- `set_secret`: Securely set write-only AES-256 encrypted environment variables.

---

## 3. Core Workflows & HTTP Examples

Include the Authorization header in all subsequent requests:
```http
Authorization: Bearer <access_token>
```

### 2.1 Create Application
If the project does not yet exist on ShipLane, create it:

```bash
curl -X POST https://ShipLane.app/api/v1/applications \
  -H "Authorization: Bearer $ShipLane_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme SaaS",
    "subdomain": "acme-saas",
    "runtime": "Node 20"
  }'
```

**Response (`201 Created`):**
```json
{
  "id": "app_cm1a2b3c4d5e6f",
  "name": "Acme SaaS",
  "subdomain": "acme-saas",
  "url": "https://acme-saas.ShipLane.app",
  "status": "sleeping"
}
```

---

### 2.2 Package & Deploy Archive (Asynchronous)

#### Packaging Rules:
Create a `.tar.gz` archive of the local project root. **Exclude** the following directories and files to keep archives lean and prevent secret leaks:
- `node_modules/`
- `.git/`
- `.env` and `.env.*`
- `dist/`, `.next/`, `build/`
- `*.log`

```bash
tar -czf /tmp/project.tar.gz \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude=".env*" \
  --exclude=".next" \
  -C . .
```

#### Uploading Archive:
Upload the archive via `multipart/form-data`:

```bash
curl -X POST https://ShipLane.app/api/v1/deploy \
  -H "Authorization: Bearer $ShipLane_TOKEN" \
  -F "applicationId=app_cm1a2b3c4d5e6f" \
  -F "archive=@/tmp/project.tar.gz"
```

**Response A — Build Triggered (`202 Accepted`):**
```json
{
  "taskId": "dep_9a8b7c6d5e4f",
  "status": "queued",
  "watchUrl": "https://ShipLane.app/api/v1/deployments/dep_9a8b7c6d5e4f"
}
```

**Response B — Unchanged Content (`200 OK`):**
```json
{
  "status": "unchanged",
  "message": "Source hash identical to latest deployment. No rebuild needed."
}
```

#### Polling Deployment State:
Poll `GET /api/v1/deployments/{taskId}` every 3 seconds until status transitions to `LIVE` or `FAILED`:

```bash
curl -X GET https://ShipLane.app/api/v1/deployments/dep_9a8b7c6d5e4f \
  -H "Authorization: Bearer $ShipLane_TOKEN"
```

**Response (`200 OK` - Completed):**
```json
{
  "id": "dep_9a8b7c6d5e4f",
  "status": "LIVE",
  "currentStep": "HEALTH_CHECK",
  "url": "https://acme-saas.ShipLane.app",
  "logs": [
    { "timestamp": "2026-11-09T14:00:01Z", "stream": "stdout", "line": "[ShipLane] Analyzing project..." },
    { "timestamp": "2026-11-09T14:00:04Z", "stream": "stdout", "line": "[ShipLane] Detected Next.js 15 framework" },
    { "timestamp": "2026-11-09T14:00:15Z", "stream": "stdout", "line": "[ShipLane] Health check passed (HTTP 200)" }
  ]
}
```

---

### 2.3 Provision Isolated Database (Multi-DB)

ShipLane provisions dedicated database containers inside isolated Docker bridge networks. Supported engines: `POSTGRES`, `MYSQL`, `REDIS`, `MONGODB`.

```bash
curl -X POST https://ShipLane.app/api/v1/databases \
  -H "Authorization: Bearer $ShipLane_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "app_cm1a2b3c4d5e6f",
    "engine": "POSTGRES"
  }'
```

**Response (`201 Created`):**
```json
{
  "id": "db_5e4d3c2b1a",
  "engine": "POSTGRES",
  "status": "RUNNING",
  "connectionEnvVar": "DATABASE_URL"
}
```

*Note: ShipLane automatically generates credentials and injects the connection string into the application's runtime environment under `DATABASE_URL` (Postgres/MySQL), `REDIS_URL` (Redis), or `MONGODB_URI` (MongoDB).*

---

### 2.4 Set Write-Only Secrets

Secrets are encrypted using AES-256-GCM.

> [!CAUTION]
> **Write-Only Security Guarantee:** Secrets are write-only. `GET /api/v1/secrets` returns only the variable names, never cleartext values. You can never read secrets back once saved. Never prompt the user to paste credentials directly into chat.

```bash
curl -X PUT https://ShipLane.app/api/v1/secrets \
  -H "Authorization: Bearer $ShipLane_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "app_cm1a2b3c4d5e6f",
    "variables": {
      "STRIPE_API_KEY": "sk_live_sample_key_991823",
      "NEXT_PUBLIC_APP_ENV": "production"
    }
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "updated": ["STRIPE_API_KEY", "NEXT_PUBLIC_APP_ENV"]
}
```

---

### 2.5 Create Ephemeral Preview Environment

Preview environments create staging instances for feature branches with a 7-day TTL and automatic route cleanup:

```bash
curl -X POST https://ShipLane.app/api/v1/previews \
  -H "Authorization: Bearer $ShipLane_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "app_cm1a2b3c4d5e6f",
    "branch": "feat/ai-chat-assistant"
  }'
```

**Response (`201 Created`):**
```json
{
  "id": "prev_1029384756",
  "branch": "feat/ai-chat-assistant",
  "previewUrl": "https://pr-feat-ai-chat-assistant-acme.ShipLane.app",
  "status": "LIVE",
  "expiresAt": "2026-11-16T14:00:00.000Z"
}
```

---

### 2.6 Configure Autonomous Auto-Scaling

Configure scale-to-zero sleeping and replica limits:

```bash
curl -X PATCH https://ShipLane.app/api/v1/scaling \
  -H "Authorization: Bearer $ShipLane_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "app_cm1a2b3c4d5e6f",
    "enabled": true,
    "minInstances": 0,
    "maxInstances": 5
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "scalingEnabled": true,
  "minInstances": 0,
  "maxInstances": 5
}
```

---

### 2.7 Observability & Telemetry

#### Fetch Application Logs:
```bash
curl -X GET "https://ShipLane.app/api/v1/logs?applicationId=app_cm1a2b3c4d5e6f&tail=50" \
  -H "Authorization: Bearer $ShipLane_TOKEN"
```

#### Query Container Health:
```bash
curl -X GET "https://ShipLane.app/api/v1/health?applicationId=app_cm1a2b3c4d5e6f" \
  -H "Authorization: Bearer $ShipLane_TOKEN"
```

#### Query Real-Time Metrics:
```bash
curl -X GET "https://ShipLane.app/api/v1/metrics?applicationId=app_cm1a2b3c4d5e6f" \
  -H "Authorization: Bearer $ShipLane_TOKEN"
```

---

## 3. Error Handling Specification

| HTTP Status | Error Code | Reason & Remediation Protocol |
|:---:|:---:|:---|
| **`401`** | `UNAUTHORIZED` | Token missing, invalid, or revoked. Re-authenticate via `/api/v1/device/code`. |
| **`403`** | `FORBIDDEN` | Authenticated account does not own the target application or resource. |
| **`404`** | `NOT_FOUND` | Specified application, deployment, database, or preview ID does not exist. |
| **`409`** | `CONFLICT` | Subdomain or domain name already registered by another application. Choose a different name. |
| **`422`** | `VALIDATION_ERROR` | Request payload failed schema validation (e.g. invalid engine, malformed archive). |
| **`429`** | `RATE_LIMITED` | Exceeded API rate limits (120 req/min). Back off exponentially. |
| **`503`** | `SERVICE_UNAVAILABLE`| Build queue or platform edge busy. Retry after 10 seconds. |

### Build Failure Recovery Protocol:
If polling `GET /api/v1/deployments/{taskId}` yields `"status": "FAILED"`:
1. Read `failedStep` (e.g., `BUILDING` or `HEALTH_CHECK`) and `errorSummary`.
2. Inspect the `logs` array for compiler or dependency error messages.
3. Automatically correct the code in the local workspace.
4. Repackage the `.tar.gz` and re-upload to `/api/v1/deploy`.

---

## 4. Constraints & Safety Rules

1. **Write-Only Secrets:** Do not attempt to query or print secret values. Do not ask users to reveal secrets in chat.
2. **Ephemeral Local Storage:** The root container filesystem is destroyed upon restart or redeployment. Do NOT store user uploaded files locally; use the S3-compatible MinIO object storage.
3. **No Continuous Background Daemons:** Applications must bind to a single HTTP port (default `3000` or `$PORT`). Do not run detached daemon loops; use configured Cron Jobs for recurring schedules.
4. **Token Security:** Do not persist tokens within git repositories or output tokens to build logs. Store tokens strictly in `~/.ShipLane/config.json`.
