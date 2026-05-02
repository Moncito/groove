import { create } from 'zustand'

interface UIState {
  // Bottom sheet / modal state
  isCheckInModalOpen: boolean
  activeHabitId: string | null
  openCheckInModal: (habitId: string) => void
  closeCheckInModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isCheckInModalOpen: false,
  activeHabitId: null,
  openCheckInModal: (habitId) =>
    set({ isCheckInModalOpen: true, activeHabitId: habitId }),
  closeCheckInModal: () =>
    set({ isCheckInModalOpen: false, activeHabitId: null }),
}))
