import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { DynamicBagState } from '@/lib/baggage/baggageDataService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Luggage, X, Plane, User, AlertTriangle, Scale, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface BagDetailDrawerProps {
  bagState: DynamicBagState | null;
  onClose: () => void;
  onOpenFlightDrawer?: (flightId: string) => void;
}

export const BagDetailDrawer: React.FC<BagDetailDrawerProps> = ({
  bagState,
  onClose,
  onOpenFlightDrawer,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {bagState && (
        <BagDetailDrawerContent
          bagState={bagState}
          onClose={onClose}
          onOpenFlightDrawer={onOpenFlightDrawer}
          shouldReduceMotion={shouldReduceMotion}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};

interface BagDetailDrawerContentProps {
  bagState: DynamicBagState;
  onClose: () => void;
  onOpenFlightDrawer?: (flightId: string) => void;
  shouldReduceMotion: boolean | null;
}

const BagDetailDrawerContent: React.FC<BagDetailDrawerContentProps> = ({
  bagState,
  onClose,
  onOpenFlightDrawer,
  shouldReduceMotion,
}) => {
  const { bag, flight, statusLabel, badgeVariant, alert } = bagState;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
        animate={shouldReduceMotion ? { opacity: 1 } : { x: '0%' }}
        exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative z-10 w-full max-w-[500px] sm:max-w-[560px] bg-surface-1 border-l border-line h-full flex flex-col shadow-2xl font-data"
      >
        {/* Drawer Header */}
        <div className="px-md py-sm border-b border-line bg-surface-2/80 flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <div className="p-xs rounded bg-status-ontime/10 text-status-ontime border border-status-ontime/30">
              <Luggage className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <h3 className="font-bold text-ink-primary text-base">Bag Tag #{bag.bagTagId}</h3>
                <StatusBadge variant={badgeVariant} size="sm">
                  {statusLabel}
                </StatusBadge>
              </div>
              <p className="text-xs text-ink-muted">PNR: {bag.tagPnr} | Checkpoint: {bag.checkpointCode}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-md space-y-md flex-1 overflow-y-auto">
          {/* Active Alert Banner if flagged */}
          {alert && (
            <div className="p-sm rounded bg-status-alert/10 border border-status-alert/30 text-status-alert text-xs space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>{alert.title}</span>
              </div>
              <p className="text-ink-muted">{alert.description}</p>
            </div>
          )}

          {/* Bag Attributes Card */}
          <div className="p-sm rounded bg-surface-2/60 border border-line space-y-xs">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-accent-signal flex items-center gap-1">
              <Scale className="h-3.5 w-3.5" /> BHS Telemetry & Specs
            </h4>

            <div className="grid grid-cols-2 gap-xs text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">Weight</span>
                <span className="text-ink-primary font-bold">{bag.weightKg.toFixed(1)} kg</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Dimensions</span>
                <span className="text-ink-primary font-bold">{bag.dimensions}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Scans Logged</span>
                <span className="text-ink-primary font-bold">{bag.scanCount} scans</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Current Location</span>
                <span className="text-ink-primary font-bold">{bag.currentLocation}</span>
              </div>
            </div>
          </div>

          {/* Timestamp Lifecycle */}
          <div className="p-sm rounded bg-surface-2/60 border border-line space-y-xs">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-accent-signal flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Lifecycle Timestamps
            </h4>

            <div className="space-y-xs text-xs">
              <div className="flex items-center justify-between border-b border-line/40 pb-1">
                <span className="text-ink-muted">Check-in Logged:</span>
                <span className="text-ink-primary font-bold">{bag.checkInTimestamp}</span>
              </div>
              <div className="flex items-center justify-between border-b border-line/40 pb-1">
                <span className="text-ink-muted">Load Timestamp:</span>
                <span className="text-ink-primary font-bold">{bag.loadTimestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Last Scan Event:</span>
                <span className="text-ink-primary font-bold">{bag.lastScanTimestamp}</span>
              </div>
            </div>
          </div>

          {/* Linked Passenger Ref */}
          <div className="p-sm rounded bg-surface-2/60 border border-line space-y-xs">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-accent-signal flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Passenger Reference
            </h4>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">Passport Ref Code</span>
                <span className="text-ink-primary font-bold">{bag.passengerRef}</span>
              </div>
              <div className="text-right">
                <span className="text-ink-muted block text-[11px]">Tag PNR</span>
                <span className="text-accent-signal font-bold">{bag.tagPnr}</span>
              </div>
            </div>
          </div>

          {/* Linked Flight Card */}
          {flight && (
            <div className="p-sm rounded bg-surface-2 border border-line space-y-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-accent-signal flex items-center gap-1">
                  <Plane className="h-3.5 w-3.5" /> Linked Flight Manifest
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenFlightDrawer?.(flight.flightId);
                  }}
                  className="text-[11px] py-0.5"
                >
                  View Full Flight
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-xs text-xs">
                <div>
                  <span className="text-ink-muted block text-[11px]">Flight ID</span>
                  <span className="text-ink-primary font-bold">{flight.flightId} ({flight.airlineCode})</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Destination</span>
                  <span className="text-accent-signal font-bold">{flight.destination}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Gate / STD</span>
                  <span className="text-ink-primary font-bold">{flight.gate} | {flight.scheduledDeparture.slice(11, 16)}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Aircraft</span>
                  <span className="text-ink-primary font-bold">{flight.aircraftType} ({flight.aircraftReg})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
