# Phase 1: Codebase Audit & Functional Inventory

**Project:** ShipLane (Autonomous Application Cloud Platform)  
**Status:** Audit Completed  
**Rule:** Every item below marked **MUST PRESERVE** is functionally immutable during this visual overhaul.

---

## 1. Technology Stack & Styling Architecture
- **Framework:** Next.js 15.1.4 (App Router), React 19.0.0, TypeScript 5.7.3 — **[MUST PRESERVE]**
- **Monorepo Architecture:** npm workspaces (`apps/dashboard`, `apps/workers`, `packages/shared`, `packages/antideploy-mcp`) — **[MUST PRESERVE]**
- **Styling System:** Tailwind CSS 3.4.17 with `tailwindcss-animate`, Radix UI primitives (`@radix-ui/react-*`), Lucide React icons — **[MUST PRESERVE]**
- **Runtime & DB Engine:** Node.js, Prisma ORM 6.3.0, PostgreSQL, Dockerode, BullMQ 5.34.0, MinIO / S3 SDK — **[MUST PRESERVE]**

---

## 2. Page Hierarchy & Routes
| Route | Type | File Path | Functional Purpose | Status |
|---|---|---|---|---|
| `/` | Marketing Landing | `apps/dashboard/app/(marketing)/page.tsx` | Main product landing page explaining ShipLane, agent prompts, comparison, 4-step workflow, features, pricing, FAQ | **[MUST PRESERVE]** |
| `/pricing` | Marketing Pricing | `apps/dashboard/app/(marketing)/pricing/page.tsx` | Dedicated pricing breakdown, plan cards (Free, Go, Pro, Scale), comparison matrix, FAQ | **[MUST PRESERVE]** |
| `/login` | Auth | `apps/dashboard/app/(auth)/login/page.tsx` | Sign-in with Demo account (`demo@nebula.local`), Google OAuth, or custom developer email | **[MUST PRESERVE]** |
| `/activate` | Auth / RFC 8628 | `apps/dashboard/app/(auth)/activate/page.tsx` | Device authorization code verification grant for AI coding agents & CLI | **[MUST PRESERVE]** |
| `/apps` | Console App List | `apps/dashboard/app/(console)/apps/page.tsx` | List of deployed applications with status, health, and links | **[MUST PRESERVE]** |
| `/apps/new` | Console Deploy Wizard | `apps/dashboard/app/(console)/apps/new/page.tsx` | Multi-source deployment wizard (Agent, GitHub, Folder upload) | **[MUST PRESERVE]** |
| `/apps/[id]` | Console Overview | `apps/dashboard/app/(console)/apps/[id]/page.tsx` | App metrics, runtime info, domains, and controls | **[MUST PRESERVE]** |
| `/apps/[id]/databases` | Console Databases | `apps/dashboard/app/(console)/apps/[id]/databases/page.tsx` | Provisioned Postgres databases, connection credentials, metrics | **[MUST PRESERVE]** |
| `/apps/[id]/deployments` | Console Deployments | `apps/dashboard/app/(console)/apps/[id]/deployments/page.tsx` | Deployment timeline, rollback triggers, build history | **[MUST PRESERVE]** |
| `/apps/[id]/logs` | Console Logs | `apps/dashboard/app/(console)/apps/[id]/logs/page.tsx` | Live build logs, container stdout/stderr streams | **[MUST PRESERVE]** |
| `/apps/[id]/previews` | Console Previews | `apps/dashboard/app/(console)/apps/[id]/previews/page.tsx` | Pull-request / branch-specific preview environments | **[MUST PRESERVE]** |
| `/apps/[id]/scaling` | Console Scaling | `apps/dashboard/app/(console)/apps/[id]/scaling/page.tsx` | Scale-to-zero configuration, replica rules | **[MUST PRESERVE]** |
| `/apps/[id]/settings` | Console Settings | `apps/dashboard/app/(console)/apps/[id]/settings/page.tsx` | Env variables editor, custom domains, delete app | **[MUST PRESERVE]** |
| `/settings` | Global Settings | `apps/dashboard/app/(console)/settings/page.tsx` | User profile, API keys, platform preferences | **[MUST PRESERVE]** |

---

## 3. Navigation, Buttons & Actions Inventory

### Header / Navbar Navigation
- **Brand Logo:** `Link href="/"` displaying Rocket icon and `ShipLane` — **[MUST PRESERVE]**
- **Navigation Links:**
  - `How It Works` ➔ Anchor `#how-it-works` — **[MUST PRESERVE]**
  - `Why ShipLane` ➔ Anchor `#why-ShipLane` — **[MUST PRESERVE]**
  - `Features` ➔ Anchor `#features` — **[MUST PRESERVE]**
  - `Pricing` ➔ Anchor `#pricing` — **[MUST PRESERVE]**
  - `Docs` ➔ External link to `/agent.md` (`target="_blank"`) — **[MUST PRESERVE]**
- **Header Actions:**
  - `ThemeToggle` ➔ Dynamic dark/light theme switch — **[MUST PRESERVE]**
  - `Sign In` ➔ `Link href="/login"` — **[MUST PRESERVE]**
  - `Console` ➔ `Link href="/apps"` — **[MUST PRESERVE]**

