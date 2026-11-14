# 🚀 Nebula Developer Setup Guide

A complete, step-by-step walkthrough to get Nebula running locally on your machine in under 5 minutes.

---

## 📌 Prerequisites

Ensure you have the following installed before starting:

| Tool | Minimum Version | Check Command | Download Link |
|:---|:---|:---|:---|
| **Node.js** | `v20.0.0+` | `node -v` | [nodejs.org](https://nodejs.org/) |
| **npm** | `v10.0.0+` | `npm -v` | Included with Node.js |
| **Docker Desktop** | Latest | `docker info` | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Latest | `git --version` | [git-scm.com](https://git-scm.com/) |

> [!IMPORTANT]
> **Docker Desktop must be running** before executing infrastructure commands. Ensure the Docker whale icon in your system tray shows "Engine running".

---

## ⚡ Quickstart (5-Step Walkthrough)

### Step 1: Clone the Repository & Configure Environment

Clone the repository and enter the directory:

```bash
git clone https://github.com/YashWahi/ShipLane.git nebula
cd nebula
```

Create your local `.env` configuration files:

```bash
# On macOS / Linux:
cp .env.example .env
cp .env.example apps/dashboard/.env

# On Windows (PowerShell):
Copy-Item .env.example .env
Copy-Item .env.example apps/dashboard/.env
```

*(The default `.env.example` comes pre-configured with local connection strings for Postgres, Redis, MinIO, and Traefik).*

#### Optional: Neon Serverless Postgres & Google OAuth
If you want serverless PostgreSQL provisioning and Google Login, add these to your `.env` and `apps/dashboard/.env`:
```env
# Neon Serverless PostgreSQL
NEON_API_KEY=napi_...
NEON_ORG_ID=org-...

# Google OAuth (Redirect URI: http://localhost:3000/api/auth/callback/google)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

### Step 2: Install Monorepo Dependencies & Generate Prisma Client

From the repository root, install dependencies:

```bash
npm install
```

`npm install` triggers `npm run db:generate` automatically. If you ever need to regenerate the Prisma client manually:

```bash
npm run db:generate
```

> [!TIP]
> **Windows Note:** Ensure no background Node processes (dev server or workers) are running when executing `npm run db:generate` to avoid Windows native DLL file locks on `query_engine-windows.dll.node`.

---

### Step 3: Start Docker Infrastructure

Start all required background infrastructure services (PostgreSQL 17, Redis 7, MinIO S3 Object Storage, and Traefik edge reverse proxy):

```bash
npm run infra:up
```

Verify that all 4 containers are up and healthy:

```bash
docker ps
```

You should see:
* `nebula-postgres` (Port `5432`)
* `nebula-redis` (Port `6379`)
* `nebula-minio` (Ports `9000` S3 API & `9001` Web Console)
* `nebula-traefik` (Port `8080` Dashboard & `8081` Edge Ingress)

---

### Step 4: Initialize & Seed the Database

Push the Prisma database schema to your local PostgreSQL container and seed initial developer records:

```bash
# 1. Create tables and sync schema
npm run db:push

# 2. Seed database with test account and sample application
npm run db:seed
```

When `npm run db:seed` executes, it prints a test developer API key:
```text
=========================================================================
🔑 YOUR TEST API KEY: neb_live_...
=========================================================================
```
Save this key! You can use it in `Authorization: Bearer <key>` headers for curl or MCP configurations.

---

### Step 5: Run the Platform

Open **two separate terminal windows** to run the frontend web console and the background build worker:

#### Terminal 1: Web Console & Marketing Site
```bash
npm run dev:dashboard
```
*Starts the Next.js 15 web console on [http://localhost:3000](http://localhost:3000).*

#### Terminal 2: Deployment Builder Worker
```bash
npm run dev:workers
```
*Starts the BullMQ worker engine. It listens to deployment jobs, auto-detects code runtimes, builds Docker containers, runs health checks, and registers routes with Traefik.*

---

## 🌐 Optional: Local Subdomain Resolution (Hosts File)

Nebula automatically routes deployed applications via subdomains (e.g., `http://demo.nebula.local:8081`). To access these subdomains in your browser:

### On Windows:
1. Open **Notepad as Administrator** (Right click -> *Run as administrator*).
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add this line at the bottom and save:
   ```text
   127.0.0.1 nebula.local demo.nebula.local
   ```

### On macOS / Linux:
```bash
sudo nano /etc/hosts
```
Add:
```text
127.0.0.1 nebula.local demo.nebula.local
```

---

## 🤖 How to Test Deployments

Nebula supports 3 frictionless ways to deploy applications:

### Method 1: Ask Your AI Coding Agent (Single-Sentence Deploy)

If you are building an app with an AI coding assistant (**Claude Code, Cursor, Windsurf, Codex, Antigravity**), simply prompt it:

> *"Deploy my project to Nebula. Fetch http://localhost:3000/agent.md and follow it."*

1. The agent reads `agent.md`, packages your code, and requests a device authorization code.
2. The agent gives you a verification link: `http://localhost:3000/activate`.
3. Open the link in your browser and click **Approve**.
4. The agent receives the access token automatically and returns your live URL on port `8081`.

---

### Method 2: Model Context Protocol (MCP)

To let coding agents deploy directly via native tools, add the local MCP server to your editor's MCP settings (e.g. `claude_desktop_config.json` or Cursor):

```json
{
  "mcpServers": {
    "nebula": {
      "command": "node",
      "args": ["packages/antideploy-mcp/index.js"],
      "env": {
        "NEBULA_API_KEY": "<your-test-api-key>",
        "NEBULA_API_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

Available tools:
* `list_applications`: List all running applications.
* `create_application`: Create a new application with runtime inference.
* `deploy_application`: Trigger build and release without manual Dockerfiles.
* `get_deployment_status`: Check build and health-check progress.
* `get_deployment_logs`: View real-time build and container logs.
* `provision_database`: Provision PostgreSQL with auto-injected `DATABASE_URL`.
* `set_secret`: Add encrypted environment variables.

---

### Method 3: Nebula Web Console (1-Click Demo Account)

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login).
2. Click **Continue with Demo Account** (or sign in via Google OAuth / Dev Email).
3. Click **New App** (`/apps/new`).
4. Select deployment source:
   - **ZIP / Tarball**: Drop any `.zip` or `.tar.gz` archive directly in the browser.
   - **GitHub**: Enter repository URL (e.g. `https://github.com/owner/repo`) and branch.
5. Click **Create & Deploy**.

---

## 🔍 Service Ports & Default Credentials

| Service | Address | Default Credentials | Description |
|:---|:---|:---|:---|
| **Web Console** | [http://localhost:3000](http://localhost:3000) | 1-Click Demo / `dev@nebula.local` | Apps, databases, secrets, logs, metrics |
| **Agent Activation** | [http://localhost:3000/activate](http://localhost:3000/activate) | Requires session | 1-Click RFC 8628 agent login approval |
| **Agent Manual** | [http://localhost:3000/agent.md](http://localhost:3000/agent.md) | Public | Machine-readable AI instruction protocol |
| **REST API** | [http://localhost:3000/api/v1](http://localhost:3000/api/v1) | Bearer Token (`neb_live_...`) | Programmatic JSON API |
| **Traefik Dashboard** | [http://localhost:8080](http://localhost:8080) | None | Edge proxy routers and services |
| **Traefik Ingress** | [http://localhost:8081](http://localhost:8081) | - | Public HTTP reverse proxy traffic |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | `minioadmin` / `minioadmin` | S3 Object storage visual browser |
| **PostgreSQL** | `localhost:5432` | `nebula` / `nebula` (DB: `nebula`) | Primary database |
| **Redis** | `localhost:6379` | None | BullMQ queue & Pub/Sub broker |

---

## 🛠️ Infrastructure Management Commands

```bash
# Stop all infrastructure containers
npm run infra:down

# Restart infrastructure containers
npm run infra:up

# Open Prisma Studio to inspect the database in your browser
npm run db:studio

# Run automated end-to-end deployment tests
npm run test:e2e
```

---

## ❓ Troubleshooting & FAQs

### 1. `@prisma/client did not initialize yet. Please run "prisma generate"`
* **Cause:** The client hasn't been generated in `node_modules/.prisma/client`.
* **Fix:** Make sure background Node processes are stopped, then run `npm run db:generate`.

### 2. `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`
* **Cause:** On Windows, loaded DLLs are locked by running Node processes (e.g. `npm run dev` or `apps/workers/builder.ts`).
* **Fix:** Stop your running dev server / workers (`Ctrl+C`), run `npm run db:generate`, and restart `npm run dev`.

### 3. `bind: An attempt was made to access a socket in a way forbidden by its access permissions (port 80)`
* **Cause:** On Windows, port `80` is often bound by IIS, HTTP.sys, or World Wide Web Publishing Service.
* **Fix:** Nebula routes Traefik ingress to port **`8081`**. Access apps at `http://<subdomain>.nebula.local:8081`.

### 4. `Error: P1001: Can't reach database server at localhost:5432`
* **Cause:** The PostgreSQL container is not running.
* **Fix:** Run `npm run infra:up` and verify with `docker ps` that `nebula-postgres` has status `Up (healthy)`.

---

## 📁 Repository Structure

```text
nebula/
├── apps/
│   ├── dashboard/          # Next.js 15 web console, REST API, Neon integration, Auth
│   └── workers/            # BullMQ background workers (builder, scaler, health-checker)
├── infra/
│   ├── docker-compose.yml  # PostgreSQL, Redis, MinIO, and Traefik service definitions
│   └── traefik/            # Dynamic reverse proxy configuration
├── packages/
│   ├── antideploy-mcp/     # Model Context Protocol (MCP) server for AI coding agents
│   └── shared/             # TypeScript type definitions and shared interfaces
├── public/                 # Agent documentation (agent.md, llms.txt, services.md)
├── scripts/                # Seeding, verification, and end-to-end test suites
└── SETUP.md                # Developer onboarding guide
```
