import { create } from 'zustand'
import { AppState, Element, FormationType } from '@/types'

export const useStore = create<AppState>((set) => ({
  // ─── State ───────────────────────────────────────────────────────────────────
  selectedElement: null,
  hoveredElement: null,
  currentFormation: 'table',
  isTransitioning: false,
  transitionStartTime: 0,
  isLoading: true,
  audioEnabled: false,
  showGrid: false,

  // ─── Actions ─────────────────────────────────────────────────────────────────
  setSelectedElement: (el: Element | null) => set({ selectedElement: el }),

  setHoveredElement: (el: Element | null) => set({ hoveredElement: el }),

  setFormation: (f: FormationType) =>
    set({
      currentFormation: f,
      isTransitioning: true,
      transitionStartTime: Date.now(),
    }),

  setTransitioning: (b: boolean) => set({ isTransitioning: b }),

  setLoading: (b: boolean) => set({ isLoading: b }),

  toggleAudio: () => set(s => ({ audioEnabled: !s.audioEnabled })),
}))
