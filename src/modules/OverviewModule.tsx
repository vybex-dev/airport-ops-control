import React from "react";
import { useNavigate } from "react-router-dom";
import { Panel } from "../components/ui/Panel";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Button } from "../components/ui/Button";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { LiveEventFeed } from "../components/sim/LiveEventFeed";
import {
  useSimClock,
  useAlerts,
  useAirportKPIs,
} from "@/store/useSimEngineHooks";
import type { SimAlert } from "@/lib/sim/simTypes";
import {
  Plane,
  DoorClosed,
  Luggage,
  ShieldCheck,
  Users,
  ShoppingBag,
  Wrench,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  Pause,
} from "lucide-react";

export const OverviewModule: React.FC = () => {
  const navigate = useNavigate();

  const { formattedTime, isPlaying, togglePlay, speedMultiplier } =
    useSimClock();

  // useAlerts/useAirportKPIs internally defer their heavy synchronous
  // compute (rule evaluation, KPI aggregation across 5 datasets) until
  // after critical data has loaded AND a paint frame has been yielded,
  // returning safe empty/zeroed defaults in the meantime. This lets the
  // header and card chrome render immediately instead of blocking on the
  // full computation during first mount.
  const { alerts, unacknowledgedCount, openAlertsDrawer, acknowledgeAlert } =
    useAlerts();
  const kpis = useAirportKPIs();

  // Top 5 active alerts for quick situational awareness
  const topCurrentAlerts = alerts.slice(0, 5);

  const getModuleCards = () => [
    {
      id: "flights",
      title: "Flight Operations & FIDS",
      path: "/flights",
      icon: <Plane className="h-5 w-5 text-status-boarding" />,
      recordCount: "1,000 Records",
      status:
        kpis.flights.delayed > 0 ? ("delayed" as const) : ("boarding" as const),
      statusLabel: `${kpis.flights.activeAirborne} Active Airborne`,
      primaryMetric: `${kpis.flights.otpPct}%`,
      primaryMetricLabel: "Live OTP",
      secondaryMetric: `${kpis.flights.delayed}`,
      secondaryMetricLabel: "Delayed Flights",
      description:
        "Real-time FIDS schedule, departure delays, boarding events, and live turnaround states.",
      accentBorder: "boarding" as const,
    },
    {
      id: "gates",
      title: "Gate & Concourse Control",
      path: "/gates",
      icon: <DoorClosed className="h-5 w-5 text-accent-signal" />,
      recordCount: "687 Records",
      status:
        kpis.gates.activeConflicts > 0
          ? ("alert" as const)
          : ("ontime" as const),
      statusLabel:
        kpis.gates.activeConflicts > 0
          ? `${kpis.gates.activeConflicts} Gate Conflict`
          : "All Gates Normal",
      primaryMetric: `${kpis.gates.utilizationPct}%`,
      primaryMetricLabel: "Utilization",
      secondaryMetric: `${kpis.gates.occupiedGates} / 50`,
      secondaryMetricLabel: "Occupied Gates",
      description:
        "Concourse timeline Gantt, turnaround tracking, buffer conflicts, and pushback status.",
      accentBorder: "signal" as const,
    },
    {
      id: "baggage",
      title: "Baggage Handling System",
      path: "/baggage",
      icon: <Luggage className="h-5 w-5 text-status-ontime" />,
      recordCount: "2,800 Records",
      status:
        kpis.baggage.misroutedCount > 0
          ? ("delayed" as const)
          : ("ontime" as const),
      statusLabel: "BHS Belts Operational",
      primaryMetric: `${kpis.baggage.slaSuccessPct}%`,
      primaryMetricLabel: "Delivery SLA",
      secondaryMetric: `${kpis.baggage.totalProcessed}`,
      secondaryMetricLabel: "Bags Processed",
      description:
        "Baggage lifecycle tracking, check-in to carousel delivery SLA, and discrepancy logs.",
      accentBorder: "ontime" as const,
    },
    {
      id: "security",
      title: "Security Screening Checkpoints",
      path: "/security",
      icon: <ShieldCheck className="h-5 w-5 text-status-ontime" />,
      recordCount: "2,500 Records",
      status:
        kpis.security.backlogRisk === "HIGH"
          ? ("delayed" as const)
          : ("ontime" as const),
      statusLabel: `${kpis.security.activeLanes} / ${kpis.security.totalLanes} Lanes Open`,
      primaryMetric: `${kpis.security.avgWaitMins}m`,
      primaryMetricLabel: "Avg Queue Wait",
      secondaryMetric: `${kpis.security.totalScreened}`,
      secondaryMetricLabel: "Pax Screened",
      description:
        "Screening throughput, lane opening logs, wait-time telemetry, and clear audit scans.",
      accentBorder: "ontime" as const,
    },
    {
      id: "staff",
      title: "Ground Roster & Staffing",
      path: "/staff",
      icon: <Users className="h-5 w-5 text-ink-primary" />,
      recordCount: "600 Records",
      status: "neutral" as const,
      statusLabel: "Shift Roster Active",
      primaryMetric: "600",
      primaryMetricLabel: "Shift Logs",
      secondaryMetric: "8",
      secondaryMetricLabel: "Work Zones",
      description:
        "Department shift schedules, terminal coverage, ground handling roster, and availability.",
      accentBorder: "signal" as const,
    },
    {
      id: "retail",
      title: "Terminal Concessions & Retail",
      path: "/retail",
      icon: <ShoppingBag className="h-5 w-5 text-status-delayed" />,
      recordCount: "3,000 Records",
      status: "neutral" as const,
      statusLabel: "T3 Outlets Open",
      primaryMetric: "3,000",
      primaryMetricLabel: "Transactions",
      secondaryMetric: "₹4.2M",
      secondaryMetricLabel: "Daily Volume",
      description:
        "Passenger retail transactions, duty-free sales telemetry, and gate-area footfall density.",
      accentBorder: "delayed" as const,
    },
    {
      id: "maintenance",
      title: "Aircraft & Fleet Maintenance",
      path: "/maintenance",
      icon: <Wrench className="h-5 w-5 text-status-alert" />,
      recordCount: "400 Records",
      status:
        kpis.maintenance.criticalDefects > 0
          ? ("alert" as const)
          : ("neutral" as const),
      statusLabel: `${kpis.maintenance.openWorkOrders} Open Work Orders`,
      primaryMetric: `${kpis.maintenance.totalLogs}`,
      primaryMetricLabel: "Technical Logs",
      secondaryMetric: `${kpis.maintenance.trackedAircraft}`,
      secondaryMetricLabel: "Target Airframe",
      description:
        "Technical maintenance logs, defect work orders, aircraft readiness, and technician entries.",
      accentBorder: "alert" as const,
    },
  ];

  const handleInvestigateAlert = (alert: SimAlert) => {
    if (alert.affectedFlightId) {
      navigate(
        `/flights?flightId=${encodeURIComponent(alert.affectedFlightId)}`,
      );
      return;
    }
    switch (alert.source) {
      case "flight":
        navigate("/flights");
        break;
      case "gate":
        navigate("/gates");
        break;
      case "baggage":
        navigate("/baggage");
        break;
      case "security":
        navigate("/security");
        break;
      case "maintenance":
        navigate("/maintenance");
        break;
      default:
        navigate("/flights");
        break;
    }
  };

  return (
    <div className="space-y-md font-display">
      {/* Overview NOC Control Room Header */}
      <div className="p-md rounded-lg bg-surface-1 border border-line flex flex-col lg:flex-row lg:items-center justify-between gap-md shadow-lg relative overflow-hidden">
        {/* Glow accent element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-signal/5 blur-3xl pointer-events-none rounded-full" />

        <div className="space-y-xs relative z-10">
          <div className="flex items-center gap-xs flex-wrap">
            <span className="font-data text-[10px] text-accent-signal px-2 py-0.5 rounded bg-accent-signal/15 border border-accent-signal/40 font-bold uppercase tracking-widest">
              VIDP / T3 MASTER CONTROL
            </span>
            <StatusBadge
              variant={
                kpis.overviewStatus.level === "CRITICAL"
                  ? "alert"
                  : kpis.overviewStatus.level === "WARNING"
                    ? "delayed"
                    : "ontime"
              }
              size="sm"
              pulseDot
            >
              {kpis.overviewStatus.label}
            </StatusBadge>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-ink-primary tracking-tight">
              Indira Gandhi International Airport — Operations Overview
            </h2>
            <p className="font-display text-xs text-ink-muted mt-0.5">
              {kpis.overviewStatus.description} Calculated dynamically over
              11,827 pre-indexed operational records.
            </p>
          </div>
        </div>

        {/* Sim Clock Controller & Alert Quick Trigger */}
        <div className="flex items-center gap-sm flex-wrap relative z-10 shrink-0">
          <div className="p-2 rounded bg-surface-0 border border-line flex items-center gap-xs font-data text-xs">
            <Clock className="h-4 w-4 text-accent-signal" />
            <div>
              <div className="text-ink-primary font-semibold tracking-tight">
                {formattedTime}
              </div>
              <div className="text-[10px] text-ink-muted">
                SIM CLOCK ({speedMultiplier}x)
              </div>
            </div>
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded bg-surface-2 hover:bg-surface-1 text-ink-primary transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
              aria-label={
                isPlaying ? "Pause simulation clock" : "Play simulation clock"
              }
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 text-status-ontime" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={openAlertsDrawer}
            className={`flex items-center gap-xs px-md py-2.5 rounded-md font-display text-xs font-bold transition-all duration-200 shadow-md ${
              unacknowledgedCount > 0
                ? "bg-status-alert text-surface-0 hover:bg-status-alert/90 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse"
                : "bg-surface-2 text-ink-primary hover:bg-surface-0 border border-line"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>INCIDENT PANEL</span>
            {unacknowledgedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-surface-0 text-status-alert font-data text-[10px] font-extrabold ml-1">
                {unacknowledgedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Airport-Wide Derived Real Telemetry KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* KPI Card 1: Flights & OTP */}
        <Panel
          variant="surface-1"
          accentBorder="boarding"
          className="p-md relative"
        >
          <div className="flex items-center justify-between gap-xs mb-xs">
            <span className="font-data text-[10px] font-bold text-ink-muted uppercase tracking-wider">
              FLIGHT OPERATIONS
            </span>
            <div className="p-1.5 rounded bg-status-boarding/10 text-status-boarding">
              <Plane className="h-4 w-4" />
            </div>
          </div>

          <div className="font-data mb-xs">
            <div className="text-2xl font-bold text-ink-primary tracking-tight">
              <AnimatedNumber value={kpis.flights.activeAirborne} />
              <span className="text-xs font-normal text-ink-muted ml-1.5">
                AIRBORNE / ON-TARMAC
              </span>
            </div>
          </div>

          <div className="space-y-1 font-data text-xs pt-xs border-t border-line/50">
            <div className="flex items-center justify-between text-ink-muted">
              <span>On-Time Performance</span>
              <span className="text-status-ontime font-semibold">
                <AnimatedNumber value={kpis.flights.otpPct} suffix="%" />
              </span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Delayed Operations</span>
              <span
                className={
                  kpis.flights.delayed > 0
                    ? "text-status-delayed font-semibold"
                    : "text-ink-primary"
                }
              >
                <AnimatedNumber value={kpis.flights.delayed} /> flights
              </span>
            </div>
          </div>
        </Panel>

        {/* KPI Card 2: Gate Utilization */}
        <Panel
          variant="surface-1"
          accentBorder="signal"
          className="p-md relative"
        >
          <div className="flex items-center justify-between gap-xs mb-xs">
            <span className="font-data text-[10px] font-bold text-ink-muted uppercase tracking-wider">
              CONCOURSE & GATES
            </span>
            <div className="p-1.5 rounded bg-accent-signal/10 text-accent-signal">
              <DoorClosed className="h-4 w-4" />
            </div>
          </div>

          <div className="font-data mb-xs">
            <div className="text-2xl font-bold text-ink-primary tracking-tight">
              <AnimatedNumber value={kpis.gates.utilizationPct} suffix="%" />
              <span className="text-xs font-normal text-ink-muted ml-1.5">
                UTILIZATION
              </span>
            </div>
          </div>

          <div className="space-y-1 font-data text-xs pt-xs border-t border-line/50">
            <div className="flex items-center justify-between text-ink-muted">
              <span>Occupied Concourse Gates</span>
              <span className="text-ink-primary font-semibold">
                <AnimatedNumber
                  value={kpis.gates.occupiedGates}
                  suffix=" / 50"
                />
              </span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Gate Turnaround Conflicts</span>
              <span
                className={
                  kpis.gates.activeConflicts > 0
                    ? "text-status-alert font-bold animate-pulse"
                    : "text-status-ontime font-medium"
                }
              >
                <AnimatedNumber value={kpis.gates.activeConflicts} />
              </span>
            </div>
          </div>
        </Panel>

        {/* KPI Card 3: Baggage SLA */}
        <Panel
          variant="surface-1"
          accentBorder="ontime"
          className="p-md relative"
        >
          <div className="flex items-center justify-between gap-xs mb-xs">
            <span className="font-data text-[10px] font-bold text-ink-muted uppercase tracking-wider">
              BAGGAGE HANDLING (BHS)
            </span>
            <div className="p-1.5 rounded bg-status-ontime/10 text-status-ontime">
              <Luggage className="h-4 w-4" />
            </div>
          </div>

          <div className="font-data mb-xs">
            <div className="text-2xl font-bold text-ink-primary tracking-tight">
              <AnimatedNumber value={kpis.baggage.slaSuccessPct} suffix="%" />
              <span className="text-xs font-normal text-ink-muted ml-1.5">
                DELIVERY SLA
              </span>
            </div>
          </div>

          <div className="space-y-1 font-data text-xs pt-xs border-t border-line/50">
            <div className="flex items-center justify-between text-ink-muted">
              <span>Total Bags Scanned</span>
              <span className="text-ink-primary font-semibold">
                <AnimatedNumber value={kpis.baggage.totalProcessed} />
              </span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Misrouted / SLA Delayed</span>
              <span
                className={
                  kpis.baggage.misroutedCount > 0
                    ? "text-status-delayed font-semibold"
                    : "text-status-ontime"
                }
              >
                <AnimatedNumber value={kpis.baggage.misroutedCount} /> tags
              </span>
            </div>
          </div>
        </Panel>

        {/* KPI Card 4: Security Checkpoint */}
        <Panel
          variant="surface-1"
          accentBorder="ontime"
          className="p-md relative"
        >
          <div className="flex items-center justify-between gap-xs mb-xs">
            <span className="font-data text-[10px] font-bold text-ink-muted uppercase tracking-wider">
              SECURITY CHECKPOINT
            </span>
            <div className="p-1.5 rounded bg-status-ontime/10 text-status-ontime">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="font-data mb-xs">
            <div className="text-2xl font-bold text-ink-primary tracking-tight">
              <AnimatedNumber value={kpis.security.avgWaitMins} suffix="m" />
              <span className="text-xs font-normal text-ink-muted ml-1.5">
                AVG QUEUE WAIT
              </span>
            </div>
          </div>

          <div className="space-y-1 font-data text-xs pt-xs border-t border-line/50">
            <div className="flex items-center justify-between text-ink-muted">
              <span>Active Screening Lanes</span>
              <span className="text-ink-primary font-semibold">
                <AnimatedNumber
                  value={kpis.security.activeLanes}
                  suffix={` / ${kpis.security.totalLanes}`}
                />
              </span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Passengers Screened</span>
              <span className="text-ink-primary font-semibold">
                <AnimatedNumber value={kpis.security.totalScreened} />
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Situational Awareness Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        {/* Left Column (7/12 width): Live Operational Event Feed */}
        <div className="lg:col-span-7 flex flex-col h-[520px]">
          <LiveEventFeed limit={20} showControls />
        </div>

        {/* Right Column (5/12 width): Top Current Derived Operational Alerts */}
        <div className="lg:col-span-5 flex flex-col h-[520px] rounded-lg border border-line bg-surface-1 overflow-hidden">
          {/* Header */}
          <div className="p-sm bg-surface-0 border-b border-line flex items-center justify-between gap-xs shrink-0">
            <div className="flex items-center gap-xs">
              <div className="p-1.5 rounded bg-status-alert/10 text-status-alert">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink-primary uppercase tracking-wider">
                  Top Active Alerts
                </h3>
                <p className="font-display text-[11px] text-ink-muted">
                  Rule engine alerts derived up to virtual timestamp
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="xs"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              iconPosition="right"
              onClick={openAlertsDrawer}
            >
              All Alerts ({unacknowledgedCount})
            </Button>
          </div>

          {/* Top Alerts List */}
          <div className="flex-1 overflow-y-auto p-sm space-y-xs">
            {topCurrentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-md text-center text-ink-muted my-auto h-full">
                <CheckCircle2 className="h-8 w-8 text-status-ontime mb-xs" />
                <span className="font-data text-xs font-semibold text-ink-primary">
                  Zero Active Critical Alerts
                </span>
                <span className="font-display text-[11px] text-ink-muted mt-0.5">
                  All airport subsystems operating nominally.
                </span>
              </div>
            ) : (
              topCurrentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-sm rounded border transition-all duration-200 ${
                    alert.isAcknowledged
                      ? "bg-surface-0/50 border-line/60 opacity-60"
                      : alert.severity === "critical"
                        ? "bg-status-alert/10 border-status-alert/40 shadow-[0_0_8px_rgba(244,63,94,0.1)]"
                        : "bg-status-delayed/10 border-status-delayed/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-xs mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-data text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          alert.severity === "critical"
                            ? "bg-status-alert text-surface-0"
                            : "bg-status-delayed text-surface-0"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-data text-[10px] text-accent-signal">
                        {alert.timestamp}
                      </span>
                    </div>

                    <span className="font-data text-[10px] text-ink-muted">
                      {alert.ruleId}
                    </span>
                  </div>

                  <h4 className="font-display text-xs font-bold text-ink-primary mb-1">
                    {alert.title}
                  </h4>
                  <p className="font-display text-[11px] text-ink-muted line-clamp-2 mb-2">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-xs border-t border-line/40">
                    <div className="font-data text-[10px] text-ink-primary font-medium">
                      {alert.affectedFlightId
                        ? `Flight ${alert.affectedFlightId}`
                        : alert.affectedRef || alert.source}
                    </div>

                    <div className="flex items-center gap-xs">
                      {!alert.isAcknowledged && (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="font-data text-[10px] text-ink-muted hover:text-ink-primary underline"
                        >
                          Ack
                        </button>
                      )}
                      <Button
                        variant="primary"
                        size="xs"
                        icon={<ExternalLink className="h-3 w-3" />}
                        onClick={() => handleInvestigateAlert(alert)}
                      >
                        Investigate
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Subsystem Control Modules Section Header */}
      <div className="pt-2xs flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-primary">
            Subsystem Operations Control Modules
          </h3>
          <p className="font-display text-xs text-ink-muted">
            Access specialized sub-system dashboards for deep-dive operational
            management.
          </p>
        </div>
      </div>

      {/* 7 Subsystem Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
        {getModuleCards().map((mod) => (
          <Panel
            key={mod.id}
            variant="surface-1"
            accentBorder={mod.accentBorder}
            className="hover:border-accent-signal/40 transition-all duration-200 cursor-pointer group"
          >
            <div
              className="flex flex-col h-full justify-between gap-md"
              onClick={() => navigate(mod.path)}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-xs mb-xs">
                  <div className="p-2xs rounded bg-surface-2 border border-line/80 group-hover:border-accent-signal/30 transition-colors">
                    {mod.icon}
                  </div>
                  <StatusBadge variant={mod.status} size="sm">
                    {mod.statusLabel}
                  </StatusBadge>
                </div>

                <h4 className="font-display text-base font-semibold text-ink-primary group-hover:text-accent-signal transition-colors mb-4xs">
                  {mod.title}
                </h4>
                <p className="font-display text-xs text-ink-muted line-clamp-2">
                  {mod.description}
                </p>
              </div>

              {/* Card Middle: Key Metrics */}
              <div className="grid grid-cols-2 gap-xs p-xs rounded bg-surface-2/60 border border-line/50 font-data">
                <div>
                  <div className="text-[10px] text-ink-muted uppercase">
                    {mod.primaryMetricLabel}
                  </div>
                  <div className="text-sm font-semibold text-ink-primary">
                    {mod.primaryMetric}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-ink-muted uppercase">
                    {mod.secondaryMetricLabel}
                  </div>
                  <div className="text-sm font-semibold text-ink-primary">
                    {mod.secondaryMetric}
                  </div>
                </div>
              </div>

              {/* Card Bottom */}
              <div className="flex items-center justify-between pt-xs border-t border-line/50">
                <span className="font-data text-xs text-ink-muted">
                  {mod.recordCount}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  }
                  iconPosition="right"
                >
                  Open Shell
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
};
