import { create } from 'zustand';

interface FlightModalState {
  selectedFlightId: string | null;
  isOpen: boolean;
  openFlightModal: (flightId: string) => void;
  closeFlightModal: () => void;
}

export const useFlightModalStore = create<FlightModalState>((set) => ({
  selectedFlightId: null,
  isOpen: false,
  openFlightModal: (flightId: string) => set({ selectedFlightId: flightId, isOpen: true }),
  closeFlightModal: () => set({ selectedFlightId: null, isOpen: false }),
}));
