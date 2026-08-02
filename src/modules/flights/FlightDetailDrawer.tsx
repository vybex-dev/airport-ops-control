import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  X,
  Plane,
  Users,
  Luggage,
  DoorClosed,
  Wrench,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { JoinedFlightData } from '@/lib/flights/flightDataService';

interface FlightDetailDrawerProps {
  data: JoinedFlightData | null;
  onClose: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const FlightDetailDrawer: React.FC<FlightDetailDrawerProps> = ({
  data,
  onClose,
  onAcknowledgeAlert,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {data && (
        <FlightDetailDrawerContent
          data={data}
          onClose={onClose}
          onAcknowledgeAlert={onAcknowledgeAlert}
          shouldReduceMotion={shouldReduceMotion}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};

interface FlightDetailDrawerContentProps {
  data: JoinedFlightData;
  onClose: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
  shouldReduceMotion: boolean | null;
}

const FlightDetailDrawerContent: React.FC<FlightDetailDrawerContentProps> = ({
  data,
  onClose,
  onAcknowledgeAlert,
  shouldReduceMotion,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'passengers' | 'baggage' | 'gate' | 'maintenance' | 'alerts'>(
    'overview'
  );
  const [passengerSearch, setPassengerSearch] = useState('');

  const { flight, passengers, baggage, gateEvents, maintenanceLogs, alerts, liveState } = data;

  const filteredPassengers = passengerSearch.trim()
    ? passengers.list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(passengerSearch.toLowerCase()) ||
          p.lastName.toLowerCase().includes(passengerSearch.toLowerCase()) ||
          p.pnrCode.toLowerCase().includes(passengerSearch.toLowerCase()) ||
          p.seatNumber.toLowerCase().includes(passengerSearch.toLowerCase())
      )
    : passengers.list;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
      {/* Backdrop Click to Close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
        animate={shouldReduceMotion ? { opacity: 1 } : { x: '0%' }}
        exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative z-10 w-full max-w-[720px] lg:max-w-[850px] bg-surface-1 border-l border-line shadow-2xl flex flex-col h-full overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-md border-b border-line bg-surface-2/80 relative">
          <div className="flex items-start justify-between gap-md">
            <div className="flex items-center gap-sm">
              <div className="p-sm rounded-md bg-surface-1 border border-accent-signal/40 text-accent-signal">
                <Plane className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-xs flex-wrap">
                  <span className="font-data text-xl font-bold text-ink-primary tracking-wider">
                    {flight.flightId}
                  </span>
                  <span className="font-display text-sm text-ink-muted">({flight.airlineName})</span>
                  <StatusBadge variant={liveState.badgeVariant} size="sm" pulseDot={liveState.isLive}>
                    {liveState.statusLabel}
                  </StatusBadge>
                  {alerts.length > 0 && (
                    <StatusBadge variant="alert" size="sm" pulseDot>
                      {alerts.length} ALERTS
                    </StatusBadge>
                  )}
                </div>

                <div className="flex items-center gap-xs mt-1 text-xs font-data text-ink-muted">
                  <span className="text-ink-primary font-semibold">DEL (Delhi)</span>
                  <span>&rarr;</span>
                  <span className="text-accent-signal font-bold">{flight.destination}</span>
                  <span className="text-line">•</span>
                  <span>Gate {flight.gate}</span>
                  <span className="text-line">•</span>
                  <span>Terminal {flight.terminal}</span>
                  <span className="text-line">•</span>
                  <span>{flight.aircraftType} ({flight.aircraftReg})</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-xs rounded-full bg-surface-1 border border-line text-ink-muted hover:text-ink-primary hover:bg-surface-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs mt-sm pt-xs border-t border-line/60">
            <div className="p-2xs bg-surface-1 rounded border border-line text-center">
              <span className="block font-data text-[10px] uppercase text-ink-muted">Scheduled STD</span>
              <span className="font-data text-xs font-bold text-ink-primary">{flight.scheduledDeparture.slice(11, 16)}</span>
            </div>
            <div className="p-2xs bg-surface-1 rounded border border-line text-center">
              <span className="block font-data text-[10px] uppercase text-ink-muted">Actual / Est</span>
              <span
                className={`font-data text-xs font-bold ${
                  flight.delayMinutes > 0 ? 'text-status-delayed' : 'text-status-ontime'
                }`}
              >
                {flight.actualDeparture.slice(11, 16)}
              </span>
            </div>
            <div className="p-2xs bg-surface-1 rounded border border-line text-center">
              <span className="block font-data text-[10px] uppercase text-ink-muted">Pax Load</span>
              <span className="font-data text-xs font-bold text-ink-primary">
                {flight.passengerCount} / {flight.capacity} ({passengers.loadFactorPct}%)
              </span>
            </div>
            <div className="p-2xs bg-surface-1 rounded border border-line text-center">
              <span className="block font-data text-[10px] uppercase text-ink-muted">Checked Bags</span>
              <span className="font-data text-xs font-bold text-accent-signal">{baggage.totalCount} bags</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-xs px-md py-xs border-b border-line bg-surface-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-sm py-1.5 rounded-sm font-display text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40'
                : 'text-ink-muted hover:text-ink-primary border border-transparent'
            }`}
          >
            <Info className="h-3.5 w-3.5" /> Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('passengers')}
            className={`px-sm py-1.5 rounded-sm font-display text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'passengers'
                ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40'
                : 'text-ink-muted hover:text-ink-primary border border-transparent'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Passengers ({passengers.totalSampled})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('baggage')}
            className={`px-sm py-1.5 rounded-sm font-display text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'baggage'
                ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40'
                : 'text-ink-muted hover:text-ink-primary border border-transparent'
            }`}
          >
            <Luggage className="h-3.5 w-3.5" /> Baggage ({baggage.totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gate')}
            className={`px-sm py-1.5 rounded-sm font-display text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'gate'
                ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40'
                : 'text-ink-muted hover:text-ink-primary border border-transparent'
            }`}
          >
            <DoorClosed className="h-3.5 w-3.5" /> Gate Events ({gateEvents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-sm py-1.5 rounded-sm font-display text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'bg-accent-signal/20 text-accent-signal border border-accent-signal/40'
                : 'text-ink-muted hover:text-ink-primary border border-transparent'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" /> Maintenance ({maintenanceLogs.length})
          </button>

          {alerts.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`px-sm py-1.5 rounded-sm font-display text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'bg-status-alert/20 text-status-alert border border-status-alert/40'
                  : 'text-status-alert hover:bg-status-alert/10 border border-status-alert/30'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Active Alerts ({alerts.length})
            </button>
          )}
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-md space-y-md">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-md">
              {/* Active Alerts Banner if any */}
              {alerts.length > 0 && (
                <div className="p-sm rounded-md bg-status-alert/10 border border-status-alert/30 space-y-xs">
                  <div className="flex items-center gap-xs text-status-alert font-bold font-display text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Active Phase 2 Operational Alert ({alerts.length})</span>
                  </div>
                  {alerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs font-data bg-surface-1 p-2xs rounded border border-status-alert/20">
                      <div>
                        <span className="font-bold text-status-alert">{a.ruleId}:</span> {a.title} &mdash; {a.description}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcknowledgeAlert(a.id)}
                        className="text-status-alert border-status-alert/40 hover:bg-status-alert/20 text-[10px]"
                      >
                        Acknowledge
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Load Factor Visual Gauge */}
              <div className="p-sm rounded bg-surface-2/40 border border-line space-y-xs">
                <div className="flex items-center justify-between font-data text-xs">
                  <span className="text-ink-muted">Seat Occupancy / Load Factor:</span>
                  <span className="font-bold text-ink-primary">
                    {flight.passengerCount} / {flight.capacity} seats ({passengers.loadFactorPct}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-1 overflow-hidden border border-line p-0.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      passengers.loadFactorPct > 90
                        ? 'bg-status-ontime'
                        : passengers.loadFactorPct > 70
                        ? 'bg-status-boarding'
                        : 'bg-status-delayed'
                    }`}
                    style={{ width: `${passengers.loadFactorPct}%` }}
                  />
                </div>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
                <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                  <span className="font-data text-[10px] uppercase text-ink-muted block">Aircraft Airframe</span>
                  <span className="font-data text-sm font-bold text-ink-primary block">{flight.aircraftType}</span>
                  <span className="font-data text-xs text-accent-signal block">Reg: {flight.aircraftReg}</span>
                </div>

                <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                  <span className="font-data text-[10px] uppercase text-ink-muted block">Delay Reason Tag</span>
                  <span className="font-data text-sm font-bold text-status-delayed block">{flight.delayReason}</span>
                  <span className="font-data text-xs text-ink-muted block">Delay: +{flight.delayMinutes} mins</span>
                </div>

                <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                  <span className="font-data text-[10px] uppercase text-ink-muted block">Turnaround Time</span>
                  <span className="font-data text-sm font-bold text-ink-primary block">{flight.turnaroundMinutes} mins</span>
                  <span className="font-data text-xs text-ink-muted block">Boarding window: 45m</span>
                </div>

                <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                  <span className="font-data text-[10px] uppercase text-ink-muted block">OTP Score</span>
                  <span className="font-data text-sm font-bold text-status-ontime block">
                    {flight.onTimePerformanceScore.toFixed(1)} / 100
                  </span>
                  <span className="font-data text-xs text-ink-muted block">Category: {flight.delayCategory}</span>
                </div>

                <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                  <span className="font-data text-[10px] uppercase text-ink-muted block">Distance & Fuel</span>
                  <span className="font-data text-sm font-bold text-ink-primary block">{flight.distanceKm} km</span>
                  <span className="font-data text-xs text-ink-muted block">{flight.fuelUsedKg.toLocaleString()} kg fuel</span>
                </div>

                <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                  <span className="font-data text-[10px] uppercase text-ink-muted block">Route Metadata</span>
                  <span className="font-data text-sm font-bold text-ink-primary block">{flight.routeType}</span>
                  <span className="font-data text-xs text-ink-muted block">
                    {flight.isInternational ? 'International' : 'Domestic'} ({flight.timeOfDayBand})
                  </span>
                </div>
              </div>

              {/* Timeline Specs */}
              <div className="p-sm rounded bg-surface-2/40 border border-line space-y-xs">
                <h4 className="font-display text-xs font-bold text-ink-primary uppercase tracking-wider">
                  Full Timeline Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-xs font-data text-xs">
                  <div className="p-2xs bg-surface-1 rounded border border-line">
                    <span className="text-ink-muted block text-[10px]">BOARDING TIME</span>
                    <span className="text-accent-signal font-bold">{flight.boardingTime}</span>
                  </div>
                  <div className="p-2xs bg-surface-1 rounded border border-line">
                    <span className="text-ink-muted block text-[10px]">SCHEDULED DEPARTURE</span>
                    <span className="text-ink-primary font-bold">{flight.scheduledDeparture}</span>
                  </div>
                  <div className="p-2xs bg-surface-1 rounded border border-line">
                    <span className="text-ink-muted block text-[10px]">ACTUAL DEPARTURE</span>
                    <span className="text-status-delayed font-bold">{flight.actualDeparture}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGERS */}
          {activeTab === 'passengers' && (
            <div className="space-y-md">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Total Passengers</span>
                  <span className="font-data text-base font-bold text-ink-primary">{flight.passengerCount}</span>
                </div>
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Business / Economy</span>
                  <span className="font-data text-base font-bold text-accent-signal">
                    {passengers.businessCount} / {passengers.economyCount}
                  </span>
                </div>
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Frequent Flyers</span>
                  <span className="font-data text-base font-bold text-status-ontime">{passengers.frequentFlyersCount}</span>
                </div>
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Special Assistance</span>
                  <span className="font-data text-base font-bold text-status-delayed">{passengers.specialAssistanceCount}</span>
                </div>
              </div>

              {/* Sampled Passenger Manifest List */}
              <div className="space-y-xs">
                <div className="flex items-center justify-between gap-xs">
                  <h4 className="font-display text-xs font-bold text-ink-primary">
                    Sampled Manifest Records ({passengers.totalSampled} joined)
                  </h4>
                  <input
                    type="text"
                    value={passengerSearch}
                    onChange={(e) => setPassengerSearch(e.target.value)}
                    placeholder="Search passenger name or PNR..."
                    className="bg-surface-2 text-xs text-ink-primary px-xs py-1 rounded border border-line focus:outline-none focus:border-accent-signal w-48 font-data"
                  />
                </div>

                {filteredPassengers.length === 0 ? (
                  <p className="text-xs text-ink-muted p-md text-center bg-surface-2/30 rounded border border-line">
                    No passenger manifest records found matching search.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded border border-line bg-surface-1">
                    <table className="w-full min-w-[560px] text-left font-data text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-2/60 border-b border-line text-ink-muted text-[10px] uppercase">
                          <th className="p-xs">PNR</th>
                          <th className="p-xs">Passenger Name</th>
                          <th className="p-xs">Seat</th>
                          <th className="p-xs">Class</th>
                          <th className="p-xs">Nationality</th>
                          <th className="p-xs">Check-In Time</th>
                          <th className="p-xs">Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {filteredPassengers.map((p) => (
                          <tr key={p.pnrCode + p.seatNumber} className="hover:bg-surface-2/40">
                            <td className="p-xs font-bold text-accent-signal">{p.pnrCode}</td>
                            <td className="p-xs font-display text-ink-primary font-medium">
                              {p.firstName} {p.lastName}
                            </td>
                            <td className="p-xs text-ink-primary font-bold">{p.seatNumber}</td>
                            <td className="p-xs">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  p.bookingClass === 'Business'
                                    ? 'bg-status-boarding/20 text-status-boarding'
                                    : 'bg-surface-2 text-ink-muted'
                                }`}
                              >
                                {p.bookingClass}
                              </span>
                            </td>
                            <td className="p-xs text-ink-muted">{p.nationality}</td>
                            <td className="p-xs text-ink-muted">{p.checkInTime.slice(11, 19)}</td>
                            <td className="p-xs flex items-center gap-1 flex-wrap">
                              {p.isFrequentFlyer && (
                                <span className="px-1 py-0.5 rounded bg-status-ontime/20 text-status-ontime text-[9px] font-bold">
                                  FF
                                </span>
                              )}
                              {p.hasSpecialAssistance && (
                                <span className="px-1 py-0.5 rounded bg-status-delayed/20 text-status-delayed text-[9px] font-bold">
                                  ASSIST
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BAGGAGE */}
          {activeTab === 'baggage' && (
            <div className="space-y-md">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-xs">
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Total Checked Bags</span>
                  <span className="font-data text-base font-bold text-accent-signal">{baggage.totalCount}</span>
                </div>
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Total Weight</span>
                  <span className="font-data text-base font-bold text-ink-primary">{baggage.totalWeightKg} kg</span>
                </div>
                <div className="p-xs bg-surface-2/40 rounded border border-line text-center">
                  <span className="block font-data text-[10px] uppercase text-ink-muted">Avg Bag Weight</span>
                  <span className="font-data text-base font-bold text-status-ontime">{baggage.avgWeightKg} kg</span>
                </div>
              </div>

              {/* Baggage Items Table */}
              {baggage.list.length === 0 ? (
                <p className="text-xs text-ink-muted p-md text-center bg-surface-2/30 rounded border border-line">
                  No checked baggage records linked to flight {flight.flightId}.
                </p>
              ) : (
                <div className="overflow-x-auto rounded border border-line bg-surface-1">
                  <table className="w-full min-w-[560px] text-left font-data text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-2/60 border-b border-line text-ink-muted text-[10px] uppercase">
                        <th className="p-xs">Bag Tag ID</th>
                        <th className="p-xs">Tag PNR</th>
                        <th className="p-xs">Weight</th>
                        <th className="p-xs">Checkpoint</th>
                        <th className="p-xs">Check-In Time</th>
                        <th className="p-xs">Scans</th>
                        <th className="p-xs">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {baggage.list.map((b) => (
                        <tr key={b.bagTagId} className="hover:bg-surface-2/40">
                          <td className="p-xs font-bold text-accent-signal">{b.bagTagId}</td>
                          <td className="p-xs text-ink-muted">{b.tagPnr}</td>
                          <td className="p-xs font-bold text-ink-primary">{b.weightKg} kg</td>
                          <td className="p-xs text-ink-muted">{b.checkpointCode}</td>
                          <td className="p-xs text-ink-muted">{b.checkInTimestamp.slice(11, 19)}</td>
                          <td className="p-xs text-status-ontime font-bold">{b.scanCount} scans</td>
                          <td className="p-xs">
                            <span className="px-1.5 py-0.5 rounded bg-surface-2 text-ink-primary border border-line text-[10px]">
                              {b.currentLocation}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GATE EVENTS */}
          {activeTab === 'gate' && (
            <div className="space-y-md">
              <div className="p-sm bg-surface-2/40 rounded border border-line flex items-center justify-between">
                <div>
                  <span className="font-data text-[10px] uppercase text-ink-muted block">Gate Assignment</span>
                  <span className="font-data text-lg font-bold text-accent-signal">Terminal 3 — Gate {flight.gate}</span>
                </div>
                <StatusBadge variant="boarding" size="md">
                  BOARDING ZONE READY
                </StatusBadge>
              </div>

              {gateEvents.length === 0 ? (
                <p className="text-xs text-ink-muted p-md text-center bg-surface-2/30 rounded border border-line">
                  No gate events logged for flight {flight.flightId}.
                </p>
              ) : (
                <div className="space-y-xs">
                  <h4 className="font-display text-xs font-bold text-ink-primary">Concourse Gate Timeline</h4>
                  <div className="space-y-xs">
                    {gateEvents.map((g) => (
                      <div key={g.eventId} className="p-sm bg-surface-2/40 rounded border border-line flex items-center justify-between font-data text-xs">
                        <div className="space-y-4xs">
                          <div className="flex items-center gap-xs">
                            <span className="font-bold text-accent-signal">{g.eventType}</span>
                            <span className="text-ink-muted">({g.eventId})</span>
                          </div>
                          <p className="text-ink-muted text-[11px]">
                            Timestamp: <strong className="text-ink-primary">{g.eventTimestamp}</strong>
                          </p>
                        </div>

                        <div className="text-right space-y-4xs">
                          <span className="text-status-ontime font-bold block">{g.durationSeconds}s duration</span>
                          <span className="text-ink-muted text-[10px] block">Staff Ref: {g.handledByRef}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MAINTENANCE LOGS */}
          {activeTab === 'maintenance' && (
            <div className="space-y-md">
              <div className="p-sm bg-surface-2/40 rounded border border-line space-y-4xs">
                <span className="font-data text-[10px] uppercase text-ink-muted block">Airframe Tail Registry</span>
                <span className="font-data text-base font-bold text-accent-signal block">{flight.aircraftReg}</span>
                <p className="font-display text-xs text-ink-muted">
                  Maintenance work orders associated with airframe operations for {flight.flightId}.
                </p>
              </div>

              {maintenanceLogs.length === 0 ? (
                <p className="text-xs text-ink-muted p-md text-center bg-surface-2/30 rounded border border-line">
                  No open or logged maintenance defects for flight {flight.flightId}.
                </p>
              ) : (
                <div className="space-y-xs">
                  {maintenanceLogs.map((m) => (
                    <div key={m.workOrderId} className="p-sm bg-status-alert/10 border border-status-alert/30 rounded space-y-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-xs">
                          <Wrench className="h-4 w-4 text-status-alert" />
                          <span className="font-data text-xs font-bold text-status-alert">{m.workOrderId}</span>
                        </div>
                        <StatusBadge variant="alert" size="sm">
                          SEVERITY LEVEL {m.severity}
                        </StatusBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-xs font-data text-xs text-ink-primary">
                        <div>
                          <span className="text-ink-muted text-[10px] block">DEFECT DESCRIPTION</span>
                          <span className="font-bold text-status-alert">{m.defectDescription}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted text-[10px] block">PART AFFECTED</span>
                          <span className="font-bold text-ink-primary">{m.partAffected}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-data text-[11px] text-ink-muted pt-xs border-t border-status-alert/20">
                        <span>Opened: {m.openedTimestamp}</span>
                        <span>Tech Ref: {m.technicianRef}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ACTIVE ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-md">
              <h4 className="font-display text-xs font-bold text-status-alert uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-status-alert" />
                Phase 2 Algorithmic Operational Alerts
              </h4>

              {alerts.length === 0 ? (
                <p className="text-xs text-ink-muted p-md text-center bg-surface-2/30 rounded border border-line">
                  No active simulation engine alerts for flight {flight.flightId}.
                </p>
              ) : (
                <div className="space-y-sm">
                  {alerts.map((a) => (
                    <div key={a.id} className="p-sm bg-surface-2/60 border border-status-alert/40 rounded space-y-xs">
                      <div className="flex items-center justify-between">
                        <StatusBadge variant={a.severity === 'critical' ? 'alert' : 'delayed'} size="sm">
                          {a.severity.toUpperCase()} ALERT
                        </StatusBadge>
                        <span className="font-data text-xs text-ink-muted">{a.timestamp}</span>
                      </div>

                      <div>
                        <h5 className="font-display text-sm font-bold text-ink-primary">{a.title}</h5>
                      <p className="font-display text-xs text-ink-muted mt-1">{a.description}</p>
                      </div>

                      <div className="pt-xs border-t border-line flex items-center justify-between">
                        <span className="font-data text-xs text-accent-signal">Rule ID: {a.ruleId}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onAcknowledgeAlert(a.id)}
                          className="bg-status-alert/20 text-status-alert hover:bg-status-alert/30 border-status-alert/40"
                        >
                          Acknowledge Alert
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-md border-t border-line bg-surface-2/60 flex items-center justify-between font-data text-xs text-ink-muted">
          <span>DEL Ops Control Drawer &bull; Flight {flight.flightId}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Drawer
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
