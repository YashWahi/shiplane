# Phase 3: Section-by-Section Implementation Plan

**Goal:** Rebuild the frontend visual design of ShipLane to closely match the layout, typography, proportions, and motion of the Taskible Framer Template (`https://taskible.framer.website/`), while preserving 100% of ShipLane's functionality, routes, and data models.

---

## 1. Landing Page Section Mapping Table

| # | Taskible Reference Section | ShipLane Target Route & Section | Component to Rewrite | Required Layout, CSS & Typography Changes (from Phase 2) | Functionality to Preserve | Excluded / Omitted Elements & Reason |
|---|---|---|---|---|---|---|
| **1** | Floating Pill Navbar | `/` & all pages header | `Navbar` (`page.tsx`) | Height `68px`, centered pill (`rounded-full max-w-[1220px]`), `backdrop-blur-xl`, `border-blue-500/15`, brand squircle with Rocket icon, Manrope 15px nav links, pill CTA button (`#0066FF`) | Links to `#how-it-works`, `#why-ShipLane`, `#features`, `#pricing`, `/agent.md`, `/login`, `/apps`, `ThemeToggle` | Omit fake "All Pages" template dropdown (no dummy links) |
| **2** | Hero Section (3-line H1 with "— Effortlessly." line, subcopy, CTA, dashboard) | `/` Hero section | Hero block (`page.tsx`) | H1 64px (line 1: "Put your app online.", line 2: "Just ask your agent,", line 3: *"— Effortlessly."* in Playfair Display italic `#0066FF`). Eyebrow pill in `#0066FF` 13px bold. Subcopy Manrope 18px `#475569`. Action card with terminal header and prompt snippet. Large SaaS interactive dashboard with floating live indicators. | Monospace prompt string, `CopyPromptButton` with clipboard write + toast, `Open Web Console` button to `/apps` | Omit Taskible template sales CTAs and dummy trial counters |
| **3** | Inbox / Boards / Planner Trio (Home 1 feature cards) | `/` Feature Highlights | Trio card row | 3 cards (`rounded-[24px] bg-[#F8FBFF] p-8 border border-blue-500/10`), Manrope 24px H4 titles, squircle icon containers with blue glow | Real ShipLane features: 1. Zero-Config Inference, 2. Instant Postgres, 3. Scale-to-Zero Runtimes | Omit Taskible generic task management copy |
| **4** | 01–04 Numbered Accordion / Workflow Progression | `/` How It Works (`#how-it-works`) | `HowItWorks` block | Section H2 48px with *"— Flawlessly."* in Playfair Display italic `#0066FF`. 4 cards with 32px Manrope numbers (`01.`, `02.`, `03.`, `04.`), card radius 24px, subtle border highlight, interactive hover lift. | Steps: 1. Copy Prompt, 2. Paste into Agent, 3. 1-Click Approval, 4. Get Live Link | Omit template placeholder text |
| **5** | Chat ➔ Checkmark / Comparison Section | `/` Why ShipLane (`#why-ShipLane`) | Comparison cards block | Section H2 48px with *"— Seamlessly."* in Playfair Display. 2 contrasting cards: Left (`bg-[#FFF5F5] border-red-500/20` for Traditional Cloud/Vercel) vs Right (`bg-[#F0F7FF] border-blue-500/30 shadow-xl` for ShipLane Agent Way) | Comparison bullet points: git configs vs zero-config, cryptic errors vs automatic inference, manual DB vs auto-injected Postgres, token risk vs RFC 8628 | None |
| **6** | Features Bento Grid | `/` Features (`#features`) | Bento Grid block | Asymmetric bento grid (`1220px max-width`, 24px gaps, 24px card radius). Cards use `#F8FBFF` (light) / `#050F26` (dark), glowing squircle icon boxes (`48x48px`), runtime badges (`Next.js`, `Python`, `Go`, `Node`), and active status chips. | Real technical features: Inference, PostgreSQL & S3, Scale-to-Zero, Previews, MCP Server, Multi-source deploy | Omit dummy template illustration graphics |
| **7** | Pricing Cards with Highlighted Center Plan | `/` & `/pricing` | Pricing grid block | Section H2 48px with *"— Transparently."* in Playfair Display. 4 plan cards (`rounded-[24px] p-8`). Pro plan highlighted with 2px `#0066FF` border, subtle blue glow, and `Most Popular` badge. Checkmarks with emerald circles. Pill CTA buttons. | Real plans: Free (₹0), Go (₹399), Pro (₹1,999), Scale (₹6,999). Action links to `/login` | Omit template $USD pricing and fake enterprise terms |
| **8** | Integrations Strip / Trust Badges | `/` Framework Badges | Badges ribbon | Clean pill container with verified runtime logos: Next.js, Node.js, Python, PostgreSQL, Go, Docker, Traefik | Displays real supported runtimes | Omit Taskible generic fake logos |
| **9** | Testimonials Marquee / Slider | N/A | N/A | **OMIT** | N/A | **OMIT:** ShipLane does not have fake customer testimonials. Hard Rule 1 strictly forbids fake testimonials or invented social proof. |
| **10** | Blog Cards | N/A | N/A | **OMIT** | N/A | **OMIT:** ShipLane does not have an active blog engine. Hard Rule 1 strictly forbids placeholder blog posts. |
| **11** | FAQ Accordion | `/` & `/pricing` FAQ | FAQ block | Single-column accordion (`800px max-width`), enclosed cards (`rounded-[16px] bg-[#F8FBFF] border border-blue-500/10 mb-3`), rotating chevron indicator, smooth height expansion. | 4 real ShipLane technical FAQs | Omit template generic questions |
| **12** | CTA Banner | `/` Pre-Footer CTA | Action banner | Luminous rounded banner (`rounded-[32px] p-12 bg-gradient-to-br from-[#001A41] to-[#0A255C] text-white shadow-2xl`), H2 40px, prompt copy pill + console button. | Action triggers: `CopyPromptButton` and link to `/apps` | Omit template "Buy Template" buttons |
| **13** | Footer | `/` & `/pricing` Footer | Footer block | Multi-column layout with ShipLane wordmark, rocket icon squircle, live status indicator (`● Systems Operational`), categorized links (`agent.md`, `/pricing`, `/privacy`, `/terms`, GitHub). | Real destinations and external links | Omit template copyright & purchase links |

