import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAlerts, useSimClock } from '@/store/useSimEngineHooks';
import { useFlightModalStore } from '@/store/useFlightModalStore';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import type { AlertSeverity, EventSource, SimAlert } from '@/lib/sim/simTypes';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  Filter,
  CheckCheck,
  RotateCcw,
  Plane,
  DoorClosed,
  Luggage,
  ShieldCheck,
  Wrench,
  Sparkles,
} from 'lucide-react';

export interface AlertsPanelProps {
  isEmbedded?: boolean;
}

export const AlertsPanelDrawer: React.FC<AlertsPanelProps> = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { openFlightModal } = useFlightModalStore();

  const {
    alerts,
    unacknowledgedCount,
    criticalCount,
    warningCount,
    infoCount,
    totalActiveAlerts,
    isAlertsDrawerOpen,
    closeAlertsDrawer,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    clearAllAlerts,
  } = useAlerts();

  const { formattedTime } = useSimClock();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | EventSource>('ALL');
  const [unackOnly, setUnackOnly] = useState(false);

  // Filtered alerts list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchDesc = a.description.toLowerCase().includes(q);
        const matchRule = a.ruleId.toLowerCase().includes(q);
        const matchFlight = a.affectedFlightId?.toLowerCase().includes(q);
        const matchRef = a.affectedRef?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRule && !matchFlight && !matchRef) {
          return false;
        }
      }

      // 2. Severity
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;

      // 3. Source
      if (sourceFilter !== 'ALL' && a.source !== sourceFilter) return false;

      // 4. Unacknowledged
      if (unackOnly && a.isAcknowledged) return false;

      return true;
    });
  }, [alerts, searchQuery, severityFilter, sourceFilter, unackOnly]);

  const handleInvestigate = (alert: SimAlert) => {
    if (!isEmbedded) {
      closeAlertsDrawer();
    }

    if (alert.affectedFlightId) {
      // Open the global flight modal directly — no navigation needed
      openFlightModal(alert.affectedFlightId);
      return;
    }

    switch (alert.source) {
      case 'flight':
        navigate('/flights');
        break;
      case 'gate':
        navigate('/gates');
        break;
      case 'baggage':
        navigate('/baggage');
        break;
      case 'security':
        navigate('/security');
        break;
      case 'maintenance':
        navigate('/maintenance');
        break;
      default:
        navigate('/flights');
        break;
    }
  };

  const getSourceIcon = (source: EventSource) => {
    switch (source) {
      case 'flight':
        return <Plane className="h-3.5 w-3.5" />;
      case 'gate':
        return <DoorClosed className="h-3.5 w-3.5" />;
      case 'baggage':
        return <Luggage className="h-3.5 w-3.5" />;
      case 'security':
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case 'maintenance':
        return <Wrench className="h-3.5 w-3.5" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded bg-status-alert/15 border border-status-alert/40 text-status-alert font-data text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="h-3 w-3 animate-pulse" /> CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded bg-status-delayed/15 border border-status-delayed/40 text-status-delayed font-data text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> WARNING
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-accent-signal/15 border border-accent-signal/40 text-accent-signal font-data text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
            <Info className="h-3 w-3" /> INFO
          </span>
        );
    }
  };

  const contentMarkup = (
    <div className="flex flex-col h-full bg-surface-1 text-ink-primary font-display selection:bg-accent-signal selection:text-surface-0">
      {/* Top Header */}
      <div className="p-md border-b border-line bg-surface-0/80 backdrop-blur-md flex items-center justify-between gap-sm shrink-0">
        <div className="flex items-center gap-xs">
          <div className="p-2 rounded bg-status-alert/10 border border-status-alert/30 text-status-alert shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-ink-primary tracking-tight">
                Alerts & Incident Control Center
              </h2>
              {unacknowledgedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-status-alert text-surface-0 font-data text-[11px] font-bold animate-pulse">
                  {unacknowledgedCount} OPEN
                </span>
              )}
            </div>
            <p className="font-display text-xs text-ink-muted">
              Live Algorithmic Rule Engine • Virtual Time: <span className="font-data text-accent-signal">{formattedTime}</span>
            </p>
          </div>
        </div>

        {!isEmbedded && (
          <button
            type="button"
            onClick={closeAlertsDrawer}
            className="p-1.5 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
            aria-label="Close Incident Panel"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Operational KPI Summary Strip */}
      <div className="px-md py-xs bg-surface-0 border-b border-line grid grid-cols-2 sm:grid-cols-4 gap-xs font-data text-xs shrink-0">
        <div className="flex flex-col items-center justify-center p-1.5 rounded bg-surface-1 border border-line">
          <span className="text-[10px] text-ink-muted uppercase">ACTIVE ALERTS</span>
          <span className="font-bold text-ink-primary text-sm">{totalActiveAlerts}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 rounded bg-status-alert/10 border border-status-alert/30">
          <span className="text-[10px] text-status-alert uppercase font-semibold">CRITICAL</span>
          <span className="font-bold text-status-alert text-sm">{criticalCount}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 rounded bg-status-delayed/10 border border-status-delayed/30">
          <span className="text-[10px] text-status-delayed uppercase font-semibold">WARNING</span>
          <span className="font-bold text-status-delayed text-sm">{warningCount}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1.5 rounded bg-accent-signal/10 border border-accent-signal/30">
          <span className="text-[10px] text-accent-signal uppercase font-semibold">INFO</span>
          <span className="font-bold text-accent-signal text-sm">{infoCount}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-sm bg-surface-1 border-b border-line space-y-xs shrink-0">
        {/* Search & Global Actions */}
        <div className="flex items-center justify-between gap-xs flex-wrap">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search alert title, flight, gate, WO..."
            />
          </div>

          <div className="flex items-center gap-xs">
            {unacknowledgedCount > 0 && (
              <Button
                variant="secondary"
                size="xs"
                icon={<CheckCheck className="h-3.5 w-3.5 text-status-ontime" />}
                onClick={() => acknowledgeAllAlerts(alerts.map((a) => a.id))}
              >
                Ack All ({unacknowledgedCount})
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              icon={<RotateCcw className="h-3 w-3" />}
              onClick={clearAllAlerts}
              title="Reset Acknowledged Statuses"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-xs overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="font-data text-[10px] text-ink-muted uppercase flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> SEVERITY:
          </span>
          {(['ALL', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded font-data text-[11px] font-medium transition-colors shrink-0 uppercase ${
                severityFilter === sev
                  ? 'bg-accent-signal text-surface-0 font-semibold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                  : 'bg-surface-2 text-ink-muted hover:text-ink-primary border border-line'
              }`}
            >
              {sev}
            </button>
          ))}

          <div className="h-4 w-px bg-line shrink-0" />

          <span className="font-data text-[10px] text-ink-muted uppercase flex items-center gap-1 shrink-0">
            SOURCE:
          </span>
          {(['ALL', 'flight', 'gate', 'baggage', 'security', 'maintenance'] as const).map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-2 py-0.5 rounded font-data text-[11px] font-medium transition-colors shrink-0 uppercase ${
                sourceFilter === src
                  ? 'bg-accent-signal text-surface-0 font-semibold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                  : 'bg-surface-2 text-ink-muted hover:text-ink-primary border border-line'
              }`}
            >
              {src}
            </button>
          ))}

          <div className="h-4 w-px bg-line shrink-0" />

          <button
            onClick={() => setUnackOnly(!unackOnly)}
            className={`px-2 py-0.5 rounded font-data text-[11px] font-medium transition-colors shrink-0 ${
              unackOnly
                ? 'bg-status-alert text-surface-0 font-semibold'
                : 'bg-surface-2 text-ink-muted hover:text-ink-primary border border-line'
            }`}
          >
            UNACKNOWLEDGED ONLY
          </button>
        </div>
      </div>

      {/* Alert List Container */}
      <div className="flex-1 overflow-y-auto p-md space-y-sm">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-xl text-center border border-dashed border-line rounded-lg bg-surface-0/50 my-md">
            <div className="p-3 rounded-full bg-status-ontime/10 text-status-ontime mb-xs">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-sm font-semibold text-ink-primary">No Matching Operational Alerts</h3>
            <p className="font-display text-xs text-ink-muted max-w-sm mt-1">
              All systems normal for the selected filter view at virtual timestamp {formattedTime}.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={!shouldReduceMotion}>
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`p-md rounded-lg border transition-all duration-200 ${
                  alert.isAcknowledged
                    ? 'bg-surface-0/60 border-line/60 opacity-75'
                    : alert.severity === 'critical'
                    ? 'bg-status-alert/5 border-status-alert/40 shadow-[0_0_12px_rgba(244,63,94,0.08)] hover:border-status-alert/70'
                    : alert.severity === 'warning'
                    ? 'bg-status-delayed/5 border-status-delayed/40 hover:border-status-delayed/70'
                    : 'bg-accent-signal/5 border-accent-signal/30 hover:border-accent-signal/60'
                }`}
              >
                {/* Alert Top Header Row */}
                <div className="flex items-start justify-between gap-xs mb-xs">
                  <div className="flex items-center gap-xs flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    <span className="font-data text-[11px] px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-muted">
                      {alert.ruleId}
                    </span>
                    <span className="font-data text-[11px] text-accent-signal font-medium">
                      {alert.timestamp}
                    </span>
                  </div>

                  <Tag variant="mono" icon={getSourceIcon(alert.source)}>
                    {alert.source.toUpperCase()}
                  </Tag>
                </div>

                {/* Title & Narrative Description */}
                <h4 className="font-display text-sm font-semibold text-ink-primary mb-1">{alert.title}</h4>
                <p className="font-display text-xs text-ink-muted leading-relaxed mb-sm">{alert.description}</p>

                {/* Affected Entity Tags */}
                <div className="flex items-center justify-between gap-sm pt-xs border-t border-line/50 flex-wrap">
                  <div className="flex items-center gap-xs flex-wrap">
                    {alert.affectedFlightId && (
                      <span className="font-data text-xs px-2 py-0.5 rounded bg-surface-2 border border-line text-ink-primary font-medium flex items-center gap-1">
                        <Plane className="h-3 w-3 text-status-boarding" /> Flight {alert.affectedFlightId}
                      </span>
                    )}
                    {alert.affectedRef && (
                      <span className="font-data text-xs px-2 py-0.5 rounded bg-surface-2 border border-line text-ink-primary font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-accent-signal" /> {alert.affectedRef}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-xs">
                    <Button
                      variant={alert.isAcknowledged ? 'ghost' : 'outline'}
                      size="xs"
                      icon={alert.isAcknowledged ? <CheckCircle2 className="h-3.5 w-3.5 text-status-ontime" /> : undefined}
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      {alert.isAcknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                    </Button>

                    <Button
                      variant="primary"
                      size="xs"
                      icon={<ExternalLink className="h-3.5 w-3.5" />}
                      iconPosition="right"
                      onClick={() => handleInvestigate(alert)}
                    >
                      Investigate
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );

  // If embedded in a dedicated page (/alerts)
  if (isEmbedded) {
    return <div className="h-full rounded-lg overflow-hidden border border-line shadow-xl">{contentMarkup}</div>;
  }

  // Slide-out Drawer Overlay
  return createPortal(
    <AnimatePresence>
      {isAlertsDrawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm"
            onClick={closeAlertsDrawer}
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: '0%' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-[560px] lg:max-w-[680px] h-full shadow-2xl border-l border-line bg-surface-1 flex flex-col"
          >
            {contentMarkup}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
