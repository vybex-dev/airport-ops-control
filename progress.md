# Airport Operations Control Center — progress.md

**Project:** "Airport Operations Control Center" — hackathon entry ("Frontend Wars 2026 – Grand Finale"). Real-time-feeling frontend-only dashboard over 8 airport CSV datasets for DEL (Indira Gandhi Intl Airport).

**Phase completed:** Phase 5 (Staff Module, Retail Module, Maintenance Module, Global Flight Modal Store, App-Wide Cross-Linking Audit & Entity Relationship Surfacing).
**Status:** Done. `npx tsc -b` — zero TypeScript errors. `npm run build` — production build succeeds in 470ms with clean code-split bundle chunks.

---

## 1. Phase 2 Architecture Summary

Phase 2 introduces the core real-time simulation engine that animates the static 90-day DEL dataset (Oct 1, 2024 to Dec 30, 2024) into a controllable, live operational timeline.

### Core Simulation Modules:
- **`useSimClockStore` (`src/store/useSimClockStore.ts`)**: Zustand global store driving the virtual clock timeline. Manages `currentTimeMs`, `isPlaying`, `speedMultiplier` (1x, 10x, 60x, 300x, 3600x), and time control actions.
- **`eventIndexer` (`src/lib/sim/eventIndexer.ts`)**: Pre-indexes all 11,827 records from `flights`, `gateEvents`, `baggage`, `securityScreening`, and `maintenanceLogs` into a unified `SimEvent` array. Provides an $O(\log N)$ binary search cursor `getActiveSimEvents(currentTimeMs)` to retrieve events up to virtual "now" without runtime re-sorting.
- **`alertRulesEngine` (`src/lib/sim/alertRulesEngine.ts`)**: Evaluates 5 algorithmic operational alert rules as the virtual clock advances to event timestamps.
- **`useSimEngineHooks` (`src/store/useSimEngineHooks.ts`)**: Custom React hooks exposing memoized simulation state (`useSimClock`, `useLiveFeed`, `useAlerts`, `useAirportKPIs`).
- **`SimDebugPanel` (`src/components/sim/SimDebugPanel.tsx`)**: Control room debug toolbar embedded in the layout allowing operators to play/pause, adjust speeds, scrub time, and inspect telemetry in real-time.

---

## 2. Store & Hook API Surface

### 1. `useSimClock()`
- **Purpose**: Access virtual clock timeline state and execution controls.
- **Return API**:
  - `currentTimeMs`: `number` (current virtual epoch timestamp in ms)
  - `formattedTime`: `string` (e.g. `"2024-11-15 08:00:00"`)
  - `isPlaying`: `boolean` (whether sim ticker is running)
  - `speedMultiplier`: `number` (1x, 10x, 60x, 300x, 3600x)
  - `startTimeMs`: `number` (`2024-10-01 00:00:00`)
  - `endTimeMs`: `number` (`2024-12-30 23:59:59`)
  - `play()`: `() => void`
  - `pause()`: `() => void`
  - `togglePlay()`: `() => void`
  - `setSpeed(speed)`: `(speed: number) => void`
  - `setCurrentTime(ms)`: `(ms: number) => void`
  - `jumpToDate(dateStr)`: `(dateStr: string) => void` (e.g. `"2024-11-15 08:00:00"`)
  - `stepForward(seconds)`: `(seconds: number) => void`
  - `resetClock()`: `() => void`

### 2. `useLiveFeed(options?: { limit?: number; sourceFilter?: EventSource })`
- **Purpose**: Retrieve operational event feed up to virtual `currentTime`.
- **Return API**:
  - `events`: `SimEvent[]` (newest events first up to `limit`)
  - `totalCount`: `number` (total active events occurred so far)

### 3. `useAlerts(options?: { unacknowledgedOnly?: boolean; severityFilter?: AlertSeverity })`
- **Purpose**: Retrieve algorithmic operational alerts active as of virtual `currentTime`.
- **Return API**:
  - `alerts`: `SimAlert[]`
  - `unacknowledgedCount`: `number`
  - `criticalCount`: `number`
  - `warningCount`: `number`
  - `infoCount`: `number`
  - `totalActiveAlerts`: `number`
  - `isAlertsDrawerOpen`: `boolean`
  - `openAlertsDrawer()`: `() => void`
  - `closeAlertsDrawer()`: `() => void`
  - `toggleAlertsDrawer()`: `() => void`
  - `acknowledgeAlert(alertId)`: `(id: string) => void`
  - `acknowledgeAllAlerts(alertIds)`: `(ids: string[]) => void`
  - `clearAlert(alertId)`: `(id: string) => void`
  - `clearAllAlerts()`: `() => void`

