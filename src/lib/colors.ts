import { ElementCategory } from '@/types'

/** Neon color palette — one per element category */
export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  'alkali-metal':          '#ff6600',
  'alkaline-earth-metal':  '#ffaa00',
  'transition-metal':      '#4488ff',
  'post-transition-metal': '#44ccff',
  'metalloid':             '#aa44ff',
  'polyatomic-nonmetal':   '#00ffcc',
  'diatomic-nonmetal':     '#00ff88',
  'halogen':               '#ff0088',
  'noble-gas':             '#00ccff',
  'lanthanide':            '#ff44cc',
  'actinide':              '#ffaa44',
  'unknown':               '#8888aa',
}

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  'alkali-metal':          'Alkali Metal',
  'alkaline-earth-metal':  'Alkaline Earth Metal',
  'transition-metal':      'Transition Metal',
  'post-transition-metal': 'Post-transition Metal',
  'metalloid':             'Metalloid',
  'polyatomic-nonmetal':   'Polyatomic Nonmetal',
  'diatomic-nonmetal':     'Diatomic Nonmetal',
  'halogen':               'Halogen',
  'noble-gas':             'Noble Gas',
  'lanthanide':            'Lanthanide',
  'actinide':              'Actinide',
  'unknown':               'Unknown',
}

export function getCategoryColor(category: ElementCategory): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['unknown']
}

/** Convert hex color string to [r, g, b] 0–1 floats */
export function hexToRGB(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}
