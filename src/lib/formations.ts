import * as THREE from 'three'
import { Element, FormationType } from '@/types'

export type FormationPositions = THREE.Vector3[]

// ─── Centering helpers ────────────────────────────────────────────────────────

/** Shift all positions so their bounding-box center sits at the world origin */
function centerPositions(positions: FormationPositions): FormationPositions {
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  for (const p of positions) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  for (const p of positions) { p.x -= cx; p.y -= cy }
  return positions
}

// ─── Table Formation ──────────────────────────────────────────────────────────

function tableFormation(elements: Element[]): FormationPositions {
  const SPACING = 1.22   // card width + small gap
  const VSEP    = 1.0    // extra vertical gap before lanthanide/actinide rows

  const raw = elements.map(el => {
    const x = (el.tableCol - 1) * SPACING      // 0 → 17, will be centred below
    let y: number
    if (el.tableRow <= 7) {
      y = -(el.tableRow - 1) * SPACING
    } else {
      // Lanthanides (row 8) and Actinides (row 9) sit below the main block
      y = -(7 * SPACING) - VSEP - (el.tableRow - 8) * SPACING
    }
    return new THREE.Vector3(x, y, 0)
  })

  // Center the whole layout (both axes)
  return centerPositions(raw)
}

// ─── Sphere Formation (Fibonacci lattice) ────────────────────────────────────

function sphereFormation(n: number, radius = 8): FormationPositions {
  const golden = Math.PI * (3 - Math.sqrt(5)) // golden angle ≈ 2.399 rad
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    return new THREE.Vector3(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius
    )
  })
}

// ─── Helix Formation ──────────────────────────────────────────────────────────

function helixFormation(
  n: number,
  radius = 5,
  height = 12,   // reduced so it fits in vertical viewport
  turns  = 4
): FormationPositions {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * turns * Math.PI * 2
    return new THREE.Vector3(
      Math.cos(t) * radius,
      (i / n) * height - height / 2,
      Math.sin(t) * radius
    )
  })
}

// ─── 3D Grid Formation ────────────────────────────────────────────────────────

function gridFormation(n: number, spacing = 1.8): FormationPositions {
  const side = Math.ceil(Math.cbrt(n))
  return Array.from({ length: n }, (_, i) => {
    const x = (i % side) - (side - 1) / 2
    const y = (Math.floor(i / side) % side) - (side - 1) / 2
    const z = Math.floor(i / (side * side)) - (side - 1) / 2
    return new THREE.Vector3(x * spacing, y * spacing, z * spacing)
  })
}

// ─── Galaxy Formation ─────────────────────────────────────────────────────────

// Seeded pseudo-random — deterministic, no jumping on re-render
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function galaxyFormation(n: number): FormationPositions {
  const arms  = 3
  const rng   = seededRandom(42)
  const max   = 10           // reduced max radius so outer arms stay in FOV
  return Array.from({ length: n }, (_, i) => {
    const arm      = i % arms
    const progress = Math.floor(i / arms) / Math.ceil(n / arms)
    const theta    = progress * Math.PI * 5 + (arm / arms) * Math.PI * 2
    const radius   = 1.5 + progress * max
    const scatter  = (rng() - 0.5) * 2.0
    const scatterY = (rng() - 0.5) * 1.5
    return new THREE.Vector3(
      Math.cos(theta) * radius + scatter,
      scatterY,
      Math.sin(theta) * radius + scatter
    )
  })
}

// ─── DNA Double Helix ─────────────────────────────────────────────────────────

function dnaFormation(
  n: number,
  radius = 3,
  height = 12,   // reduced to fit vertical viewport
  turns  = 3
): FormationPositions {
  const half = Math.ceil(n / 2)
  return Array.from({ length: n }, (_, i) => {
    const strand = i < half ? 0 : 1
    const idx    = strand === 0 ? i : i - half
    const count  = strand === 0 ? half : n - half
    const t      = (idx / count) * turns * Math.PI * 2 + strand * Math.PI
    const y      = (idx / count) * height - height / 2
    return new THREE.Vector3(
      Math.cos(t) * radius,
      y,
      Math.sin(t) * radius
    )
  })
}

