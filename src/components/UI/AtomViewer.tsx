'use client'
/**
 * AtomViewer — 3-D atomic orbital visualiser
 *
 * Two rendering modes, controlled by the parent (ElementModal):
 *
 *  isExpanded = false  →  CompactCanvas (220×220, auto-rotates, click → onExpand)
 *  isExpanded = true   →  ExpandedCanvas (fills its container via absolute inset-0,
 *                          OrbitControls enabled, electron trails visible)
 *
 * Hover pipeline (both modes):
 *   R3F onPointerEnter on the outer glow mesh (biggest hit area, first raycast)
 *   → e.point projected to viewport px → OrbitalTooltip renders at that position
 *
 * Performance:
 *   • memo() on every sub-component
 *   • useFrame mutates refs directly (zero React re-renders per frame)
 *   • useMemo for per-shell phase arrays
 *   • PausedCtx ref shared via context — no prop-drilling, no extra renders
 */

import { useRef, useState, useCallback, useMemo, memo, createContext, useContext } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { getAtomicConfig, buildGenericShells } from '@/data/atomicData'
import type { AtomicConfig, ShellInfo } from '@/data/atomicData'

// ─── Visual constants ─────────────────────────────────────────────────────────

const SHELL_RADII    = [0.68, 1.28, 1.98, 2.78]   // compact mode
const SHELL_RADII_FS = [1.10, 2.10, 3.25, 4.55]   // expanded mode

const SHELL_OMEGAS = [2.7, 1.9, 1.25, 0.82, 0.60, 0.44, 0.32]  // rad/s

/**
 * Each shell gets a tilt in a clearly different plane so they never look coplanar.
 * Rule: consecutive shells rotate around different dominant axes.
 *   K  → equatorial (camera looks along Z, so this appears as a flat ellipse)
 *   L  → ~60° around X  (tilts "toward" viewer)
 *   M  → ~55° around Z  (perpendicular axis to L)
 *   N  → ~50° around Y  (third axis)
 *   O+ → compound tilts cycling through axis combinations
 */
const SHELL_TILTS: [number, number, number][] = [
  [0,                   0,                  0],             // K — equatorial
  [Math.PI * 0.33,      0,                  0],             // L — X dominant
  [0,                   0,                  Math.PI * 0.30],// M — Z dominant
  [0,                   Math.PI * 0.30,     0],             // N — Y dominant
  [Math.PI * 0.22,      0,                  Math.PI * 0.22],// O — X+Z
  [-Math.PI * 0.22,     Math.PI * 0.22,     0],             // P — -X+Y
  [Math.PI * 0.18,     -Math.PI * 0.18,     Math.PI * 0.18],// Q — equal mix
]

const SHELL_BASE_COLORS = ['#d8efff', '#00d4ff', '#4488ff', '#aa66ff', '#ff88aa', '#ffcc44', '#88ffcc']
const NUCLEUS_BASE = 0.20

// ─── Pause context ────────────────────────────────────────────────────────────
// A mutable ref shared via context so useFrame hooks can read it without causing
// re-renders in Canvas children. Parent owns the useState; ref is synced each render.

