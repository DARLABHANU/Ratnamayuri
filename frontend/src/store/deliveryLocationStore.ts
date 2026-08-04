import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DeliveryLocation {
  pincode: string;
  city: string;
  district: string;
  state: string;
}

interface DeliveryLocationStore {
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation) => void;
  clearLocation: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationStore>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (loc) => set({ location: loc }),
      clearLocation: () => set({ location: null }),
      isModalOpen: false,
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
    }),
    {
      name: "ratnamayuri-delivery-location", // persists to localStorage
      partialize: (state) => ({ location: state.location }), // Only persist location, not modal state
    }
  )
);
