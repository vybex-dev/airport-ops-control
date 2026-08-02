# Airport Operations Control Center (DEL / VIDP)

> **Frontend Wars 2026 — Grand Finale Hackathon Entry**  
> A real-time, frontend-only operational control room dashboard for **Indira Gandhi International Airport (DEL)**, animating 11,827 multi-dataset records across 8 interconnected operational domains.

---

## 📑 Table of Contents
1. [Quick Start & Setup Instructions](#1-quick-start--setup-instructions)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
   - [Real-Time Simulation Engine & Indexing](#real-time-simulation-engine--indexing)
   - [Cross-Dataset Relational Joins](#cross-dataset-relational-joins)
   - [Algorithmic Alert Rules Engine](#algorithmic-alert-rules-engine)
4. [Feature Summary Mapped to Evaluation Criteria](#4-feature-summary-mapped-to-evaluation-criteria)
5. [Deployment Guide (Vercel / Netlify)](#5-deployment-guide-vercel--netlify)
6. [Lighthouse Report Analysis & High-Leverage Optimizations](#6-lighthouse-report-analysis--high-leverage-optimizations)

---

## 1. Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Execution
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Run local development server
npm run dev
# -> Local server available at http://localhost:5173

# 3. Type-check TypeScript codebase
npx tsc -b

# 4. Build for production (Code-split bundles)
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 2. Technology Stack

- **Framework & Core**: React 19, TypeScript 6.0, Vite 8.2
- **State Management**: Zustand 5.0 (Global virtual clock store & persistent alert acknowledgment state)
- **Styling & Design System**: Tailwind CSS v4 (CSS-first configuration with custom design tokens in `@theme`)
- **Virtualization**: `@tanstack/react-virtual` v3 (Rendering 1,000+ FIDS rows, 2,800 baggage items, and 2,500 security logs at 60fps)
- **Animation & Motion**: Framer Motion 12 (`prefers-reduced-motion` accessible numerical counters & status badge flips)
- **Visualization**: Recharts 3.10 (Security throughput & queue latency area/bar charts with virtual "NOW" reference marker)
- **Iconography & Fonts**: Lucide React SVGs, Google Fonts (Inter display typography & IBM Plex Mono tabular numeric data face)

---

## 3. Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    DEL 90-Day Static Dataset (CSVs)  │
                      │  (Oct 1, 2024 to Dec 30, 2024 / DEL) │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Event Indexer (eventIndexer.ts)   │
                      │  Pre-indexes 11,827 records into     │
                      │  chronological O(log N) SimEvents   │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
┌───────────────────────────┐  10 Ticks / sec  ┌───────────────────────────┐
│   useSimClockStore (Zustand)│ ──────────────> │    useSimEngineHooks      │
│   currentTimeMs / Speed   │                  │  Active Events / Alerts   │
└───────────────────────────┘                  └─────────────┬─────────────┘
                                                             │
                                                             ▼
                                               ┌───────────────────────────┐
                                               │ Algorithmic Alert Engine  │
                                               │  5 Real-time Rule Checkers│
                                               └─────────────┬─────────────┘
                                                             │
                                                             ▼
                                               ┌───────────────────────────┐
                                               │ FIDS Board / Gantt / BHS  │
                                               │ Security / Cross-Drawers  │
                                               └───────────────────────────┘
```

### Real-Time Simulation Engine & Indexing
Instead of re-filtering or re-sorting 11,827 raw records on every frame tick, the engine pre-indexes all operations at initialization (`src/lib/sim/eventIndexer.ts`):
1. Records from `flights`, `gateEvents`, `baggage`, `securityScreening`, and `maintenanceLogs` are normalized into a unified `SimEvent` timestamped structure.
2. The indexer provides a binary search cursor (`getActiveSimEvents(currentTimeMs)`) with $O(\log N)$ temporal lookup complexity.
3. The virtual clock (`useSimClockStore`) ticks at 10 Hz (100ms intervals), advancing virtual time by `deltaRealMs * speedMultiplier` (supporting 1x realtime up to 3600x fast-forward).

### Cross-Dataset Relational Joins
The application integrates 8 heterogeneous dataset domains into a single unified operational view. When an operator selects any flight (e.g. `6E-204`), the system executes live relational joins (`src/lib/flights/flightDataService.ts`):
- **Flight ↔ Gate**: Joins `assignedGate` with `gateEvents.csv` to calculate turnaround window & buffer.
- **Flight ↔ Baggage**: Joins `flightNumber` with `baggage.csv` to aggregate checked luggage count, SLA delivery status, and carousel assignment.
- **Flight ↔ Passengers**: Filters passenger manifest by `flightId` to expose passenger PNRs, seat numbers, check-in timestamps, and security clearance status.
- **Flight ↔ Maintenance**: Queries `maintenanceLogs.csv` by aircraft registration (e.g. `VT-ABC`) to fetch open work orders and defect severity levels.
- **Flight ↔ Alerts**: Joins active simulation alerts generated by the rules engine targeting the specific flight or aircraft tail.

### Algorithmic Alert Rules Engine
The engine continuously evaluates 5 core operational risk rules (`src/lib/sim/alertRulesEngine.ts`):

| Rule ID | Operational Risk Trigger | Severity | Target Entity |
|---|---|---|---|
| `RULE_FLIGHT_DELAY` | Departure delay $\ge 60$m (Warning) or $\ge 150$m (Critical) when `currentTime >= scheduledDeparture`. | `warning` / `critical` | Flight ID |
| `RULE_GATE_CONFLICT` | Two flights scheduled at the exact same gate with $< 45$m turnaround buffer. | `warning` | Flight ID & Gate # |
| `RULE_MAINTENANCE_DEFECT` | Maintenance log opened for `VT-ABC` with severity level 3 (`Hydraulic leak` / `Seal`). | `critical` | Work Order ID / Reg |
| `RULE_BAGGAGE_DELAY` | Bag check-in timestamp passed with extended handling interval beyond SLA. | `info` | Bag Tag ID |
| `RULE_SECURITY_LATENCY` | Security screening volume exceeding lane clearance rate during peak hours. | `info` | Screening ID |

---

## 4. Feature Summary Mapped to Evaluation Criteria

### 1. Operational Thinking (Weight: 25%)
- **System Readiness Level (DEFCON)**: Master operational alert status (`NOMINAL` / `ELEVATED` / `WARNING` / `CRITICAL`) computed dynamically based on active flight delays, gate collisions, and open maintenance work orders.
- **Gate Turnaround Conflict Detection**: Visual collision indicators on concourse Gantt timeline whenever two aircraft overlap within a 45-minute buffer.
- **BHS SLA Telemetry**: Real-time bag lifecycle stage tracking (`Check-in` → `Loaded / Transit` → `Delivered / Claim`) with SLA breach warnings.

### 2. Deep Functionality & Features (Weight: 20%)
- **FIDS Departure Schedule Board**: Virtualized FIDS board with multi-field search, airline/destination filter pills, and live delay tracking.
- **Concourse Gantt Timeline**: Interactive timeline chart visualizing Gate B1–B50 turnaround occupancies relative to virtual "NOW".
- **Security Queue Monitor**: 24-hour rolling entry vs clearance throughput chart and status breakdown for Lanes 1–8.
- **Global Alerts & Incident Drawer**: Slide-out drawer & dedicated `/alerts` route with severity filters, unacknowledged badge counter, and batch acknowledge actions.

### 3. Data Integration & Relational Joins (Weight: 20%)
- **Unified 6-Tab Flight Detail Drawer**: Click any flight anywhere in the app to inspect its Overview, Passengers, Baggage, Gate Events, Maintenance, and active Alerts in a single panel.
- **Bidirectional PNR & Bag Tag Drill-Through**: Drill from a bag tag to the passenger's PNR, and from the passenger back to their flight manifest.

### 4. UI/UX & Design Excellence (Weight: 15%)
- **Control-Room Aesthetics**: Purposeful dark theme using ATC radar phosphor green (`#2fd97c`), split-flap amber (`#f5a623`), signal blue (`#3ba7ff`), and electric cyan (`#00e5ff`).
- **WCAG AA Compliance**: High-contrast ratios ($\ge 5.6:1$ to $16.8:1$), explicit ARIA labels on icon-only buttons, keyboard navigation support (`Tab`, `Enter`, `Space`, `⌘K`), and high-visibility focus rings.
- **Responsive Layout**: Fluid breakpoints adapting from 1280px desktop screens down to laptop and mobile viewports.

### 5. Real-Time Simulation Experience (Weight: 10%)
- **Scrubbable Virtual Timeline**: Play/pause toggle, speed multiplier controls (1x to 3600x), step forward (+1m), and timeline jump presets (Oct 1 start, Nov 15 mid, Dec 30 peak).
- **Live Event Ticker Feed**: Real-time operational event feed streaming as virtual clock advances.

### 6. Code Quality & Performance (Weight: 10%)
- **Code-Split Bundles**: Vite production build produces route-level lazy chunks (`React.lazy` + `Suspense`), isolating Recharts (`vendor-charts`), Framer Motion (`vendor-motion`), and parsed datasets (`parsed-data`).
- **List Virtualization**: `@tanstack/react-virtual` renders 1,000+ flight rows, 2,800 baggage rows, and 2,500 security logs at 60fps with zero DOM lag.

---

## 5. Deployment Guide (Vercel / Netlify)

### Deploying to Vercel
1. Install Vercel CLI or import project directly via GitHub:
   ```bash
   npx vercel
   ```
2. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Single Page Application (SPA) Routing:
   Vercel automatically detects Vite SPAs. Ensure route rewrites to `index.html` are configured (handled automatically by Vercel for Vite).

### Deploying to Netlify
1. Create a `public/_redirects` file or `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
2. Run deployment:
   ```bash
   npx netlify deploy --prod
   ```

---

## 6. Lighthouse Report Analysis & High-Leverage Optimizations

### Expected Category Scores (Production Build)
- **Accessibility**: **98 - 100** (Full ARIA semantics, WCAG AA contrast ratios, form labels, keyboard navigation, focus rings).
- **Best Practices**: **95 - 100** (Clean HTTPS, semantic HTML5, no deprecated APIs).
- **SEO**: **100** (Meta description, viewport tag, title tag, semantic structure).
- **Performance**: **85 - 92** (High initial dataset bundle size due to pre-parsing 11,827 CSV records into static TypeScript structures).

### Why Performance is ~88-92 & The Single Highest-Leverage Remaining Fix
- **Current Architecture**: To guarantee 60fps smooth simulation without client-side CSV parsing CPU spikes during interaction, all 8 datasets were pre-parsed into a dedicated `parsed-data` bundle chunk (`~5.3 MB` raw, `733 KB` gzipped).
- **Impact on Core Web Vitals**: While LCP and INP are fast, the initial JavaScript execution time to evaluate `parsed-data.js` adds a slight main-thread block on slower mobile CPUs.
- **Single Highest-Leverage Remaining Fix**: Implement **Web Worker IndexedDB Streaming / Lazy Chunk Loading**:
  - Move the pre-parsed dataset into IndexedDB or chunked JSON files fetched asynchronously on-demand or inside a dedicated Web Worker thread.
  - This would reduce the initial main JS payload from `733 KB` gzip to `< 100 KB` gzip, boosting the Lighthouse Performance score to **98 - 100**.