const PausedCtx = createContext<React.MutableRefObject<boolean>>({ current: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipInfo {
  label: string
  description: string
  x: number   // viewport px
  y: number
}

interface HoverCbs {
  show: (label: string, description: string, point: THREE.Vector3) => void
  hide: () => void
}

// ─── Projection helper ────────────────────────────────────────────────────────

function worldToViewport(
  worldPos: THREE.Vector3,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const ndc  = worldPos.clone().project(camera)
  const rect = canvas.getBoundingClientRect()
  return {
    x: rect.left + ((ndc.x + 1) / 2) * rect.width,
    y: rect.top  + (1 - (ndc.y + 1) / 2) * rect.height,
  }
}

// ─── Nucleus ─────────────────────────────────────────────────────────────────

const Nucleus = memo(function Nucleus({ elementColor, protons, hoverCbs }: {
  elementColor: string; protons: number; hoverCbs: HoverCbs
}) {
  const pausedRef = useContext(PausedCtx)
  const outerRef  = useRef<THREE.Mesh>(null)
  const midRef    = useRef<THREE.Mesh>(null)
  const coreRef   = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (pausedRef.current) return
    const t = clock.elapsedTime
    outerRef.current?.scale.setScalar(NUCLEUS_BASE * 3.2  * (1 + 0.022 * Math.sin(t * 0.65 + 1.6)))
    midRef.current?.scale.setScalar( NUCLEUS_BASE * 1.85 * (1 + 0.038 * Math.sin(t * 1.1  + 0.8)))
    coreRef.current?.scale.setScalar(NUCLEUS_BASE         * (1 + 0.055 * Math.sin(t * 1.9)))
  })

  const onEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverCbs.show('Nucleus', `${protons} proton${protons === 1 ? '' : 's'} · atomic core`, e.point)
  }, [protons, hoverCbs])

  return (
    <group>
      {/* Outer glow — carries pointer events (largest hit area, first raycast) */}
      <mesh ref={outerRef} onPointerEnter={onEnter} onPointerLeave={hoverCbs.hide}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={elementColor} transparent opacity={0.055} depthWrite={false} />
      </mesh>
      <mesh ref={midRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={elementColor} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
})

// ─── OrbitalRing ─────────────────────────────────────────────────────────────

const OrbitalRing = memo(function OrbitalRing({ radius, color, shell, hoverCbs }: {
  radius: number; color: string; shell: ShellInfo; hoverCbs: HoverCbs
}) {
  const onEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverCbs.show(
      `Shell ${shell.n} · ${shell.label}`,
      `${shell.electrons} electron${shell.electrons !== 1 ? 's' : ''} · ${shell.subshells}${shell.isValence ? ' · valence' : ''}`,
      e.point,
    )
  }, [shell, hoverCbs])

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} onPointerEnter={onEnter} onPointerLeave={hoverCbs.hide}>
      <torusGeometry args={[radius, 0.013, 6, 80]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={shell.isValence ? 0.60 : 0.30}
        depthWrite={false}
      />
    </mesh>
  )
})

// ─── TrailGhost ──────────────────────────────────────────────────────────────

const TrailGhost = memo(function TrailGhost({ shellRadius, phaseOffset, omega, color, opacity, size }: {
  shellRadius: number; phaseOffset: number; omega: number
  color: string; opacity: number; size: number
}) {
  const pausedRef = useContext(PausedCtx)
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (pausedRef.current || !ref.current) return
    const θ = phaseOffset + omega * clock.elapsedTime
    ref.current.position.set(shellRadius * Math.cos(θ), 0, shellRadius * Math.sin(θ))
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 5, 5]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
})

// ─── ElectronDot ─────────────────────────────────────────────────────────────

const TRAIL_OFFSETS = [0.16, 0.28, 0.42]

