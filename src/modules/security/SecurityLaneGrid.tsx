import React from 'react';
import type { LaneStatus } from '@/lib/security/securityDataService';
import { ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export interface SecurityLaneGridProps {
  lanes: LaneStatus[];
  activeLaneFilter: string;
  onSelectLane: (laneNum: string) => void;
}

export const SecurityLaneGrid: React.FC<SecurityLaneGridProps> = ({
  lanes,
  activeLaneFilter,
  onSelectLane,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-xs font-data select-none">
      {lanes.map((lane) => {
        const isSelected = activeLaneFilter === lane.laneNumber.toString();

        let badgeVariant: 'ontime' | 'delayed' | 'alert' = 'ontime';
        if (lane.status === 'HEAVY') badgeVariant = 'alert';
        else if (lane.status === 'MODERATE') badgeVariant = 'delayed';

        return (
          <div
            key={lane.laneNumber}
            onClick={() => onSelectLane(isSelected ? 'ALL' : lane.laneNumber.toString())}
            className={`p-xs rounded-md border cursor-pointer transition-all flex flex-col justify-between gap-xs ${
              isSelected
                ? 'bg-accent-signal/10 border-accent-signal ring-1 ring-accent-signal'
                : 'bg-surface-1 border-line hover:bg-surface-2/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-primary text-xs flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-signal" />
                LANE {lane.laneNumber}
              </span>
              <StatusBadge variant={badgeVariant} size="sm">
                {lane.status}
              </StatusBadge>
            </div>

            <div>
              <div className="text-sm font-bold text-ink-primary">
                {lane.processedCount.toLocaleString()}{' '}
                <span className="text-[10px] text-ink-muted font-normal">processed</span>
              </div>
              <div className="text-[10px] text-ink-muted mt-0.5">
                Capacity: 400 pax/h (XRAY-1)
              </div>
            </div>

            <div className="pt-xs border-t border-line/40 text-[10px] flex items-center justify-between text-ink-muted">
              <span>Avg Processing:</span>
              <span className="font-bold text-ink-primary">{lane.avgWaitSec}s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
