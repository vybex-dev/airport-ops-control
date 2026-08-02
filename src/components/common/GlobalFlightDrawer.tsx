import React, { useMemo, lazy, Suspense } from "react";
import { useFlightModalStore } from "@/store/useFlightModalStore";
import { useSimClock, useAlerts } from "@/store/useSimEngineHooks";
import {
  getAllFlights,
  getJoinedFlightData,
} from "@/lib/flights/flightDataService";

// Lazy-loaded so the drawer's full import graph (including any chart libs a
// tab might use) is only fetched once a flight is actually selected — not
// as part of the initial page bundle via AppLayout, which mounts this
// component unconditionally on every route.
const FlightDetailDrawer = lazy(() =>
  import("@/modules/flights/FlightDetailDrawer").then((m) => ({
    default: m.FlightDetailDrawer,
  })),
);

export const GlobalFlightDrawer: React.FC = () => {
  const { selectedFlightId, isOpen, closeFlightModal } = useFlightModalStore();
  const { currentTimeMs } = useSimClock();
  const { alerts, acknowledgeAlert } = useAlerts();

  const joinedData = useMemo(() => {
    if (!selectedFlightId || !isOpen) return null;
    const flight = getAllFlights().find((f) => f.flightId === selectedFlightId);
    if (!flight) return null;
    return getJoinedFlightData(flight, alerts, currentTimeMs);
  }, [selectedFlightId, isOpen, alerts, currentTimeMs]);

  if (!isOpen || !joinedData) return null;

  return (
    <Suspense fallback={null}>
      <FlightDetailDrawer
        data={joinedData}
        onClose={closeFlightModal}
        onAcknowledgeAlert={acknowledgeAlert}
      />
    </Suspense>
  );
};