const ElectronDot = memo(function ElectronDot({ shellRadius, phaseOffset, omega, color, shell, isValence, hoverCbs, showTrail }: {
  shellRadius: number; phaseOffset: number; omega: number
  color: string; shell: ShellInfo; isValence: boolean
  hoverCbs: HoverCbs; showTrail: boolean
}) {
  const pausedRef = useContext(PausedCtx)
  const groupRef  = useRef<THREE.Group>(null)
  const glowSize  = isValence ? 0.145 : 0.110
  const coreSize  = isValence ? 0.062 : 0.048
  const glowAlpha = isValence ? 0.40 : 0.24

  useFrame(({ clock }) => {
    if (pausedRef.current || !groupRef.current) return
    const θ = phaseOffset + omega * clock.elapsedTime
    groupRef.current.position.set(shellRadius * Math.cos(θ), 0, shellRadius * Math.sin(θ))
  })

  const onEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverCbs.show(
      isValence ? 'Valence electron' : 'Electron',
      `Shell ${shell.n} (${shell.label}) · ${shell.subshells} · n = ${shell.n}`,
      e.point,
    )
  }, [isValence, shell, hoverCbs])

  return (
    <>
      {showTrail && TRAIL_OFFSETS.map((off, ti) => (
        <TrailGhost key={ti} shellRadius={shellRadius} phaseOffset={phaseOffset - off}
          omega={omega} color={color}
          opacity={0.20 - ti * 0.055} size={coreSize * (0.70 - ti * 0.12)} />
      ))}
      <group ref={groupRef}>
        {/* Glow — carries pointer events (outer → first raycast hit) */}
        <mesh onPointerEnter={onEnter} onPointerLeave={hoverCbs.hide}>
          <sphereGeometry args={[glowSize, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={glowAlpha} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[coreSize, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </>
  )
})

// ─── ElectronShellGroup ───────────────────────────────────────────────────────

const ElectronShellGroup = memo(function ElectronShellGroup({ shell, shellIndex, radii, elementColor, hoverCbs, showTrails }: {
  shell: ShellInfo; shellIndex: number; radii: number[]
  elementColor: string; hoverCbs: HoverCbs; showTrails: boolean
}) {
  // Cycle through tilts — never reuse the same one for adjacent shells
  const tilt   = SHELL_TILTS[shellIndex % SHELL_TILTS.length]
  const radius = radii[shellIndex] ?? radii[radii.length - 1] + (shellIndex - radii.length + 1) * 0.85
  const omega  = SHELL_OMEGAS[shellIndex] ?? 0.30
  const color  = shell.isValence ? elementColor : (SHELL_BASE_COLORS[shellIndex % SHELL_BASE_COLORS.length] ?? '#8899ff')

  const electronPhases = useMemo(() => (
    Array.from({ length: shell.electrons }, (_, i) =>
      (i / shell.electrons) * Math.PI * 2 + shellIndex * 0.35
    )
  ), [shell.electrons, shellIndex])

  return (
    <group rotation={tilt}>
      <OrbitalRing radius={radius} color={color} shell={shell} hoverCbs={hoverCbs} />
      {electronPhases.map((phase, i) => (
        <ElectronDot key={i} shellRadius={radius} phaseOffset={phase} omega={omega}
          color={color} shell={shell} isValence={shell.isValence}
          hoverCbs={hoverCbs} showTrail={showTrails} />
      ))}
    </group>
  )
})

// ─── AtomScene3D ─────────────────────────────────────────────────────────────

function AtomScene3D({ config, elementColor, hoverCbs, fullscreen }: {
  config: AtomicConfig; elementColor: string; hoverCbs: HoverCbs; fullscreen: boolean
}) {
  const radii = fullscreen ? SHELL_RADII_FS : SHELL_RADII
  return (
    <>
      <ambientLight intensity={0.22} />
      <pointLight position={[3, 4, 3]}    intensity={0.95} color="#ffffff" />
      <pointLight position={[-3, -2, 3]}  intensity={0.55} color={elementColor} />
      {fullscreen && <pointLight position={[0, -5, -2]} intensity={0.30} color={elementColor} />}

      {fullscreen && (
        <OrbitControls
          enablePan={false}
          enableZoom
          autoRotate
          autoRotateSpeed={0.45}
          minDistance={2}
          maxDistance={22}
          dampingFactor={0.07}
          enableDamping
        />
      )}

      <Nucleus elementColor={elementColor} protons={config.atomicNumber} hoverCbs={hoverCbs} />

      {config.shells.map((shell, i) => (
        <ElectronShellGroup key={shell.n} shell={shell} shellIndex={i} radii={radii}
          elementColor={elementColor} hoverCbs={hoverCbs} showTrails={fullscreen} />
      ))}
    </>
  )
}

// ─── Tooltip overlay ─────────────────────────────────────────────────────────

function OrbitalTooltip({ info }: { info: TooltipInfo | null }) {
  return (
    <AnimatePresence>
      {info && (
        <motion.div
          key={info.label}
          className="fixed pointer-events-none"
          style={{ left: info.x + 14, top: info.y - 28, zIndex: 9999 }}
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.13, ease: 'easeOut' }}
        >
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(3, 6, 20, 0.94)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 4px 24px rgba(0,200,255,0.12)',
            }}
          >
            <p className="font-mono font-semibold text-[11px] text-white leading-tight tracking-wide">
              {info.label}
            </p>
            <p className="font-mono text-[10px] mt-1 leading-snug" style={{ color: 'rgba(0,210,255,0.75)' }}>
              {info.description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Pause button ─────────────────────────────────────────────────────────────

function PauseButton({ paused, onToggle, compact }: { paused: boolean; onToggle: () => void; compact: boolean }) {
  return (
    <button
      onClick={onToggle}
      title={paused ? 'Возобновить' : 'Пауза'}
      className="flex items-center justify-center rounded-full border border-white/10
                 hover:border-white/30 transition-colors text-white/40 hover:text-white/70"
      style={{
        width: compact ? 22 : 28,
        height: compact ? 22 : 28,
        background: 'rgba(5,8,20,0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {paused ? (
        // Play triangle
        <svg width={compact ? 8 : 10} height={compact ? 8 : 10} viewBox="0 0 10 10" fill="currentColor">
          <polygon points="2,1 9,5 2,9" />
        </svg>
      ) : (
        // Pause bars
        <svg width={compact ? 8 : 10} height={compact ? 8 : 10} viewBox="0 0 10 10" fill="currentColor">
          <rect x="1.5" y="1" width="2.5" height="8" rx="0.5" />
          <rect x="6"   y="1" width="2.5" height="8" rx="0.5" />
        </svg>
      )}
    </button>
  )
}

// ─── CompactCanvas — 220×220, auto-rotates ────────────────────────────────────

function CompactCanvas({ config, elementColor, onHoverInfo, containerRef, onClick }: {
  config: AtomicConfig; elementColor: string
  onHoverInfo: (info: TooltipInfo | null) => void
  containerRef: React.RefObject<HTMLDivElement>
  onClick: () => void
}) {
  return (
    <div
      ref={containerRef}
      className="relative mx-auto cursor-pointer group select-none"
      style={{ width: 220, height: 220 }}
      onClick={onClick}
      title="Нажмите для полноэкранного просмотра"
    >
      <Canvas
        camera={{ position: [0, 1.6, 5.4], fov: 44, near: 0.01, far: 100 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        frameloop="always"
      >
        <CompactSceneInner config={config} elementColor={elementColor} onHoverInfo={onHoverInfo} />
      </Canvas>

      {/* Expand hint */}
      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 4V1h3M6 1h3v3M9 6v3H6M4 9H1V6"
            stroke="rgba(0,210,255,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-mono text-[9px] tracking-[0.18em]" style={{ color: 'rgba(0,210,255,0.5)' }}>
          РАЗВЕРНУТЬ
        </span>
      </div>
    </div>
  )
}

function CompactSceneInner({ config, elementColor, onHoverInfo }: {
  config: AtomicConfig; elementColor: string
  onHoverInfo: (info: TooltipInfo | null) => void
}) {
  const pausedRef = useContext(PausedCtx)
  const { camera, gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (pausedRef.current) return
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.18
  })

  const hoverCbs = useMemo<HoverCbs>(() => ({
    show: (label, description, point) => {
      const { x, y } = worldToViewport(point, camera, gl.domElement)
      onHoverInfo({ label, description, x, y })
    },
    hide: () => onHoverInfo(null),
  }), [camera, gl.domElement, onHoverInfo])

  return (
    <group ref={groupRef}>
      <AtomScene3D config={config} elementColor={elementColor} hoverCbs={hoverCbs} fullscreen={false} />
    </group>
  )
}

// ─── ExpandedCanvas — fills parent container (absolute inset-0) ───────────────

function ExpandedCanvas({ config, elementColor, onHoverInfo }: {
  config: AtomicConfig; elementColor: string
  onHoverInfo: (info: TooltipInfo | null) => void
}) {
  // Dynamic camera distance: fits the atom's outermost shell comfortably
  const maxRadius = SHELL_RADII_FS[config.shells.length - 1] ?? SHELL_RADII_FS[3]
  const cameraZ   = Math.max(9, maxRadius * 2.85)

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 48, near: 0.01, far: 300 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
        frameloop="always"
      >
        <ExpandedSceneInner config={config} elementColor={elementColor} onHoverInfo={onHoverInfo} />
      </Canvas>
    </div>
  )
}

function ExpandedSceneInner({ config, elementColor, onHoverInfo }: {
  config: AtomicConfig; elementColor: string
  onHoverInfo: (info: TooltipInfo | null) => void
}) {
  const { camera, gl } = useThree()

  const hoverCbs = useMemo<HoverCbs>(() => ({
    show: (label, description, point) => {
      const { x, y } = worldToViewport(point, camera, gl.domElement)
      onHoverInfo({ label, description, x, y })
    },
    hide: () => onHoverInfo(null),
  }), [camera, gl.domElement, onHoverInfo])

  return (
    <AtomScene3D config={config} elementColor={elementColor} hoverCbs={hoverCbs} fullscreen />
  )
}

// ─── AtomViewer — public API ──────────────────────────────────────────────────

interface AtomViewerProps {
  atomicNumber: number
  elementColor: string
  elementName: string
  electronConfigStr: string
  /** Controlled by ElementModal — true = expanded left-column canvas */
  isExpanded: boolean
  /** Called when user clicks the compact canvas */
  onExpand: () => void
}

export default function AtomViewer({
  atomicNumber,
  elementColor,
  isExpanded,
  onExpand,
}: AtomViewerProps) {
  const [tooltip,   setTooltip]  = useState<TooltipInfo | null>(null)
  const [paused,    setPaused]   = useState(false)
  const pausedRef                = useRef(false)
  pausedRef.current              = paused          // sync ref every render (no stale closures)

  const compactRef               = useRef<HTMLDivElement>(null)

  const config = useMemo<AtomicConfig>(() => {
    const known = getAtomicConfig(atomicNumber)
    if (known) return known
    return {
      atomicNumber,
      symbol: '',
      shells: buildGenericShells(atomicNumber),
      valenceElectrons: 0,
    }
  }, [atomicNumber])

  const handleHoverInfo = useCallback((info: TooltipInfo | null) => setTooltip(info), [])
  const togglePause     = useCallback(() => setPaused(p => !p), [])

  // ── Expanded mode: large canvas filling the flex-1 container ──
  if (isExpanded) {
    return (
      <PausedCtx.Provider value={pausedRef}>
        <ExpandedCanvas config={config} elementColor={elementColor} onHoverInfo={handleHoverInfo} />
        <OrbitalTooltip info={tooltip} />

        {/* Pause / play button — bottom-right corner of the atom canvas */}
        <div className="absolute bottom-16 right-6 z-10">
          <PauseButton paused={paused} onToggle={togglePause} compact={false} />
        </div>
      </PausedCtx.Provider>
    )
  }

  // ── Compact mode: 220×220 canvas with click-to-expand ──
  return (
    <PausedCtx.Provider value={pausedRef}>
      <div className="relative">
        <CompactCanvas
          config={config}
          elementColor={elementColor}
          onHoverInfo={handleHoverInfo}
          containerRef={compactRef}
          onClick={onExpand}
        />

        {/* Pause / play button — top-right of compact canvas, stops propagation so it
            doesn't trigger the expand-click on the canvas div */}
        <div
          className="absolute top-1 right-1 z-10"
          onClick={e => e.stopPropagation()}
        >
          <PauseButton paused={paused} onToggle={togglePause} compact />
        </div>
      </div>
      <OrbitalTooltip info={tooltip} />
    </PausedCtx.Provider>
  )
}