---

## 2. Order of Sections on the Rebuilt Landing Page
1. **Floating Pill Navbar** (Logo, Nav items, ThemeToggle, Sign In, Console)
2. **Hero Section** (Eyebrow pill, 3-line H1 with Playfair Display italic highlight, Subtitle, Interactive Prompt Action Box, Trust micro-chips)
3. **Interactive SaaS Deployment Showcase Card** (Live HTTPS preview, runtime log terminal, health metrics)
4. **Feature Highlights Trio** (Zero-Config, Instant PostgreSQL, Scale-to-Zero)
5. **How It Works (01–04 Workflow Cards)** (Copy Prompt ➔ Paste into Agent ➔ 1-Click Approval ➔ Get Live Link)
6. **Comparison Section ("Why ShipLane: Deploying AI-built code shouldn't require a DevOps degree")**
7. **Platform Features Bento Grid** (6 bento cards with squircle icons and runtime pills)
8. **Supported Runtimes & Agent Ecosystem Strip** (Claude Code, Cursor, Windsurf, Next.js, Python, PostgreSQL)
9. **Simple Pricing for Powerful Productivity** (Free, Go, Pro [Featured], Scale)
10. **FAQ Accordion** (4 real technical questions)
11. **Pre-Footer Action Banner** (Instant deployment prompt & console link)
12. **Multi-Column Footer** (Brand, status indicator, documentation, legal, GitHub)

---

## 3. Propagation of Tokens to Authenticated & Shared App Pages
To ensure the entire product feels cohesive and visually unified (not just the landing page):
- **Global Theme Tokens (`globals.css`):**
  - Font stacks `--font-sans: 'Manrope', sans-serif;` and `--font-serif: 'Playfair Display', serif;` configured on `body`.
  - Color palette updated with `#001A41` navy, `#0066FF` electric blue, `#F8FBFF` card surface, and `#E5EFFF` borders.
- **Shared Primitives:**
  - `Button` (`components/ui/button.tsx`): Updated with Taskible's electric blue gradient, pill radius (`rounded-full`), and specular inset shadows.
  - `Card` (`components/ui/card.tsx`): Updated to default to `rounded-[24px]` with `border-blue-500/10` and `#F8FBFF` (light) / `#050F26` (dark) background.
  - `Badge` (`components/ui/badge.tsx`): Updated with `pill` variant in `#0066FF` with `rounded-full`.
  - `Input` (`components/ui/input.tsx`): Updated with `rounded-xl`, `border-border/80`, focus ring in `#0066FF`.
- **Console & Auth Pages (`/login`, `/activate`, `/apps`):**
  - Login & activate pages inherit the `rounded-[24px]` card containers, specular highlight borders, and electric blue primary CTA buttons.
  - Console navigation and app cards inherit the Manrope font family, squircle icon containers, and clean card spacing.