### Hero Actions & Interactions
- **Prompt String:** `"Deploy my project to Nebula. Fetch https://nebula.app/agent.md and follow it."` — **[MUST PRESERVE]**
- **Copy Agent Prompt Button:** Written to clipboard via `navigator.clipboard.writeText(...)` + Toast feedback — **[MUST PRESERVE]**
- **Open Web Console Button:** `Link href="/apps"` with arrow icon — **[MUST PRESERVE]**

### Pricing Tier Actions
- **Free Plan Button ("Get Started Free"):** `Link href="/login"` — **[MUST PRESERVE]**
- **Go Plan Button ("Upgrade to Go"):** `Link href="/login"` — **[MUST PRESERVE]**
- **Pro Plan Button ("Upgrade to Pro"):** `Link href="/login"` — **[MUST PRESERVE]**
- **Scale Plan Button ("Contact Sales"):** `Link href="/login"` — **[MUST PRESERVE]**

### Pre-Footer CTA Banner
- **Copy Prompt Button:** Triggers prompt copy to clipboard — **[MUST PRESERVE]**
- **Open Web Console:** `Link href="/apps"` — **[MUST PRESERVE]**

### Footer Links
- Brand Logo / Home ➔ `Link href="/"` — **[MUST PRESERVE]**
- Agent Docs ➔ `Link href="/agent.md"` (`target="_blank"`) — **[MUST PRESERVE]**
- Pricing ➔ `Link href="/pricing"` — **[MUST PRESERVE]**
- Privacy ➔ `Link href="/privacy"` — **[MUST PRESERVE]**
- Terms ➔ `Link href="/terms"` — **[MUST PRESERVE]**
- GitHub ➔ `Link href="https://github.com"` (`target="_blank"`) — **[MUST PRESERVE]**

### Auth & Form Handlers
- **Demo Login Button:** Calls `handleSignIn("demo@nebula.local", true)` via NextAuth credentials — **[MUST PRESERVE]**
- **Google Sign-In Button:** Calls `signIn("google", { callbackUrl: "/apps" })` — **[MUST PRESERVE]**
- **Custom Email Form:** Email state validation, triggers `handleSignIn(email)` — **[MUST PRESERVE]**
- **Device Authorization Form (`/activate`):**
  - `userCode` input field (8-character alphanumeric code) — **[MUST PRESERVE]**
  - `Approve` button ➔ calls Server Action `approveDeviceCode(code)` — **[MUST PRESERVE]**
  - `Deny` button ➔ calls Server Action `denyDeviceCode(code)` — **[MUST PRESERVE]**

---

## 4. API Routes, Server Actions, Database & External Services
- **Auth Routes:** `app/api/auth/[...nextauth]/route.ts` — **[MUST PRESERVE]**
- **API v1 Endpoints:**
  - `/api/v1/applications` (GET, POST) — **[MUST PRESERVE]**
  - `/api/v1/applications/[id]` (GET, PATCH, DELETE) — **[MUST PRESERVE]**
  - `/api/v1/databases` & `[id]` — **[MUST PRESERVE]**
  - `/api/v1/deploy` (POST - trigger app compilation & containerization) — **[MUST PRESERVE]**
  - `/api/v1/deployments/[id]` — **[MUST PRESERVE]**
  - `/api/v1/device/code` & `/device/token` (RFC 8628 OAuth Device Authorization flow) — **[MUST PRESERVE]**
  - `/api/v1/domains`, `/api/v1/health`, `/api/v1/logs`, `/api/v1/metrics`, `/api/v1/previews`, `/api/v1/scaling`, `/api/v1/secrets`, `/api/v1/security/scans` — **[MUST PRESERVE]**
- **Database Access:** Prisma client with PostgreSQL (`DATABASE_URL`) — **[MUST PRESERVE]**
- **Worker Queue:** BullMQ with Redis (`REDIS_URL`) — **[MUST PRESERVE]**
- **Object Storage:** MinIO S3 SDK — **[MUST PRESERVE]**
- **Encryption:** AES-256 with `MASTER_ENCRYPTION_KEY` — **[MUST PRESERVE]**

---

## 5. Brand Identity & Real Content (Never Copy Template Placeholder Copy)
- **Brand Name:** `ShipLane` (ShipLane Cloud) — **[MUST PRESERVE]**
- **Tagline / Value Proposition:** "Put your app online. Just ask your agent." — **[MUST PRESERVE]**
- **Core Narrative:** Zero-config deployment platform for AI coding agents and non-technical creators. Eliminates Vercel, AWS, and Docker complexity. Automatic runtime inference, built-in managed PostgreSQL, scale-to-zero compute, and RFC 8628 device flow. — **[MUST PRESERVE]**
- **Pricing Tiers (in INR):** Free (₹0), Go (₹399/mo), Pro (₹1,999/mo), Scale (₹6,999/mo) — **[MUST PRESERVE]**
- **Excluded Template Terms:** Never copy "Taskible", "Trello", "Butler", "Creazup", "Steve Jobs", "Smart Lending", "Flexible loans", "Doctors from 53+ hospitals", "Fiber Technology", "Real-time threat detection", or template purchase buttons.
