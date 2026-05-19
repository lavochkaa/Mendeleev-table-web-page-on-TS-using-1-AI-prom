'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS } from '@/lib/colors'
import FormationPicker from './FormationPicker'

// ─── Audio Toggle ─────────────────────────────────────────────────────────────

function AudioToggle() {
  const audioEnabled = useStore(s => s.audioEnabled)
  const toggleAudio  = useStore(s => s.toggleAudio)
  return (
    <motion.button
      onClick={toggleAudio}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                 border border-white/10 hover:border-white/20
                 transition-colors duration-150 outline-none
                 focus-visible:ring-1 focus-visible:ring-cyan-400/40"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      title={audioEnabled ? 'Mute ambient audio (M)' : 'Enable ambient audio (M)'}
    >
      {audioEnabled ? (
        // Sound on icon
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ccff" strokeWidth="2" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      ) : (
        // Sound off icon
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#606080" strokeWidth="2" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      )}
      <span className="font-mono text-[10px] tracking-wider"
            style={{ color: audioEnabled ? '#00ccff' : '#606080' }}>
        {audioEnabled ? 'AUDIO' : 'MUTED'}
      </span>
    </motion.button>
  )
}

// ─── Hovered Element Info ─────────────────────────────────────────────────────

function HoveredInfo() {
  const hovered = useStore(s => s.hoveredElement)

  return (
    <AnimatePresence>
      {hovered && (
        <motion.div
          key={hovered.atomicNumber}
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col">
            <span
              className="font-display text-5xl font-bold leading-none"
              style={{
                color: hovered.color,
                textShadow: `0 0 30px ${hovered.color}`,
              }}
            >
              {hovered.symbol}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-body text-sm font-medium text-white">{hovered.name}</span>
            <span className="font-mono text-xs" style={{ color: hovered.color }}>
              {CATEGORY_LABELS[hovered.category]}
            </span>
            <span className="font-mono text-xs text-text-muted">
              Z = {hovered.atomicNumber} · {hovered.atomicMass} u
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Category Legend (mini) ───────────────────────────────────────────────────

const LEGEND_CATS = [
  { label: 'Alkali', color: '#ff6600' },
  { label: 'Trans. Metal', color: '#4488ff' },
  { label: 'Nonmetal', color: '#00ff88' },
  { label: 'Noble Gas', color: '#00ccff' },
  { label: 'Lanthanide', color: '#ff44cc' },
  { label: 'Actinide', color: '#ffaa44' },
]

function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {LEGEND_CATS.map(cat => (
        <div key={cat.label} className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: cat.color, boxShadow: `0 0 4px ${cat.color}` }}
          />
          <span className="font-mono text-[9px] text-text-muted whitespace-nowrap">
            {cat.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Fullscreen button ────────────────────────────────────────────────────────

function FullscreenButton() {
  const [isFs, setIsFs] = useState(false)

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = () => {
    if (isFs) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }

  return (
    <motion.button
      onClick={toggle}
      className="w-8 h-8 rounded-lg flex items-center justify-center
                 border border-white/10 hover:border-white/20
                 transition-colors duration-150 outline-none"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      title={isFs ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
    >
      {isFs ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#606080" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#606080" strokeWidth="2" strokeLinecap="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      )}
    </motion.button>
  )
}

// ─── Main HUD ─────────────────────────────────────────────────────────────────

export default function HUD() {
  const isLoading = useStore(s => s.isLoading)

  // Global keyboard: Escape, F, M
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useStore.getState().setSelectedElement(null)
      if (e.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.()
      if (e.key.toLowerCase() === 'm') useStore.getState().toggleAudio()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (isLoading) return null

  return (
    <motion.div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-auto flex items-start justify-between px-6 pt-5">
        {/* Logo / Title */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#00ccff', boxShadow: '0 0 8px #00ccff' }}
            />
            <span
              className="font-display text-sm tracking-[0.3em] text-white"
              style={{ textShadow: '0 0 20px rgba(0,200,255,0.4)' }}
            >
              ELEMENT LAB
            </span>
          </div>
          <span className="font-mono text-[9px] text-text-muted tracking-[0.2em] pl-4">
            118 ELEMENTS · INTERACTIVE 3D
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <AudioToggle />
          <FullscreenButton />
        </div>
      </div>

      {/* ── Left side — hovered element info ────────────────────────────────── */}
      <div className="pointer-events-none flex-1 px-6 py-4 flex items-end">
        <div className="pointer-events-none min-h-[80px]">
          <HoveredInfo />
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div className="pointer-events-auto px-4 pb-5 flex flex-col gap-3">
        {/* Category legend */}
        <div className="px-2">
          <CategoryLegend />
        </div>

        {/* Formation picker */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(5,8,20,0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="px-3 pt-2.5 pb-0.5">
            <span className="font-mono text-[9px] tracking-widest text-text-muted">
              FORMATIONS  ·  PRESS 1–9 TO SWITCH
            </span>
          </div>
          <FormationPicker />
        </div>
      </div>
    </motion.div>
  )
}