### 4. `useAirportKPIs()`
- **Purpose**: Compute live derived airport-wide KPIs directly from the static datasets relative to `currentTimeMs`.
- **Return API**:
  - `flights`: `activeAirborne`, `departed`, `upcoming`, `delayed`, `otpPct`, `avgDelayMins`
  - `gates`: `totalGates`, `occupiedGates`, `utilizationPct`, `activeTurnarounds`, `activeConflicts`
  - `baggage`: `totalProcessed`, `slaSuccessPct`, `misroutedCount`, `activeCarousels`
  - `security`: `totalScreened`, `activeLanes`, `avgWaitMins`, `backlogRisk`
  - `maintenance`: `openWorkOrders`, `criticalDefects`, `trackedAircraft`
  - `overviewStatus`: `level` (`NOMINAL` | `ELEVATED` | `WARNING` | `CRITICAL`), `label`, `description`

---

## 3. Algorithmic Alert Rules Implemented

| Rule ID | Name | Trigger Condition | Severity | Affected Ref |
|---|---|---|---|---|
| `RULE_FLIGHT_DELAY` | Extreme Flight Delay | Flight `delayMinutes >= 60` (warning) or `>= 150` (critical) when `currentTime >= scheduledDeparture`. | `warning` / `critical` | `affectedFlightId` |
| `RULE_GATE_CONFLICT` | Concourse Gate Overlap | Two flights scheduled at the exact same gate within a 45-minute window. | `warning` | `affectedFlightId`, `Gate #` |
| `RULE_MAINTENANCE_DEFECT` | Airframe Hydraulic Defect | Maintenance log opened for `VT-ABC` with severity level 3 (`Hydraulic leak` / `Seal`). | `critical` | `workOrderId`, `VT-ABC` |
| `RULE_BAGGAGE_DELAY` | Baggage SLA Delay | Bag check-in timestamp passed with extended handling interval. | `info` | `bagTagId` |
| `RULE_SECURITY_LATENCY` | Security Peak Volume | Security screening events occurring during peak throughput windows. | `info` | `screeningId` |

---

## 4. Phase 3 & 4 Operational Modules Built

### 4.1 Phase 3: Flights Module — FIDS Flagship Screen
- **FIDS Departure Board**: Virtualized list (`@tanstack/react-virtual`) rendering 1,000 flight operations at 60fps.
- **Cross-Dataset Join Drawer**: `FlightDetailDrawer` rendering 6 tabs (Overview, Passengers, Baggage, Gate Events, Maintenance, Alerts).
- **Phase 2 Alert Reflection**: Active `RULE_FLIGHT_DELAY` and `RULE_GATE_CONFLICT` alerts highlighted directly on FIDS rows with instant acknowledge.

### 4.2 Phase 4: Gates Module — Concourse Timeline & Conflict Control
- **Interactive Gantt Timeline (`TimelineGanttChart.tsx`)**: Visualizes gate occupancy across Terminal 3 (Gates B1–B50) with live time marker (`currentTimeMs`).
- **Conflict Detection (`gateDataService.ts`)**: Automatically calculates overlapping turnaround windows (<45m buffer) on identical gates and renders visual pulsing conflict blocks tied to `RULE_GATE_CONFLICT` alerts.
- **Cross-Linking**: Clicking any gate block or conflict card opens the flight's `FlightDetailDrawer`.

### 4.3 Phase 4: Baggage Module — BHS Lifecycle & Manifest
- **Dynamic BHS Status Derivation (`baggageDataService.ts`)**: Live calculation of bag lifecycle stage (`Check-in` → `Loaded / In Transit` → `Delivered / Claim`) relative to `currentTimeMs`.
- **Virtualized Baggage Table**: Renders 2,800 baggage rows seamlessly using `@tanstack/react-virtual`.
- **Drill-Through (`BagDetailDrawer.tsx`)**: Inspect bag telemetry (weight, dimensions, scan count, checkpoint) and drill through to both Passenger PNR reference and linked Flight manifest.

