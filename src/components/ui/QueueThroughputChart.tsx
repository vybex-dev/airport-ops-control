import React from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { HourlySecurityBucket } from '@/lib/security/securityDataService';

export interface QueueThroughputChartProps {
  data: HourlySecurityBucket[];
  currentTimeMs: number;
}

export const QueueThroughputChart: React.FC<QueueThroughputChartProps> = ({ data, currentTimeMs }) => {
  const currentHourLabel = React.useMemo(() => {
    const d = new Date(currentTimeMs);
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  }, [currentTimeMs]);

  return (
    <div className="w-full h-64 bg-surface-1 border border-line rounded-md p-sm flex flex-col font-data">
      <div className="flex items-center justify-between mb-xs">
        <div className="flex items-center gap-sm text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-status-boarding/60 border border-status-boarding" />
            <span className="text-ink-muted">Entered Queue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-status-ontime/60 border border-status-ontime" />
            <span className="text-ink-muted">Cleared Screening</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-status-alert/60 border border-status-alert" />
            <span className="text-ink-muted">Backlog Risk</span>
          </div>
        </div>

        <span className="text-[11px] text-accent-signal uppercase tracking-wider font-bold">
          24-HOUR ROLLING THROUGHPUT TELEMETRY
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#2a3547" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hourLabel" stroke="#8b96a8" fontSize={10} tickLine={false} />
            <YAxis stroke="#8b96a8" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a2333',
                borderColor: '#2a3547',
                borderRadius: '4px',
                color: '#e8ecf2',
                fontSize: '12px',
                fontFamily: 'IBM Plex Mono',
              }}
            />
            <Bar dataKey="queueEntered" fill="#3ba7ff" fillOpacity={0.6} radius={[2, 2, 0, 0]} name="Queue Entered" />
            <Area
              type="monotone"
              dataKey="cleared"
              stroke="#2fd97c"
              fill="#2fd97c"
              fillOpacity={0.2}
              strokeWidth={2}
              name="Cleared Pax"
            />
            <Area
              type="monotone"
              dataKey="backlog"
              stroke="#ff4d4f"
              fill="#ff4d4f"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Backlog"
            />
            <ReferenceLine
              x={currentHourLabel}
              stroke="#00e5ff"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: 'VIRTUAL NOW',
                fill: '#00e5ff',
                fontSize: 10,
                position: 'top',
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
