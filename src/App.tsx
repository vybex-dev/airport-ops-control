import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

const OverviewModule = lazy(() => import('./modules/OverviewModule').then((m) => ({ default: m.OverviewModule })));
const AlertsModule = lazy(() => import('./modules/AlertsModule').then((m) => ({ default: m.AlertsModule })));
const FlightsModule = lazy(() => import('./modules/FlightsModule').then((m) => ({ default: m.FlightsModule })));
const GatesModule = lazy(() => import('./modules/GatesModule').then((m) => ({ default: m.GatesModule })));
const BaggageModule = lazy(() => import('./modules/BaggageModule').then((m) => ({ default: m.BaggageModule })));
const SecurityModule = lazy(() => import('./modules/SecurityModule').then((m) => ({ default: m.SecurityModule })));
const StaffModule = lazy(() => import('./modules/StaffModule').then((m) => ({ default: m.StaffModule })));
const RetailModule = lazy(() => import('./modules/RetailModule').then((m) => ({ default: m.RetailModule })));
const MaintenanceModule = lazy(() => import('./modules/MaintenanceModule').then((m) => ({ default: m.MaintenanceModule })));

function RouteFallback() {
  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-md text-ink-muted">
      <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
      <span className="font-display text-xs uppercase tracking-widest">Loading Operational Module...</span>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewModule />} />
            <Route path="alerts" element={<AlertsModule />} />
            <Route path="flights" element={<FlightsModule />} />
            <Route path="gates" element={<GatesModule />} />
            <Route path="baggage" element={<BaggageModule />} />
            <Route path="security" element={<SecurityModule />} />
            <Route path="staff" element={<StaffModule />} />
            <Route path="retail" element={<RetailModule />} />
            <Route path="maintenance" element={<MaintenanceModule />} />
            {/* Catch-all redirect to Overview */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

