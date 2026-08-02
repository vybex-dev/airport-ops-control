import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLiveFeed } from '@/store/useSimEngineHooks';
import type { SimEvent, EventSource } from '@/lib/sim/simTypes';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Activity,
  Plane,
  DoorClosed,
  Luggage,
  ShieldCheck,
  Wrench,
  ExternalLink,
  Pause,
  Play,
} from 'lucide-react';

export interface LiveEventFeedProps {
  limit?: number;
  className?: string;
  showControls?: boolean;
}

export const LiveEventFeed: React.FC<LiveEventFeedProps> = ({
  limit = 20,
  className = '',
  showControls = true,
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [sourceFilter, setSourceFilter] = useState<'ALL' | EventSource>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const { events: liveEvents, totalCount } = useLiveFeed({
    limit: 60,
    sourceFilter: sourceFilter === 'ALL' ? undefined : sourceFilter,
  });

  // Filter by search query & freeze stream if paused
  const displayedEvents = useMemo(() => {
    let result = liveEvents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q) ||
          e.flightId?.toLowerCase().includes(q)
      );
    }

    return result.slice(0, limit);
  }, [liveEvents, searchQuery, limit]);

  const handleInvestigateEvent = (ev: SimEvent) => {
    if (ev.flightId) {
      navigate(`/flights?flightId=${encodeURIComponent(ev.flightId)}`);
      return;
    }

    switch (ev.source) {
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
        return <Plane className="h-3.5 w-3.5 text-status-boarding" />;
      case 'gate':
        return <DoorClosed className="h-3.5 w-3.5 text-accent-signal" />;
      case 'baggage':
        return <Luggage className="h-3.5 w-3.5 text-status-ontime" />;
      case 'security':
        return <ShieldCheck className="h-3.5 w-3.5 text-status-ontime" />;
      case 'maintenance':
        return <Wrench className="h-3.5 w-3.5 text-status-alert" />;
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border border-line bg-surface-1 overflow-hidden font-display ${className}`}>
      {/* Header Banner */}
      <div className="p-sm bg-surface-0 border-b border-line flex items-center justify-between gap-xs flex-wrap shrink-0">
        <div className="flex items-center gap-xs">
          <div className="flex items-center justify-center p-1.5 rounded bg-accent-signal/10 border border-accent-signal/30 text-accent-signal">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-ink-primary uppercase tracking-wider">
                Live Operational Event Feed
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-status-ontime/15 border border-status-ontime/40 text-status-ontime font-data text-[10px] font-bold tracking-tight">
                {totalCount} EVENTS INDEXED
              </span>
            </div>
            <p className="font-display text-[11px] text-ink-muted">
              Real-time stream across 5 operational sub-systems as simulation advances
            </p>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-xs">
            <Button
              variant="ghost"
              size="xs"
              icon={isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Resume' : 'Freeze Stream'}
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      {showControls && (
        <div className="p-xs bg-surface-1 border-b border-line flex items-center justify-between gap-xs flex-wrap shrink-0 text-xs">
          <div className="flex items-center gap-xs overflow-x-auto no-scrollbar">
            {(['ALL', 'flight', 'gate', 'baggage', 'security', 'maintenance'] as const).map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-2 py-1 rounded font-data text-[11px] font-medium transition-colors shrink-0 uppercase flex items-center gap-1 ${
                  sourceFilter === src
                    ? 'bg-accent-signal text-surface-0 font-semibold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                    : 'bg-surface-2 text-ink-muted hover:text-ink-primary border border-line'
                }`}
              >
                {src !== 'ALL' && getSourceIcon(src)}
                {src}
              </button>
            ))}
          </div>

          <div className="w-40 sm:w-48">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search feed..."
            />
          </div>
        </div>
      )}

      {/* Event Stream List */}
      <div className="flex-1 overflow-y-auto p-sm space-y-xs min-h-[300px]">
        {displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-lg text-center text-ink-muted my-auto">
            <Activity className="h-6 w-6 text-line mb-xs" />
            <span className="font-data text-xs">No operational events recorded yet in current window.</span>
          </div>
        ) : (
          <AnimatePresence initial={!shouldReduceMotion}>
            {displayedEvents.map((ev) => (
              <motion.div
                key={ev.id}
                initial={shouldReduceMotion ? false : { opacity: 0, x: -8, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-xs rounded bg-surface-0 border border-line/70 hover:border-accent-signal/40 transition-colors group flex items-start justify-between gap-sm"
              >
                <div className="flex items-start gap-xs min-w-0">
                  <div className="p-1 rounded bg-surface-2 border border-line shrink-0 mt-0.5">
                    {getSourceIcon(ev.source)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-xs flex-wrap mb-0.5">
                      <span className="font-data text-[10px] text-accent-signal font-semibold">
                        {ev.timestamp}
                      </span>
                      <span className="font-data text-[9px] px-1 rounded bg-surface-2 border border-line text-ink-muted uppercase">
                        {ev.eventType}
                      </span>
                      {ev.flightId && (
                        <span className="font-data text-[10px] text-ink-primary font-bold">
                          {ev.flightId}
                        </span>
                      )}
                    </div>

                    <h4 className="font-display text-xs font-semibold text-ink-primary group-hover:text-accent-signal transition-colors line-clamp-1">
                      {ev.title}
                    </h4>
                    <p className="font-display text-[11px] text-ink-muted line-clamp-1">
                      {ev.details}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="xs"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  icon={<ExternalLink className="h-3 w-3" />}
                  onClick={() => handleInvestigateEvent(ev)}
                  title="Inspect operational entity"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