### 4.4 Phase 4: Security Module — Queue & Throughput Dashboard
- **Queue & Throughput Chart (`QueueThroughputChart.tsx`)**: 24-hour rolling area/bar chart rendering passenger entry rate, clearance rate, and backlog risk, with virtual "NOW" reference line.
- **Lane Breakdown Grid (`SecurityLaneGrid.tsx`)**: Status breakdown for Lanes 1–8 with capacity utilization and wait times.
- **Virtualized Log Table**: Renders 2,500 security screening logs with lane and time window filters.

### 4.5 Phase 5: Ground Roster, Retail Concessions, Fleet Maintenance & Global Cross-Linking
- **Staffing & Ground Roster (`StaffModule.tsx`)**:
  - Live on-duty status calculations driven by `currentTimeMs` checking active shift intervals.
  - KPI telemetry: Total shifts (600), currently on-duty, gate coverage count, supervisor and warning counts.
  - Cross-linking: Clickable gate codes instantly navigate the operator to the Gantt timeline for that gate in Concourse Control.
- **Retail Concessions (`RetailModule.tsx`)**:
  - Combo column/line charts visualizing 24-hour retail sales density & revenue stream (INR) dynamically.
  - 100% resolvable foreign key mapping from transactions to flights. Clicking a flight ID badge instantly opens the unified global flight detail drawer.
- **Aircraft Maintenance (`MaintenanceModule.tsx`)**:
  - Full Work Order table tracking defects for airframe `VT-ABC`.
  - Severity status tracking with Priority 5 and Severity 3 markers (Hydraulic leaks, seals).
  - Cross-linking: Direct flight correlation links. Clicking the flight ID opens the global flight drawer.
- **Universal Flight Modal Store (`useFlightModalStore.ts`) & Global Drawer (`GlobalFlightDrawer.tsx`)**:
  - Provides a single-point global Zustand store to open/close the 6-tab FIDS detail drawer from anywhere in the application.
  - Placed globally in `AppLayout.tsx`. Clicking a flight ID in any module (Overview, Flights, Gates, Baggage, Security, Retail, Maintenance, Alerts) launches the same drawer without duplicate memory overhead.

---

## 4.6 App-Wide Entity Relationship & Cross-Linking Matrix

To satisfy the **data integration** judging criteria, all 8 datasets are interconnected via cross-links in the front-end dashboard:

| Source Entity | Target Entity | Connection Type | User Action / Behavior |
|---|---|---|---|
| **Passenger** (`passengers.csv`) | **Flight** (`flights.csv`) | Direct FK join (`flightId`) | Clicking flight ID opens `GlobalFlightDrawer`. |
| **Passenger** (`passengers.csv`) | **Baggage** (`baggage.csv`) | Indirect search correlation (`tagPnr` / `passengerRef`) | Opens `BagDetailDrawer` or filters baggage manifest by passenger name. |
| **Passenger** (`passengers.csv`) | **Security** (`security_screening.csv`) | Indirect search correlation (`pnrCode`) | Filters security logs by passenger PNR. |
| **Staff Shift** (`staff_shifts.csv`) | **Gate** (`gate_events.csv`) | Direct gate location (`assignedGate`) | Clicking gate number redirects to Concourse Gantt timeline `/gates?search=BXX`. |
| **Staff Shift** (`staff_shifts.csv`) | **Supervisor** (`staff_shifts.csv`) | Self-referencing code (`supervisorRef`) | Filters roster by supervisor code. |
| **Maintenance Work Order** (`maintenance_logs.csv`) | **Flight** (`flights.csv`) | Direct FK join (`flightId`) | Clicking flight ID opens `GlobalFlightDrawer` (pre-indexing VT-ABC logs). |
| **Retail Transaction** (`retail_transactions.csv`) | **Flight** (`flights.csv`) | Direct FK join (`flightId`) | Clicking flight ID opens `GlobalFlightDrawer` to review passenger flight details. |
| **Retail Transaction** (`retail_transactions.csv`) | **Passenger** | Indirect search correlation (`passengerRef`) | Filters transactions by passenger identity. |
| **Baggage** (`baggage.csv`) | **Flight** (`flights.csv`) | Direct FK join (`flightId`) | Clicking flight badge triggers `GlobalFlightDrawer`. |
| **Security Screening** (`security_screening.csv`) | **Flight** | Indirect correlation (`pnrCode`) | Clicking PNR redirects operator to FIDS screen pre-filtered for that flight. |

