import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAlerts } from '@/store/useSimEngineHooks';
import {
  LayoutDashboard,
  Plane,
  DoorClosed,
  Luggage,
  ShieldCheck,
  Users,
  ShoppingBag,
  Wrench,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'ontime' | 'boarding' | 'delayed' | 'alert' | 'neutral';
  shortcut?: string;
}

export const staticNavItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
    badge: 'NOC ALL',
    badgeVariant: 'neutral',
    shortcut: '1',
  },
  {
    id: 'alerts',
    label: 'Alerts & Incidents',
    path: '/alerts',
    icon: <ShieldAlert className="h-4 w-4 text-status-alert" />,
    badgeVariant: 'alert',
    shortcut: 'A',
  },
  {
    id: 'flights',
    label: 'Flights',
    path: '/flights',
    icon: <Plane className="h-4 w-4" />,
    badge: '1,000',
    badgeVariant: 'boarding',
    shortcut: '2',
  },
  {
    id: 'gates',
    label: 'Gates',
    path: '/gates',
    icon: <DoorClosed className="h-4 w-4" />,
    badge: '687',
    badgeVariant: 'neutral',
    shortcut: '3',
  },
  {
    id: 'baggage',
    label: 'Baggage',
    path: '/baggage',
    icon: <Luggage className="h-4 w-4" />,
    badge: '2,800',
    badgeVariant: 'neutral',
    shortcut: '4',
  },
  {
    id: 'security',
    label: 'Security',
    path: '/security',
    icon: <ShieldCheck className="h-4 w-4" />,
    badge: '2,500',
    badgeVariant: 'ontime',
    shortcut: '5',
  },
  {
    id: 'staff',
    label: 'Staff',
    path: '/staff',
    icon: <Users className="h-4 w-4" />,
    badge: '600',
    badgeVariant: 'neutral',
    shortcut: '6',
  },
  {
    id: 'retail',
    label: 'Retail',
    path: '/retail',
    icon: <ShoppingBag className="h-4 w-4" />,
    badge: '3,000',
    badgeVariant: 'neutral',
    shortcut: '7',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    path: '/maintenance',
    icon: <Wrench className="h-4 w-4" />,
    badge: '400',
    badgeVariant: 'alert',
    shortcut: '8',
  },
];

export interface PrimaryNavProps {
  onItemClick?: () => void;
  className?: string;
}

export const PrimaryNav: React.FC<PrimaryNavProps> = ({ onItemClick, className }) => {
  const { unacknowledgedCount } = useAlerts();

  return (
    <nav
      aria-label="Primary Control Room Modules"
      className={clsx('flex flex-col gap-4xs py-xs text-ink-muted', className)}
    >
      <div className="px-sm pb-2xs font-display text-[10px] font-semibold uppercase tracking-wider text-ink-muted/70">
        Control Modules
      </div>

      <div className="flex flex-col gap-4xs">
        {staticNavItems.map((item) => {
          const badgeText = item.id === 'alerts' ? `${unacknowledgedCount} OPEN` : item.badge;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              onClick={onItemClick}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center justify-between px-sm py-2xs mx-2xs rounded-sm font-display text-xs font-medium transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal focus-visible:ring-offset-1 focus-visible:ring-offset-surface-1',
                  isActive
                    ? 'bg-surface-2 text-ink-primary border-l-2 border-l-accent-signal shadow-sm font-semibold'
                    : 'hover:bg-surface-2/60 hover:text-ink-primary border-l-2 border-l-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2xs min-w-0">
                    <span
                      className={clsx(
                        'shrink-0 transition-colors',
                        isActive ? 'text-accent-signal' : 'text-ink-muted group-hover:text-ink-primary'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {badgeText && (
                      <span
                        className={clsx(
                          'font-data text-[10px] px-1.5 py-0.5 rounded border select-none',
                          item.id === 'alerts' && unacknowledgedCount > 0
                            ? 'bg-status-alert/15 text-status-alert border-status-alert/40 font-bold animate-pulse'
                            : isActive
                            ? 'bg-accent-signal/15 text-accent-signal border-accent-signal/30'
                            : 'bg-surface-0/60 text-ink-muted border-line/60 group-hover:border-line'
                        )}
                      >
                        {badgeText}
                      </span>
                    )}
                    <ChevronRight
                      className={clsx(
                        'h-3 w-3 transition-transform duration-150',
                        isActive
                          ? 'text-accent-signal translate-x-0.5'
                          : 'text-ink-muted/40 opacity-0 group-hover:opacity-100'
                      )}
                    />
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
