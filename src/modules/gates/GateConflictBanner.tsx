import React from 'react';
import type { SimAlert } from '@/lib/sim/simTypes';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface GateConflictBannerProps {
  alerts: SimAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onSelectFlight?: (flightId: string) => void;
}

export const GateConflictBanner: React.FC<GateConflictBannerProps> = ({
  alerts,
  onAcknowledgeAlert,
  onSelectFlight,
}) => {
  const gateConflictAlerts = alerts.filter(
    (a) => a.ruleId === 'RULE_GATE_CONFLICT' || a.source === 'gate'
  );

  if (gateConflictAlerts.length === 0) {
    return (
      <div className="p-sm rounded-md bg-status-ontime/10 border border-status-ontime/30 flex items-center justify-between gap-xs flex-wrap font-data text-xs">
        <div className="flex items-center gap-xs text-status-ontime min-w-0 flex-wrap">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-bold">CONCOURSE OPERATIONAL SAFETY CLEAR:</span>
          <span>Zero gate turnaround conflicts active in Terminal 3.</span>
        </div>
        <span className="text-ink-muted text-[11px] shrink-0">45m Buffer Enforced</span>
      </div>
    );
  }

  return (
    <div className="p-sm rounded-md bg-status-alert/10 border border-status-alert/40 space-y-xs font-data">
      <div className="flex items-center justify-between gap-xs flex-wrap border-b border-status-alert/20 pb-xs">
        <div className="flex items-center gap-xs text-status-alert font-bold text-sm min-w-0">
          <AlertTriangle className="h-5 w-5 animate-pulse shrink-0" />
          <span>CONCOURSE GATE CONFLICT ALERTS ({gateConflictAlerts.length})</span>
        </div>
        <span className="text-xs text-status-alert uppercase font-bold tracking-wider shrink-0">
          RULE_GATE_CONFLICT TRIGGERED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xs">
        {gateConflictAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-xs rounded bg-surface-1 border flex flex-col justify-between gap-xs ${
              alert.isAcknowledged ? 'border-line opacity-60' : 'border-status-alert/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-ink-primary">
                <span>{alert.title}</span>
                <span className="text-[10px] text-accent-signal">{alert.timestamp.slice(11, 16)}</span>
              </div>
              <p className="text-xs text-ink-muted mt-1">{alert.description}</p>
            </div>

            <div className="flex items-center justify-between pt-xs border-t border-line/40 text-xs">
              {alert.affectedFlightId ? (
                <button
                  onClick={() => onSelectFlight?.(alert.affectedFlightId!)}
                  className="text-accent-signal hover:underline flex items-center gap-1 font-bold"
                >
                  View Flight {alert.affectedFlightId} <ChevronRight className="h-3 w-3" />
                </button>
              ) : (
                <span />
              )}

              {!alert.isAcknowledged ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  className="text-xs py-1"
                >
                  Acknowledge Alert
                </Button>
              ) : (
                <span className="text-[11px] text-status-ontime font-bold">ACKNOWLEDGED</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
