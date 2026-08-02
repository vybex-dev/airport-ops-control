import React, { useMemo } from 'react';
import { useFlightModalStore } from '@/store/useFlightModalStore';
import { useSimClock, useAlerts } from '@/store/useSimEngineHooks';
import { getAllFlights, getJoinedFlightData } from '@/lib/flights/flightDataService';
import { FlightDetailDrawer } from '@/modules/flights/FlightDetailDrawer';

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
    <FlightDetailDrawer
      data={joinedData}
      onClose={closeFlightModal}
      onAcknowledgeAlert={acknowledgeAlert}
    />
  );
};
