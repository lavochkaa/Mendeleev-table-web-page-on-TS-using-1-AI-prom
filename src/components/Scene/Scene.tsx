'use client'
import { useCallback, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { ELEMENTS } from '@/data/elements'
import { calculateFormation } from '@/lib/formations'
import { Element } from '@/types'
import ElementCard from './ElementCard'
import ParticleField from './ParticleField'
import Effects from './Effects'
import CameraController from './CameraController'

// ─── Scene Lights ─────────────────────────────────────────────────────────────

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      {/* Key light — cool white */}
      <directionalLight position={[5, 10, 8]} intensity={0.7} color="#e8f0ff" />
      {/* Front fill — electric blue */}
      <pointLight position={[0, 0, 12]} intensity={2.0} color="#4488ff" distance={40} />
      {/* Left fill — magenta */}
      <pointLight position={[-14, 6, -4]} intensity={1.2} color="#ff44aa" distance={35} />
      {/* Right fill — teal */}
      <pointLight position={[14, 4, -4]} intensity={0.9} color="#44ffaa" distance={35} />
      {/* Top back — deep blue rim */}
      <pointLight position={[0, 20, -10]} intensity={0.6} color="#2233ff" distance={45} />
    </>
  )
}

// ─── Inner scene (must be child of Canvas) ────────────────────────────────────

function SceneInner() {
  const currentFormation  = useStore(s => s.currentFormation)
  const selectedElement   = useStore(s => s.selectedElement)
  const hoveredElement    = useStore(s => s.hoveredElement)
  const setSelected       = useStore(s => s.setSelectedElement)
  const setHovered        = useStore(s => s.setHoveredElement)
  const setTransitioning  = useStore(s => s.setTransitioning)
  const setLoading        = useStore(s => s.setLoading)

  // Pre-compute target positions for current formation
  const targetPositions = useMemo(
    () => calculateFormation(currentFormation, ELEMENTS),
    [currentFormation]
  )

  // Signal transition end after ~2s
  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 2200)
    return () => clearTimeout(t)
  }, [currentFormation, setTransitioning])

  // Signal scene ready → hide loading screen
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2400)
    return () => clearTimeout(t)
  }, [setLoading])

  const handleHover = useCallback((el: Element | null) => setHovered(el), [setHovered])
  const handleClick = useCallback((el: Element) => {
    setSelected(selectedElement?.atomicNumber === el.atomicNumber ? null : el)
  }, [selectedElement, setSelected])

  // Deselect on click-miss
  const handlePointerMissed = useCallback(() => setSelected(null), [setSelected])

  return (
    <>
      <Lighting />
      <CameraController />

      {/* Background stars */}
      <Stars
        radius={80}
        depth={60}
        count={4000}
        factor={3}
        saturation={0}
        fade
        speed={0.4}
      />

      {/* Ambient particles */}
      <ParticleField count={2200} radius={42} />

      {/* All 118 element cards
          staggerDelay: linear 0 → ~1700ms so cards appear / move one-by-one
          Cards are sorted by atomic number (≈ table reading order) */}
      {ELEMENTS.map((el, i) => (
        <ElementCard
          key={el.atomicNumber}
          element={el}
          targetPosition={targetPositions[i]}
          staggerDelay={i * 14}       // 0 ms … 1652 ms  (no modulo → smooth wave)
          formation={currentFormation}
          isSelected={selectedElement?.atomicNumber === el.atomicNumber}
          isHovered={hoveredElement?.atomicNumber === el.atomicNumber}
          onHover={handleHover}
          onClick={handleClick}
        />
      ))}

      {/* Post-processing */}
      <Effects />
    </>
  )
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 60, near: 0.1, far: 500 }}
      gl={{
        antialias: false,       // postprocessing handles AA
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      dpr={[1, 1.5]}            // cap at 1.5x for performance
      style={{ background: '#000000' }}
      onPointerMissed={() => useStore.getState().setSelectedElement(null)}
    >
      <SceneInner />
    </Canvas>
  )
}
