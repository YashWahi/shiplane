# Phase 2: Reference Measurement & Design Specification

**Reference URL:** [Taskible Framer Template](https://taskible.framer.website/) (Home 1 `/` and Home 2 `/home-2`)  
**Measurement Method:** Chrome DevTools computed styles (`window.getComputedStyle`), network font request inspection, and full-page viewport screenshots at 1440px, 1024px, 768px, and 390px.

---

## 1. Screenshots Captured
The reference screenshots are saved in `/docs/redesign/ref/`:
- `ref/home-1-1440.png` — Desktop 1440px full-page capture
- `ref/home-1-1024.png` — Laptop 1024px full-page capture
- `ref/home-1-768.png` — Tablet 768px full-page capture
- `ref/home-1-390.png` — Mobile 390px full-page capture
- `ref/home-2-1440.png` — Home 2 Desktop 1440px capture
- `ref/home-2-1024.png` — Home 2 Laptop 1024px capture
- `ref/home-2-768.png` — Home 2 Tablet 768px capture
- `ref/home-2-390.png` — Home 2 Mobile 390px capture

---

## 2. Typography Specification

### Font Families
- **Primary Sans-Serif:** `Manrope` (Google Fonts: `@fontsource/manrope`, weights: 400, 500, 600, 700)
- **Highlighted Keyword Serif:** `Playfair Display` (Google Fonts: `@fontsource/playfair-display`, weights: 600, style: italic/normal)
- **Monospace (Code / Agent Prompts):** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Heading & Body Style Metrics
| Element | Font Family | Size (1440px) | Size (768px) | Size (390px) | Weight | Line Height | Letter Spacing | Color (Light) | Color (Dark) |
|---|---|---|---|---|---|---|---|---|---|
| **H1 Base** | Manrope | 64px | 48px | 36px | 600 | 70.4px (1.1x) | -1.92px (-0.03em) | `#001A41` | `#F8FBFF` |
| **H1 Highlight** | Playfair Display (italic) | 64px | 48px | 36px | 600 | 70.4px (1.1x) | -1.92px (-0.03em) | `#0066FF` | `#0066FF` |
| **H2 Base** | Manrope | 48px | 36px | 28px | 600 | 52.8px (1.1x) | -1.44px (-0.03em) | `#001A41` | `#F8FBFF` |
| **H2 Highlight** | Playfair Display (italic) | 48px | 36px | 28px | 600 | 52.8px (1.1x) | -1.44px (-0.03em) | `#0066FF` | `#0066FF` |
| **H3 (Numbers)** | Manrope | 32px | 28px | 24px | 600 | 35.2px (1.1x) | -0.96px | `#001A41` | `#F8FBFF` |
| **H4 (Card Titles)** | Manrope | 24px | 22px | 20px | 600 | 26.4px (1.1x) | -0.72px | `#001A41` | `#F8FBFF` |
| **H5 (Subheaders)** | Manrope | 20px | 18px | 18px | 600 | 22.0px (1.1x) | -0.60px | `#001A41` | `#F8FBFF` |
| **Body / Subcopy** | Manrope | 16px | 16px | 15px | 400 | 25.6px (1.6x) | 0px | `#475569` | `#A3ACBA` |
| **Eyebrow Pill** | Manrope | 13px | 12px | 12px | 700 | 16.0px | +0.06em | `#0066FF` | `#38BDF8` |
| **Button Text** | Manrope | 15px | 14px | 14px | 600 | 20.0px | -0.15px | `#FFFFFF` | `#FFFFFF` |

---

## 3. Color System & Gradients
- **Page Background:** `#FFFFFF` (clean light mode) / `#001A41` to `#05050A` (deep dark midnight mode)
- **Section Surfaces:**
  - Standard card: `#F8FBFF`
  - Subtle contrast card: `#F2F8FF`
  - Tinted highlight card: `#E5EFFF` (`rgb(229, 239, 255)`)
- **Text Colors:**
  - Primary: `#001A41` (`rgb(0, 26, 65)`)
  - Secondary: `#475569` / `#8093B1` (`rgb(128, 147, 177)`)
  - Muted: `#8093B1` (`rgb(128, 147, 177)`)
- **Primary Accent:** `#0066FF` (`rgb(0, 102, 255)`)
- **Primary Button Fill:** Electric blue `#0066FF` with gradient `linear-gradient(135deg, #0066FF 0%, #297FFF 100%)`
- **Button Shadow:** `0px 0px 0px 1px #0063FB, 0px 0.5px 0.5px 0px rgba(69, 144, 178, 0.25) inset, 0px -6px 12px 0px rgba(255, 255, 255, 0.1) inset`
- **Highlight Keyword Formula:** Applied to the final keyword or phrase in H1 and H2 headings (`"Playfair Display", serif`, `font-style: italic`, `color: #0066FF`).

---

## 4. Layout & Proportions
- **Container Max-Width:** `1300px` (outer section container), `1220px` (inner content grid)
- **Container Side Padding:** `40px` (desktop 1440px), `24px` (tablet 768px), `16px` (mobile 390px)
- **Section Vertical Padding:** `80px` to `100px`
- **Card Border Radius:** `24px` across all cards, bento blocks, and pricing cards
- **Pill Border Radius:** `9999px` (or `25px`) for buttons, badges, and floating navbar
- **Card Padding:** `32px` to `40px` (desktop), `24px` (mobile)

---

## 5. Header / Navbar
- **Height:** `64px` to `72px`
- **Structure:** Floating rounded pill navigation bar centered with top margin (`top: 16px`)
- **Background:** `rgba(255, 255, 255, 0.85)` in light mode, `rgba(0, 26, 65, 0.85)` in dark mode with `backdrop-filter: blur(20px)`
- **Border:** `1px solid rgba(0, 102, 255, 0.12)` (light) / `1px solid rgba(255, 255, 255, 0.12)` (dark)
- **Shadow:** `0 10px 30px -10px rgba(0, 26, 65, 0.08)`
- **Right Action Button:** Pill CTA with electric blue fill `#0066FF` and white text.

---

## 6. Motion & Animations
- **Durations:** `0.3s` to `0.45s`
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`
- **Hover Transitions:**
  - Card lift: `transform: translateY(-4px)`
  - Button hover: `transform: scale(1.02)`, box shadow glow intensity expands
- **Accordion:** Smooth height transition `0.3s ease-out` on FAQ and numbered workflow items
- **Prefers-reduced-motion:** All transitions disable or shorten when user prefers reduced motion.

---

## 7. Breakpoints
- **Desktop:** `≥ 1280px` / `1440px`
- **Laptop:** `1024px`
- **Tablet:** `768px` (bento collapses to 2 columns, pricing to 2 columns, nav collapses to mobile trigger)
- **Mobile:** `390px` / `360px` (single-column layout, stacked buttons, reduced heading size to 36px)