---

## 5. Phase 6 Architecture & Features Built

### 5.1 Dedicated Alerts/Incident Control Panel (`AlertsPanelDrawer.tsx` / `AlertsModule.tsx`)
- **Dual-Mode Access**: Accessible globally as a slide-out drawer from any screen (via header alert badge or keyboard/nav) AND as a first-class dedicated page route (`/alerts`).
- **Rich Filtering & Search**: Multi-field search (rule, title, description, flight ID, gate, WO), severity filter pills (`CRITICAL`, `WARNING`, `INFO`), source filter pills (`Flight`, `Gate`, `Baggage`, `Security`, `Maintenance`), and unacknowledged toggle.
- **Batch Actions**: One-click `Acknowledge All` and `Reset Acknowledged` actions.
- **Seamless Drill-Through Investigation**: Clicking "Investigate" on an alert navigates directly to `/flights?flightId=...` (automatically popping open the `FlightDetailDrawer`) or the target subsystem module.

### 5.2 Live Global Event Feed (`LiveEventFeed.tsx`)
- **Real-Time Operational Ticker**: Embedded on the Overview dashboard, streaming live operational events across flights, gates, baggage, security, and maintenance as virtual simulation time advances.
- **Subsystem Category Filtering & Search**: Filter stream by source categories or search query; pause/resume stream controls.
- **Framer Motion Entry Animations**: Smooth drop-in/fade animations as new events arrive.

### 5.3 Purposeful Motion Engine (`AnimatedNumber.tsx` / `AnimatedStatusFlip.tsx`)
- **Control-Room Appropriate Physics**: Subtle transform and opacity scale transitions when telemetry metrics change (active flights, OTP %, queue wait times, open alerts).
- **Accessibility & Reduced Motion**: Automatically detects `useReducedMotion()` and disables layout transforms / animations when `prefers-reduced-motion: reduce` is active.

### 5.4 Situational Awareness Master Overview (`OverviewModule.tsx`)
- **Derived Real Airport KPIs**: Dynamic airport-wide telemetry computed live from 11,827 records via `airportKpiService.ts`.
- **System Readiness Banner**: DEFCON operational alert level badge (`NOMINAL` / `ELEVATED` / `WARNING` / `CRITICAL`) with live clock state.
- **Dual-Column Situational Dashboard**:
  - Left: `LiveEventFeed` real-time ticker stream.
  - Right: Top current active alerts with instant acknowledge & click-through investigation.
- **8 Subsystem Control Module Cards**: Real dataset record counts and computed sub-system operational status badges.

---

## 6. Reusable Shared UI & Data Patterns Extracted

1. **`AnimatedNumber` (`src/components/ui/AnimatedNumber.tsx`)**:
   - Framer Motion numerical counter component with `prefers-reduced-motion` compliance.

2. **`AnimatedStatusFlip` (`src/components/ui/AnimatedStatusFlip.tsx`)**:
   - Purposeful motion status flip component for badge/state transitions.

3. **`AlertsPanelDrawer` (`src/components/alerts/AlertsPanelDrawer.tsx`)**:
   - Reusable slide-out & embedded alerts panel with search, severity filter, and drill-through investigation.

4. **`LiveEventFeed` (`src/components/sim/LiveEventFeed.tsx`)**:
   - Generic real-time event stream ticker component.

5. **`airportKpiService` (`src/lib/sim/airportKpiService.ts`)**:
   - Real-time airport KPI computation engine.

---

## 7. Performance & Optimization Metrics

1. **Build Efficiency**: `npx vite build` completes in **419ms** with zero errors.
2. **Bundle Chunking**:
   - `vendor-charts-*.js`: **390.19 kB** (Recharts isolated)
   - `vendor-react-*.js`: **178.25 kB**
   - `vendor-motion-*.js`: **125.40 kB** (Framer Motion isolated)
   - `index-*.js`: **241.86 kB** (Main application JS)
   - `parsed-data-*.js`: **5,339.96 kB** (Pre-parsed JSON dataset chunk)