// ─── Atom Orbital Formation ───────────────────────────────────────────────────

function atomFormation(n: number): FormationPositions {
  const shellCapacity = [2, 8, 18, 32, 32, 18, 8]
  const positions: FormationPositions = new Array(n)
  let idx = 0

  shellCapacity.forEach((cap, shellIdx) => {
    const shellRadius   = (shellIdx + 1) * 2.8   // tighter shells → smaller overall
    const count         = Math.min(cap, n - idx)
    if (count <= 0) return
    const orbitsInShell = Math.max(1, Math.floor(shellIdx / 2) + 1)

    for (let i = 0; i < count; i++) {
      const orbit     = i % orbitsInShell
      const orbitTilt = (orbit / orbitsInShell) * Math.PI
      const theta     = (i / count) * Math.PI * 2
      const x = Math.cos(theta) * shellRadius
      const y = Math.sin(theta) * shellRadius * Math.cos(orbitTilt)
      const z = Math.sin(theta) * shellRadius * Math.sin(orbitTilt)
      positions[idx++] = new THREE.Vector3(x, y, z)
    }
  })

  for (let i = idx; i < n; i++) positions[i] = new THREE.Vector3(0, 0, 0)
  return positions
}

// ─── Neural Network Formation ─────────────────────────────────────────────────

function neuralFormation(n: number, radius = 10): FormationPositions {
  const rng = seededRandom(137)
  return Array.from({ length: n }, () => {
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(rng() * 2 - 1)
    const r     = Math.pow(rng(), 0.33) * radius
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
  })
}

// ─── Wave Surface Formation ───────────────────────────────────────────────────

function waveFormation(n: number): FormationPositions {
  const cols = Math.ceil(Math.sqrt(n))
  return Array.from({ length: n }, (_, i) => {
    const col  = i % cols
    const row  = Math.floor(i / cols)
    const x    = (col - cols / 2) * 1.35
    const z    = (row - cols / 2) * 1.35
    const dist = Math.sqrt(x * x + z * z)
    const y    = Math.sin(dist * 0.75) * 2.0
    return new THREE.Vector3(x, y, z)
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const FORMATION_CONFIGS = [
  { id: 'table',  label: 'Classic Table', icon: '⊞', description: 'Standard periodic table layout',   cameraZ: 24 },
  { id: 'sphere', label: 'Sphere',        icon: '◉', description: 'Fibonacci sphere distribution',     cameraZ: 20 },
  { id: 'helix',  label: 'Helix',         icon: '↻', description: 'Single helical arrangement',        cameraZ: 18 },
  { id: 'grid',   label: '3D Grid',       icon: '⬛', description: '5×5×5 three-dimensional grid',     cameraZ: 18 },
  { id: 'galaxy', label: 'Galaxy',        icon: '✦', description: 'Logarithmic spiral galaxy arms',    cameraZ: 24 },
  { id: 'dna',    label: 'DNA Helix',     icon: '⬡', description: 'Double helix structure',           cameraZ: 18 },
  { id: 'atom',   label: 'Atom',          icon: '⚛', description: 'Electron shell orbitals',          cameraZ: 24 },
  { id: 'neural', label: 'Neural',        icon: '◈', description: 'Neural network cloud',             cameraZ: 22 },
  { id: 'wave',   label: 'Wave',          icon: '〜', description: 'Standing wave surface',            cameraZ: 20 },
] as const

export function calculateFormation(
  formation: FormationType,
  elements: Element[]
): FormationPositions {
  const n = elements.length
  switch (formation) {
    case 'table':  return tableFormation(elements)
    case 'sphere': return sphereFormation(n)
    case 'helix':  return helixFormation(n)
    case 'grid':   return gridFormation(n)
    case 'galaxy': return galaxyFormation(n)
    case 'dna':    return dnaFormation(n)
    case 'atom':   return atomFormation(n)
    case 'neural': return neuralFormation(n)
    case 'wave':   return waveFormation(n)
    default:       return tableFormation(elements)
  }
}

export function getFormationCameraZ(formation: FormationType): number {
  return FORMATION_CONFIGS.find(f => f.id === formation)?.cameraZ ?? 22
}
