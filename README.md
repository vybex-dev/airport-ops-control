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
6. [Performance Architecture](#6-performance-architecture)

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

# 4. Build for production (code-split bundles)
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 2. Technology Stack

- **Framework & Core**: React 19, TypeScript 6.0, Vite 8.2
- **State Management**: Zustand 5.0 (global virtual clock store & persistent alert acknowledgment state)
- **Styling & Design System**: Tailwind CSS v4 (CSS-first configuration with custom design tokens in `@theme`)
- **Virtualization**: `@tanstack/react-virtual` v3 (rendering 1,000+ FIDS rows, 2,800 baggage items, and 2,500 security logs at 60fps)
- **Animation & Motion**: A mix of Framer Motion 12 (for drawer/panel transitions, loaded on demand) and lightweight CSS keyframe animations (for high-frequency UI — KPI counters, status flips, live event ticker — kept dependency-free so they never block first paint), all respecting `prefers-reduced-motion`.
- **Visualization**: Recharts 3.10 (security throughput & queue latency area/bar charts with virtual "NOW" reference marker)
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
- **Fetch-Based Data Loading**: All 8 datasets are served as static JSON from `/public/data/`, split into critical (loaded immediately: flights, gate events, baggage, security, maintenance) and lazy (fetched on-demand: passengers, retail, staff) — nothing is bundled into JavaScript.
- **Route-Level Code Splitting**: Every module (`OverviewModule`, `FlightsModule`, `SecurityModule`, etc.) is a separate `React.lazy()` chunk, so the initial bundle only contains the code the current route needs.
- **Dependency-Aware Chunking**: Recharts and Framer Motion are only pulled into the bundles of the components that actually use them (e.g. `QueueThroughputChart`, `AlertsPanelDrawer`), so neither library loads until a user actually opens a drawer or a chart-bearing tab.
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

## 6. Performance Architecture

The app is built around a simple rule: **nothing loads until something on screen actually needs it.**

- **Data**: The 8 operational datasets are fetched as static JSON rather than bundled into the JS payload, and split into a critical set (needed for the Overview screen) and a lazy set (fetched only when their module mounts).
- **Routes**: Every top-level module is behind `React.lazy()`, so visiting `/` never downloads the code for `/security`, `/gates`, `/staff`, and so on.
- **Heavy dependencies**: Recharts (charts) and Framer Motion (drawer/panel transitions) are scoped to the specific components that use them rather than force-bundled into a shared vendor chunk, so they load only when a user opens something that actually needs them — a chart tab, an alerts drawer, a mobile nav panel.
- **High-frequency UI**: Elements that re-render often as the simulation clock ticks (KPI counters, status badges, the live event feed) use plain CSS keyframe animations instead of a JS animation library, so the parts of the UI that update most often are also the cheapest to update.
- **Accessibility-safe motion**: All animation, whether CSS or Framer Motion, respects `prefers-reduced-motion` globally.

Run `npm run build` to see the current chunk breakdown, or `npx vite-bundle-visualizer` for an interactive treemap of exactly what's in each bundle.