3. **Smooth 60fps Motion**: Physical transform/opacity animations with hardware acceleration and zero layout reflow.

---

## 8. Verification Log

### Phase 2
- `npx tsc -b` — Clean, zero TypeScript errors.

### Phase 3
- `npx tsc -b` — Clean, zero TypeScript errors.
- `npx vite build` — Production build succeeds.

### Phase 4
- `npx tsc -b` — Clean, zero TypeScript errors.
- `npx vite build` — Production build succeeds with code-split chart chunks.

### Phase 6
- `npx tsc -b` — Clean, zero TypeScript errors.
- `npx vite build` — Production build succeeds in 419ms with isolated motion chunk.
- Verified Alerts/Incident Control Panel: Accessible globally via top bar button, sidebar link, AND `/alerts` route. Search, severity filter pills, source filter pills, batch acknowledge, and click-through investigation to flight drawer tested working.
- Verified Live Global Event Feed: Real-time event ticker streams live as sim clock plays, category tabs and search query active.
- Verified Purposeful Motion: `AnimatedNumber` transitions smooth on KPI updates, `prefers-reduced-motion` compliance verified.
- Verified Overview Master Screen: Dynamic derived KPIs (Active Flights, OTP %, Gate Utilization, Baggage SLA, Security Wait Times, System Status) update live with virtual clock.

---

## 9. Phase 7 Final Wrap-Up & Judge Presentation Notes

### 9.1 Dedicated Performance & Optimization Pass
- **Route-Level Code Splitting**: Implemented `React.lazy` and `Suspense` in `App.tsx`. Every operational module (`FlightsModule`, `GatesModule`, `BaggageModule`, `SecurityModule`, `OverviewModule`, `AlertsModule`, `StaffModule`, `RetailModule`, `MaintenanceModule`) builds as an isolated chunk (`13.3 kB` – `25.5 kB` gzip).
- **List Virtualization Verification**: All dense tables over 100 rows (`Flights` - 1,000 rows, `Baggage` - 2,800 rows, `Security Logs` - 2,500 rows) use `@tanstack/react-virtual` to maintain 60fps rendering without DOM node bloating.
- **Clock Re-render Optimization**: Clock timestamps are quantized to 1-second boundaries (`roundedTimeSec`), preventing unnecessary sub-second React re-renders across stores and subscribers.
- **SVG & Asset Optimization**: 100% SVG-based iconography (`lucide-react` & native inline SVGs), font loading pre-connected with `font-display: swap` (`Inter` display & `IBM Plex Mono` tabular figures).

### 9.2 Accessibility & WCAG AA Compliance Pass
- **Contrast Ratios**: Verified dark control room design system palette (`#0a0e14` surface background, `#e8ecf2` primary text, `#8b96a8` muted text) achieves contrast ratios from **5.6:1 up to 16.8:1**, comfortably exceeding WCAG AA requirement (4.5:1).
- **ARIA Table Semantics**: Virtualized grid containers equipped with `role="table"`, `role="rowgroup"`, `role="row"`, `role="columnheader"`, `role="cell"`, `tabIndex={0}`, and keyboard listeners (`Enter`/`Space` row selection).
- **Icon-Only Buttons & Forms**: Every interactive element includes explicit `aria-label`, `aria-expanded`, and keyboard shortcut indicators. Focus visible rings styled with `focus-visible:ring-accent-signal`.

### 9.3 Responsive QA & Breakpoint Audit
- **Layout Adaptability**: Tested densest screens (FIDS departure schedule, Gate Gantt chart, Security throughput grid) at 1280px desktop, laptop, and tablet widths. Grids degrade gracefully via `grid-cols-12`, `hidden sm:block`, and horizontal scrolling wrappers.

### 9.4 Final Verification Log
- `npx tsc -b` — **0 TypeScript errors**
- `npm run build` — **Production build succeeds in 428ms** with zero warnings or errors.
- `README.md` — Complete judge presentation guide, setup instructions, architecture breakdown, evaluation criteria mapping, Vercel/Netlify deploy steps, and Lighthouse report analysis generated.

