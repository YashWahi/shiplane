# ShipLane: Put Your App Online. Just Ask Your Agent.

> The agent-native Platform-as-a-Service (PaaS) built for non-technical creators and modern developers. Connect with your AI coding agent (Claude Code, Cursor, Windsurf, Codex, Antigravity) and auto-deploy websites and apps without dealing with Vercel, Docker, AWS, or DevOps configurations.

---

## 🎯 The ShipLane Premise (Zero Vercel/Cloud Overhead)

If an AI coding assistant can write your application code, you shouldn't have to spend hours fighting cloud dashboards, creating GitHub Actions, configuring Vercel build presets, or stitching together external database providers:

1. **Prompt Your Agent in 1 Sentence:**
   ```text
   Deploy my project to ShipLane. Fetch https://ShipLane.app/agent.md and follow it.
   ```
2. **Approve in Browser:** Open `https://ShipLane.app/activate` (or `http://localhost:3000/activate`) and click **Approve** (RFC 8628 OAuth Device Flow — zero API key leaks in chat).
3. **Your App is Live:** ShipLane automatically detects your framework (Next.js, Node, Python, Django, Vite, Go, Ruby), spins up an isolated PostgreSQL database with `DATABASE_URL` injected, and gives you a live HTTPS link.

---

## 🚀 Key Features

* **AI Agent Native:** Built specifically to receive deployments directly from AI coding assistants via REST API or Model Context Protocol (`ShipLane-mcp`).
* **Zero Configuration:** No `Dockerfile` or YAML required. Automatically infers runtimes, dependencies, build commands, and listening ports.
* **1-Click Device Activation (`/activate`):** RFC 8628 Device Authorization Grant allows AI agents to securely connect without users copying/pasting sensitive tokens.
* **Instant Managed PostgreSQL & S3:** Dedicated containerized database with connection strings automatically injected into your app runtime.
* **Scale-to-Zero Compute:** Server apps sleep when idle to eliminate compute costs, waking within milliseconds on incoming HTTP traffic.
* **Ephemeral Previews:** Staging URLs generated automatically for branch pushes and pull requests.
* **Transparent Pricing:** Permanent Free tier (₹0), Go (₹399/mo), Pro (₹1,999/mo), and Scale (₹6,999/mo). Failed deploys never count against limits!

---

## 📋 Local Setup & Prerequisites

> [!TIP]
> **New to the project?** Follow our step-by-step [Developer Setup Guide (SETUP.md)](SETUP.md) for detailed onboarding, port configurations, and MCP setup.

1. **Node.js 20+** (`node -v` >= 20.0.0)
2. **Docker Desktop** (must be launched and running)
3. **Hosts file entry** (for local domain routing):
   ```text
   127.0.0.1 ShipLane.local demo.ShipLane.local
   ```

---

## ⚡ Quickstart

```bash
# 1. Start all infrastructure containers (Postgres, Redis, MinIO, Traefik)
npm run infra:up

# 2. Push Prisma database schema to local Postgres
npm run db:push

# 3. Seed database with test account and sample application
npm run db:seed
```

---

## 🖥️ Running the Platform

Run the web console dashboard and the deployment worker engine in two terminal windows:

### Terminal 1: Web Console & Marketing Site
```bash
npm run dev:dashboard
```
*Starts the Next.js 15 ShipLane console on `http://localhost:3000`.*

### Terminal 2: Deployment Builder Worker
```bash
npm run dev:workers
```
*Starts the BullMQ worker engine listening for deployment jobs, compiling containers, and updating Traefik dynamic routing.*

---

## 🔌 Model Context Protocol (MCP) Integration

Connect Claude Code, Cursor, Windsurf, or Codex directly to ShipLane via MCP:

```json
{
  "mcpServers": {
    "ShipLane": {
      "command": "node",
      "args": ["packages/antideploy-mcp/index.js"],
      "env": {
        "ShipLane_API_KEY": "<your_api_key>",
        "ShipLane_API_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

Exposes native tools: `list_applications`, `create_application`, `deploy_application`, `get_deployment_status`, `get_deployment_logs`, `provision_database`, `set_secret`.

---

## 🔍 Access Points & Endpoints

| Service | URL | Notes |
|:---|:---|:---|
| **ShipLane Homepage & Console** | [http://localhost:3000](http://localhost:3000) | Landing page, Pricing, Console, Apps |
| **Device Activation** | [http://localhost:3000/activate](http://localhost:3000/activate) | RFC 8628 1-click agent approval page |
| **Agent Manual** | [http://localhost:3000/agent.md](http://localhost:3000/agent.md) | Plain-text AI instruction manual with curl examples |
| **Pricing Page** | [http://localhost:3000/pricing](http://localhost:3000/pricing) | Free, Go, Pro, Scale tier comparison |
| **LLMs Discovery** | [http://localhost:3000/llms.txt](http://localhost:3000/llms.txt) | LLM discovery standard metadata |
| **REST API Contract** | [http://localhost:3000/api/v1](http://localhost:3000/api/v1) | Full machine-readable JSON specification |
| **Traefik Dashboard** | [http://localhost:8081](http://localhost:8081) | Live ingress routers, entrypoints, and container bridges |
| **MinIO S3 Console** | [http://localhost:9001](http://localhost:9001) | User: `minioadmin` / Pass: `minioadmin` |
| **Postgres Database** | `localhost:5432` | User: `ShipLane` / Pass: `ShipLane` / DB: `ShipLane` |
| **Redis Cache** | `localhost:6379` | BullMQ message queue broker |

---

## 💳 Pricing Plans (Zero Failure Penalty)

| Plan | Price | Server Apps | Static Sites | Postgres DB | Domains |
|:---|:---|:---:|:---:|:---:|:---|
| **Free** | ₹0 / forever | 1 (auto-sleep) | Unlimited | 1 | ShipLane subdomain |
| **Go** | ₹399 / mo | 3 | Unlimited | 1 | 3 custom domains + HTTPS |
| **Pro** | ₹1,999 / mo | 9 | Unlimited | 3 | Unlimited domains + ₹100 AI credit |
| **Scale** | ₹6,999 / mo | 20 | Unlimited | 5 | Unlimited domains + Direct support |

*Failed deployments never count against monthly allowances.*
