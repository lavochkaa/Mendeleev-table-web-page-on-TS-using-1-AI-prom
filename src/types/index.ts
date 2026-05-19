import * as THREE from 'three'

// ─── Element Categories ────────────────────────────────────────────────────────

export type ElementCategory =
  | 'diatomic-nonmetal'
  | 'noble-gas'
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'metalloid'
  | 'polyatomic-nonmetal'
  | 'halogen'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'lanthanide'
  | 'actinide'
  | 'unknown'

// ─── Element Data ──────────────────────────────────────────────────────────────

export interface Element {
  atomicNumber: number
  symbol: string
  name: string
  atomicMass: number
  category: ElementCategory
  period: number
  group: number | null      // 1–18, null for lanthanides/actinides
  tableRow: number          // 1–9  (8 = lanthanides, 9 = actinides)
  tableCol: number          // 1–18
  electronegativity: number | null
  electronConfig: string
  color: string             // hex, derived from category
}

// ─── Formations ───────────────────────────────────────────────────────────────

export type FormationType =
  | 'table'
  | 'sphere'
  | 'helix'
  | 'grid'
  | 'galaxy'
  | 'dna'
  | 'atom'
  | 'neural'
  | 'wave'

export interface FormationConfig {
  id: FormationType
  label: string
  icon: string
  description: string
  cameraZ: number
}

// ─── Animation State ──────────────────────────────────────────────────────────

export interface CardAnimState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  scale: number
  scaleVelocity: number
  glow: number
  glowVelocity: number
  active: boolean           // false during stagger delay
}

// ─── App Store ────────────────────────────────────────────────────────────────

export interface AppState {
  // Interaction
  selectedElement: Element | null
  hoveredElement: Element | null
  // Formation
  currentFormation: FormationType
  isTransitioning: boolean
  transitionStartTime: number
  // UI
  isLoading: boolean
  audioEnabled: boolean
  showGrid: boolean
  // Actions
  setSelectedElement: (el: Element | null) => void
  setHoveredElement: (el: Element | null) => void
  setFormation: (f: FormationType) => void
  setTransitioning: (b: boolean) => void
  setLoading: (b: boolean) => void
  toggleAudio: () => void
}
