import React, { useState, lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { TopStatusBar } from "./TopStatusBar";
import { PrimaryNav } from "./PrimaryNav";
import { SimDebugPanel } from "../sim/SimDebugPanel";
import { AlertsPanelDrawer } from "../alerts/AlertsPanelDrawer";
import { GlobalFlightDrawer } from "../common/GlobalFlightDrawer";
import { ShieldCheck, Activity, Terminal } from "lucide-react";

// Only fetched once someone actually opens the mobile nav — keeps the
// framer-motion (vendor-motion) chunk off the initial render's critical path.
const MobileNavDrawer = lazy(() =>
  import("./MobileNavDrawer").then((m) => ({ default: m.MobileNavDrawer })),
);

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Tracks whether the drawer has ever been opened. Once true, MobileNavDrawer
  // stays mounted (visibility controlled via isOpen) so AnimatePresence can
  // still play the exit animation on close.
  const [hasOpenedMobileNav, setHasOpenedMobileNav] = useState(false);

  const handleToggleMobileNav = () => {
    setIsMobileNavOpen((prev) => {
      const next = !prev;
      if (next) setHasOpenedMobileNav(true);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface-0 text-ink-primary flex flex-col font-display selection:bg-accent-signal selection:text-surface-0">
      {/* Persistent Header */}
      <TopStatusBar
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={handleToggleMobileNav}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-w-0 relative">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface-1/90 backdrop-blur-sm sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto">
          <PrimaryNav className="flex-1" />

          {/* Quick System Health Box in Sidebar Footer */}
          <div className="p-xs m-2xs rounded bg-surface-0/60 border border-line text-xs">
            <div className="flex items-center justify-between font-data text-[10px] text-ink-muted mb-1">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-status-ontime" /> SYSTEM
                METRICS
              </span>
              <span className="text-status-ontime font-semibold">
                99.9% UPTIME
              </span>
            </div>
            <div className="font-data text-[11px] text-ink-muted">
              DEL-T3 Core Gateway:{" "}
              <span className="text-ink-primary font-medium">ONLINE</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer Overlay — lazy, only after first toggle */}
        {hasOpenedMobileNav && (
          <Suspense fallback={null}>
            <MobileNavDrawer
              isOpen={isMobileNavOpen}
              onClose={() => setIsMobileNavOpen(false)}
            />
          </Suspense>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-sm md:p-md lg:p-lg flex flex-col overflow-y-auto max-w-[1920px] mx-auto w-full">
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Global Alerts / Incident Panel Slide-out Drawer */}
      <AlertsPanelDrawer />

      {/* Global App-Wide Flight Telemetry Detail Drawer */}
      <GlobalFlightDrawer />

      {/* Simulation Engine Debug Panel */}
      <SimDebugPanel />

      {/* Persistent Footer Status Bar */}
      <footer className="border-t border-line bg-surface-0 px-md py-1 text-ink-muted font-data text-[11px] flex flex-wrap items-center justify-between gap-xs select-none">
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-1.5 text-status-ontime">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>OPERATIONAL SCAN CLEAR</span>
          </div>
          <div className="hidden sm:block text-line">•</div>
          <div className="hidden sm:block">
            DEL Airport Operations Control Center — Virtual Clock Simulation
            Active
          </div>
        </div>

        <div className="flex items-center gap-md">
          <div className="hidden md:flex items-center gap-2 font-data text-[10px]">
            <span className="px-1 bg-surface-2 border border-line rounded">
              ⌘K
            </span>{" "}
            Global Search
            <span className="text-line">•</span>
            <span className="px-1 bg-surface-2 border border-line rounded">
              Tab
            </span>{" "}
            Focus Mode
          </div>
          <div className="flex items-center gap-1.5 text-accent-signal">
            <Terminal className="h-3 w-3" />
            <span>VIDP-NODE-01</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
